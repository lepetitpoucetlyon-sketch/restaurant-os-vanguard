 
import { logger } from '@/lib/logger';
import { db } from '@/lib/offline/offline-store';
import { toError } from "@/lib/toError";
import { NexusError, NexusErrorCode } from '@nexus/errors';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { z } from 'zod';

// ── Catalogue d'événements métier ─────────────────────────────────────────────

export type { NexusEvents } from './events/catalog';
import type { NexusEvents } from './events/catalog';

export type NexusEventName = keyof NexusEvents;
export type NexusEventPayload<E extends NexusEventName> = NexusEvents[E];

// ── §9.0 Garde-fou : orphelins ATTENDUS (pas des bugs) ─────────────────────────
// Un event émis sans handler ressemble à un succès (emit() retourne, emitDurable
// marque l'outbox 'done', rien ne part en DLQ). On rend ça visible — SAUF pour :
//  1. les préfixes des verticales NON OUVERTES (events publiés pour branchement
//     futur ; table préfixe→verticale : scripts/gen-vertical-playbook.ts:69).
//     Quand une verticale ouvre (playbook « ✅ Prête »), retirer son préfixe ici.
//  2. la Classe B : l'état est persisté AVANT l'emit, l'event est un fan-out
//     d'extension sans abonné obligatoire.
const EXPECTED_UNCONSUMED_PREFIXES = ['auto.', 'bakery.', 'health.', 'hotel.', 'salon.', 'retail.'] as const;
const EXPECTED_UNCONSUMED_EVENTS: ReadonlySet<string> = new Set([
  'ops.service_ticket_opened', 'ops.service_ticket_working',
  'ops.service_ticket_closed', 'ops.service_ticket_cancelled',
  'crm.allergen_flagged',
  'finance.refund_issued',
  'finance.invoice_generated',
]);

