import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: { adapter: { get: mockGet, set: mockSet, update: mockUpdate, query: mockQuery } },
}));
vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: { on: mockOn, emit: mockEmit, emitDurable: mockEmitDurable },
}));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));
vi.mock('@/infrastructure/services/audit', () => ({ empireAudit: { log: vi.fn() } }));
vi.mock('@/lib/shared-kernel', () => ({
  SharedKernel: { generateId: vi.fn((p: string) => `${p}-id`) },
}));
vi.mock('@/lib/push/browserPush', () => ({
  browserPush: { sendToRole: vi.fn(async () => true), sendToUser: vi.fn(async () => true) },
}));
vi.mock('@/infrastructure/adapters/NotificationGateway', () => ({
  NotificationGateway: { sendEmail: vi.fn(async () => true), send: vi.fn(async () => true) },
}));

// ─── Imports après mocks ───────────────────────────────────────────────────────

import { registerKdsCourseManagerHandler } from '@/shared/eventBus/handlers/KdsCourseManagerHandler';
import { registerKdsPassNotifierHandler } from '@/shared/eventBus/handlers/KdsPassNotifierHandler';
import { registerKdsPrepDelayAlertHandler } from '@/shared/eventBus/handlers/KdsPrepDelayAlertHandler';
import { registerKdsPrepTimeAnalyzerHandler } from '@/shared/eventBus/handlers/KdsPrepTimeAnalyzerHandler';
import { registerKdsPrintFallbackHandler } from '@/shared/eventBus/handlers/KdsPrintFallbackHandler';
import { registerKdsRoutingHandler } from '@/shared/eventBus/handlers/KdsRoutingHandler';
import { registerRecipeChangeKDSHandler } from '@/shared/eventBus/handlers/RecipeChangeKDSHandler';
import { registerRushModeIntegrationHandler } from '@/shared/eventBus/handlers/RushModeIntegrationHandler';
import { registerOrderAcceptanceWindowHandler } from '@/shared/eventBus/handlers/OrderAcceptanceWindowHandler';
import { registerOrderCancelRestockHandler } from '@/shared/eventBus/handlers/OrderCancelRestockHandler';
import { registerBigGroupAlertHandler } from '@/shared/eventBus/handlers/BigGroupAlertHandler';
import { registerGroupPrepTasksHandler } from '@/shared/eventBus/handlers/GroupPrepTasksHandler';
import { registerResaKitchenTaskHandler } from '@/shared/eventBus/handlers/ResaKitchenTaskHandler';
import { registerResaReminderHandler } from '@/shared/eventBus/handlers/ResaReminderHandler';
import { registerReservationNotifierHandler } from '@/shared/eventBus/handlers/ReservationNotifierHandler';
import { registerNoShowPenaltyHandler } from '@/shared/eventBus/handlers/NoShowPenaltyHandler';
import { registerFloorPlanCapacityHandler } from '@/shared/eventBus/handlers/FloorPlanCapacityHandler';
import { registerTableTurnoverAnalyzerHandler } from '@/shared/eventBus/handlers/TableTurnoverAnalyzerHandler';
import { registerCompEntryHandler } from '@/shared/eventBus/handlers/CompEntryHandler';
import { registerCompMealHandler } from '@/shared/eventBus/handlers/CompMealHandler';

const T = 'tenant-ops';

// ─── KdsCourseManagerHandler ──────────────────────────────────────────────────

