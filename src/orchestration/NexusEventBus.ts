 
import { logger } from '@/lib/logger';
import { db } from '@/lib/offline/offline-store';
import { toError } from "@/lib/toError";
import { NexusError, NexusErrorCode } from '@nexus/errors';
import { z } from 'zod';

// ── Catalogue d'événements métier ─────────────────────────────────────────────

export type { NexusEvents } from './events/catalog';
import type { NexusEvents } from './events/catalog';

export type NexusEventName = keyof NexusEvents;
export type NexusEventPayload<E extends NexusEventName> = NexusEvents[E];

type Handler<E extends NexusEventName> = (
  payload: NexusEventPayload<E>
) => Promise<void> | void;

interface RegisteredHandler<E extends NexusEventName> {
  id: string;
  event: E;
  handler: Handler<E>;
  priority: 'CRITICAL' | 'HIGH' | 'BACKGROUND';
}

// ── Bus ───────────────────────────────────────────────────────────────────────

class NexusEventBusClass {
  private handlers = new Map<NexusEventName, RegisteredHandler<NexusEventName>[]>();
  /** Events currently being dispatched in the current call stack — circuit-breaker anti-loop */
  private readonly inFlight = new Set<string>();
  
  /** Fallback server-side in-memory outbox (utilisé quand window n'est pas dispo) */
  private readonly serverOutbox = new Map<string, any>();

  /**
   * Souscrit à un événement.
   * priority CRITICAL  → s'exécute en premier, bloquant si nécessaire
   * priority HIGH      → parallèle avec les autres HIGH
   * priority BACKGROUND → lancé après les CRITICAL/HIGH, non-bloquant
   */
  on<E extends NexusEventName>(
    event: E,
    handler: Handler<E>,
    options: { id: string; priority?: RegisteredHandler<E>['priority'] } = { id: crypto.randomUUID() }
  ): () => void {
    const registered: RegisteredHandler<E> = {
      id: options.id,
      event,
      handler,
      priority: options.priority ?? 'HIGH',
    };

    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, [...existing, registered]);

