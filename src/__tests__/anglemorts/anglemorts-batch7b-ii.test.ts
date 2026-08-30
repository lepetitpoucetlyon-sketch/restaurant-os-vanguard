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

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

import { DynamicPricingSurgeEngineService } from '@/modules/commerce/relation/crm/services/DynamicPricingSurgeEngineService';
import { SommelierPairingEngineService } from '@/modules/commerce/relation/crm/services/SommelierPairingEngineService';
import { VipGuestPreferenceMemoryService } from '@/modules/commerce/relation/crm/services/VipGuestPreferenceMemoryService';
import { LostAndFoundRegistryService } from '@/modules/commerce/relation/crm/services/LostAndFoundRegistryService';
import { InfluencerCollaborationTrackerService } from '@/modules/commerce/relation/crm/services/InfluencerCollaborationTrackerService';
import { DigitalCoatCheckTagService } from '@/modules/commerce/relation/crm/services/DigitalCoatCheckTagService';
import { ValetParkingManagementService } from '@/modules/commerce/relation/crm/services/ValetParkingManagementService';
describe('Angles Morts — Batch 7 (Part 2)', () => {
  beforeEach(() => { vi.clearAllMocks(); });
describe('anglemorts-batch7b (Part 2)', () => {
  beforeEach(() => { vi.clearAllMocks(); });


  // ── T72: DynamicPricingSurgeEngineService ─────────────────────────────────
  describe('T72 — DynamicPricingSurgeEngineService', () => {
    it('applies +15% surge pricing during high occupancy match nights', () => {
      const surge = DynamicPricingSurgeEngineService.computeDynamicPrice('tenant-1', {
        basePriceInMicrounits: 10_000_000, // 10.00 € pint
        isMatchNightOrPeakEvent: true,
        currentOccupancyPct: 92,
      });

      expect(surge.appliedMultiplier).toBe(1.15);
      expect(surge.adjustedPriceInMicrounits).toBe(11_500_000); // 11.50 €
      expect(surge.isLegalNoticeRequired).toBe(true);
    });
  });

  // ── T73: SommelierPairingEngineService ─────────────────────────────────────
  describe('T73 — SommelierPairingEngineService', () => {
    it('recommends tannic red wine for red meat dish', () => {
      const rec = SommelierPairingEngineService.recommendPairing(
        'tenant-1',
        'ORD-5',
        { dishSku: 'COTE-BOEUF', dishName: 'Côte de Bœuf Maturée', dishCategory: 'viande_rouge' },
        [
          { wineSku: 'CHATEAUNEUF', wineName: 'Châteauneuf-du-Pape', appellation: 'AOP', vintage: '2020', bottlesInStock: 8, glassPriceInMicrounits: 14_000_000, tags: ['tannique', 'puissant', 'boise'] },
          { wineSku: 'CHABLIS', wineName: 'Chablis 1er Cru', appellation: 'AOP', vintage: '2022', bottlesInStock: 5, glassPriceInMicrounits: 11_000_000, tags: ['mineral', 'vif'] },
        ]
      );

      expect(rec?.recommendedWine.wineSku).toBe('CHATEAUNEUF');
      expect(rec?.sommelierTastingNote).toContain('Côte de Bœuf');
    });
  });

  // ── T74: VipGuestPreferenceMemoryService ───────────────────────────────────
  describe('T74 — VipGuestPreferenceMemoryService', () => {
    it('applies VIP table and beverage preferences and logs audit', async () => {
      const greeting = await VipGuestPreferenceMemoryService.applyPreferences('tenant-1', 'MAITRE-HOTEL', {
        customerId: 'VIP-7',
        guestName: 'Madame de La Tour',
        preferredTableNumber: 'Table 1 (Alcôve)',
        favoriteWater: 'gazeuse_chateldon',
        meatCookingPreference: 'saignant',
        dietaryRestrictions: ['sans_gluten'],
        notes: 'Toujours servir le pain sans gluten tiède',
      });

      expect(greeting.vipTableAssignment).toBe('Table 1 (Alcôve)');
      expect(greeting.greetingSummary).toContain('gazeuse_chateldon');
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'VIP_PREFERENCE_UPDATED' }));
    });
  });

  // ── T75: LostAndFoundRegistryService ──────────────────────────────────────
  describe('T75 — LostAndFoundRegistryService', () => {
    it('registers lost item in digital registry', () => {
      const item = LostAndFoundRegistryService.registerItem('tenant-1', {
        itemId: 'LOST-01',
        itemDescription: 'Lunettes de soleil Ray-Ban étui cuir',
        locationFound: 'Terrasse Table 8 sous chaise',
        foundByStaffName: 'Nicolas',
      });

      expect(item.isReturnedToOwner).toBe(false);
      expect(NexusEventBus.emit).toHaveBeenCalledWith('crm.lost_found_registered', expect.any(Object));
    });
  });

  // ── T76: InfluencerCollaborationTrackerService ────────────────────────────
  describe('T76 — InfluencerCollaborationTrackerService', () => {
    it('measures influencer ROI on promo code orders', () => {
      const rep = InfluencerCollaborationTrackerService.evaluateRoi('tenant-1', {
        influencerHandle: '@lyon_food_guide',
        promoCode: 'LYONFOOD10',
        complimentaryMealCostInMicrounits: 90_000_000, // 90.00 € meal
        generatedOrdersCount: 28,
        totalGeneratedRevenueInMicrounits: 1_250_000_000, // 1 250.00 €
      });

      expect(rep.isCampaignProfitable).toBe(true);
      expect(rep.roiMultiplier).toBe(13.9); // ~13.9x ROI
    });
  });

  // ── T77: DigitalCoatCheckTagService ───────────────────────────────────────
  describe('T77 — DigitalCoatCheckTagService', () => {
    it('issues digital coat check tag with claim token', () => {
      const tag = DigitalCoatCheckTagService.issueDigitalTag({
        tenantId: 'tenant-1',
        tagNumber: 'VEST-88',
        customerPhone: '+33612345678',
        garmentDescription: 'Veste costume bleue',
      });

      expect(tag.digitalClaimQrUrl).toContain('/vestiaire/VEST-88');
      expect(tag.smsClaimToken).toContain('CLAIM-VEST-88');
    });
  });

  // ── T78: ValetParkingManagementService ────────────────────────────────────
  describe('T78 — ValetParkingManagementService', () => {
    it('creates valet parking ticket with spot assignment', () => {
      const ticket = ValetParkingManagementService.checkInVehicle({
        tenantId: 'tenant-1',
        vehiclePlate: 'AB-123-CD',
        vehicleModel: 'Porsche Taycan',
        customerPhone: '+33698765432',
        assignedSpotNumber: 'BOX-04',
      });

      expect(ticket.vehiclePlate).toBe('AB-123-CD');
      expect(ticket.spotNumber).toBe('BOX-04');
      expect(ticket.retrievalSmsUrl).toContain('/claim/VALET-tenant-1');
    });
  });
});
});