describe('KdsCourseManagerHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerKdsCourseManagerHandler(); });

  it('met les items du course à fired dans le ticket KDS', async () => {
    mockGet.mockResolvedValue({
      items: [{ id: 'i-1', course: 1, status: 'pending' }, { id: 'i-2', course: 2, status: 'pending' }],
    });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['kds.course_fired']({ tenantId: T, orderId: 'ord-1', course: 1 });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/kdsTickets/kds_ord-1`,
      expect.objectContaining({
        items: expect.arrayContaining([expect.objectContaining({ id: 'i-1', status: 'fired' })]),
      }),
    );
  });

  it('ne fait rien si le ticket KDS est introuvable', async () => {
    mockGet.mockResolvedValue(null);
    await capturedHandlers['kds.course_fired']({ tenantId: T, orderId: 'ord-ghost', course: 1 });
    expect(mockUpdate).not.toHaveBeenCalledWith(expect.stringContaining('kdsTickets'), expect.anything());
  });
});

// ─── KdsPassNotifierHandler ───────────────────────────────────────────────────

describe('KdsPassNotifierHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerKdsPassNotifierHandler(); });

  it('trace la notification ticket prêt au passe', async () => {
    const { empireAudit } = await import('@/infrastructure/services/audit');
    await capturedHandlers['kds.ticket_done']({ tenantId: T, orderId: 'ord-1' });
    expect(empireAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'KDS_TICKET_READY_NOTIFIED' }));
  });
});

// ─── KdsPrepDelayAlertHandler ─────────────────────────────────────────────────

describe('KdsPrepDelayAlertHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerKdsPrepDelayAlertHandler(); });

  it('émet une notification d\'urgence en cas de retard', async () => {
    await capturedHandlers['kds.ticket_delayed']({ tenantId: T, orderId: 'ord-1', delayInMinutes: 20 });
    expect(mockEmit).toHaveBeenCalledWith('notification.urgent', expect.objectContaining({ tenantId: T }));
  });
});

// ─── KdsPrepTimeAnalyzerHandler ───────────────────────────────────────────────

describe('KdsPrepTimeAnalyzerHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerKdsPrepTimeAnalyzerHandler(); });

  it('met l\'item à done et trace le temps de préparation', async () => {
    mockGet.mockResolvedValue({
      items: [{ id: 'item-1', status: 'fired', startedAt: Date.now() - 900000 }],
    });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['kds.item_done']({ tenantId: T, orderId: 'ord-1', itemId: 'item-1' });

    expect(mockUpdate).toHaveBeenCalledWith(
      `tenants/${T}/kdsTickets/kds_ord-1`,
      expect.objectContaining({ items: expect.arrayContaining([expect.objectContaining({ status: 'done' })]) }),
    );
  });
});

// ─── KdsPrintFallbackHandler ──────────────────────────────────────────────────

describe('KdsPrintFallbackHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerKdsPrintFallbackHandler(); });

  it('trace le fallback imprimante dans l\'audit', async () => {
    const { empireAudit } = await import('@/infrastructure/services/audit');
    await capturedHandlers['kds.printer_failed']({ tenantId: T, orderId: 'ord-1', printerId: 'ptr-1', errorReason: 'offline' });
    expect(empireAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'KDS_PRINTER_FALLBACK_TRIGGERED' }));
  });
});

// ─── KdsRoutingHandler ────────────────────────────────────────────────────────

describe('KdsRoutingHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerKdsRoutingHandler(); });

  it('crée le ticket KDS et émet kds.ticket_received', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['order.placed']({
      tenantId: T, orderId: 'ord-2',
      items: [{ productId: 'prod-1', name: 'Pizza', quantity: 2, unitPriceInMicrounits: 1000000, priceInMicrounits: 2000000 }],
    });

    expect(mockSet).toHaveBeenCalledWith(
      `tenants/${T}/kdsTickets/kds_ord-2`,
      expect.objectContaining({ orderId: 'ord-2', status: 'received' }),
    );
    expect(mockEmitDurable).toHaveBeenCalledWith('kds.ticket_received', expect.objectContaining({ orderId: 'ord-2' }));
  });
});

// ─── RecipeChangeKDSHandler ───────────────────────────────────────────────────

describe('RecipeChangeKDSHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerRecipeChangeKDSHandler(); });

  it('notifie les KDS de la mise à jour de recette', async () => {
    await capturedHandlers['recipe.updated']({ tenantId: T, recipeId: 'rec-1', productId: 'prod-1' });
    expect(mockEmit).toHaveBeenCalledWith('notification.created', expect.objectContaining({ type: 'warning' }));
  });
});

// ─── RushModeIntegrationHandler ───────────────────────────────────────────────

describe('RushModeIntegrationHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerRushModeIntegrationHandler(); });

  it('émet une notification urgent quand le rush mode s\'active', async () => {
    await capturedHandlers['store.rush_mode_toggled']({ tenantId: T, isPaused: true });
    expect(mockEmit).toHaveBeenCalledWith('notification.urgent', expect.anything());
  });

  it('ne notifie pas quand le rush mode se désactive', async () => {
    await capturedHandlers['store.rush_mode_toggled']({ tenantId: T, isPaused: false });
    expect(mockEmit).not.toHaveBeenCalled();
  });
});

// ─── OrderAcceptanceWindowHandler ─────────────────────────────────────────────

describe('OrderAcceptanceWindowHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerOrderAcceptanceWindowHandler(); });

  it('place la commande en attente si autoAccept est false', async () => {
    mockGet.mockResolvedValue({ autoAccept: false });
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['integration.delivery_order_received']({
      tenantId: T, integrationId: 'int-1', platform: 'ubereats', rawPayload: { id: 'ext-1' },
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/pendingDeliveries/`),
      expect.objectContaining({ platform: 'ubereats' }),
    );
  });
});