/** Vrai si l'absence de handler pour cet event est attendue (verticale fermée ou Classe B). */
export function isExpectedUnconsumed(event: string): boolean {
  return EXPECTED_UNCONSUMED_EVENTS.has(event)
    || EXPECTED_UNCONSUMED_PREFIXES.some(p => event.startsWith(p));
}

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

  /** §9.0 — Nombre de handlers enregistrés pour un event (0 = orphelin runtime). */
  listenerCount(event: NexusEventName): number {
    return this.handlers.get(event)?.length ?? 0;
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

  /**
   * §13 — Politique de tier : bloque _ref_*, auto-active Simulacra pour _demo_*.
   *
   * _ref_*  → ACCESS_DENIED immédiat (le tenant de référence est en lecture seule ;
   *            toute émission depuis ce tenant est une anomalie).
   * _demo_* → isSimulation=true + activation automatique de Simulacra si pas encore
   *            actif. Sans cela, un accès direct (URL, rechargement, route hors
   *            SplashGate) laisse les handlers écrire sur le Nexus réel → SovereignGuard
   *            lève → DLQ de fausses alertes.
   * _test_* / tenant_{siret} → passthrough normal.
   */
  private async enforceTierPolicies(payload: any): Promise<void> {
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

    // §13 Option C — activation automatique de Simulacra pour les tenants _demo_*.
    // Idempotent : si Simulacra est déjà actif (SplashGate / useNexusTenantLogic l'a
    // activé en amont), isSimulacraActive() retourne true et on saute le bloc.
    if (isSimulation && typeof window !== 'undefined' && !Nexus.isSimulacraActive()) {
      await Nexus.activateSimulacraMode(`auto_${tenantId}`);
      logger.debug(`[EventBus] §13 Simulacra auto-activé pour demo tenant : ${tenantId}`);
    }
  }

  /**
   * Émet un événement métier de manière durable via l'EventOutbox.
   * Protège contre les crashs entre le persist state (Nexus) et l'exécution des handlers.
   */
  async emitDurable<E extends NexusEventName>(
    event: E,
    payload: NexusEventPayload<E>
  ): Promise<void> {
    await this.enforceTierPolicies(payload);
    
    const id = crypto.randomUUID();
    
    // 1. Outbox : Persister l'intention d'émettre
    const outboxEntry = {
      id,
      eventName: event,
      payload,
      createdAt: Date.now(),
      attempts: 0,
      status: 'pending' as const,
    };
    if (typeof window !== 'undefined') {
      try {
        await db.busOutbox.put(outboxEntry);
      } catch (err) {
        logger.error(`[EventBus] Failed to write to Outbox for ${event}`, err);
      }
    } else {
      // Côté serveur : outbox Firestore — durable à travers les crashs process.
      // Collection globale accessible au process Node (pas scopée par tenant car le
      // replayer serveur tourne en MCC et ne connaît pas le tenant au démarrage).
      try {
        await Nexus.adapter.set(`busOutbox/${id}`, outboxEntry);
      } catch (err) {
        logger.error(`[EventBus] Failed to write server-side Outbox for ${event}`, err);
      }
    }

    // 2. Émettre en RAM
    await this.emit(event, payload);

    // §9.0 Garde-fou : distinguer « traité par ≥1 handler » de « aucun consommateur ».
    // Un orphelin non-attendu est marqué done_no_consumer → observable en base, jamais
    // confondu avec un succès, sans jamais polluer la DLQ (qui ne rattrape que les échecs).
    const hadConsumer = (this.handlers.get(event)?.length ?? 0) > 0;
    const finalStatus = hadConsumer || isExpectedUnconsumed(event) ? 'done' : 'done_no_consumer';

    // 3. Outbox : Marquer comme terminé (ou done_no_consumer si orphelin inattendu)
    if (typeof window !== 'undefined') {
      try {
        await db.busOutbox.update(id, { status: finalStatus });
      } catch (err) {
        logger.error(`[EventBus] Failed to mark Outbox for ${event}`, err);
      }
    } else {
      try {
        await Nexus.adapter.update(`busOutbox/${id}`, { status: finalStatus });
      } catch (err) {
        logger.error(`[EventBus] Failed to mark server-side Outbox for ${event}`, err);
      }
    }
  }

  /**
   * Écrit une entrée dans la Dead Letter Queue (DLQ), côté client (Dexie)
   * ou côté serveur (Firestore). Ne lève jamais — utilisé dans les catch.
   */
  private async writeToDLQ(
    event: NexusEventName,
    payload: unknown,
    handlerId: string,
    err: unknown,
    skipDLQWrite?: boolean
  ): Promise<void> {
    if (skipDLQWrite) return;
    const entry = {
      id: crypto.randomUUID(),
      eventName: event,
      payload,
      handlerId,
      error: toError(err).message,
      failedAt: Date.now(),
      attempts: 1,
      nextRetryAt: Date.now() + 2000,
      status: 'retry' as const,
    };
    if (typeof window !== 'undefined') {
      await db.deadLetterEvents.put(entry)
        .catch(e => logger.error('[EventBus] DLQ write failed', e));
    } else {
      await Nexus.adapter.set(`deadLetterEvents/${entry.id}`, entry)
        .catch(e => logger.error('[EventBus] Server DLQ write failed', e));
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
    await this.enforceTierPolicies(payload);

    if (this.inFlight.has(event)) {
      logger.warn(`[NexusEventBus] Boucle détectée sur "${event}" — émission bloquée`);
      return;
    }

    const all = this.handlers.get(event) ?? [];
    if (all.length === 0) {
      // §9.0 Garde-fou : un orphelin non-attendu = un fil débranché en silence.
      if (process.env.NODE_ENV !== 'production' && !isExpectedUnconsumed(event)) {
        logger.warn(`[EventBus] ⚠️ émis SANS handler (orphelin) : "${event}" — voir PLAN_COMPLET §9`);
      }
      return;
    }

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
          await this.writeToDLQ(event, payload, h.id, err, options?.skipDLQWrite);
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
            await this.writeToDLQ(event, payload, h.id, r.reason, options?.skipDLQWrite);
          }
        }));
      }

      // 3 — BACKGROUND : fire-and-forget AVEC écriture DLQ en cas d'échec
      background.forEach(h => {
        Promise.resolve().then(() => h.handler(payload)).catch(async (err) => {
          logger.warn(`[EventBus][BACKGROUND] ${event}#${h.id} failed`, err);
          await this.writeToDLQ(event, payload, h.id, err, options?.skipDLQWrite);
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
