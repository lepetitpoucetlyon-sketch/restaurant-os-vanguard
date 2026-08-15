import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockGet, mockSet, mockUpdate, mockQuery, mockEmit, mockEmitDurable, mockOn, capturedHandlers } =
  vi.hoisted(() => {
    const capturedHandlers: Record<string, (payload: unknown) => Promise<void>> = {};
    const mockOn = vi.fn((event: string, cb: (p: unknown) => Promise<void>) => {
      capturedHandlers[event] = cb;
      return () => {};
    });
    return {
      mockGet: vi.fn(),
      mockSet: vi.fn(),
      mockUpdate: vi.fn(),
      mockQuery: vi.fn(),
      mockEmit: vi.fn(),
      mockEmitDurable: vi.fn(),
      mockOn,
      capturedHandlers,
    };
  });

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));
vi.mock('@/modules/commerce/relation/delivery/services/AggregatorMappingService', () => ({
  AggregatorMappingService: {
    getActiveAdapters: vi.fn(async () => []),
  },
}));
vi.mock('@/modules/intelligence/ia/ai', () => ({
  AI_MODELS: { fast: 'gemini-flash', pro: 'gemini-pro', GEMINI_FLASH: 'gemini-flash' },
  DNAInjector: { inject: vi.fn() },
}));
vi.mock('@/instances', () => ({}));
vi.mock('@/instances/lepetitpoucet', () => ({}));

// ─── Imports après mocks ───────────────────────────────────────────────────────

import { registerBirthdayCampaignHandler } from '@/shared/eventBus/handlers/BirthdayCampaignHandler';
import { BirthdayOfferHandler } from '@/shared/eventBus/handlers/BirthdayOfferHandler';
import { registerCustomerProfileInitHandler } from '@/shared/eventBus/handlers/CustomerProfileInitHandler';
import { registerCustomerRFMAnalyzerHandler } from '@/shared/eventBus/handlers/CustomerRFMAnalyzerHandler';
import { registerCustomerRiskTagHandler } from '@/shared/eventBus/handlers/CustomerRiskTagHandler';
import { registerInactiveCustomerHandler } from '@/shared/eventBus/handlers/InactiveCustomerHandler';
import { registerLoyaltyRewardAlertHandler } from '@/shared/eventBus/handlers/LoyaltyRewardAlertHandler';
import { registerSegmentTargetingHandler } from '@/shared/eventBus/handlers/SegmentTargetingHandler';
import { registerMarketingCampaignRouterHandler } from '@/shared/eventBus/handlers/MarketingCampaignRouterHandler';
import { registerNegativeReviewHandler } from '@/shared/eventBus/handlers/NegativeReviewHandler';
import { PromotionExpiryHandler } from '@/shared/eventBus/handlers/PromotionExpiryHandler';
import { PromotionPriceHandler } from '@/shared/eventBus/handlers/PromotionPriceHandler';
import { registerAggregatorMenuSyncHandler } from '@/shared/eventBus/handlers/AggregatorMenuSyncHandler';
import { registerAggregatorStockSyncHandler } from '@/shared/eventBus/handlers/AggregatorStockSyncHandler';
import { registerQuoteFollowUpHandler } from '@/shared/eventBus/handlers/QuoteFollowUpHandler';

const T = 'tenant-crm';

// ─── Global spy setup (vi.spyOn on real singletons — path-agnostic) ─────────
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { NotificationGateway } from '@/lib/adapters/NotificationGateway';
import { SharedKernel } from '@/lib/shared-kernel';

beforeEach(() => {
  mockGet.mockClear();
  mockSet.mockClear();
  mockUpdate.mockClear();
  mockQuery.mockClear();
  mockEmit.mockClear();
  mockEmitDurable.mockClear();

  // NexusEventBus — use mockOn so capturedHandlers is populated
  vi.spyOn(NexusEventBus, 'on').mockImplementation(mockOn as typeof NexusEventBus.on);
  vi.spyOn(NexusEventBus, 'emit').mockImplementation(mockEmit as typeof NexusEventBus.emit);
  vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(mockEmitDurable as typeof NexusEventBus.emitDurable);
  // Nexus.adapter — delegate to hoisted vi.fn() mocks
  vi.spyOn(Nexus.adapter, 'get').mockImplementation(mockGet as typeof Nexus.adapter.get);
  vi.spyOn(Nexus.adapter, 'set').mockImplementation(mockSet as typeof Nexus.adapter.set);
  vi.spyOn(Nexus.adapter, 'update').mockImplementation(mockUpdate as typeof Nexus.adapter.update);
  vi.spyOn(Nexus.adapter, 'query').mockImplementation(mockQuery as typeof Nexus.adapter.query);
  // Real singletons
  vi.spyOn(empireAudit, 'log').mockImplementation(vi.fn());
  vi.spyOn(NotificationGateway, 'send').mockResolvedValue(undefined as never);
  vi.spyOn(SharedKernel, 'generateId').mockImplementation((p: string) => `${p}-id`);

  if (vi.isMockFunction(empireAudit.log)) (empireAudit.log as any).mockClear();
  if (vi.isMockFunction(NotificationGateway.send)) (NotificationGateway.send as any).mockClear();
});