// ─── OrderCancelRestockHandler ────────────────────────────────────────────────

describe('OrderCancelRestockHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerOrderCancelRestockHandler(); });

  it('restitue les stocks si la commande annulée n\'était pas en cuisine', async () => {
    const mockTransaction = {
      get: vi.fn(async () => ({ quantity: 500 })),
      update: vi.fn(),
    };
    mockGet
      .mockResolvedValueOnce({ status: 'pending', items: [{ productId: 'prod-1', quantity: 2 }] })
      .mockResolvedValueOnce({ ingredients: [{ stockItemId: 'ing-1', quantity: 100 }] });
    mockUpdate.mockResolvedValue(undefined);

    // Patch runTransaction on the Nexus adapter via the mock
    const nexusMod = await import('@/lib/nexus/NexusAdapter');
    (nexusMod.Nexus.adapter as Record<string, unknown>).runTransaction = vi.fn(
      async (fn: (t: typeof mockTransaction) => Promise<void>) => fn(mockTransaction),
    );

    await capturedHandlers['order.cancelled']({ tenantId: T, orderId: 'ord-1' });

    expect(mockTransaction.update).toHaveBeenCalledWith(
      `tenants/${T}/stockItems/ing-1`,
      expect.objectContaining({ quantity: expect.any(Number) }),
    );
  });

  it('ne restitue pas si la commande était déjà en préparation', async () => {
    mockGet.mockResolvedValue({ status: 'preparing', items: [{ productId: 'prod-1', quantity: 1 }] });

    await capturedHandlers['order.cancelled']({ tenantId: T, orderId: 'ord-2' });

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── BigGroupAlertHandler ─────────────────────────────────────────────────────

describe('BigGroupAlertHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerBigGroupAlertHandler(); });

  it('alerte le manager pour un groupe > seuil', async () => {
    mockGet.mockResolvedValue({ bigGroupThreshold: 12 });
    mockUpdate.mockResolvedValue(undefined);
    const { browserPush } = await import('@/lib/push/browserPush');

    await capturedHandlers['biggroup.confirmed']({
      tenantId: T, reservationId: 'res-1', covers: 15, date: '2026-09-01', customerId: 'cust-1',
    });

    expect(browserPush.sendToRole).toHaveBeenCalled();
  });

  it('ne fait rien si les couverts sont sous le seuil', async () => {
    mockGet.mockResolvedValue({ bigGroupThreshold: 12 });
    const { browserPush } = await import('@/lib/push/browserPush');

    await capturedHandlers['biggroup.confirmed']({
      tenantId: T, reservationId: 'res-2', covers: 8, date: '2026-09-01', customerId: 'cust-2',
    });

    expect(browserPush.sendToRole).not.toHaveBeenCalled();
  });
});

// ─── GroupPrepTasksHandler ────────────────────────────────────────────────────

describe('GroupPrepTasksHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerGroupPrepTasksHandler(); });

  it('crée une tâche de préparation pour le grand groupe', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['reservation.large_group']({
      tenantId: T, reservationId: 'res-1', covers: 20, datetime: '2026-09-01T19:00:00Z',
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/prepTasks/`),
      expect.objectContaining({ covers: 20, status: 'pending' }),
    );
  });
});

// ─── ResaKitchenTaskHandler ───────────────────────────────────────────────────

describe('ResaKitchenTaskHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerResaKitchenTaskHandler(); });

  it('crée une tâche cuisine si covers > 8', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['resa.j1']({ tenantId: T, reservationId: 'res-1', covers: 15, date: '2026-09-02' });

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/`),
      expect.objectContaining({ covers: 15 }),
    );
  });

  it('ne crée pas de tâche si covers <= 8', async () => {
    await capturedHandlers['resa.j1']({ tenantId: T, reservationId: 'res-2', covers: 4, date: '2026-09-02' });
    expect(mockSet).not.toHaveBeenCalled();
  });
});

// ─── ResaReminderHandler ──────────────────────────────────────────────────────

