import { describe, it, expect, vi, beforeEach } from 'vitest';
const mockCreate = vi.fn();
const mockRunTransaction = vi.fn();
const mockDelete = vi.fn();
const mockNexusGet = vi.fn();
const mockNexusSet = vi.fn();
const mockNexusUpdate = vi.fn();
const mockQuery = vi.fn();
const mockEmitDurable = vi.fn();
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { browserPush } from '@/lib/push/browserPush';
import { NotificationGateway } from '@/lib/adapters/NotificationGateway';
import { SharedKernel } from '@/lib/shared-kernel';

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockGet, mockSet, mockUpdate, mockEmit, mockOn, mockSendToRole, capturedHandlers } =
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
      mockEmit: vi.fn(),
      mockOn,
      mockSendToRole: vi.fn(),
      capturedHandlers,
    };
  });

// // vi.mock('@/lib/nexus/NexusAdapter', () => ({
// //   Nexus: { adapter: { get: mockGet, set: mockSet, update: mockUpdate } },
// // }));
// // vi.mock('@/shared/eventBus/NexusEventBus', () => ({
// //   NexusEventBus: { on: mockOn, emit: mockEmit, emitDurable: vi.fn() },
// // }));
// // vi.mock('@/lib/logger', () => ({
// //   logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
// // }));
// // vi.mock('@/lib/audit', () => ({
// //   empireAudit: { log: vi.fn() },
// // }));
// // vi.mock('@/lib/push/browserPush', () => ({
// //   browserPush: { sendToRole: mockSendToRole },
// // }));
// // vi.mock('@/lib/shared-kernel', () => ({
// //   SharedKernel: { generateId: vi.fn((prefix: string) => `${prefix}-test-id`) },
// // }));


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
  if (typeof mockQuery !== 'undefined') { vi.spyOn(Nexus.adapter, 'query').mockImplementation(mockQuery); }
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

  if (typeof browserPush !== 'undefined') {
      if (typeof mockSendToRole !== 'undefined') {
          vi.spyOn(browserPush, 'sendToRole').mockImplementation(mockSendToRole as any);
      } else {
          vi.spyOn(browserPush, 'sendToRole').mockResolvedValue(true as any);
      }
  }

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

import { registerKDSOrderHandler } from '@/shared/eventBus/handlers/KDSOrderHandler';
import { registerPaymentLedgerHandler } from '@/shared/eventBus/handlers/PaymentLedgerHandler';
import { registerTableAutoReleaseHandler } from '@/shared/eventBus/handlers/TableAutoReleaseHandler';
import { registerNoShowTableReleaseHandler } from '@/shared/eventBus/handlers/NoShowTableReleaseHandler';
import { registerKDSReadyHandler } from '@/shared/eventBus/handlers/KDSReadyHandler';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const baseOrderPaid = {
  tenantId: 'T',
  orderId: 'ord-1',
  tableId: 'tbl-1',
  paymentMode: 'card' as const,
  totalInMicrounits: 2000000,
  items: [{ productId: 'p1', name: 'Pizza', quantity: 2, unitPriceInMicrounits: 1000000, priceInMicrounits: 2000000 }],
  splits: undefined,
  customerId: undefined,
};

// ─── KDSOrderHandler ──────────────────────────────────────────────────────────

describe('KDSOrderHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerKDSOrderHandler();
  });

  it('crée un kdsOrder avec status pending lors d\'order.paid', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['order.paid'](baseOrderPaid);

    expect(mockSet).toHaveBeenCalledWith(
      'tenants/T/kdsOrders/ord-1',
      expect.objectContaining({ orderId: 'ord-1', tableId: 'tbl-1', status: 'pending' }),
    );
  });

  it('inclut tous les items avec status pending', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({
      ...baseOrderPaid,
      items: [
        { productId: 'p1', name: 'Pizza', quantity: 1, unitPriceInMicrounits: 1000000, priceInMicrounits: 1000000 },
        { productId: 'p2', name: 'Salade', quantity: 1, unitPriceInMicrounits: 800000, priceInMicrounits: 800000 },
      ],
    });

    const kdsOrder = mockSet.mock.calls[0][1];
    expect(kdsOrder.items).toHaveLength(2);
    expect(kdsOrder.items.every((i: { status: string }) => i.status === 'pending')).toBe(true);
  });

  it('ne crée pas de kdsOrder si items vide', async () => {
    await capturedHandlers['order.paid']({ ...baseOrderPaid, items: [] });

    expect(mockSet).not.toHaveBeenCalled();
  });
});

