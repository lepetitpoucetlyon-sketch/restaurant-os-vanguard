import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerFlexibilityNotificationHandler } from '@/shared/eventBus/handlers/FlexibilityNotificationHandler';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { IdempotencyGuard } from '@/shared/eventBus/IdempotencyGuard';

describe('Système de Rappels, d Alertes et de Notifications de Flexibilité', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    NexusEventBus.resetForTesting();
    IdempotencyGuard.clearMemoryCache();
    registerFlexibilityNotificationHandler();
  });

  it('1. stock.negative_alert déclenche une alerte push urgente ET une notification persistante', async () => {
    let capturedUrgent: unknown = null;
    let capturedCreated: unknown = null;

    NexusEventBus.on('notification.urgent', async (payload) => {
      capturedUrgent = payload;
    });
    NexusEventBus.on('notification.created', async (payload) => {
      capturedCreated = payload;
    });

    await NexusEventBus.emit('stock.negative_alert', {
      v: 1,
      tenantId: 'resto-test',
      itemId: 'steak-hache',
      itemName: 'Steak Haché',
      currentQuantity: -2,
      deficit: 2,
    });

    expect(capturedUrgent).toBeDefined();
    // Correctif N0-3 : rôles canoniques (minuscules) — sinon WebPushService.sendToRole
    // ne résout aucun utilisateur et l'alerte n'atteint personne.
    expect((capturedUrgent as { roles: string[] }).roles).toContain('chef_cuisinier');
    expect((capturedUrgent as { message: string }).message).toContain('Stock négatif détecté');

    expect(capturedCreated).toBeDefined();
    expect((capturedCreated as { priority: string }).priority).toBe('high');
    expect((capturedCreated as { title: string }).title).toBe('Alerte Rupture de Stock');
  });

  it('2. stock.pending_recipe_deduction déclenche un rappel de création de fiche technique', async () => {
    let capturedCreated: unknown = null;
    NexusEventBus.on('notification.created', async (payload) => {
      capturedCreated = payload;
    });

    await NexusEventBus.emit('stock.pending_recipe_deduction', {
      v: 1,
      tenantId: 'resto-test',
      deductionId: 'ded-123',
      orderId: 'ord-456',
      productId: 'burger-ephemere',
      quantity: 1,
      soldAt: new Date().toISOString(),
    });

    expect(capturedCreated).toBeDefined();
    expect((capturedCreated as { title: string }).title).toBe('Fiche Technique Manquante');
    // N3 : l'alerte est actionnable — elle mène à l'écran où on la traite.
    expect((capturedCreated as { action?: { href: string } }).action?.href).toBe('/menu-builder');
    expect((capturedCreated as { message: string }).message).toContain('vendu sans fiche technique');
  });

  it('3. stock.deductions_reconciled confirme la régularisation des stocks au chef', async () => {
    let capturedCreated: unknown = null;
    NexusEventBus.on('notification.created', async (payload) => {
      capturedCreated = payload;
    });

    await NexusEventBus.emit('stock.deductions_reconciled', {
      v: 1,
      tenantId: 'resto-test',
      productId: 'burger-ephemere',
      recipeId: 'rec-burger-1',
      reconciledCount: 8,
    });

    expect(capturedCreated).toBeDefined();
    expect((capturedCreated as { title: string }).title).toBe('Stocks Régularisés Rétroactivement');
    expect((capturedCreated as { message: string }).message).toContain('8 déduction(s)');
  });

  it('4. finance.purchase_variance_detected notifie l écart d achat à la comptabilité', async () => {
    let capturedCreated: unknown = null;
    NexusEventBus.on('notification.created', async (payload) => {
      capturedCreated = payload;
    });

    await NexusEventBus.emit('finance.purchase_variance_detected', {
      v: 1,
      tenantId: 'resto-test',
      supplierId: 'maree-bretonne',
      invoiceId: 'fact-001',
      receiptId: 'rec-001',
      stockItemId: 'saumon-frais',
      quantity: 5,
      provisionalPriceCts: 1200,
      actualPriceCts: 1500,
      varianceAmountCts: 1500,
    });

    expect(capturedCreated).toBeDefined();
    expect((capturedCreated as { title: string }).title).toBe('Écart Prix Achat Détecté');
    expect((capturedCreated as { message: string }).message).toContain('+15.00 €');
  });

  it('5. hr.shift_regularized consigne une notification de vacation rétroactive validée', async () => {
    let capturedCreated: unknown = null;
    NexusEventBus.on('notification.created', async (payload) => {
      capturedCreated = payload;
    });

    await NexusEventBus.emit('hr.shift_regularized', {
      v: 1,
      tenantId: 'resto-test',
      employeeId: 'emp-lucas',
      shiftId: 'shift-1',
      businessDay: '2026-09-01',
      occurredStartIso: '2026-09-01T08:00:00Z',
      occurredEndIso: '2026-09-01T16:00:00Z',
      recordedAtIso: '2026-09-04T18:00:00Z',
      isRetroactive: true,
      durationMinutes: 480,
      reason: 'Oubli badgeuse',
      approvedByManagerId: 'mgr-alexandre',
    });

    expect(capturedCreated).toBeDefined();
    expect((capturedCreated as { title: string }).title).toBe('Pointage Régularisé');
    expect((capturedCreated as { message: string }).message).toContain('8h');
  });

  it('6. finance.period_closed_batch notifie le bilan de la clôture groupée', async () => {
    let capturedCreated: unknown = null;
    NexusEventBus.on('notification.created', async (payload) => {
      capturedCreated = payload;
    });

    await NexusEventBus.emit('finance.period_closed_batch', {
      v: 1,
      tenantId: 'resto-test',
      fromDay: '2026-08-01',
      toDay: '2026-08-10',
      closedDays: ['2026-08-01', '2026-08-02'],
      skippedDays: [],
      totalInMicrounits: 85_000_000,
      totalOrdersCount: 12,
      operatorId: 'gerant-1',
    });

    expect(capturedCreated).toBeDefined();
    expect((capturedCreated as { title: string }).title).toBe('Clôture Multi-Jours Validée');
    expect((capturedCreated as { message: string }).message).toContain('85.00 €');
  });
});