describe('ResaReminderHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerResaReminderHandler(); });

  it('envoie le rappel et appelle NotificationGateway', async () => {
    mockGet
      .mockResolvedValueOnce({ email: 'test@ex.com', time: '19:30' })
      .mockResolvedValueOnce({ name: 'Le Bistrot' });
    mockSet.mockResolvedValue(undefined);
    const { NotificationGateway } = await import('@/infrastructure/adapters/NotificationGateway');

    await capturedHandlers['resa.j1']({
      tenantId: T, reservationId: 'res-1', customerId: 'cust-1', date: '2026-09-02', covers: 2, time: '19:30',
    });

    expect(NotificationGateway.send).toHaveBeenCalled();
  });
});

// ─── ReservationNotifierHandler ───────────────────────────────────────────────

describe('ReservationNotifierHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerReservationNotifierHandler(); });

  it('envoie une notification de confirmation au client', async () => {
    mockGet.mockResolvedValue({ name: 'Le Bistrot' });
    mockUpdate.mockResolvedValue(undefined);
    const { NotificationGateway } = await import('@/infrastructure/adapters/NotificationGateway');

    await capturedHandlers['reservation.created']({
      tenantId: T, reservationId: 'res-1', customerId: 'cust-1',
      customerName: 'Jean Dupont', date: '2026-09-02', time: '19:30', covers: 2,
      isSimulation: false,
    });

    expect(NotificationGateway.send).toHaveBeenCalled();
  });
});

// ─── NoShowPenaltyHandler ─────────────────────────────────────────────────────

describe('NoShowPenaltyHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerNoShowPenaltyHandler(); });

  it('crée une pénalité en attente si la réservation avait un dépôt', async () => {
    mockGet.mockResolvedValue({ hasDeposit: true, subjectId: 'cust-1' });
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['reservation.no_show']({ tenantId: T, reservationId: 'res-1' });

    expect(mockSet).toHaveBeenCalledWith(
      `tenants/${T}/pendingPenalties/res-1`,
      expect.objectContaining({ status: 'pending_manager_approval' }),
    );
  });

  it('ne crée pas de pénalité si pas de dépôt', async () => {
    mockGet.mockResolvedValue({ hasDeposit: false });

    await capturedHandlers['reservation.no_show']({ tenantId: T, reservationId: 'res-2' });

    expect(mockSet).not.toHaveBeenCalled();
  });
});

// ─── FloorPlanCapacityHandler ─────────────────────────────────────────────────

describe('FloorPlanCapacityHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerFloorPlanCapacityHandler(); });

  it('incrémente les couverts réservés pour le service', async () => {
    mockGet.mockResolvedValue({ bookedCovers: 20, maxCovers: 50 });
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['reservation.created']({
      tenantId: T, scheduledAt: new Date('2026-09-02T20:00:00Z').getTime(), partySize: 4,
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${T}/capacity/`),
      expect.objectContaining({ bookedCovers: 24 }),
    );
  });
});

// ─── TableTurnoverAnalyzerHandler ─────────────────────────────────────────────

describe('TableTurnoverAnalyzerHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerTableTurnoverAnalyzerHandler(); });

  it('persiste la session courante (seatedAt) à l\'assignation', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['table.assigned']({ tenantId: T, tableId: 'tbl-1', partySize: 3 });

    expect(mockSet).toHaveBeenCalledWith(
      `tenants/${T}/tables/tbl-1/currentSession`,
      expect.objectContaining({ partySize: 3 }),
    );
  });
});

// ─── CompEntryHandler / CompMealHandler ───────────────────────────────────────

describe('CompEntryHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerCompEntryHandler(); });

  it('trace la comp (remise gratuite) dans le ledger', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['order.comp']({
      tenantId: T, orderId: 'ord-1', operatorId: 'op-1', reason: 'manager_goodwill',
      totalValueInMicrounits: 1500000,
    });

    expect(mockSet).toHaveBeenCalledWith(
      `tenants/${T}/paymentLedger/PL-id`,
      expect.objectContaining({ reason: 'manager_goodwill', type: 'comp' }),
    );
  });
});

describe('CompMealHandler', () => {
  beforeEach(() => { vi.clearAllMocks(); registerCompMealHandler(); });

  it('trace le repas offert dans l\'audit', async () => {
    const { empireAudit } = await import('@/infrastructure/services/audit');
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['order.comp']({
      tenantId: T, orderId: 'ord-2', operatorId: 'op-1', reason: 'staff_meal',
      amountInMicrounits: 2500000,
    });

    expect(empireAudit.log).toHaveBeenCalled();
  });
});