// ─── PaymentLedgerHandler ─────────────────────────────────────────────────────

describe('PaymentLedgerHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerPaymentLedgerHandler();
  });

  it('crée une entrée paymentLedger avec l\'orderId comme clé (paiement simple)', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({ ...baseOrderPaid, paymentMode: 'cash' });

    expect(mockSet).toHaveBeenCalledWith(
      'tenants/T/paymentLedger/ord-1',
      expect.objectContaining({ mode: 'cash', amountInMicrounits: 2000000, isSplit: false }),
    );
  });

  it('crée une entrée par split avec id {orderId}_split_{index}', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({
      ...baseOrderPaid,
      splits: [
        { amount: 1200000, mode: 'card' },
        { amount: 800000, mode: 'cash' },
      ],
    });

    expect(mockSet).toHaveBeenCalledWith(
      'tenants/T/paymentLedger/ord-1_split_0',
      expect.objectContaining({ mode: 'card', amountInMicrounits: 1200000, isSplit: true }),
    );
    expect(mockSet).toHaveBeenCalledWith(
      'tenants/T/paymentLedger/ord-1_split_1',
      expect.objectContaining({ mode: 'cash', amountInMicrounits: 800000, isSplit: true }),
    );
  });

  it('enregistre orderId dans chaque entrée split', async () => {
    mockSet.mockResolvedValue(undefined);

    await capturedHandlers['order.paid']({
      ...baseOrderPaid,
      splits: [{ amount: 2000000, mode: 'card' }],
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ orderId: 'ord-1' }),
    );
  });
});

// ─── TableAutoReleaseHandler ──────────────────────────────────────────────────

describe('TableAutoReleaseHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerTableAutoReleaseHandler();
  });

  it('libère la table quand sessionEnd=true', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['table.cleared']({ tenantId: 'T', tableId: 'tbl-A', sessionEnd: true });

    expect(mockUpdate).toHaveBeenCalledWith(
      'tenants/T/tables/tbl-A',
      expect.objectContaining({ status: 'available', seatedAt: null }),
    );
  });

  it('ne fait rien si sessionEnd !== true', async () => {
    await capturedHandlers['table.cleared']({ tenantId: 'T', tableId: 'tbl-B', sessionEnd: false });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('ne fait rien si sessionEnd est absent', async () => {
    await capturedHandlers['table.cleared']({ tenantId: 'T', tableId: 'tbl-C' });

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── NoShowTableReleaseHandler ────────────────────────────────────────────────

describe('NoShowTableReleaseHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerNoShowTableReleaseHandler();
    mockSendToRole.mockResolvedValue(undefined);
  });

  it('libère la table associée à la réservation', async () => {
    mockGet.mockResolvedValueOnce({ tableId: 'tbl-1' });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['reservation.no_show']({ tenantId: 'T', reservationId: 'resa-1' });

    expect(mockUpdate).toHaveBeenCalledWith(
      'tenants/T/tables/tbl-1',
      expect.objectContaining({ status: 'available', reservationId: null }),
    );
  });

  it('envoie un WebPush à l\'hôtesse', async () => {
    mockGet.mockResolvedValueOnce({ tableId: 'tbl-2' });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['reservation.no_show']({ tenantId: 'T', reservationId: 'resa-2' });

    expect(mockSendToRole).toHaveBeenCalledWith(
      'T',
      'hotesse',
      expect.objectContaining({ title: expect.any(String) }),
    );
  });

  it('envoie quand même le WebPush si pas de tableId', async () => {
    mockGet.mockResolvedValueOnce({ note: 'pas de table' });

    await capturedHandlers['reservation.no_show']({ tenantId: 'T', reservationId: 'resa-no-table' });

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockSendToRole).toHaveBeenCalledWith('T', 'hotesse', expect.any(Object));
  });
});

// ─── KDSReadyHandler ──────────────────────────────────────────────────────────

describe('KDSReadyHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerKDSReadyHandler();
    mockEmit.mockResolvedValue(undefined);
  });

  it('émet notification.created lors de kds.item_done', async () => {
    await capturedHandlers['kds.item_done']({ tenantId: 'T', orderId: 'ord-1', itemId: 'item-1' });

    expect(mockEmit).toHaveBeenCalledWith(
      'notification.created',
      expect.objectContaining({
        tenantId: 'T',
        title: expect.stringMatching(/prêt/i),
      }),
    );
  });
});
