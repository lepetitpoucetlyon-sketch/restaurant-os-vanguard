import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockGet, mockSet, mockUpdate, mockQuery, mockCreate, mockEmit, mockEmitDurable, mockOn, capturedHandlers } =
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
      mockCreate: vi.fn(),
      mockEmit: vi.fn(),
      mockEmitDurable: vi.fn(),
      mockOn,
      capturedHandlers,
    };
  });

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/audit', () => ({ empireAudit: { log: vi.fn() } }));
vi.mock('@/lib/adapters/MasterBridge', () => ({
  MasterBridge: { pushGlobalConfig: vi.fn(async () => undefined) },
}));
vi.mock('@/lib/push/browserPush', () => ({
  browserPush: { sendToRole: vi.fn(async () => true) },
}));
vi.mock('@/lib/adapters/NotificationGateway', () => ({
  NotificationGateway: { sendEmail: vi.fn(async () => true), send: vi.fn(async () => true) },
}));
vi.mock('@/modules/intelligence', () => ({
  HermesKnowledgeManager: { analyze: vi.fn(async () => ({ insights: [] })) },
}));
vi.mock('@/modules/intelligence/ia/GeminiProvider', () => ({
  GeminiProvider: vi.fn().mockImplementation(() => ({
    generateContent: vi.fn(async () => ({ text: '{"summary":"ok","priority":"low"}' })),
  })),
}));
vi.mock('@/modules/intelligence/ia/ai', () => ({ AI_MODELS: { GEMINI_FLASH: 'gemini-flash' } }));
vi.mock('@/lib/mcc/ChangelogService', () => ({
  ChangelogService: { getRecentChanges: vi.fn(async () => []) },
}));
vi.mock('@/domain/schemas/tenant', () => ({
  TenantConfigSchema: { safeParse: vi.fn(() => ({ success: false })) },
}));
vi.mock('@/domain/schemas/supportTicket', () => ({
  SupportDraftSchema: { parse: vi.fn((x: unknown) => x) },
}));
vi.mock('@/modules/commerce', () => ({
  AggregatorMappingService: { getActiveAdapters: vi.fn(async () => []) },
}));

// ─── Imports après mocks ───────────────────────────────────────────────────────

import { registerLLMFallbackHandler } from '@/shared/eventBus/handlers/LLMFallbackHandler';
import { FleetOutboxHandler } from '@/shared/eventBus/handlers/FleetOutboxHandler';
import { FleetStratBriefingHandler } from '@/shared/eventBus/handlers/FleetStratBriefingHandler';
import { OracleQueryAuditHandler } from '@/shared/eventBus/handlers/OracleQueryAuditHandler';
import { registerSovereignBreachHandler } from '@/shared/eventBus/handlers/SovereignBreachHandler';
import { PinLockoutNotifierHandler } from '@/shared/eventBus/handlers/PinLockoutNotifierHandler';
import { registerPrivacyConsentHandler } from '@/shared/eventBus/handlers/PrivacyConsentHandler';
import { registerReportRetryHandler } from '@/shared/eventBus/handlers/ReportRetryHandler';
import { WeeklyReportHandler } from '@/shared/eventBus/handlers/WeeklyReportHandler';
import { registerSupportTicketAnalysisHandler } from '@/shared/eventBus/handlers/SupportTicketAnalysisHandler';
import { GracePeriodHandler } from '@/shared/eventBus/handlers/GracePeriodHandler';
import { StripePaymentRetryHandler } from '@/shared/eventBus/handlers/StripePaymentRetryHandler';
import { registerDeliveryDriverUnlockHandler } from '@/shared/eventBus/handlers/DeliveryDriverUnlockHandler';
import { registerDeliveryRushModeHandler } from '@/shared/eventBus/handlers/DeliveryRushModeHandler';
import { registerAntiCorruptionLayerHandler } from '@/shared/eventBus/handlers/AntiCorruptionLayerHandler';
import { registerIntelligenceHandler } from '@/shared/eventBus/handlers/IntelligenceHandler';

const T = 'tenant-intel';

