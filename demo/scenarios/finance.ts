import { SimulacraEngine } from '../engine/SimulacraEngine';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

function seq(prefix: string, idx: number) {
  return `${prefix}_${idx}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Réconciliation bancaire ───────────────────────────────────────────────────

export async function triggerBankReconciliation(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  const bankTxId = seq('btx', Date.now());
  await NexusEventBus.emit('finance.bank_transaction_synced', {
    v: 1, isSimulation: true, tenantId,
    transactionId: bankTxId,
    bankAccountId: 'iban_nexus_restaurant_001',
    amountInMicrounits: 18_540_000_000,
    syncedAt: Date.now(),
  });
  await NexusEventBus.emit('finance.reconciliation_completed', {
    v: 1, isSimulation: true, tenantId,
    reconciliationId: seq('recon', Date.now()),
    bankTransactionId: bankTxId,
    matchedEntityId: seq('z_report', Date.now()),
    matchedEntityType: 'ticket_z',
    reconciledBy: 'emp_mgr_1',
  });
}

// ── Facture fournisseur traitée ──────────────────────────────────────────────

export async function triggerInvoiceProcessed(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  const invoiceId = seq('inv_sup', Date.now());
  await NexusEventBus.emit('supplier.invoice_processed', {
    v: 1, isSimulation: true, tenantId,
    supplierId: 'sup_boucher_1',
    invoiceId,
    lines: [
      { stockItemId: 'ing_viande_boeuf', unitCostInMicrounits: 26_400_000 },
      { stockItemId: 'ing_viande_porc', unitCostInMicrounits: 18_200_000 },
    ],
    processedAt: Date.now(),
  });
  await NexusEventBus.emit('finance.invoice_approved', {
    v: 1, isSimulation: true, tenantId,
    invoiceId,
    supplierId: 'sup_boucher_1',
    amountInMicrounits: 890_000_000,
    approvedBy: 'emp_mgr_1',
  });
}

// ── Livraison fournisseur reçue (stock up) ───────────────────────────────────

export async function triggerDeliveryReceived(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  const deliveryId = seq('dlv', Date.now());
  await NexusEventBus.emit('stock.received', {
    v: 1, isSimulation: true, tenantId,
    deliveryId,
    purchaseOrderId: 'po_primeur_041',
    items: [
      { itemId: 'ing_salade', quantity: 8, unitPrice: 2_500_000 },
      { itemId: 'ing_legumes_soupe', quantity: 12, unitPrice: 1_800_000 },
      { itemId: 'ing_legumes_misc', quantity: 20, unitPrice: 1_200_000 },
    ],
  });
  await NexusEventBus.emit('supplier.delivery_received', {
    v: 1, tenantId, supplierId: 'sup_primeur_1', orderId: 'po_primeur_041',
  });
}

// ── Inventaire physique hebdomadaire ─────────────────────────────────────────

export async function triggerPhysicalInventory(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('inventory.physical', {
    v: 1, isSimulation: true, tenantId,
    inventoryId: seq('inv_phys', Date.now()),
    operatorId: 'emp_mgr_1',
    items: [
      { itemId: 'ing_viande_boeuf', theoreticalQty: 12, physicalQty: 11 },
      { itemId: 'ing_salade', theoreticalQty: 6, physicalQty: 7 },
      { itemId: 'ing_poisson_saumon', theoreticalQty: 5, physicalQty: 5 },
    ],
  });
  // Ajustement stock écart
  await NexusEventBus.emit('inventory.stock_adjusted', {
    v: 1, isSimulation: true, tenantId,
    itemId: 'ing_viande_boeuf',
    oldQuantity: 12,
    newQuantity: 11,
    reason: 'Inventaire physique — écart -1 unité',
    adjustedBy: 'emp_mgr_1',
  });
}

// ── Clôture mensuelle NF525 ──────────────────────────────────────────────────

export async function triggerMonthClose(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  const month = engine.clock.getDateString().slice(0, 7);
  await NexusEventBus.emit('finance.period_locked', {
    v: 1, isSimulation: true, tenantId,
    periodId: `period_${month}`,
    lockedBy: 'emp_mgr_1',
    lockedAt: engine.clock.getISOString(),
  });
  await NexusEventBus.emit('finance.month_closed', {
    v: 1, tenantId, month,
  });
  // Rapport mensuel Fleet Intelligence
  await NexusEventBus.emit('ai.weekly_report_due', {
    v: 1, isSimulation: true, tenantId, periodEnd: engine.clock.getISOString(),
  });
}
