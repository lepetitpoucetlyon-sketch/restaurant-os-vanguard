import { describe, it, expect, vi, beforeEach } from 'vitest';
import { closeTicketZForDay, registerTicketZHandler } from '@/shared/eventBus/handlers/TicketZHandler';

// ── Mocks ────────────────────────────────────────────────────────────────────

const nexusStore: Record<string, unknown> = {};





import { CryptoService } from '@/lib/CryptoService';

// NexusEventBus : émulation in-memory
const handlers: Record<string, ((payload: unknown) => Promise<void>)[]> = {};

vi.mock('@/lib/audit', () => ({
  empireAudit: { log: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));



// ── Helpers ──────────────────────────────────────────────────────────────────

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FiscalSealer } from '@/modules/finance/fiscalite/FiscalSealer';
import { NexusEventBus, type NexusEvents } from '@/shared/eventBus/NexusEventBus';
import { MockAdapter } from '@/lib/adapters/MockAdapter';


function paidPayload(overrides: Partial<NexusEvents['order.paid']> & Pick<NexusEvents['order.paid'], 'tenantId' | 'totalInMicrounits'>): NexusEvents['order.paid'] {
  return {
    v: 1 as const,
    orderId: 'order_test',
    tableId: null,
    operatorId: 'op_test',
    paymentMode: 'card',
    items: [],
    ...overrides,
  };
}

async function seed(path: string, data: unknown) {
  await Nexus.adapter.set(path, data as any);
}

async function clearStore() {
  Nexus.adapter = new MockAdapter();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TicketZHandler — registerTicketZHandler', () => {
  beforeEach(async () => {
    await clearStore();
    vi.clearAllMocks();
    delete handlers['order.paid'];
    vi.spyOn(CryptoService, 'canonicalStringify').mockImplementation((d: unknown) => JSON.stringify(d));
    vi.spyOn(NexusEventBus, 'on').mockImplementation((event: string, handler: (payload: any) => Promise<void>) => {
      handlers[event] = handlers[event] ?? [];
      handlers[event].push(handler);
      return () => { handlers[event] = handlers[event].filter(h => h !== handler); };
    });
    vi.spyOn(NexusEventBus, 'emit').mockImplementation(async (event: string, payload: any) => {
      for (const h of handlers[event] ?? []) await h(payload);
    });
    registerTicketZHandler();
  });

  it('accumulates totalInMicrounits on order.paid', async () => {
    type PartialItem = { taxRate: string; unitPriceInMicrounits: number; quantity: number };
    const items = [{ taxRate: '0.10', unitPriceInMicrounits: 5_000_000, quantity: 1 }] as unknown as NexusEvents['order.paid']['items'];
    await NexusEventBus.emit('order.paid', paidPayload({
      tenantId: 'tenant_1',
      totalInMicrounits: 5_000_000,
      items,
    }));

    const today = new Date().toISOString().split('T')[0];
    const stored = (await Nexus.adapter.get(`tenants/tenant_1/ticketZ/${today}`)) as Record<string, unknown>;
    expect(stored.totalInMicrounits).toBe(5_000_000);
    expect(stored.ordersCount).toBe(1);
  });

  it('accumulates across multiple payments', async () => {
    await NexusEventBus.emit('order.paid', paidPayload({ tenantId: 'tenant_1', totalInMicrounits: 3_000_000 }));
    await NexusEventBus.emit('order.paid', paidPayload({ tenantId: 'tenant_1', totalInMicrounits: 2_000_000 }));

    const today = new Date().toISOString().split('T')[0];
    const stored = (await Nexus.adapter.get(`tenants/tenant_1/ticketZ/${today}`)) as Record<string, unknown>;
    expect(stored.totalInMicrounits).toBe(5_000_000);
    expect(stored.ordersCount).toBe(2);
  });

  it('does NOT accumulate when ticket Z is already closed (post-close protection)', async () => {
    const today = new Date().toISOString().split('T')[0];
    await seed(`tenants/tenant_1/ticketZ/${today}`, {
      id: today, date: today, tenantId: 'tenant_1',
      ordersCount: 5, totalInMicrounits: 20_000_000,
      taxBreakdown: {}, updatedAt: new Date().toISOString(), closed: true,
    });

    await NexusEventBus.emit('order.paid', paidPayload({ tenantId: 'tenant_1', totalInMicrounits: 9_000_000 }));

    const stored = (await Nexus.adapter.get(`tenants/tenant_1/ticketZ/${today}`)) as Record<string, unknown>;
    // total must remain unchanged
    expect(stored.totalInMicrounits).toBe(20_000_000);
    expect(stored.ordersCount).toBe(5);
  });
});

