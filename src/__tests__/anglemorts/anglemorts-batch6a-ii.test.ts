import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: { adapter: { get: vi.fn(), set: vi.fn(), query: vi.fn() } },
}));
vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: { emit: vi.fn(), emitDurable: vi.fn() },
}));
vi.mock('@/lib/audit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/audit')>();
  return {
    ...actual,
    AuditLogger: { ...actual.AuditLogger, logAction: vi.fn().mockResolvedValue({ id: 'AUD-1', hash: 'HASH-1' }) },
  };
});
vi.mock('@/lib/mcc/audit/AuditLogger', () => ({
  AuditLogger: { logAction: vi.fn().mockResolvedValue({ id: 'AUD-1', hash: 'HASH-1' }) },
}));
vi.mock('@/modules/compliance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/compliance')>();
  return {
    ...actual,
    AuditLogger: { ...actual.AuditLogger, logAction: vi.fn().mockResolvedValue({ id: 'AUD-1', hash: 'HASH-1' }) },
  };
});
vi.mock('@/modules/compliance/securite/AuditLogger', () => ({
  AuditLogger: { logAction: vi.fn().mockResolvedValue({ id: 'AUD-1', hash: 'HASH-1' }) },
}));

import { AuditLogger } from '@/lib/audit';

import { SupplierDisputeWorkflowService } from '@/modules/logistics/approvisionnement/procurement/services/SupplierDisputeWorkflowService';
import { DlcExpiryAlertScheduler } from '@/modules/logistics/stock/inventory/services/DlcExpiryAlertScheduler';
import { PerpetualInventoryWorkflowService } from '@/modules/logistics/stock/inventory/services/PerpetualInventoryWorkflowService';
import { DeliveryPlatformAdapterService } from '@/modules/commerce/relation/delivery/services/DeliveryPlatformAdapterService';
import { DeliveryCommissionPnLService } from '@/modules/commerce/relation/delivery/services/DeliveryCommissionPnLService';
import { DeliveryStorePauseService } from '@/modules/commerce/relation/delivery/services/DeliveryStorePauseService';
import { VariableWeightStockService } from '@/modules/logistics/stock/inventory/services/VariableWeightStockService';
import { DoublePassOcrService } from '@/modules/logistics/approvisionnement/procurement/services/DoublePassOcrService';
describe('anglemorts-batch6a (Part 2)', () => {
  beforeEach(() => { vi.clearAllMocks(); });


  // ── H3/L31: SupplierDisputeWorkflowService ────────────────────────────────
  describe('H3/L31 — SupplierDisputeWorkflowService', () => {
    it('opens dispute, blocks SEPA debit and logs audit', async () => {
      const dispute = await SupplierDisputeWorkflowService.openDispute({
        tenantId: 'tenant-1',
        adminId: 'CHEF-1',
        deliverySlipId: 'BL-8899',
        supplierId: 'POMONA',
        supplierName: 'Pomona Terre Azur',
        disputedSku: 'SAUMON-FRAIS',
        productName: 'Filet de Saumon Label Rouge',
        reason: 'temperature_break',
        disputedAmountInMicrounits: 280_000_000, // 280.00 €
      });

      expect(dispute.sepaPaymentHold).toBe(true);
      expect(dispute.creditNoteExpectedInMicrounits).toBe(280_000_000);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'SUPPLIER_DISPUTE_SEQUESTRATED' }));
    });
  });

  // ── H4: DlcExpiryAlertScheduler ───────────────────────────────────────────
  describe('H4 — DlcExpiryAlertScheduler', () => {
    it('flags J-1 DLC expiry with immediate kitchen action', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const alert = DlcExpiryAlertScheduler.evaluateBatchDLC('tenant-1', {
        batchId: 'BATCH-CREME-01',
        sku: 'CREME-35',
        name: 'Crème liquide 35% 1L',
        expiryDateIso: tomorrow.toISOString().split('T')[0],
        quantityInStock: 6,
        unit: 'L',
        costInMicrounits: 24_000_000,
      });

      expect(alert.alertSeverity).toBe('j_minus_1');
      expect(alert.recommendedAction).toContain('Cuisiner impérativement ce jour');
    });
  });

  // ── H5: PerpetualInventoryWorkflowService ─────────────────────────────────
  describe('H5 — PerpetualInventoryWorkflowService', () => {
    it('reconciles inventory count and calculates financial shrinkage', async () => {
      const rep = await PerpetualInventoryWorkflowService.reconcileCategoryInventory(
        'tenant-1',
        'CHEF-1',
        'viandes',
        [
          { sku: 'COTE-BOEUF', name: 'Côte de bœuf', expectedQuantity: 10, countedQuantity: 8, unitCostInMicrounits: 25_000_000 }, // -2 * 25€ = -50€
          { sku: 'MAGRET', name: 'Magret canard', expectedQuantity: 15, countedQuantity: 15, unitCostInMicrounits: 8_000_000 },
        ]
      );

      expect(rep.totalVarianceInMicrounits).toBe(-50_000_000); // -50.00 € shrinkage
      expect(rep.hasDiscrepancies).toBe(true);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'PERPETUAL_INVENTORY_VARIANCE_POSTED' }));
    });
  });

  // ── F1: DeliveryPlatformAdapterService ────────────────────────────────────
  describe('F1 — DeliveryPlatformAdapterService', () => {
    it('normalizes external Uber Eats order into standard POS order', () => {
      const order = DeliveryPlatformAdapterService.normalizeOrder('tenant-1', {
        platform: 'uber_eats',
        platformOrderId: 'UBER-9876',
        customerName: 'Claire D.',
        orderLines: [
          { sku: 'BURGER-1', name: 'Cheeseburger', qty: 2, unitPriceInMicrounits: 14_000_000 },
        ],
        platformCommissionInMicrounits: 8_400_000,
      });

      expect(order.posOrderId).toBe('POS-DELIV-UBER_EATS-UBER-9876');
      expect(order.totalInMicrounits).toBe(28_000_000);
    });
  });

  // ── F2: DeliveryCommissionPnLService ──────────────────────────────────────
  describe('F2 — DeliveryCommissionPnLService', () => {
    it('computes net merchant revenue deducting 30% platform commission', () => {
      const pnl = DeliveryCommissionPnLService.computeOrderPnL('tenant-1', {
        platform: 'deliveroo',
        platformOrderId: 'DELIV-5544',
        grossTtcInMicrounits: 40_000_000, // 40.00 €
        foodCostInMicrounits: 10_000_000, // 10.00 €
        packagingCostInMicrounits: 1_200_000, // 1.20 €
        negotiatedCommissionPct: 30, // 30% = 12.00 €
      });

      expect(pnl.commissionInMicrounits).toBe(12_000_000);
      expect(pnl.netMerchantInMicrounits).toBe(28_000_000);
      expect(pnl.netContributionMarginInMicrounits).toBe(16_800_000); // 28 - 10 - 1.2 = 16.80 €
    });
  });

  // ── F3: DeliveryStorePauseService ─────────────────────────────────────────
  describe('F3 — DeliveryStorePauseService', () => {
    it('pauses delivery platforms during kitchen rush', async () => {
      const status = await DeliveryStorePauseService.pauseStore({
        tenantId: 'tenant-1',
        adminId: 'CHEF-1',
        platform: 'all',
        reason: 'kitchen_rush',
        pauseDurationMinutes: 45,
      });

      expect(status.isPaused).toBe(true);
      expect(status.autoResumeAt).toBeGreaterThan(Date.now());
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELIVERY_STORE_PAUSED' }));
    });
  });

  // ── L28: VariableWeightStockService ───────────────────────────────────────
  describe('L28 — VariableWeightStockService', () => {
    it('calculates true yield and effective cost per usable kg on whole salmon', () => {
      const res = VariableWeightStockService.evaluateYield('tenant-1', {
        sku: 'SAUMON-ENTIER',
        lotId: 'LOT-SAUMON-01',
        productName: 'Saumon Atlantique Entier 4-5kg',
        grossWeightGrams: 4500,
        tareGrams: 0,
        netWeightGrams: 4500,
        usableWeightGrams: 3150, // 70% yield (loss of head/bones/skin)
        billedUnitPricePerKgInMicrounits: 12_000_000, // 12€/kg brute -> 54.00€ total
      });

      expect(res.totalCostInMicrounits).toBe(54_000_000);
      expect(res.yieldPct).toBe(70);
      expect(res.parageLossGrams).toBe(1350);
      expect(res.effectiveCostPerUsableKgInMicrounits).toBe(17_142_857); // 54€ / 3.15kg = ~17.14€/kg filet
    });
  });

  // ── L29: DoublePassOcrService ─────────────────────────────────────────────
  describe('L29 — DoublePassOcrService', () => {
    it('requires manual review if OCR confidence < 90%', () => {
      const res = DoublePassOcrService.evaluatePasses(
        'tenant-1',
        'INV-GREASY-01',
        { extractedText: 'Total: 154.20 EUR', detectedTotalTtc: 154.20, ocrConfidence: 75 },
        { extractedText: 'Total: 154.20 EUR', detectedTotalTtc: 154.20, ocrConfidence: 80 }
      );

      expect(res.confidencePct).toBe(78);
      expect(res.requiresManualReview).toBe(true);
    });
  });

  // ── L30: SkuSubstitutionAlertService ──────────────────────────────────────
});
