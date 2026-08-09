import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import type { NexusEventName, NexusEventPayload } from '@/shared/eventBus/NexusEventBus';

// ── Enregistrement d'un event capturé ────────────────────────────────────────

export interface CapturedEvent<E extends NexusEventName = NexusEventName> {
  seq: number;          // numéro d'ordre d'émission
  name: E;
  payload: NexusEventPayload<E>;
  capturedAt: number;   // timestamp réel système (Date.now())
}

// ── Collecteur — se branche directement sur le bus ───────────────────────────

export class EventCollector {
  private _events: CapturedEvent[] = [];
  private _seq = 0;
  private _unsubscribers: Array<() => void> = [];

  // Liste de tous les events connus à intercepter
  private static readonly ALL_EVENTS: NexusEventName[] = [
    // OPS
    'order.placed', 'order.paid', 'order.cancelled', 'order.comp', 'order.refunded',
    'order.split', 'order.proforma_printed',
    'kds.ticket_received', 'kds.item_started', 'kds.item_done', 'kds.ticket_done',
    'kds.course_fired', 'kds.bumped', 'kds.rush_alert', 'kds.printer_failed',
    'kds.ticket_delayed', 'kds.dish_rebound', 'kds.fire_next_course', 'kds.course_passed',
    'table.locked', 'table.released', 'table.transferred', 'table.assigned', 'table.cleared',
    'pos.terminal_login',
    'inventory.deducted', 'inventory.quarantine_activated', 'inventory.stock_adjusted',
    'inventory.physical', 'inventory.waste_logged',
    'stock.low', 'stock.zero', 'stock.received', 'stock.transfer',
    'hardware.printer_mapped',
    // FINANCE
    'finance.order_sealed', 'finance.ticket_z_closed', 'finance.z_report_requested',
    'finance.cash_counted', 'finance.period_locked', 'finance.month_closed',
    'finance.payment_failed', 'finance.payment_dispatched', 'finance.invoice_approved',
    'finance.bank_transaction_synced', 'finance.reconciliation_completed',
    'finance.food_cost_impacted', 'finance.tax_mismatch', 'finance.daily_audit',
    'finance.refund_issued',
    'supplier.invoice_processed', 'supplier.delivery_received',
    // HACCP / COMPLIANCE
    'haccp.check.saved', 'haccp.nonconform', 'haccp.alert', 'haccp.temperature_logged',
    'haccp.cooling_cycle_logged',
    'dlc.expired', 'recall.declared',
    'sensor.temperature_anomaly', 'iot.offline',
    'compliance.calendar', 'compliance.deadline_approaching',
    'cert.expired',
    // HR
    'hr.clock_in', 'hr.shift_started', 'hr.shift_ended', 'hr.break_checked',
    'hr.absence_declared', 'hr.tip_distributed', 'hr.overtime_alert',
    'hr.contract_expiring', 'hr.medical_visit_expired', 'hr.payroll_exported',
    'hr.schedule_published', 'hr.preroll_validated', 'hr.training_expired',
    'staff.clock_in', 'staff.clock_out',
    'overtime.threshold', 'payroll.submitted',
    // CRM
    'crm.points_earned', 'crm.reward_redeemed', 'crm.reward_unlocked',
    'crm.customer_created', 'crm.customer_updated', 'crm.rfm_trigger',
    'crm.birthday_approaching', 'crm.allergen_flagged', 'crm.segment_matched',
    'inactive.90d', 'review.negative', 'review.positive',
    // RESERVATIONS
    'reservation.created', 'reservation.updated', 'reservation.cancelled',
    'reservation.confirmed', 'reservation.no_show', 'reservation.matched',
    'reservation.large_group', 'resa.j1', 'biggroup.confirmed',
    'table.assigned',
    // COMMERCE
    'commerce.promotion_activated', 'commerce.promotion_expired', 'commerce.margin_warning',
    'commerce.yield_updated',
    'marketing.campaign_launched',
    'payment.rejected',
    // WASTE / GASPILLAGE
    'waste.logged',
    // ANALYTICS / AI
    'analytics.sales_data_ready', 'analytics.anomaly_detected',
    'anomaly.detected',
    'intelligence.bcg_calculated', 'intelligence.menu_engineering_requested',
    'ai.weekly_report_due', 'ai.fleet_brief_requested',
    // SECURITY / SYSTEM
    'cash_drawer.opened_unauthorized',
    'security.pin_locked',
    'sovereign.breach',
    'system.audit_log',
    'crypto.integrity_failed',
    // MCC
    'mcc.health_ping', 'mcc.fiscal_audit_required', 'mcc.dlq_quarantine',
    'mcc.feature_flag_toggled',
    // NOTIFICATIONS
    'notification.created', 'notification.urgent',
    // DELIVERY / INTEGRATION
    'delivery.delivered',
    'integration.delivery_order_received', 'integration.reservation_received',
    'integration.menu_sync_requested',
    // MISC OPS
    'store.rush_mode_toggled', 'store.shift_ended',
    'service.end',
    'facility.floor_plan_updated', 'facility.maintenance_required',
    'procurement.mismatch_detected',
    'recipe.updated',
    'quote.sent', 'invoice.overdue',
    'hr.transfer_offer',
  ];

