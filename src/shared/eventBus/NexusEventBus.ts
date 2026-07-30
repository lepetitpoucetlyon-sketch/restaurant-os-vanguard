import { logger } from '@/lib/logger';
import type { CartItem } from '@/modules/ops/engine/types';
import { db } from '@/infrastructure/services/offline/offline-store';

// ── Catalogue d'événements métier ─────────────────────────────────────────────

export interface NexusEvents {
  'order.placed': {
    v: 1;
    orderId: string;
    tableId: string | null;
    tenantId: string;
    operatorId: string;
    items: CartItem[];
  };
  'order.paid': {
    v: 1;
    orderId: string;
    tableId: string | null;
    tenantId: string;
    operatorId: string;
    items: CartItem[];
    totalInMicrounits: number;
    paymentMode: string;
  };
  'order.cancelled': {
    v: 1;
    orderId: string;
    tenantId: string;
    operatorId: string;
    reason?: string;
  };
  'stock.low': {
    v: 1;
    tenantId: string;
    itemId: string;
    itemName: string;
    currentQuantity: number;
    threshold: number;
  };
  'stock.received': {
    v: 1;
    tenantId: string;
    deliveryId: string;
    items: Array<{ itemId: string; quantity: number }>;
  };
  /**
   * 🛡️ Brèche d'isolation souveraine (cross-tenant drift) détectée par SovereignGuard.
   * Émis par la barrière fiscale ; consommé par SovereignBreachHandler qui déclenche
   * le kill-switch global via MasterBridge. Découple SovereignGuard de MasterBridge
   * (cassure du cycle SovereignGuard → MasterBridge → TimeSync → NexusAdapter → SovereignGuard).
   */
  'sovereign.breach': {
    v: 1;
    targetTenantId: string;
    anchoredTenantId: string;
    path?: string;
    message: string;
  };
  'commerce.yield_updated': {
    v: 1;
    tenantId: string;
    config: Record<string, unknown>;
  };
  'hr.transfer_offer': {
    v: 1;
    fromTenantId: string;
    toTenantId: string;
    ownerId: string;
    headcount: number;
    bonusInMicrounits: number;
  };
  'reservation.confirmed': {
    v: 1;
    tenantId: string;
    reservationId: string;
    customerName: string;
    covers: number;
    date: string;
    time: string;
  };
  'haccp.alert': {
    v: 1;
    tenantId: string;
    sensorId: string;
    readingId: string;
    alertType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
  };
  'payroll.submitted': {
    v: 1;
    tenantId: string;
    period: string;
    submissionId: string;
    employeeCount: number;
  };
  'waste.logged': {
    v: 1;
    tenantId: string;
    wasteId: string;
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    reason: string;
  };
  'staff.clock_in': {
    v: 1;
    tenantId: string;
    userId: string;
    userName: string;
    terminalId: string;
    timestamp: string;
  };
  'staff.clock_out': {
    v: 1;
    tenantId: string;
    userId: string;
    userName: string;
    terminalId: string;
    timestamp: string;
  };
  /**
   * Émis par une route API serveur (pas par le client) : première émission
   * SSR du bus. Le handler doit donc être enregistré à portée module dans
   * la route elle-même, pas via registerHandlers.ts (100% client).
   */
  'support.ticket_submitted': {
    v: 1;
    ticketId: string;
    tenantId: string;
    description: string;
    screenshotUrl?: string;
    submittedBy: string;
  };
  'cash_drawer.opened_unauthorized': {
    v: 1;
    drawerId: string;
    operatorId: string;
    detectedAt: number;
    tenantId: string;
  };
  'supplier.invoice_processed': {
    v: 1;
    tenantId: string;
    supplierId: string;
    invoiceId: string;
    lines: Array<{ stockItemId: string; unitCostInMicrounits: number }>;
    processedAt: number;
  };
  'inventory.quarantine_activated': {
    v: 1;
    tenantId: string;
    productIds: string[];
    reason: string;
  };
  'commerce.margin_warning': {
    v: 1;
    tenantId: string;
    productId: string;
    currentMarginBps: number;
    thresholdBps: number;
    triggerEventId: string;
  };
}

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

  /**
   * Émet un événement métier de manière durable via l'EventOutbox.
   * Protège contre les crashs entre le persist state (Nexus) et l'exécution des handlers.
   */
  async emitDurable<E extends NexusEventName>(
    event: E,
    payload: NexusEventPayload<E>
  ): Promise<void> {
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
   */
  async emit<E extends NexusEventName>(
    event: E,
    payload: NexusEventPayload<E>
  ): Promise<void> {
    const all = this.handlers.get(event) ?? [];
    if (all.length === 0) return;

    const critical    = all.filter(h => h.priority === 'CRITICAL');
    const high        = all.filter(h => h.priority === 'HIGH');
    const background  = all.filter(h => h.priority === 'BACKGROUND');

    const start = performance.now();

    // 1 — CRITICAL : séquentiel, bloquant
    for (const h of critical) {
      try {
        await h.handler(payload);
      } catch (err) {
        logger.error(`[EventBus][CRITICAL] ${event}#${h.id} failed`, err);
        if (typeof window !== 'undefined') {
          await db.deadLetterEvents.put({
            id: crypto.randomUUID(),
            eventName: event,
            payload,
            handlerId: h.id,
            error: String(err),
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
          if (typeof window !== 'undefined') {
            await db.deadLetterEvents.put({
              id: crypto.randomUUID(),
              eventName: event,
              payload,
              handlerId: h.id,
              error: String(r.reason),
              failedAt: Date.now(),
              attempts: 1,
              nextRetryAt: Date.now() + 2000,
              status: 'retry'
            }).catch(e => logger.error('[EventBus] DLQ write failed', e));
          }
        }
      }));
    }

    // 3 — BACKGROUND : fire-and-forget
    background.forEach(h => {
      Promise.resolve().then(() => h.handler(payload)).catch(err => {
        logger.warn(`[EventBus][BACKGROUND] ${event}#${h.id} failed`, err);
      });
    });

    const ms = (performance.now() - start).toFixed(1);
    logger.info(`[EventBus] ${event} → ${all.length} handlers (${ms}ms sync)`);
  }
}

export const NexusEventBus = new NexusEventBusClass();