describe('BirthdayCampaignHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerBirthdayCampaignHandler(); });

  it('émet marketing.campaign_launched pour l\'anniversaire', async () => {
    await capturedHandlers['crm.birthday_approaching']({ tenantId: T, customerId: 'cust-1' });
    expect(mockEmit).toHaveBeenCalledWith('marketing.campaign_launched', expect.objectContaining({
      campaignId: 'birthday-cust-1', targetSegment: 'birthday',
    }));
  });
});

// ─── BirthdayOfferHandler ─────────────────────────────────────────────────────

describe('BirthdayOfferHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); BirthdayOfferHandler.register(); });

  it('persiste le coupon anniversaire dans Nexus', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['crm.birthday_approaching']({
      tenantId: T, customerId: 'cust-2', birthdayAt: '2026-09-01T00:00:00Z', daysUntil: 3,
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/crm/coupons/`),
      expect.objectContaining({ customerId: 'cust-2' }),
    );
  });
});

// ─── CustomerProfileInitHandler ───────────────────────────────────────────────

describe('CustomerProfileInitHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerCustomerProfileInitHandler(); });

  it('crée le profil fidélité pour un nouveau client', async () => {
    mockGet.mockResolvedValue(null);
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['crm.customer_created']({ tenantId: T, customerId: 'cust-new' });

    expect(mockSet).toHaveBeenCalledWith(
      `tenants/${T}/crms/cust-new`,
      expect.objectContaining({ loyaltyPoints: 0, totalVisits: 0, tags: ['new_customer'] }),
    );
  });

  it('ne réinitialise pas le profil s\'il existe déjà', async () => {
    mockGet.mockResolvedValue({ loyaltyPoints: 200 });

    await capturedHandlers['crm.customer_created']({ tenantId: T, customerId: 'cust-existing' });

    expect(mockSet).not.toHaveBeenCalled();
  });
});

// ─── CustomerRFMAnalyzerHandler ───────────────────────────────────────────────

describe('CustomerRFMAnalyzerHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerCustomerRFMAnalyzerHandler(); });

  it('met à jour le segment RFM du client après gain de points', async () => {
    mockGet.mockResolvedValue({ visitCount: 4, segment: 'regular' });
    mockUpdate.mockResolvedValue(undefined);
    const nexusMod = await import('@/lib/nexus/NexusAdapter');
    (nexusMod.Nexus.adapter as unknown as Record<string, unknown>).runTransaction = vi.fn(
      async (fn: (t: unknown) => Promise<void>) => fn({}),
    );

    await capturedHandlers['crm.rfm_trigger']({
      tenantId: T, customerId: 'cust-1',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/customers/cust-1`,
      expect.objectContaining({ segment: expect.any(String) }),
    );
  });
});

// ─── CustomerRiskTagHandler ───────────────────────────────────────────────────

describe('CustomerRiskTagHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerCustomerRiskTagHandler(); });

  it('incrémente le noShowCount du profil CRM', async () => {
    mockGet.mockResolvedValue({ noShowCount: 0, tags: [] });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['reservation.no_show']({ tenantId: T, reservationId: 'res-1', customerId: 'cust-1' });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/crms/cust-1`,
      expect.objectContaining({ noShowCount: 1 }),
    );
  });

  it('ne fait rien si customerId est absent', async () => {
    await capturedHandlers['reservation.no_show']({ tenantId: T, reservationId: 'res-2' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── InactiveCustomerHandler ──────────────────────────────────────────────────

describe('InactiveCustomerHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerInactiveCustomerHandler(); });

  it('crée une campagne de réactivation pour le client inactif', async () => {
    mockGet.mockResolvedValue({ name: 'Marie Dupont', email: 'marie@ex.com', tags: [] });
    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['inactive.90d']({
      tenantId: T, customerId: 'cust-1', lastVisitDate: '2026-04-01', totalSpentInMicrounits: 80000000,
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/marketing/campaigns/`),
      expect.objectContaining({ type: 'reactivation', customerId: 'cust-1' }),
    );
  });
});

// ─── LoyaltyRewardAlertHandler ────────────────────────────────────────────────

describe('LoyaltyRewardAlertHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerLoyaltyRewardAlertHandler(); });

  it('émet une notification de récompense débloquée', async () => {
    await capturedHandlers['crm.reward_unlocked']({
      tenantId: T, customerId: 'cust-1', rewardId: 'rew-1', rewardName: 'Café offert',
    });
    expect(mockEmit).toHaveBeenCalledWith('notification.created', expect.objectContaining({
      title: 'Cadeau Fidélité !',
    }));
  });
});