  /**
   * Active la collecte — se branche en BACKGROUND priority sur le bus
   * pour ne pas interférer avec les handlers métier (CRITICAL/HIGH)
   */
  start(): void {
    if (this._unsubscribers.length > 0) return; // déjà actif

    for (const evtName of EventCollector.ALL_EVENTS) {
      const unsub = NexusEventBus.on(
        evtName,
        (payload) => {
          this._events.push({
            seq: this._seq++,
            name: evtName,
            payload: payload as NexusEventPayload<typeof evtName>,
            capturedAt: Date.now(),
          });
        },
        { id: `__verifier_${evtName}`, priority: 'BACKGROUND' }
      );
      this._unsubscribers.push(unsub);
    }
  }

  /** Stoppe la collecte et se désenregistre du bus */
  stop(): void {
    for (const unsub of this._unsubscribers) unsub();
    this._unsubscribers = [];
  }

  /** Retourne le corpus complet — immuable pour les règles */
  get events(): ReadonlyArray<CapturedEvent> {
    return this._events;
  }

  /** Filtre rapide par nom d'événement */
  of<E extends NexusEventName>(name: E): CapturedEvent<E>[] {
    return this._events.filter(e => e.name === name) as CapturedEvent<E>[];
  }

  /** Filtre par préfixe de domaine (ex: 'kds.', 'haccp.', 'hr.') */
  domain(prefix: string): CapturedEvent[] {
    return this._events.filter(e => e.name.startsWith(prefix));
  }

  /** Retourne les events après un event de référence (par seq) */
  after(seq: number): CapturedEvent[] {
    return this._events.filter(e => e.seq > seq);
  }

  /** Retourne les events d'un tenantId donné */
  forTenant(tenantId: string): CapturedEvent[] {
    return this._events.filter(e => {
      const p = e.payload as Record<string, unknown>;
      return p.tenantId === tenantId;
    });
  }

  /** Réinitialise le corpus (utile entre deux suites de tests) */
  reset(): void {
    this._events = [];
    this._seq = 0;
  }

  /** Statistiques de couverture du corpus */
  stats(): {
    totalEvents: number;
    uniqueEventTypes: number;
    eventTypeBreakdown: Record<string, number>;
  } {
    const breakdown: Record<string, number> = {};
    for (const e of this._events) {
      breakdown[e.name] = (breakdown[e.name] ?? 0) + 1;
    }
    return {
      totalEvents: this._events.length,
      uniqueEventTypes: Object.keys(breakdown).length,
      eventTypeBreakdown: breakdown,
    };
  }
}