    return () => this.off(event, options.id);
  }

  off(event: NexusEventName, id: string): void {
    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, existing.filter(h => h.id !== id));
  }

  onValidated<E extends NexusEventName, T>(
      event: E,
      schema: z.ZodType<T>,
      handler: (payload: T) => Promise<void>,
      options?: { id: string; priority?: 'CRITICAL' | 'HIGH' | 'BACKGROUND' }
  ) {
      return this.on(event, async (raw: unknown) => {
          const parsed = schema.safeParse(raw);
          if (!parsed.success) {
              throw new NexusError(
                  NexusErrorCode.VALIDATION_ERROR,
                  `Payload d'événement invalide sur ${event}`,
                  parsed.error.issues,
              );
          }
          return handler(parsed.data);
      }, options);
  }

  private enforceTierPolicies(payload: any): void {
    const tenantId = payload?.tenantId || payload?.targetTenantId;
    if (!tenantId) {
      throw new NexusError(
        NexusErrorCode.VALIDATION_ERROR,
        `[EventBus] SECURITY BREACH: Missing tenantId in event payload. Cross-tenant pollution prevention active.`
      );
    }

    const isWritable = !tenantId.startsWith('_ref_');
    if (!isWritable) {
      throw new NexusError(NexusErrorCode.ACCESS_DENIED, `[EventBus] Writes to reference tenant ${tenantId} are forbidden.`);
    }

    const isSimulation = !!payload.isSimulation || tenantId.startsWith('_demo_');
    payload.isSimulation = isSimulation;
  }

  /**
   * Émet un événement métier de manière durable via l'EventOutbox.
   * Protège contre les crashs entre le persist state (Nexus) et l'exécution des handlers.
   */
  async emitDurable<E extends NexusEventName>(
    event: E,
    payload: NexusEventPayload<E>
  ): Promise<void> {
    this.enforceTierPolicies(payload);
    
    const id = crypto.randomUUID();
    
    // 1. Outbox : Persister l'intention d'émettre
    if (typeof window !== 'undefined') {
      try {
        await db.busOutbox.put({
          id,
          eventName: event,
          payload,
          createdAt: Date.now(),
          attempts: 0,
          status: 'pending'
        });
      } catch (err) {
        logger.error(`[EventBus] Failed to write to Outbox for ${event}`, err);
      }
    } else {
      logger.warn(`[EventBus] Server-side durable emit fallback used for ${event}`);
      this.serverOutbox.set(id, {
        id,
        eventName: event,
        payload,
        createdAt: Date.now(),
        attempts: 0,
        status: 'pending'
      });
    }

    // 2. Émettre en RAM
    await this.emit(event, payload);

    // 3. Outbox : Marquer comme terminé
    if (typeof window !== 'undefined') {
      try {
        await db.busOutbox.update(id, { status: 'done' });
      } catch (err) {
        logger.error(`[EventBus] Failed to mark Outbox as done for ${event}`, err);
      }
    } else {
      const pending = this.serverOutbox.get(id);
      if (pending) {
        pending.status = 'done';
      }
    }
  }

  /**
   * Émet un événement.
   *
   * Ordre d'exécution :
   * 1. CRITICAL  → await en séquence (ordre d'inscription)
   * 2. HIGH      → Promise.allSettled (parallèle)
   * 3. BACKGROUND → fire-and-forget (microtask, non-bloquant)
   *
   * Retourne quand CRITICAL + HIGH sont résolus.
   * Les erreurs BACKGROUND sont loggées sans propager.
   *
   * @param options.skipDLQWrite — true quand appelé par DLQRetryService ou
   *   handleRetry : le service de retry gère lui-même l'état de l'entrée DLQ
   *   pour éviter une double-écriture avec attempts=1.
   */
  async emit<E extends NexusEventName>(
    event: E,
    payload: NexusEventPayload<E>,
    options?: { skipDLQWrite?: boolean }
  ): Promise<void> {
    this.enforceTierPolicies(payload);

    if (this.inFlight.has(event)) {
      logger.warn(`[NexusEventBus] Boucle détectée sur "${event}" — émission bloquée`);
      return;
    }

    const all = this.handlers.get(event) ?? [];
    if (all.length === 0) return;

    this.inFlight.add(event);

    const critical    = all.filter(h => h.priority === 'CRITICAL');
    const high        = all.filter(h => h.priority === 'HIGH');
    const background  = all.filter(h => h.priority === 'BACKGROUND');

    const start = performance.now();

    try {
      // 1 — CRITICAL : séquentiel, bloquant
      for (const h of critical) {
        try {
          await h.handler(payload);
        } catch (err) {
          logger.error(`[EventBus][CRITICAL] ${event}#${h.id} failed`, err);
          if (typeof window !== 'undefined' && !options?.skipDLQWrite) {
            await db.deadLetterEvents.put({
              id: crypto.randomUUID(),
              eventName: event,
              payload,
              handlerId: h.id,
              error: toError(err).message,
              failedAt: Date.now(),
              attempts: 1,
              nextRetryAt: Date.now() + 2000,
              status: 'retry'
            }).catch(e => logger.error('[EventBus] DLQ write failed', e));
          }
          throw err; // remonte — critique = non négociable
        }
      }

      // 2 — HIGH : parallèle, on attend la résolution
      if (high.length > 0) {
        const results = await Promise.allSettled(
          high.map(h => h.handler(payload))
        );
        await Promise.all(results.map(async (r, i) => {
          if (r.status === 'rejected') {
            const h = high[i];
            logger.error(`[EventBus][HIGH] ${event}#${h.id} failed`, r.reason);
            if (typeof window !== 'undefined' && !options?.skipDLQWrite) {
              await db.deadLetterEvents.put({
                id: crypto.randomUUID(),
                eventName: event,
                payload,
                handlerId: h.id,
                error: toError(r.reason).message,
                failedAt: Date.now(),
                attempts: 1,
                nextRetryAt: Date.now() + 2000,
                status: 'retry'
              }).catch(e => logger.error('[EventBus] DLQ write failed', e));
            }
          }
        }));
      }

      // 3 — BACKGROUND : fire-and-forget AVEC écriture DLQ en cas d'échec
      background.forEach(h => {
        Promise.resolve().then(() => h.handler(payload)).catch(async (err) => {
          logger.warn(`[EventBus][BACKGROUND] ${event}#${h.id} failed`, err);
          if (typeof window !== 'undefined' && !options?.skipDLQWrite) {
            await db.deadLetterEvents.put({
              id: crypto.randomUUID(),
              eventName: event,
              payload,
              handlerId: h.id,
              error: toError(err).message,
              failedAt: Date.now(),
              attempts: 1,
              nextRetryAt: Date.now() + 2000,
              status: 'retry'
            }).catch(e => logger.error('[EventBus] DLQ write failed (BACKGROUND)', e));
          }
        });
      });

      const ms = (performance.now() - start).toFixed(1);
      logger.info(`[EventBus] ${event} → ${all.length} handlers (${ms}ms sync)`);
    } finally {
      this.inFlight.delete(event);
    }
  }
}

export const NexusEventBus = new NexusEventBusClass();