// ─── IntelligenceHandler ──────────────────────────────────────────────────────


// ─── Global spy setup (vi.spyOn on real singletons — path-agnostic) ─────────
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

beforeEach(() => {
  vi.restoreAllMocks();
  // NexusEventBus — use mockOn so capturedHandlers is populated
  vi.spyOn(NexusEventBus, 'on').mockImplementation(mockOn as typeof NexusEventBus.on);
  vi.spyOn(NexusEventBus, 'emit').mockImplementation(mockEmit as typeof NexusEventBus.emit);
  vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(mockEmitDurable as typeof NexusEventBus.emitDurable);
  // Nexus.adapter — delegate to hoisted vi.fn() mocks
  vi.spyOn(Nexus.adapter, 'get').mockImplementation(mockGet as typeof Nexus.adapter.get);
  vi.spyOn(Nexus.adapter, 'set').mockImplementation(mockSet as typeof Nexus.adapter.set);
  vi.spyOn(Nexus.adapter, 'update').mockImplementation(mockUpdate as typeof Nexus.adapter.update);
  vi.spyOn(Nexus.adapter, 'query').mockImplementation(mockQuery as typeof Nexus.adapter.query);
  vi.spyOn(Nexus.adapter, 'create').mockImplementation(mockCreate as typeof Nexus.adapter.create);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('IntelligenceHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerIntelligenceHandler(); });

  it('s\'enregistre sur order.paid sans erreur', () => {
    expect(capturedHandlers['order.paid']).toBeDefined();
  });

  it('accepte le payload sans explosion (debounce fire-and-forget)', () => {
    expect(() => capturedHandlers['order.paid']({
      tenantId: T, items: [], totalInMicrounits: 0, v: 1,
      orderId: 'x', tableId: 't', operatorId: 'o', paymentMode: 'card',
    })).not.toThrow();
  });
});

// ─── LLMFallbackHandler ───────────────────────────────────────────────────────

describe('LLMFallbackHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerLLMFallbackHandler(); });

  it('persiste un retry LLM avec le modèle fallback', async () => {
    mockSet.mockResolvedValue(undefined);
    mockEmit.mockResolvedValue(undefined);

    await capturedHandlers['llm.timeout']({
      tenantId: T, requestId: 'req-1', model: 'gemini-1.5-flash', prompt: 'Analyse ceci', attemptCount: 0,
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/llm/retries/`),
      expect.objectContaining({ fallbackModel: expect.any(String) }),
    );
  });
});

// ─── FleetOutboxHandler ───────────────────────────────────────────────────────

describe('FleetOutboxHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); FleetOutboxHandler.register(); });

  it('place l\'événement finance.payment_failed dans l\'outbox MCC', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['finance.payment_failed']({
      tenantId: T, invoiceId: 'inv-1', customerId: 'cust-1', amountInMicrounits: 5000000, reason: 'declined',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/mcc_outbox/`),
      expect.objectContaining({ eventName: 'finance.payment_failed', status: 'pending' }),
    );
  });

  it('ne fait rien si isSimulation', async () => {
    await capturedHandlers['finance.payment_failed']({ tenantId: T, isSimulation: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── FleetStratBriefingHandler ────────────────────────────────────────────────

describe('FleetStratBriefingHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); FleetStratBriefingHandler.register(); });

  it('génère et persiste le briefing MCC', async () => {
    mockQuery.mockResolvedValue([]);
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['ai.fleet_brief_requested']({
      tenantId: T, requestedBy: 'admin', fleetScope: 'all',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/ai/briefings/`),
      expect.objectContaining({ requestedBy: 'admin' }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['ai.fleet_brief_requested']({ tenantId: T, requestedBy: 'x', fleetScope: 'y', isSimulation: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── OracleQueryAuditHandler ──────────────────────────────────────────────────

describe('OracleQueryAuditHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); OracleQueryAuditHandler.register(); });

  it('trace la requête AI dans le ledger d\'audit', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['ai.query_received']({
      tenantId: T, userId: 'user-1', query: 'Quel est mon CA ?', contextScope: 'finance',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/ai/queries/`),
      expect.objectContaining({ userId: 'user-1', query: 'Quel est mon CA ?' }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['ai.query_received']({ tenantId: T, userId: 'x', query: 'y', contextScope: 'z', isSimulation: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── SovereignBreachHandler ───────────────────────────────────────────────────

describe('SovereignBreachHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerSovereignBreachHandler(); });

  it('déclenche le kill-switch MasterBridge en cas de brèche souveraine', async () => {
    const { MasterBridge } = await import('@/lib/adapters/MasterBridge');

    await capturedHandlers['sovereign.breach']({
      message: 'drift', targetTenantId: 'tenant-b', anchoredTenantId: T, path: '/bad/path',
    });

    expect(MasterBridge.pushGlobalConfig).toHaveBeenCalledWith(
      expect.objectContaining({ maintenanceMode: true, killSwitch: true }),
    );
  });
});

// ─── PinLockoutNotifierHandler ────────────────────────────────────────────────

describe('PinLockoutNotifierHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); PinLockoutNotifierHandler.register(); });

  it('persiste la notification de verrouillage PIN', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['security.pin_locked']({
      tenantId: T, terminalId: 'term-1', lockedUntil: Date.now() + 30000,
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/notifications/`),
      expect.objectContaining({ type: 'warning', priority: 'high' }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['security.pin_locked']({ tenantId: T, terminalId: 'x', lockedUntil: 0, isSimulation: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── PrivacyConsentHandler ────────────────────────────────────────────────────

describe('PrivacyConsentHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerPrivacyConsentHandler(); });

  it('anonymise le client si deleteRequested = true (RGPD)', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['crm.customer_updated']({
      tenantId: T, customerId: 'cust-1', updates: { deleteRequested: true },
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/customers/cust-1`,
      expect.objectContaining({ email: 'ANONYMOUS_USER', name: 'ANONYMOUS_USER' }),
    );
  });

  it('ne fait rien si deleteRequested est absent', async () => {
    await capturedHandlers['crm.customer_updated']({
      tenantId: T, customerId: 'cust-1', updates: { email: 'new@ex.com' },
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── ReportRetryHandler ───────────────────────────────────────────────────────

describe('ReportRetryHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerReportRetryHandler(); });

  it('planifie un retry avec backoff si attemptCount < 3', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['report.send.failed']({
      tenantId: T, reportId: 'rpt-1', recipientEmail: 'a@b.com',
      reportType: 'weekly', attemptCount: 1, error: 'timeout',
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/tasks/RETRY-REPORT-rpt-1`),
      expect.objectContaining({ nextRetryAt: expect.any(String) }),
    );
  });

  it('crée une alerte critique si attemptCount >= 3', async () => {
    mockSet.mockResolvedValue(undefined);
    const { empireAudit } = await import('@/lib/audit');

    await capturedHandlers['report.send.failed']({
      tenantId: T, reportId: 'rpt-2', recipientEmail: 'b@c.com',
      reportType: 'monthly', attemptCount: 3, error: 'permanent_failure',
    });

    expect(empireAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'REPORT_DELIVERY_FAILED' }),
    );
  });
});

// ─── WeeklyReportHandler ─────────────────────────────────────────────────────

describe('WeeklyReportHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); WeeklyReportHandler.register(); });

  it('génère et persiste le rapport hebdomadaire', async () => {
    mockQuery.mockResolvedValue([{ total: 5000000 }, { total: 3000000 }]);
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['ai.weekly_report_due']({ tenantId: T, periodEnd: '2026-09-07T00:00:00Z' });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/ai/reports/`),
      expect.objectContaining({ totalRevenue: 8000000, ticketCount: 2 }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['ai.weekly_report_due']({ tenantId: T, periodEnd: 'x', isSimulation: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── SupportTicketAnalysisHandler ────────────────────────────────────────────

describe('SupportTicketAnalysisHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerSupportTicketAnalysisHandler(); });

  it('analyse le ticket support et persiste le statut', async () => {
    mockGet.mockResolvedValue({ tier: 'pro', status: {} });
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['support.ticket_submitted']({
      tenantId: T, ticketId: 'tkt-1', userId: 'user-1', message: 'Mon POS ne démarre pas', category: 'technical',
    });

    expect(mockSet).toHaveBeenCalledWith(
      'mcc/supportTickets/tkt-1',
      expect.objectContaining({ status: expect.any(String) }),
      expect.objectContaining({ merge: true }),
    );
  });
});

// ─── GracePeriodHandler ───────────────────────────────────────────────────────

describe('GracePeriodHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); GracePeriodHandler.register(); });

  it('passe le tenant en grace_period read-only', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['tenant.subscription_expired']({
      tenantId: T, expiredAt: new Date().toISOString(),
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/billing/status`,
      expect.objectContaining({ status: 'grace_period', isReadOnly: true }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['tenant.subscription_expired']({ tenantId: T, expiredAt: 'x', isSimulation: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── StripePaymentRetryHandler ────────────────────────────────────────────────

describe('StripePaymentRetryHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); StripePaymentRetryHandler.register(); });

  it('planifie un retry de paiement Stripe et trace l\'échec', async () => {
    mockGet.mockResolvedValue({ contact: { emailGeneral: 'owner@res.com' } });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['finance.payment_failed']({
      tenantId: T, invoiceId: 'inv-1', customerId: 'cust-1', amountInMicrounits: 10000000, reason: 'declined',
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/finance/retries/`),
      expect.objectContaining({ status: 'pending', reason: 'declined' }),
    );
  });

  it('ignore si isSimulation', async () => {
    await capturedHandlers['finance.payment_failed']({ tenantId: T, isSimulation: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── DeliveryDriverUnlockHandler ─────────────────────────────────────────────

describe('DeliveryDriverUnlockHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerDeliveryDriverUnlockHandler(); });

  it('trace la libération du livreur dans l\'audit', async () => {
    const { empireAudit } = await import('@/lib/audit');

    await capturedHandlers['delivery.delivered']({ orderId: 'ord-1', driverId: 'drv-1', tenantId: T });

    expect(empireAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DRIVER_UNLOCKED', details: expect.objectContaining({ driverId: 'drv-1' }) }),
    );
  });

  it('ne fait rien si driverId est absent', async () => {
    const { empireAudit } = await import('@/lib/audit');

    await capturedHandlers['delivery.delivered']({ orderId: 'ord-2', tenantId: T });

    expect(empireAudit.log).not.toHaveBeenCalled();
  });
});

// ─── DeliveryRushModeHandler ──────────────────────────────────────────────────

describe('DeliveryRushModeHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerDeliveryRushModeHandler(); });

  it('suspend les plateformes de livraison en mode rush', async () => {
    const { AggregatorMappingService } = await import('@/modules/commerce');
    const mockAdapter = { suspendStore: vi.fn(async () => true) };
    (AggregatorMappingService.getActiveAdapters as ReturnType<typeof vi.fn>).mockResolvedValue([{ adapter: mockAdapter }]);

    await capturedHandlers['store.rush_mode_toggled']({ tenantId: T, isPaused: true, requestedBy: 'manager' });

    expect(mockAdapter.suspendStore).toHaveBeenCalledWith(T);
  });
});

// ─── AntiCorruptionLayerHandler ───────────────────────────────────────────────

describe('AntiCorruptionLayerHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerAntiCorruptionLayerHandler(); });

  it('émet les ordres natifs si autoAccept est activé', async () => {
    mockGet.mockResolvedValue({ autoAccept: true });

    await capturedHandlers['integration.delivery_order_received']({
      tenantId: T, integrationId: 'int-1', platform: 'uber',
      rawPayload: { id: 'ext-99', total_price_cents: 1000, items: [{ name: 'Pizza', quantity: 2, price_cents: 1000, id: 'p1' }] },
    });

    expect(mockEmitDurable).toHaveBeenCalledWith('order.placed', expect.objectContaining({ tenantId: T }));
  });
});
