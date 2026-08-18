/* eslint-disable no-restricted-imports -- infrastructure/aggregator: deep path required */
import { logger } from '@/lib/logger';
import type { CartItem } from '@/modules/ops';
import { db } from '@/lib/offline/offline-store';
import { toError } from "@/lib/toError";

import { IdempotencyGuard } from './IdempotencyGuard';

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
  idempotent?: boolean;
}

export interface EventHandlerOptions {
  id?: string;
  priority?: 'CRITICAL' | 'HIGH' | 'BACKGROUND';
  idempotent?: boolean;
}

// ── Bus ───────────────────────────────────────────────────────────────────────

class NexusEventBusClass {
  private handlers = new Map<NexusEventName, RegisteredHandler<NexusEventName>[]>();
  /** Events currently being dispatched in the current call stack — circuit-breaker anti-loop par emissionId */
  private readonly inFlight = new Set<string>();
  private callStackDepth = 0;
  private readonly MAX_CALL_STACK_DEPTH = 15;

  /**
   * Souscrit à un événement.
   * priority CRITICAL  → s'exécute en premier, bloquant si nécessaire (idempotent par défaut)
   * priority HIGH      → parallèle avec les autres HIGH
   * priority BACKGROUND → lancé après les CRITICAL/HIGH, non-bloquant
   * idempotent: true   → Invariant #1 : déduplique automatiquement sur eventId
   */
  on<E extends NexusEventName>(
    event: E,
    handler: Handler<E>,
    options: EventHandlerOptions = { id: crypto.randomUUID() }
  ): () => void {
    const handlerId = options.id ?? crypto.randomUUID();
    const priority = options.priority ?? 'HIGH';
    // V3-BUS-06: Les handlers CRITICAL sont idempotents par défaut pour éviter tout re-jeu corrompu
    const isIdempotent = options.idempotent !== undefined ? options.idempotent : priority === 'CRITICAL';

    const effectiveHandler: Handler<E> = isIdempotent
      ? (IdempotencyGuard.withIdempotencyGuard(handlerId, event, handler as never) as unknown as Handler<E>)
      : handler;

    const registered: RegisteredHandler<E> = {
      id: handlerId,
      event,
      handler: effectiveHandler,
      priority,
      idempotent: isIdempotent,
    };

    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, [...existing, registered]);

    return () => this.off(event, handlerId);
  }

  off(event: NexusEventName, id: string): void {
    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, existing.filter(h => h.id !== id));
  }

  /**
   * Émet un événement métier de manière durable via l'EventOutbox.
   * Protège contre les crashs entre le persist state (Nexus) et l'exécution des handlers.
   * V3-BUS-06 : Replay dedup & atomic execution
   */
  async emitDurable<E extends NexusEventName>(
    event: E,
    payload: NexusEventPayload<E>
  ): Promise<void> {
    // V3-BUS-05: Normalisation de l'eventId obligatoire (ADR-001)
    const rawPayload = (payload || {}) as Record<string, unknown>;
    const eventId = String(rawPayload.eventId || rawPayload.id || crypto.randomUUID());
    if (payload && typeof payload === 'object' && !rawPayload.eventId) {
      rawPayload.eventId = eventId;
    }

    const outboxId = `outbox_${eventId}_${event}`;
    
    // 1. Outbox : Vérifier si déjà traité (dedup replay) et persister l'intention d'émettre
    if (typeof window !== 'undefined' && db?.busOutbox) {
      try {
        const existing = await db.busOutbox.get(outboxId);
        if (existing && existing.status === 'done') {
          logger.info(`[EventBus] Replay dedup: outbox event ${outboxId} already completed — skipping`);
          return;
        }
        await db.busOutbox.put({
          id: outboxId,
          eventName: event,
          payload,
          createdAt: Date.now(),
          attempts: (existing?.attempts ?? 0) + 1,
          status: 'pending'
        });
      } catch (err) {
        logger.error(`[EventBus] Failed to write to Outbox for ${event}`, err);
      }
    }

    // 2. Émettre en RAM
    await this.emit(event, payload);

    // 3. Outbox : Marquer comme terminé
    if (typeof window !== 'undefined' && db?.busOutbox) {
      try {
        await db.busOutbox.update(outboxId, { status: 'done' });
      } catch (err) {
        logger.error(`[EventBus] Failed to mark Outbox as done for ${event}`, err);
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
   * V3-BUS-04: inFlight par emissionId (débloque multi-caisse concurrent)
   * V3-BUS-05: eventId normalisé systématiquement
   */
  async emit<E extends NexusEventName>(
    event: E,
    payload: NexusEventPayload<E>,
    options?: { skipDLQWrite?: boolean }
  ): Promise<void> {
    const rawPayload = (payload || {}) as Record<string, unknown>;
    const eventId = String(rawPayload.eventId || rawPayload.id || crypto.randomUUID());
    if (payload && typeof payload === 'object' && !rawPayload.eventId) {
      rawPayload.eventId = eventId;
    }

    // V3-BUS-04: inFlight qualifié par emissionId pour débloquer le parallélisme multi-caisse
    const emissionKey = `${event}:${eventId}`;
    if (this.inFlight.has(emissionKey) && this.callStackDepth > 0) {
      logger.warn(`[NexusEventBus] Boucle récursive détectée sur "${emissionKey}" — émission bloquée`);
      return;
    }

    if (this.callStackDepth >= this.MAX_CALL_STACK_DEPTH) {
      logger.error(`[NexusEventBus] Profondeur de récursion maximale (${this.MAX_CALL_STACK_DEPTH}) atteinte sur "${event}" — cascade bloquée`);
      return;
    }

    const all = this.handlers.get(event) ?? [];
    if (all.length === 0) return;

    this.inFlight.add(emissionKey);
    this.callStackDepth++;

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
      this.callStackDepth = Math.max(0, this.callStackDepth - 1);
      this.inFlight.delete(emissionKey);
    }
  }
}

export const NexusEventBus = new NexusEventBusClass();
export { IdempotencyGuard } from './IdempotencyGuard';
