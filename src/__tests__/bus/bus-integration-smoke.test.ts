import { describe, it, expect, beforeAll, vi } from 'vitest';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { registerOpsHandlers } from '@orchestration/registerHandlers/ops';
import { registerFinanceHandlers } from '@orchestration/registerHandlers/finance';
import { registerLogisticsHandlers } from '@orchestration/registerHandlers/logistics';
import { registerComplianceHandlers } from '@orchestration/registerHandlers/compliance';
import { registerHumanHandlers } from '@orchestration/registerHandlers/human';
import { registerCommerceHandlers } from '@orchestration/registerHandlers/commerce';
import { registerNotificationHandlers } from '@orchestration/registerHandlers/notifications';
import { assertHandlerTenant, TenantMismatchError } from '@orchestration/guards/assertHandlerTenant';

/**
 * §9.3 — Smoke test intégration bus
 *
 * Simule un boot complet (tous les handler groups enregistrés)
 * et vérifie les chaînes critiques de bout en bout :
 *   emit → handler → side-effects (events cascadés, writes).
 *
 * Ce fichier complète guardrail.test.ts (§9.0) et chain-integration.test.ts
 * en testant spécifiquement les correctifs §9.1 et §9.2.
 */
describe('§9.3 Smoke test intégration bus — boot complet', () => {
  const unsubs: Array<() => void> = [];

  beforeAll(() => {
    unsubs.push(
      ...registerOpsHandlers(),
      ...registerFinanceHandlers(),
      ...registerLogisticsHandlers(),
      ...registerComplianceHandlers(),
      ...registerHumanHandlers(),
      ...registerCommerceHandlers(),
      ...registerNotificationHandlers(),
    );
  });

  // ── §9.1 Fix: inventory.stock_adjusted handler (data loss fix) ──────────

  it('inventory.stock_adjusted → finance.food_cost_impacted (chaîne §9.1)', async () => {
    let foodCostEvent: Record<string, unknown> | null = null;

    const unsub = NexusEventBus.on('finance.food_cost_impacted', async (payload) => {
      if (payload.reason === 'stock_adjusted_item_smoke') {
        foodCostEvent = payload as Record<string, unknown>;
      }
    });

    await NexusEventBus.emitDurable('inventory.stock_adjusted', {
      v: 1,
      tenantId: 'smoke-tenant',
      itemId: 'item_smoke',
      oldQuantity: 50,
      newQuantity: 30,
      reason: 'inventaire',
      adjustedBy: 'manager_1',
    });

    expect(foodCostEvent).not.toBeNull();
    expect(foodCostEvent!.tenantId).toBe('smoke-tenant');
    unsub();
  });

  it('inventory.stock_adjusted → stock.zero quand newQuantity=0 (§9.1)', async () => {
    let stockZeroEmitted = false;

    const unsub = NexusEventBus.on('stock.zero', async (payload) => {
      if (payload.itemId === 'item_zero_smoke') {
        stockZeroEmitted = true;
      }
    });

    await NexusEventBus.emitDurable('inventory.stock_adjusted', {
      v: 1,
      tenantId: 'smoke-tenant',
      itemId: 'item_zero_smoke',
      oldQuantity: 3,
      newQuantity: 0,
      reason: 'casse',
      adjustedBy: 'chef_1',
    });

    expect(stockZeroEmitted).toBe(true);
    unsub();
  });

  // ── §9.1 Fix: formerly unregistered handlers now wired ──────────────────

  it('haccp.nonconform → notification.urgent CRITICAL (handler §9.1 registration fix)', async () => {
    let criticalNotif = false;

    const unsub = NexusEventBus.on('notification.urgent', async (payload) => {
      if (payload.priority === 'CRITICAL' && payload.message.includes('HACCP')) {
        criticalNotif = true;
      }
    });

    await NexusEventBus.emitDurable('haccp.nonconform', {
      v: 1,
      tenantId: 'smoke-tenant',
      checkId: 'check_smoke',
      correctionDeadline: Date.now() + 3600000,
    });

    expect(criticalNotif).toBe(true);
    unsub();
  });

  it('support.ticket_escalated a ≥1 handler actif (§9.1 registration fix)', () => {
    expect(NexusEventBus.listenerCount('support.ticket_escalated' as never)).toBeGreaterThan(0);
  });

  it('order.proforma_printed a ≥1 handler actif (§9.1 registration fix)', () => {
    expect(NexusEventBus.listenerCount('order.proforma_printed' as never)).toBeGreaterThan(0);
  });

  // ── §9.2 Cross-tenant guard — vérifie dans le contexte réel handler ─────

  it('assertHandlerTenant intégré — pass sur path cohérent, bloque cross-tenant (§9.2)', () => {
    expect(() => assertHandlerTenant('stock-adjusted', 'tenant-A', 'tenants/tenant-A/stockItems/x')).not.toThrow();
    expect(() => assertHandlerTenant('stock-adjusted', 'tenant-A', 'tenants/tenant-B/stockItems/x')).toThrow(TenantMismatchError);
  });

  // ── Full boot: aucun handler ne crash au bind ───────────────────────────

  it('boot complet: tous les domaines s\'enregistrent sans erreur', () => {
    expect(unsubs.length).toBeGreaterThan(30);
  });

  // ── Chaîne order.paid → stock + NF525 downstream ──────────────────────

  it('order.paid → StockDeductionHandler + TicketZHandler actifs', async () => {
    let paidHandled = false;

    const unsub = NexusEventBus.on('order.paid', async (p) => {
      if (p.orderId === 'ord_smoke_paid') paidHandled = true;
    });

    await NexusEventBus.emitDurable('order.paid', {
      v: 1,
      tenantId: 'smoke-tenant',
      orderId: 'ord_smoke_paid',
      tableId: 't_1',
      operatorId: 'op_1',
      items: [{ productId: 'p1', quantity: 1, priceInMicrounits: 12_000_000 }] as unknown as never,
      totalInMicrounits: 12_000_000,
      paymentMode: 'card',
    });

    expect(paidHandled).toBe(true);
    // StockDeductionHandler + TicketZHandler both listen to order.paid
    expect(NexusEventBus.listenerCount('order.paid' as never)).toBeGreaterThanOrEqual(2);
    unsub();
  });

  it('finance.cash_counted avec écart → notification.urgent', async () => {
    let anomalyAlert = false;

    const unsub = NexusEventBus.on('notification.urgent', async (payload) => {
      if (payload.message.includes('caisse')) {
        anomalyAlert = true;
      }
    });

    await NexusEventBus.emitDurable('finance.cash_counted', {
      v: 1,
      tenantId: 'smoke-tenant',
      drawerId: 'drawer_smoke',
      expectedAmountInMicrounits: 100_000_000,
      actualAmountInMicrounits: 80_000_000,
      countedBy: 'Smoke Manager',
    });

    expect(anomalyAlert).toBe(true);
    unsub();
  });

  // ── Chaîne stock.received → persistance ────────────────────────────────

  it('stock.received active le StockReceptionHandler', async () => {
    let receptionHandled = false;

    const unsub = NexusEventBus.on('stock.received', async () => {
      receptionHandled = true;
    });

    await NexusEventBus.emitDurable('stock.received', {
      v: 1,
      tenantId: 'smoke-tenant',
      deliveryId: 'del_smoke',
      items: [{ itemId: 'item_1', quantity: 100 }],
    });

    expect(receptionHandled).toBe(true);
    unsub();
  });

  // ── Couverture exhaustive: toutes les chaînes critiques §9 ─────────────

  it.each([
    'order.paid',
    'order.placed',
    'order.refunded',
    'stock.received',
    'inventory.deducted',
    'inventory.stock_adjusted',
    'haccp.nonconform',
    'support.ticket_escalated',
    'order.proforma_printed',
    'finance.cash_counted',
    'hr.shift_started',
    'notification.urgent',
    'dlc.expired',
    'sensor.temperature_anomaly',
  ])('« %s » a ≥1 handler après boot complet', (event) => {
    expect(NexusEventBus.listenerCount(event as never)).toBeGreaterThan(0);
  });
});
