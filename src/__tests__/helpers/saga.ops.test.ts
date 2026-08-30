import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/audit', () => ({
  empireAudit: { log: vi.fn() },
}));
vi.mock('@/lib/shared-kernel', () => ({
  SharedKernel: { generateId: vi.fn((prefix: string) => `${prefix}-test-id`) },
}));

// ─── Imports ───────────────────────────────────────────────────────────────────

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


// ─── Global spy setup (vi.spyOn on real singletons — path-agnostic) ─────────
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { browserPush } from '@/lib/push/browserPush';

beforeEach(() => {
  // NexusEventBus — use mockOn so capturedHandlers is populated
  vi.spyOn(NexusEventBus, 'on').mockImplementation(mockOn as typeof NexusEventBus.on);
  vi.spyOn(NexusEventBus, 'emit').mockImplementation(mockEmit as typeof NexusEventBus.emit);
  vi.spyOn(NexusEventBus, 'emitDurable').mockResolvedValue(undefined);
  // Nexus.adapter — delegate to hoisted vi.fn() mocks
  vi.spyOn(Nexus.adapter, 'get').mockImplementation(mockGet as typeof Nexus.adapter.get);
  vi.spyOn(Nexus.adapter, 'set').mockImplementation(mockSet as typeof Nexus.adapter.set);
  vi.spyOn(Nexus.adapter, 'update').mockImplementation(mockUpdate as typeof Nexus.adapter.update);
  // browserPush — same module isolation issue, use vi.spyOn
  vi.spyOn(browserPush, 'sendToRole').mockImplementation(mockSendToRole as typeof browserPush.sendToRole);
});

// ─── PaymentLedgerHandler ─────────────────────────────────────────────────────

describe('PaymentLedgerHandler', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockEmit.mockClear();
    mockSendToRole.mockClear();
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
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockEmit.mockClear();
    mockSendToRole.mockClear();
    registerTableAutoReleaseHandler();
  });

  it('libère la table quand sessionEnd=true', async () => {
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['table.cleared']({ tenantId: 'T', tableId: 'tbl-A', sessionEnd: true });

    expect(mockUpdate).toHaveBeenCalledWith(
      'tenants/T/ops_nodes/tbl-A',
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
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockEmit.mockClear();
    mockSendToRole.mockClear();
    registerNoShowTableReleaseHandler();
    mockSendToRole.mockResolvedValue(undefined);
  });

  it('libère la table associée à la réservation', async () => {
    mockGet.mockResolvedValueOnce({ tableId: 'tbl-1' });
    mockUpdate.mockResolvedValue(undefined);

    await capturedHandlers['reservation.no_show']({ tenantId: 'T', reservationId: 'resa-1' });

    expect(mockUpdate).toHaveBeenCalledWith(
      'tenants/T/ops_nodes/tbl-1',
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
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockEmit.mockClear();
    mockSendToRole.mockClear();
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
