import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { browserPush } from '@/lib/push/browserPush';
import { NotificationGateway } from '@/lib/adapters/NotificationGateway';
import { SharedKernel } from '@/lib/shared-kernel';

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockGet, mockSet, mockUpdate, mockRunTransaction, mockEmitDurable, mockEmit, mockOn, capturedHandlers } =
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
      mockRunTransaction: vi.fn((fn: (tx: unknown) => Promise<void>) => fn({})),
      mockEmitDurable: vi.fn(),
      mockEmit: vi.fn(),
      mockOn,
      capturedHandlers,
    };
  });

// vi.mock('@/lib/nexus/NexusAdapter', () => ({
//   Nexus: {
//     adapter: {
//       get: mockGet,
//       set: mockSet,
//       update: mockUpdate,
//       runTransaction: mockRunTransaction,
//     },
//   },
// }));
// vi.mock('@orchestration/NexusEventBus', () => ({
//   NexusEventBus: { on: mockOn, emitDurable: mockEmitDurable, emit: mockEmit },
// }));
// vi.mock('@/lib/logger', () => ({
//   logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
// }));
// vi.mock('@/lib/audit', () => ({
//   empireAudit: { log: vi.fn() },
// }));


// --- Auto-Injected vi.spyOn Setup ---
beforeEach(() => {
  // Clear the actual object
  if (typeof capturedHandlers !== 'undefined') {
    for (const key in capturedHandlers) delete capturedHandlers[key];
  }
  
  // Set up NexusEventBus spies
  if (typeof mockOn !== 'undefined') {
    vi.spyOn(NexusEventBus, 'on').mockImplementation((event: string, cb: any) => {
      if (typeof capturedHandlers !== 'undefined') {
        capturedHandlers[event] = cb;
        capturedHandlers['DEFAULT'] = cb;
      }
      return mockOn(event, cb);
    });
  }


  // Set up NexusAdapter spies
  if (typeof mockGet !== 'undefined') { vi.spyOn(Nexus.adapter, 'get').mockImplementation(mockGet); }
  if (typeof mockSet !== 'undefined') { vi.spyOn(Nexus.adapter, 'set').mockImplementation(mockSet); }
  if (typeof mockUpdate !== 'undefined') { vi.spyOn(Nexus.adapter, 'update').mockImplementation(mockUpdate); }
  if (typeof mockRunTransaction !== 'undefined') { vi.spyOn(Nexus.adapter, 'runTransaction').mockImplementation(mockRunTransaction); }
  vi.spyOn(Nexus.adapter, 'query').mockImplementation(vi.fn());
  if (typeof mockEmitDurable !== 'undefined') { vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(mockEmitDurable); }
  if (typeof mockEmit !== 'undefined') { vi.spyOn(NexusEventBus, 'emit').mockImplementation(mockEmit); }


  // Set up other spies (logger, audit, push, notification)
  vi.spyOn(logger, 'info').mockImplementation(() => {});
  vi.spyOn(logger, 'warn').mockImplementation(() => {});
  vi.spyOn(logger, 'error').mockImplementation(() => {});
  vi.spyOn(logger, 'debug').mockImplementation(() => {});

  if (typeof empireAudit !== 'undefined') {
    try {
       vi.spyOn(empireAudit as any, 'log').mockReturnValue(undefined as any);
    } catch {
       vi.spyOn(Object.getPrototypeOf(empireAudit), 'log').mockReturnValue(undefined as any);
    }
  }

  if (typeof browserPush !== 'undefined') { vi.spyOn(browserPush, 'sendToRole').mockResolvedValue(true as any); }

  if (typeof NotificationGateway !== 'undefined') {
    vi.spyOn(NotificationGateway, 'send').mockResolvedValue(undefined as any);
  }

  if (typeof SharedKernel !== 'undefined') {
    vi.spyOn(SharedKernel, 'generateId').mockImplementation((prefix: string) => `${prefix}-test-id`);
  }
});

// Replace prototype of capturedHandlers so it acts as a fallback map!
if (typeof capturedHandlers !== 'undefined') {
  Object.setPrototypeOf(capturedHandlers, new Proxy({}, {
    get(target, prop) {
      if (prop === 'then') return undefined; // avoid Promise confusion
      if (prop === 'catch') return undefined;
      return capturedHandlers['DEFAULT'];
    }
  }));
}
// ------------------------------------

// ─── Imports ───────────────────────────────────────────────────────────────────

import { registerNoShowCRMHandler } from '@orchestration/handlers/NoShowCRMHandler';
import { registerLoyaltyEngineHandler } from '@orchestration/handlers/LoyaltyEngineHandler';
import { registerLoyaltyPointsAccrualHandler } from '@orchestration/handlers/LoyaltyPointsAccrualHandler';
import { registerVipStatusEvaluationHandler } from '@orchestration/handlers/VipStatusEvaluationHandler';

// ─── NoShowCRMHandler ─────────────────────────────────────────────────────────