describe('TicketZHandler — closeTicketZForDay', () => {
  beforeEach(async () => {
    await clearStore();
    vi.clearAllMocks();
    vi.spyOn(CryptoService, 'canonicalStringify').mockImplementation((d: unknown) => JSON.stringify(d));
    vi.spyOn(Nexus.adapter, 'update');
    vi.spyOn(FiscalSealer, 'generateSequentialReceiptNumber').mockResolvedValue('2026-000001');
    vi.spyOn(FiscalSealer, 'sealDataAtomically').mockResolvedValue({
      hash: 'test_hash_abc',
      signature: 'test_sig_xyz',
      sealId: 'seal_test_001',
      previousHash: 'GENESIS_ROOT',
    });
  });

  it('is a no-op when JournalEntry already exists (idempotence)', async () => {
    await seed('tenants/t1/journalEntries/Z_20260101', { id: 'Z_20260101' });

    await closeTicketZForDay('t1', '2026-01-01');

    expect(FiscalSealer.sealDataAtomically).not.toHaveBeenCalled();
    expect(Nexus.adapter.update).not.toHaveBeenCalled();
  });

  it('is a no-op when no ticketZ exists for that date', async () => {
    await closeTicketZForDay('t1', '2026-01-02');

    expect(FiscalSealer.sealDataAtomically).not.toHaveBeenCalled();
  });

  it('calls sealDataAtomically and marks ticketZ as closed', async () => {
    await seed('tenants/t1/ticketZ/2026-01-03', {
      id: '2026-01-03', date: '2026-01-03', tenantId: 't1',
      ordersCount: 10, totalInMicrounits: 50_000_000,
      taxBreakdown: { '0.10': 4_545_454 }, updatedAt: '2026-01-03T23:00:00Z',
    });

    await closeTicketZForDay('t1', '2026-01-03');

    expect(FiscalSealer.generateSequentialReceiptNumber).toHaveBeenCalledWith('t1');
    expect(FiscalSealer.sealDataAtomically).toHaveBeenCalledOnce();

    const updateCall = (Nexus.adapter.update as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(updateCall[0]).toBe('tenants/t1/ticketZ/2026-01-03');
    const updatePayload = updateCall[1] as Record<string, unknown>;
    expect(updatePayload.closed).toBe(true);
    expect(updatePayload.fiscalSealId).toBe('seal_test_001');
  });

  it('writes JournalEntry with correct entryId format (Z_YYYYMMDD)', async () => {
    await seed('tenants/t1/ticketZ/2026-02-15', {
      id: '2026-02-15', date: '2026-02-15', tenantId: 't1',
      ordersCount: 3, totalInMicrounits: 15_000_000,
      taxBreakdown: {}, updatedAt: '2026-02-15T23:00:00Z',
    });

    await closeTicketZForDay('t1', '2026-02-15');

    const sealCall = (FiscalSealer.sealDataAtomically as ReturnType<typeof vi.fn>).mock.calls[0];
    const journalEntry = sealCall[3] as Record<string, unknown>;
    expect(journalEntry.id).toBe('Z_20260215');
    expect(journalEntry.totalInMicrounits).toBe(15_000_000);
    expect(journalEntry.ordersCount).toBe(3);
    expect(journalEntry.type).toBe('revenue');
    expect(journalEntry.isSystemGenerated).toBe(true);
  });
});