// ─── SegmentTargetingHandler ──────────────────────────────────────────────────

describe('SegmentTargetingHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerSegmentTargetingHandler(); });

  it('trace le ciblage de segment dans l\'audit', async () => {
    const { empireAudit } = await import('@/lib/audit');
    await capturedHandlers['crm.segment_matched']({
      tenantId: T, segmentId: 'seg-vip', customerId: 'cust-1', segmentName: 'VIP',
    });
    expect(empireAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CUSTOMER_SEGMENT_MATCHED' }));
  });
});

// ─── MarketingCampaignRouterHandler ───────────────────────────────────────────

describe('MarketingCampaignRouterHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerMarketingCampaignRouterHandler(); });

  it('trace la campagne dans l\'audit', async () => {
    const { empireAudit } = await import('@/lib/audit');
    await capturedHandlers['marketing.campaign_launched']({
      tenantId: T, campaignId: 'camp-1', targetSegment: 'birthday', launchedBy: 'system',
    });
    expect(empireAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CAMPAIGN_DISPATCHED' }));
  });
});

// ─── NegativeReviewHandler ────────────────────────────────────────────────────

describe('NegativeReviewHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerNegativeReviewHandler(); });

  it('alerte le manager sur un avis négatif', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['review.negative']({
      tenantId: T, reviewId: 'rev-1', platform: 'google', rating: 2, content: 'Mauvais service',
    });

    expect(mockSet).toHaveBeenCalledWith(
      `tenants/${T}/reviews/alerts/ALERT-rev-1`,
      expect.objectContaining({ reviewId: 'rev-1' }),
    );
  });
});

// ─── PromotionExpiryHandler ───────────────────────────────────────────────────

describe('PromotionExpiryHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); PromotionExpiryHandler.register(); });

  it('expire la promotion et rollback les prix des produits', async () => {
    mockGet.mockResolvedValue({ productIds: ['prod-1', 'prod-2'] });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['commerce.promotion_expired']({ tenantId: T, promotionId: 'promo-1' });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/pos/activePromotions/promo-1`, expect.objectContaining({ status: 'expired' }),
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/menu/items/prod-1`, expect.objectContaining({ activePromotionId: null }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['commerce.promotion_expired']({ tenantId: T, promotionId: 'x', isSimulation: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── PromotionPriceHandler ────────────────────────────────────────────────────

describe('PromotionPriceHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); PromotionPriceHandler.register(); });

  it('applique la remise promotionnelle sur les produits ciblés', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['commerce.promotion_activated']({
      tenantId: T, promotionId: 'promo-2', discountBps: 1000, productIds: ['prod-A'],
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/menu/items/prod-A`,
      expect.objectContaining({ promotionDiscountBps: 1000 }),
    );
  });
});

// ─── AggregatorMenuSyncHandler ────────────────────────────────────────────────

describe('AggregatorMenuSyncHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerAggregatorMenuSyncHandler(); });

  it('ne fait rien si l\'intégration est introuvable', async () => {
    const { AggregatorMappingService } = await import(
      '@/modules/commerce/relation/delivery/services/AggregatorMappingService'
    );
    (AggregatorMappingService.getActiveAdapters as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await capturedHandlers['integration.menu_sync_requested']({
      tenantId: T, integrationId: 'ubereats', requestedBy: 'admin',
    });

    expect(mockSet).not.toHaveBeenCalled();
  });
});

// ─── AggregatorStockSyncHandler ───────────────────────────────────────────────

describe('AggregatorStockSyncHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerAggregatorStockSyncHandler(); });

  it('marque l\'article épuisé dans l\'audit de sync', async () => {
    const { empireAudit } = await import('@/lib/audit');
    await capturedHandlers['stock.zero']({
      tenantId: T, itemId: 'item-1', itemName: 'Frites',
    });
    expect(empireAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'AGGREGATOR_STOCK_ZERO_SYNCED' }));
  });
});

// ─── QuoteFollowUpHandler ─────────────────────────────────────────────────────

describe('QuoteFollowUpHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockQuery.mockClear();
    mockEmit.mockClear();
    mockEmitDurable.mockClear(); registerQuoteFollowUpHandler(); });

  it('planifie la relance du devis envoyé', async () => {
    mockGet.mockResolvedValue({ quoteId: 'quot-1', customerId: 'cust-1' });
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['quote.sent']({
      tenantId: T, quoteId: 'quot-1', customerId: 'cust-1',
      totalInMicrounits: 50000000, sentAt: new Date().toISOString(),
    });

    expect(mockSet).toHaveBeenCalledWith(
      `tenants/${T}/tasks/FOLLOWUP-quot-1`,
      expect.objectContaining({ quoteId: 'quot-1' }),
    );
  });
});
