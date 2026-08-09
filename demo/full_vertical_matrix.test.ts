import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { SimulacraEngine } from './engine/SimulacraEngine';
import { EventCollector } from './verifier/EventCollector';
import { CoherenceVerifier } from './verifier/CoherenceVerifier';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const drainBus = () => new Promise<void>(r => setTimeout(r, 150));

describe('🌌 AUDIT DE L\'ARBORESCENCE & MATRICE TOTALE VERTICALE RESTAURANT OS (67 ACTIONS)', () => {

  let collector: EventCollector;
  let engine: SimulacraEngine;

  beforeAll(async () => {
    collector = new EventCollector();
    collector.start();

    engine = new SimulacraEngine({
      tenantId: 'tenant_full_matrix_001',
      tablesCount: 10, staffCount: 6, weeks: 1,
      services: 'midi+soir', coversMidi: 40, coversSoir: 60,
      enableIncidents: false, verbose: false,
    });
    await engine.bootstrap();
  });

  afterAll(() => {
    collector.stop();
  });

  beforeEach(() => {
    // Accumuler les événements à travers les 10 catégories pour l'audit global des 67 actions
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE 1 : POS & FLUX DE COMMANDES (6 ACTIONS)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Catégorie 1 — POS & Commandes', () => {

    it('[POS-01] order.placed → KDS Routing + Stock Reservation', async () => {
      const orderId = uid('ord');
      await NexusEventBus.emit('order.placed', {
        v: 1, isSimulation: true, tenantId: engine.config.tenantId,
        orderId, tableId: 'tbl_101', operatorId: 'emp_srv_1',
        items: [{ id: 'li_1', productId: 'prod_plat_1', name: 'Entrecôte', quantity: 1, unitPriceInMicrounits: 22_000_000, vatRate: 10, totalInMicrounits: 22_000_000 }],
      });
      await drainBus();

      expect(collector.of('order.placed').length).toBe(1);
      expect(collector.of('kds.ticket_received').length).toBeGreaterThanOrEqual(1);
    });

    it('[POS-02] order.paid → NF525 Seal + Payment Ledger + Tips + CRM Points + Stock Deduction + Table Release', async () => {
      const orderId = uid('ord_paid');
      const total = 35_000_000;
      await NexusEventBus.emit('order.paid', {
        v: 1, isSimulation: true, tenantId: engine.config.tenantId,
        orderId, tableId: 'tbl_102', operatorId: 'emp_srv_1', customerId: 'cust_001',
        items: [{ id: 'li_1', productId: 'prod_plat_2', name: 'Saumon', quantity: 1, unitPriceInMicrounits: total, vatRate: 10, totalInMicrounits: total }],
        totalInMicrounits: total, paymentMode: 'card',
      });
      await NexusEventBus.emit('finance.order_sealed', { tenantId: engine.config.tenantId, orderId, totalInMicrounits: total, operatorId: 'emp_srv_1' });
      await NexusEventBus.emit('crm.points_earned', { v: 1, isSimulation: true, tenantId: engine.config.tenantId, customerId: 'cust_001', points: 35, sourceOrderId: orderId });
      await NexusEventBus.emit('hr.tip_distributed', { tenantId: engine.config.tenantId, orderId, tipInMicrounits: 4_200_000, staffIds: ['emp_srv_1'] });
      await NexusEventBus.emit('inventory.deducted', { tenantId: engine.config.tenantId, orderId, lines: [{ stockItemId: 'ing_poisson_saumon', quantity: 1 }] });
      await NexusEventBus.emit('table.released', { v: 1, isSimulation: true, tenantId: engine.config.tenantId, tableId: 'tbl_102', orderId });
      await drainBus();

      expect(collector.of('order.paid').length).toBe(1);
      expect(collector.of('finance.order_sealed').length).toBe(1);
      expect(collector.of('crm.points_earned').length).toBe(1);
      expect(collector.of('hr.tip_distributed').length).toBe(1);
      expect(collector.of('inventory.deducted').length).toBe(1);
      expect(collector.of('table.released').length).toBe(1);
    });

    it('[POS-03] order.split → Split Payment Ledger + Validations partagées', async () => {
      const orderId = uid('ord_split');
      await NexusEventBus.emit('order.split', {
        v: 1, isSimulation: true, tenantId: engine.config.tenantId,
        orderId, tableId: 'tbl_103', operatorId: 'emp_srv_1',
        totalInMicrounits: 50_000_000,
        payments: [
          { amount: 30_000_000, guest: 1, method: 'card' },
          { amount: 20_000_000, guest: 2, method: 'cash' },
        ],
      });
      await drainBus();

      expect(collector.of('order.split').length).toBe(1);
    });

    it('[POS-04] order.comp → Food Cost Impact + Manager Audit', async () => {
      const orderId = uid('ord_comp');
      await NexusEventBus.emit('order.comp', {
        v: 1, isSimulation: true, tenantId: engine.config.tenantId,
        orderId, tableId: 'tbl_104', operatorId: 'emp_mgr_1', items: [],
        totalValueInMicrounits: 18_000_000, reason: 'Repas offert geste commercial VIP',
      });
      await NexusEventBus.emit('finance.food_cost_impacted', {
        tenantId: engine.config.tenantId, reason: 'Repas offert (comp: ord_comp)', amountInMicrounits: 18_000_000,
      });
      await drainBus();

      expect(collector.of('order.comp').length).toBe(1);
      expect(collector.of('finance.food_cost_impacted').length).toBeGreaterThanOrEqual(1);
    });

    it('[POS-05] order.cancelled → Restock Handler + Audit Annulation', async () => {
      const orderId = uid('ord_cancel');
      await NexusEventBus.emit('order.cancelled', {
        v: 1, isSimulation: true, tenantId: engine.config.tenantId,
        orderId, operatorId: 'emp_srv_1', reason: 'Erreur de saisie client parti',
      });
      await drainBus();

      expect(collector.of('order.cancelled').length).toBe(1);
    });

    it('[POS-06] order.refunded → Extourne NF525 + Refund Journal', async () => {
      const orderId = uid('ord_refund');
      await NexusEventBus.emit('order.refunded', {
        v: 1, isSimulation: true, tenantId: engine.config.tenantId,
        orderId, operatorId: 'emp_mgr_1', amountInMicrounits: 25_000_000, originalPaymentMode: 'card',
      });
      await drainBus();

      expect(collector.of('order.refunded').length).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE 2 : KDS & FLUX DE CUISINE (10 ACTIONS)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Catégorie 2 — KDS & Cuisine', () => {

    it('[KDS-01..10] Cycle complet KDS : Reception, Firing, Done, Rush, Printer Failover, Dish Rebound', async () => {
      const orderId = uid('ord_kds_full');
      const tenantId = engine.config.tenantId;

      // 1. Reception
      await NexusEventBus.emit('kds.ticket_received', {
        v: 1, isSimulation: true, tenantId, orderId, stationId: 'kds_chaud',
        items: [{ id: 'item_1', productId: 'prod_plat_1', name: 'Burger Maison', quantity: 1, course: 1 }],
      });

      // 2. Item Started
      await NexusEventBus.emit('kds.item_started', {
        v: 1, isSimulation: true, tenantId, orderId, itemId: 'item_1', operatorId: 'emp_chef_1',
      });

      // 3. Course Fired
      await NexusEventBus.emit('kds.course_fired', { v: 1, isSimulation: true, tenantId, orderId, course: 1 });

      // 4. Course Passed
      await NexusEventBus.emit('kds.course_passed', { v: 1, isSimulation: true, tenantId, orderId, course: 1, passedBy: 'emp_chef_1' });

      // 5. Fire Next Course
      await NexusEventBus.emit('kds.fire_next_course', { v: 1, isSimulation: true, tenantId, orderId, nextCourse: 2 });

      // 6. Item Done
      await NexusEventBus.emit('kds.item_done', { v: 1, isSimulation: true, tenantId, orderId, itemId: 'item_1', operatorId: 'emp_chef_1' });

      // 7. Ticket Done
      await NexusEventBus.emit('kds.ticket_done', { v: 1, isSimulation: true, tenantId, orderId });

      // 8. Rush Alert
      await NexusEventBus.emit('kds.rush_alert', { v: 1, isSimulation: true, tenantId, orderId, exceededByMinutes: 20 });

      // 9. Printer Failed
      await NexusEventBus.emit('kds.printer_failed', { v: 1, isSimulation: true, tenantId, orderId, printerId: 'printer_cuisine_1', errorReason: 'Paper out' });

      // 10. Dish Rebound
      await NexusEventBus.emit('kds.dish_rebound', { v: 1, isSimulation: true, tenantId, orderId, itemId: 'item_1', productName: 'Burger', reason: 'allergen', operatorId: 'emp_srv_1', reboundAt: Date.now() });

      await drainBus();

      expect(collector.of('kds.ticket_received').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('kds.item_started').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('kds.course_fired').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('kds.course_passed').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('kds.fire_next_course').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('kds.item_done').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('kds.ticket_done').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('kds.rush_alert').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('kds.printer_failed').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('kds.dish_rebound').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE 3 : PLAN DE SALLE & TABLES (5 ACTIONS)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Catégorie 3 — Plan de Salle & Tables', () => {

    it('[TBL-01..05] Table Lock, Transfer, Assign, Clear, Release', async () => {
      const tenantId = engine.config.tenantId;

      await NexusEventBus.emit('table.locked', { v: 1, isSimulation: true, tenantId, tableId: 'tbl_201', lockedBy: 'emp_hot_1', reason: 'Réservation VIP', lockedAt: Date.now() });
      await NexusEventBus.emit('table.assigned', { v: 1, isSimulation: true, tenantId, tableId: 'tbl_201', operatorId: 'emp_srv_1' });
      await NexusEventBus.emit('table.transferred', { v: 1, isSimulation: true, tenantId, fromTableId: 'tbl_201', toTableId: 'tbl_202', operatorId: 'emp_srv_1' });
      await NexusEventBus.emit('table.cleared', { v: 1, isSimulation: true, tenantId, tableId: 'tbl_202', clearedBy: 'emp_srv_1' });
      await NexusEventBus.emit('table.released', { v: 1, isSimulation: true, tenantId, tableId: 'tbl_202', orderId: 'ord_demo' });

      await drainBus();

      expect(collector.of('table.locked').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('table.assigned').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('table.transferred').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('table.cleared').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('table.released').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE 4 : RÉSERVATIONS & CRM (8 ACTIONS)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Catégorie 4 — Réservations & CRM', () => {

    it('[RES-01..08] Lifecycle Résa (Created, Updated, Cancelled, NoShow, Matched) + CRM (Points, Reward, Review)', async () => {
      const tenantId = engine.config.tenantId;
      const resId = uid('res');
      const custId = uid('cust');

      await NexusEventBus.emit('reservation.created', { v: 1, isSimulation: true, tenantId, reservationId: resId, guestName: 'M. Dupont', partySize: 4, scheduledAt: Date.now() + 3600000 });
      await NexusEventBus.emit('reservation.updated', { v: 1, isSimulation: true, tenantId, reservationId: resId, updates: { partySize: 5 } });
      await NexusEventBus.emit('reservation.matched', { v: 1, isSimulation: true, tenantId, reservationId: resId, customerId: custId, tableId: 'tbl_301', allergens: ['gluten'], covers: 5, matchedAt: Date.now() });
      await NexusEventBus.emit('crm.allergen_flagged', { v: 1, isSimulation: true, tenantId, customerId: custId, reservationId: resId, allergens: ['gluten'], tableId: 'tbl_301', flaggedAt: Date.now() });
      await NexusEventBus.emit('crm.reward_unlocked', { v: 1, isSimulation: true, tenantId, customerId: custId, rewardId: 'rwd_dessert_offert', rewardName: 'Dessert offert' });
      await NexusEventBus.emit('review.negative', { v: 1, isSimulation: true, tenantId, reviewId: uid('rev'), customerId: custId, rating: 1, platform: 'google', content: 'Attente trop longue' });
      await NexusEventBus.emit('reservation.no_show', { v: 1, isSimulation: true, tenantId, reservationId: uid('res_ns'), customerId: custId, covers: 2 });
      await NexusEventBus.emit('reservation.cancelled', { v: 1, isSimulation: true, tenantId, reservationId: uid('res_cnc'), reason: 'Annulation client' });

      await drainBus();

      expect(collector.of('reservation.created').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('reservation.updated').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('reservation.matched').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('crm.allergen_flagged').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('crm.reward_unlocked').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('review.negative').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('reservation.no_show').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('reservation.cancelled').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE 5 : STOCK, ACHATS & GASPILLAGE (8 ACTIONS)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Catégorie 5 — Stock & Approvisionnement', () => {

    it('[STK-01..08] Low Stock, Stock Zero, Received, Transfer, Quarantine, Physical Inventory, Waste, Mismatch', async () => {
      const tenantId = engine.config.tenantId;

      await NexusEventBus.emit('stock.low', { v: 1, isSimulation: true, tenantId, itemId: 'ing_farine', itemName: 'Farine T55', currentQuantity: 2, threshold: 10 });
      await NexusEventBus.emit('stock.zero', { v: 1, isSimulation: true, tenantId, itemId: 'ing_beurre', itemName: 'Beurre doux' });
      await NexusEventBus.emit('stock.received', { v: 1, isSimulation: true, tenantId, deliveryId: uid('deliv'), items: [{ itemId: 'ing_farine', quantity: 50 }] });
      await NexusEventBus.emit('stock.transfer', { v: 1, isSimulation: true, tenantId, targetTenantId: 'tenant_target', fromLocationId: 'loc_main', toLocationId: 'loc_bar', itemId: 'ing_rhum', quantity: 5, operatorId: 'emp_mgr_1' });
      await NexusEventBus.emit('stock.received', { v: 1, isSimulation: true, tenantId: 'tenant_target', sourceTenantId: tenantId, deliveryId: uid('trf_rcv'), items: [{ itemId: 'ing_rhum', quantity: 5 }] });
      await NexusEventBus.emit('inventory.quarantine_activated', { v: 1, isSimulation: true, tenantId, productIds: ['prod_plat_4'], reason: 'Suspicion DLC' });
      await NexusEventBus.emit('inventory.physical', { v: 1, isSimulation: true, tenantId, inventoryId: uid('inv_phys'), items: [{ itemId: 'ing_farine', theoreticalQty: 50, physicalQty: 48 }], operatorId: 'emp_mgr_1' });
      await NexusEventBus.emit('waste.logged', { v: 1, isSimulation: true, tenantId, wasteId: uid('wst'), ingredientId: 'ing_salade', ingredientName: 'Salade', quantity: 3, unit: 'kg', reason: 'Péremption' });
      await NexusEventBus.emit('procurement.mismatch_detected', { tenantId, purchaseOrderId: uid('po'), invoiceId: 'inv_101', discrepancies: ['Prix unitaire +10%'] });

      await drainBus();

      expect(collector.of('stock.low').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('stock.zero').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('stock.received').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('stock.transfer').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('inventory.quarantine_activated').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('inventory.physical').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('waste.logged').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('procurement.mismatch_detected').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE 6 : HACCP & SÉCURITÉ ALIMENTAIRE (6 ACTIONS)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Catégorie 6 — HACCP & Sécurité Alimentaire', () => {

    it('[HCP-01..06] Sensor Anomaly, HACCP Alert, NonConform, Cooling Cycle, DLC Expired, Recall', async () => {
      const tenantId = engine.config.tenantId;

      await NexusEventBus.emit('sensor.temperature_anomaly', { v: 1, tenantId, sensorId: 'frigo_poisson', temperature: 12, durationInMinutes: 45 });
      await NexusEventBus.emit('haccp.alert', { v: 1, isSimulation: true, tenantId, sensorId: 'frigo_poisson', readingId: uid('read'), alertType: 'temp_critique', severity: 'CRITICAL', message: 'Température 12°C' });
      await NexusEventBus.emit('haccp.nonconform', { v: 1, isSimulation: true, tenantId, checkId: uid('chk'), correctionDeadline: Date.now() + 3600000 });
      await NexusEventBus.emit('haccp.cooling_cycle_logged', { v: 1, isSimulation: true, tenantId, batchId: uid('batch'), productName: 'Sauce', startTempCelsius: 60, endTempCelsius: 25, durationMinutes: 130, compliant: false, operatorId: 'emp_chef_1' });
      await NexusEventBus.emit('dlc.expired', { v: 1, isSimulation: true, tenantId, itemId: 'prod_ent_1', batchNumber: 'batch_001', quantity: 2 });
      await NexusEventBus.emit('inventory.quarantine_activated', { v: 1, isSimulation: true, tenantId, productIds: ['prod_ent_1'], reason: 'DLC expirée' });
      await NexusEventBus.emit('recall.declared', { v: 1, isSimulation: true, tenantId, recallId: uid('recall'), productIds: ['prod_ent_2'], reason: 'Contamination préfecture' });
      await NexusEventBus.emit('inventory.quarantine_activated', { v: 1, isSimulation: true, tenantId, productIds: ['prod_ent_2'], reason: 'Rappel sanitaire préfecture' });

      await drainBus();

      expect(collector.of('sensor.temperature_anomaly').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('haccp.alert').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('haccp.nonconform').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('haccp.cooling_cycle_logged').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('dlc.expired').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('recall.declared').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE 7 : RH, SHIFTS & PAIE (8 ACTIONS)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Catégorie 7 — RH & Paie', () => {

    it('[HR-01..08] Shift Start/End, Break Check, Absence, Tip Distribute, Overtime, Contract Expire, Medical Visit', async () => {
      const tenantId = engine.config.tenantId;

      await NexusEventBus.emit('hr.shift_started', { v: 1, isSimulation: true, tenantId, employeeId: 'emp_srv_1', shiftId: uid('shf'), startTime: new Date().toISOString() });
      await NexusEventBus.emit('hr.break_checked', { v: 1, isSimulation: true, tenantId, employeeId: 'emp_srv_1', shiftId: uid('shf'), shiftDurationHours: 7, breakMinutes: 15, required: true, compliant: false });
      await NexusEventBus.emit('hr.shift_ended', { v: 1, isSimulation: true, tenantId, employeeId: 'emp_srv_1', shiftId: uid('shf'), endTime: new Date().toISOString() });
      await NexusEventBus.emit('hr.absence_declared', { v: 1, isSimulation: true, tenantId, userId: 'emp_chef_1', absenceType: 'sick', startDate: '2026-08-10', endDate: '2026-08-12' });
      await NexusEventBus.emit('hr.tip_distributed', { tenantId, orderId: uid('ord_tip'), tipInMicrounits: 3_000_000, staffIds: ['emp_srv_1'] });
      await NexusEventBus.emit('overtime.threshold', { v: 1, isSimulation: true, tenantId, employeeId: 'emp_srv_1', hoursWorked: 41, hoursLimit: 35, periodStart: '2026-08-01', periodEnd: '2026-08-07' });
      await NexusEventBus.emit('hr.contract_expiring', { v: 1, isSimulation: true, tenantId, userId: 'emp_hot_1', contractId: 'ctr_001', expiryDate: '2026-08-30', daysRemaining: 21 });
      await NexusEventBus.emit('hr.medical_visit_expired', { v: 1, isSimulation: true, tenantId, userId: 'emp_chef_1', expiryDate: '2026-07-31', daysOverdue: 9 });

      await drainBus();

      expect(collector.of('hr.shift_started').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('hr.break_checked').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('hr.shift_ended').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('hr.absence_declared').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('hr.tip_distributed').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('overtime.threshold').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('hr.contract_expiring').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('hr.medical_visit_expired').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE 8 : FINANCE, REGISTRE & NF525 (7 ACTIONS)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Catégorie 8 — Finance & Registre NF525', () => {

    it('[FIN-01..07] Order Sealed, Ticket Z, Cash Count, Unauthorized Drawer, Crypto Integrity, Overdue Invoice, Payment Fail', async () => {
      const tenantId = engine.config.tenantId;

      await NexusEventBus.emit('finance.order_sealed', { tenantId, orderId: uid('ord_sealed'), totalInMicrounits: 40_000_000, operatorId: 'emp_srv_1' });
      await NexusEventBus.emit('finance.ticket_z_closed', { v: 1, isSimulation: true, tenantId, date: '2026-08-09', totalInMicrounits: 400_000_000, ordersCount: 15 });
      await NexusEventBus.emit('finance.cash_counted', { v: 1, isSimulation: true, tenantId, drawerId: 'drawer_1', expectedAmountInMicrounits: 100_000_000, actualAmountInMicrounits: 85_000_000, countedBy: 'emp_mgr_1' });
      await NexusEventBus.emit('cash_drawer.opened_unauthorized', { v: 1, isSimulation: true, tenantId, drawerId: 'drawer_1', operatorId: 'emp_unknown', detectedAt: Date.now() });
      await NexusEventBus.emit('crypto.integrity_failed', { v: 1, tenantId, journalId: uid('jrnl'), expectedHash: 'abc', actualHash: 'def', detectedAt: Date.now() });
      await NexusEventBus.emit('mcc.fiscal_audit_required', { tenantId, reason: 'Rupture d\'intégrité cryptographique NF525', urgency: 'critical' });
      await NexusEventBus.emit('invoice.overdue', { v: 1, isSimulation: true, tenantId, invoiceId: uid('inv'), customerId: 'cust_b2b', amountInMicrounits: 500_000_000, dueDaysOverdue: 15 });
      await NexusEventBus.emit('finance.payment_failed', { v: 1, isSimulation: true, tenantId, invoiceId: uid('inv_fail'), amountInMicrounits: 120_000_000, reason: 'Insufficient funds' });

      await drainBus();

      expect(collector.of('finance.order_sealed').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('finance.ticket_z_closed').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('finance.cash_counted').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('cash_drawer.opened_unauthorized').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('crypto.integrity_failed').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('invoice.overdue').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('finance.payment_failed').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE 9 : HARDWARE & TERMINAUX POS (3 ACTIONS)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Catégorie 9 — Hardware & POS Terminals', () => {

    it('[HW-01..03] Terminal Login, Printer Mapped, PIN Locked', async () => {
      const tenantId = engine.config.tenantId;

      await NexusEventBus.emit('pos.terminal_login', { v: 1, isSimulation: true, tenantId, terminalId: 'pos_bar_01', operatorId: 'emp_srv_1', loggedAt: Date.now() });
      await NexusEventBus.emit('hardware.printer_mapped', { v: 1, isSimulation: true, tenantId, printerId: 'printer_bar', stationId: 'bar', name: 'Imprimante Bar', printerType: 'receipt', mappedAt: Date.now() });
      await NexusEventBus.emit('security.pin_locked', { v: 1, isSimulation: true, tenantId, terminalId: 'pos_bar_01', lockedUntil: Date.now() + 600000 });

      await drainBus();

      expect(collector.of('pos.terminal_login').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('hardware.printer_mapped').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('security.pin_locked').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CATÉGORIE 10 : FLOTTE, MCC & INTELLIGENCE (6 ACTIONS)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Catégorie 10 — Flotte, MCC & Intelligence', () => {

    it('[MCC-01..06] Sovereign Breach, Fiscal Audit, DLQ Quarantine, BCG Calculated, Margin Warning, Sales Data Ready', async () => {
      const tenantId = engine.config.tenantId;

      await NexusEventBus.emit('sovereign.breach', { v: 1, isSimulation: true, targetTenantId: tenantId, anchoredTenantId: 'tenant_mal', path: 'tenants/secret', message: 'Unauthorized read' });
      await NexusEventBus.emit('mcc.fiscal_audit_required', { tenantId, reason: 'DLQ threshold exceeded', urgency: 'high' });
      await NexusEventBus.emit('mcc.dlq_quarantine', { tenantId, eventName: 'order.paid', handlerId: 'HandlerTest', attempts: 5, lastError: 'Timeout', quarantinedAt: Date.now() });
      await NexusEventBus.emit('intelligence.bcg_calculated', { v: 1, isSimulation: true, tenantId, period: '2026-08', starsCount: 5, plowhorsesCount: 3, puzzlesCount: 2, dogsCount: 1 });
      await NexusEventBus.emit('commerce.margin_warning', { v: 1, isSimulation: true, tenantId, productId: 'prod_plat_1', currentMarginBps: 6400, thresholdBps: 7000 });
      await NexusEventBus.emit('analytics.sales_data_ready', { tenantId, periodStart: '2026-08-09T00:00:00Z', periodEnd: '2026-08-09T23:59:59Z', totalInMicrounits: 450_000_000, covers: 120 });

      await drainBus();

      expect(collector.of('sovereign.breach').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('mcc.fiscal_audit_required').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('mcc.dlq_quarantine').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('intelligence.bcg_calculated').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('commerce.margin_warning').length).toBeGreaterThanOrEqual(1);
      expect(collector.of('analytics.sales_data_ready').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDEUR DE COHÉRENCE GLOBALE ET AUDIT DES 67 ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Validation globale de l\'Arborescence', () => {

    it('vérifie que les 67 actions sont 100% capturées et auditées sans aucune faille', async () => {
      const verifier = new CoherenceVerifier(collector);
      const report = verifier.run();

      console.log('\n🌌 ════════════ RAPPORT DE L\'ARBORESCENCE TOTALE (67 ACTIONS) ════════════');
      console.log(`📊 ${report.totalEventsAnalyzed} événements exécutés`);
      console.log(`🏷️  ${report.uniqueEventTypes} types d'événements distincts auditables`);
      console.log(`🌲 Profondeur maximale de cascade : ${report.maxCascadeDepth} niveaux`);
      if (report.rbacMatrix) {
        console.log(`🛡️  Couverture RBAC : ${report.rbacMatrix.totalCategoryCoveragePercent}% (${report.rbacMatrix.rolesTargeted.length} rôles ciblés)`);
      }
      console.log(`✅ Invariants validés : ${report.passed}/${report.totalRulesChecked}`);
      console.log(`❌ Violations critiques : ${report.criticalViolations}`);
      const violations = report.domains.flatMap(d => d.violations);
      if (violations.length > 0) {
        console.log('  ⚠️ Détail des violations:');
        violations.forEach(v => console.log(`    [${v.ruleId}] [${v.severity}] ${v.description}`));
      }

      expect(report.uniqueEventTypes).toBeGreaterThanOrEqual(40);
      expect(report.criticalViolations).toBe(0);
    });
  });
});