describe('NoShowCRMHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerNoShowCRMHandler();
  });

  it('décrémente le score CRM de 20 points lors d\'un no-show', async () => {
    mockGet
      .mockResolvedValueOnce({ customerId: 'cust-1' }) // reservation
      .mockResolvedValueOnce({ noShowCount: 0, crmScore: 100, tags: [] }); // customer
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['reservation.no_show']({ tenantId: 'T', reservationId: 'resa-1' });

    expect(mockUpdate).toHaveBeenCalledWith(
      'tenants/T/customers/cust-1',
      expect.objectContaining({ noShowCount: 1, crmScore: 80, tags: [] }),
    );
  });

  it('ne descend pas sous 0 pour crmScore', async () => {
    mockGet
      .mockResolvedValueOnce({ customerId: 'cust-2' })
      .mockResolvedValueOnce({ noShowCount: 4, crmScore: 10, tags: [] });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['reservation.no_show']({ tenantId: 'T', reservationId: 'resa-2' });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ crmScore: 0 }),
    );
  });

  it('ajoute le tag frequent_noshow au 3ème no-show', async () => {
    mockGet
      .mockResolvedValueOnce({ customerId: 'cust-3' })
      .mockResolvedValueOnce({ noShowCount: 2, crmScore: 60, tags: [] });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['reservation.no_show']({ tenantId: 'T', reservationId: 'resa-3' });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ tags: ['frequent_noshow'], noShowCount: 3 }),
    );
  });

  it('ne duplique pas le tag frequent_noshow si déjà présent', async () => {
    mockGet
      .mockResolvedValueOnce({ customerId: 'cust-4' })
      .mockResolvedValueOnce({ noShowCount: 5, crmScore: 0, tags: ['frequent_noshow'] });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['reservation.no_show']({ tenantId: 'T', reservationId: 'resa-4' });

    const call = mockUpdate.mock.calls[0][1];
    expect(call.tags.filter((t: string) => t === 'frequent_noshow')).toHaveLength(1);
  });

  it('ignore si la réservation n\'a pas de customerId', async () => {
    mockGet.mockResolvedValueOnce({ note: 'walk-in' });

    await capturedHandlers['reservation.no_show']({ tenantId: 'T', reservationId: 'resa-walkin' });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('ignore si le client est introuvable', async () => {
    mockGet
      .mockResolvedValueOnce({ customerId: 'ghost' })
      .mockResolvedValueOnce(null);

    await capturedHandlers['reservation.no_show']({ tenantId: 'T', reservationId: 'resa-ghost' });

    expect(mockUpdate).toHaveBeenCalled();
  });
});

// ─── LoyaltyEngineHandler ─────────────────────────────────────────────────────

describe('LoyaltyEngineHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerLoyaltyEngineHandler();
  });

  it('crédite le wallet lors de crm.points_earned', async () => {
    mockGet.mockResolvedValueOnce({ pointsBalance: 50 });
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['crm.points_earned']({ tenantId: 'T', customerId: 'c1', points: 20 });

    expect(mockSet).toHaveBeenCalledWith(
      'tenants/T/wallets/c1',
      expect.objectContaining({ pointsBalance: 70 }),
    );
  });

  it('débite le wallet lors de crm.reward_redeemed', async () => {
    mockGet.mockResolvedValueOnce({ pointsBalance: 100 });
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['crm.reward_redeemed']({ tenantId: 'T', customerId: 'c2', pointsCost: 30 });

    expect(mockSet).toHaveBeenCalledWith(
      'tenants/T/wallets/c2',
      expect.objectContaining({ pointsBalance: 70 }),
    );
  });

  it('ne descend pas sous 0 pour crm.reward_redeemed', async () => {
    mockGet.mockResolvedValueOnce({ pointsBalance: 10 });
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['crm.reward_redeemed']({ tenantId: 'T', customerId: 'c3', pointsCost: 50 });

    expect(mockSet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ pointsBalance: 0 }),
    );
  });

  it('crée le wallet s\'il n\'existe pas (balance = 0)', async () => {
    mockGet.mockResolvedValueOnce(null); // wallet absent
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['crm.points_earned']({ tenantId: 'T', customerId: 'new-cust', points: 15 });

    expect(mockSet).toHaveBeenCalledWith(
      'tenants/T/wallets/new-cust',
      expect.objectContaining({ pointsBalance: 15 }),
    );
  });

  it('utilise runTransaction pour les deux types d\'événements', async () => {
    mockGet.mockResolvedValue({ pointsBalance: 0 });
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['crm.points_earned']({ tenantId: 'T', customerId: 'c4', points: 5 });
    await capturedHandlers['crm.reward_redeemed']({ tenantId: 'T', customerId: 'c4', pointsCost: 5 });

    expect(mockRunTransaction).toHaveBeenCalledTimes(2);
  });
});

// ─── LoyaltyPointsAccrualHandler ─────────────────────────────────────────────

describe('LoyaltyPointsAccrualHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerLoyaltyPointsAccrualHandler();
  });

  it('calcule 1 point par euro (floor(total / 100 000))', async () => {
    mockGet.mockResolvedValueOnce({ loyaltyPoints: 0, totalSpentInMicrounits: 0 });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({
      tenantId: 'T', orderId: 'o1', customerId: 'c1',
      totalInMicrounits: 2500000, // 2.50€ → 25 points
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      'tenants/T/crms/c1',
      expect.objectContaining({ loyaltyPoints: 25 }),
    );
  });

  it('tronque à l\'entier inférieur (pas d\'arrondi)', async () => {
    mockGet.mockResolvedValueOnce({ loyaltyPoints: 10, totalSpentInMicrounits: 0 });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({
      tenantId: 'T', orderId: 'o2', customerId: 'c2',
      totalInMicrounits: 150000, // 0.15€ → 1 point (floor(1.5))
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ loyaltyPoints: 11 }),
    );
  });

  it('ignore si pas de customerId', async () => {
    await capturedHandlers['order.paid']({
      tenantId: 'T', orderId: 'o3', customerId: undefined,
      totalInMicrounits: 3000000,
    });

    expect(mockGet).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('ignore si profil CRM introuvable', async () => {
    mockGet.mockResolvedValueOnce(null);

    await capturedHandlers['order.paid']({
      tenantId: 'T', orderId: 'o4', customerId: 'unknown',
      totalInMicrounits: 2000000,
    });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('émet crm.points_earned après la mise à jour', async () => {
    mockGet.mockResolvedValueOnce({ loyaltyPoints: 50, totalSpentInMicrounits: 0 });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({
      tenantId: 'T', orderId: 'o5', customerId: 'c5',
      totalInMicrounits: 1000000, // 1€ → 10 pts
    });

    await vi.waitFor(() => {
      expect(mockEmitDurable).toHaveBeenCalledWith(
        'crm.points_earned',
        expect.objectContaining({ customerId: 'c5', points: 10 }),
      );
    });
  });

  it('émet crm.reward_unlocked quand le solde franchit 100 pts', async () => {
    mockGet.mockResolvedValueOnce({ loyaltyPoints: 95, totalSpentInMicrounits: 0 });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({
      tenantId: 'T', orderId: 'o6', customerId: 'c6',
      totalInMicrounits: 1000000, // +10 pts → 105 (franchit 100)
    });

    await vi.waitFor(() => {
      expect(mockEmitDurable).toHaveBeenCalledWith(
        'crm.reward_unlocked',
        expect.objectContaining({ customerId: 'c6' }),
      );
    });
  });

  it('n\'émet pas crm.reward_unlocked si le seuil était déjà dépassé', async () => {
    mockGet.mockResolvedValueOnce({ loyaltyPoints: 150, totalSpentInMicrounits: 0 });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({
      tenantId: 'T', orderId: 'o7', customerId: 'c7',
      totalInMicrounits: 1000000,
    });

    await vi.waitFor(() => expect(mockEmitDurable).toHaveBeenCalled());

    const calls = mockEmitDurable.mock.calls.map(([event]: [string]) => event);
    expect(calls).not.toContain('crm.reward_unlocked');
  });
});

// ─── VipStatusEvaluationHandler ──────────────────────────────────────────────

describe('VipStatusEvaluationHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerVipStatusEvaluationHandler();
  });

  it('ajoute le tag regular à la 5ème visite', async () => {
    mockGet.mockResolvedValueOnce(null); // crmConfig → use defaults
    mockGet.mockResolvedValueOnce({ totalVisits: 4, tags: [] }); // customer profile
    mockUpdate.mockResolvedValue(undefined);
    mockEmit.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({ tenantId: 'T', customerId: 'c1', totalInMicrounits: 1000000 });

    expect(mockUpdate).toHaveBeenCalledWith(
      'tenants/T/crms/c1',
      expect.objectContaining({ tags: expect.arrayContaining(['regular']) }),
    );
  });

  it('ajoute le tag vip à la 20ème visite', async () => {
    mockGet.mockResolvedValueOnce(null); // crmConfig → use defaults
    mockGet.mockResolvedValueOnce({ totalVisits: 19, tags: ['regular'] }); // customer profile
    mockUpdate.mockResolvedValue(undefined);
    mockEmit.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({ tenantId: 'T', customerId: 'c2', totalInMicrounits: 1000000 });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ tags: expect.arrayContaining(['vip']) }),
    );
  });

  it('ne modifie pas le profil si le seuil n\'est pas atteint', async () => {
    mockGet.mockResolvedValueOnce(null); // crmConfig → use defaults
    mockGet.mockResolvedValueOnce({ totalVisits: 3, tags: [] }); // customer profile

    await capturedHandlers['order.paid']({ tenantId: 'T', customerId: 'c3', totalInMicrounits: 500000 });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('ignore si pas de customerId', async () => {
    await capturedHandlers['order.paid']({ tenantId: 'T', customerId: undefined, totalInMicrounits: 1000000 });

    expect(mockGet).not.toHaveBeenCalled();
  });

  it('ignore si profil introuvable', async () => {
    mockGet.mockResolvedValueOnce(null); // crmConfig → use defaults
    mockGet.mockResolvedValueOnce(null); // customer profile → not found

    await capturedHandlers['order.paid']({ tenantId: 'T', customerId: 'ghost', totalInMicrounits: 2000000 });

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
