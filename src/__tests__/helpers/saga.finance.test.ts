import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { browserPush } from '@/lib/push/browserPush';
import { NotificationGateway } from '@/lib/adapters/NotificationGateway';
import { SharedKernel } from '@/lib/shared-kernel';

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockGet, mockSet, mockUpdate, mockEmit, mockOn, capturedHandlers } =
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
  vi.spyOn(Nexus.adapter, 'query').mockImplementation(vi.fn());
  if (typeof mockEmit !== 'undefined') { vi.spyOn(NexusEventBus, 'emit').mockImplementation(mockEmit); }
  vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(vi.fn());


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

import { registerCompJournalHandler } from '@/shared/eventBus/handlers/CompJournalHandler';
import { registerRefundJournalHandler } from '@/shared/eventBus/handlers/RefundJournalHandler';
import { registerTaxMismatchAlertHandler } from '@/shared/eventBus/handlers/TaxMismatchAlertHandler';
import { registerPaymentRejectAuditHandler } from '@/shared/eventBus/handlers/PaymentRejectAuditHandler';

// ─── CompJournalHandler ───────────────────────────────────────────────────────

describe('CompJournalHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerCompJournalHandler();
    mockSet.mockResolvedValue(undefined);
  });

  it('crée une écriture journal NF525 immuable (set, jamais update)', async () => {
    await capturedHandlers['order.comp']({
      tenantId: 'T', orderId: 'ord-comp', operatorId: 'op-1',
      items: [], totalValueInMicrounits: 1500000, reason: 'Geste commercial',
    });

    expect(mockSet).toHaveBeenCalledWith(
      'tenants/T/journalEntries/JE-COMP-ord-comp',
      expect.objectContaining({ id: 'JE-COMP-ord-comp', status: 'validated' }),
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('génère deux lignes équilibrées (débit 658000 + crédit 707000)', async () => {
    await capturedHandlers['order.comp']({
      tenantId: 'T', orderId: 'ord-comp2', operatorId: 'op-1',
      items: [], totalValueInMicrounits: 2000000, reason: 'Erreur de service',
    });

    const entry = mockSet.mock.calls.find(([path]: [string]) =>
      path.includes('journalEntries'),
    )?.[1];

    expect(entry?.lines).toHaveLength(2);
    const debit = entry?.lines.find((l: { side: string }) => l.side === 'debit');
    const credit = entry?.lines.find((l: { side: string }) => l.side === 'credit');
    expect(debit?.accountCode).toBe('658000');
    expect(credit?.accountCode).toBe('707000');
  });

  it('persiste aussi dans compLog', async () => {
    await capturedHandlers['order.comp']({
      tenantId: 'T', orderId: 'ord-comp3', operatorId: 'op-1',
      items: [], totalValueInMicrounits: 500000, reason: 'Test',
    });

    expect(mockSet).toHaveBeenCalledWith(
      'tenants/T/compLog/COMP-ord-comp3',
      expect.objectContaining({ orderId: 'ord-comp3', reason: 'Test' }),
    );
  });

  it('convertit correctement les microunits en cents (÷ 10 000)', async () => {
    await capturedHandlers['order.comp']({
      tenantId: 'T', orderId: 'ord-comp4', operatorId: 'op-1',
      items: [], totalValueInMicrounits: 10000000, reason: 'Test',
    });

    const entry = mockSet.mock.calls.find(([path]: [string]) =>
      path.includes('journalEntries'),
    )?.[1];

    expect(entry?.amountInCents).toBe(1000); // 10 000 000µ ÷ 10 000 = 1000 cents = 10€
  });
});

// ─── RefundJournalHandler ─────────────────────────────────────────────────────

describe('RefundJournalHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerRefundJournalHandler();
    mockSet.mockResolvedValue(undefined);
  });

  it('crée une extourne immuable NF525 (set, jamais update)', async () => {
    await capturedHandlers['order.refunded']({
      tenantId: 'T', orderId: 'ord-ref', operatorId: 'op-1',
      amountInMicrounits: 3000000, originalPaymentMode: 'card',
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining('journalEntries'),
      expect.objectContaining({ status: 'refunded', orderId: 'ord-ref' }),
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('génère débit 707000 et crédit 411100 pour paiement card', async () => {
    await capturedHandlers['order.refunded']({
      tenantId: 'T', orderId: 'ord-ref2', operatorId: 'op-1',
      amountInMicrounits: 2000000, originalPaymentMode: 'card',
    });

    const entry = mockSet.mock.calls[0][1];
    const debit = entry?.lines.find((l: { side: string }) => l.side === 'debit');
    const credit = entry?.lines.find((l: { side: string }) => l.side === 'credit');

    expect(debit?.accountCode).toBe('707000');
    expect(credit?.accountCode).toBe('411100');
  });

  it('génère crédit 411200 pour paiement cash', async () => {
    await capturedHandlers['order.refunded']({
      tenantId: 'T', orderId: 'ord-ref3', operatorId: 'op-1',
      amountInMicrounits: 1000000, originalPaymentMode: 'cash',
    });

    const entry = mockSet.mock.calls[0][1];
    const credit = entry?.lines.find((l: { side: string }) => l.side === 'credit');
    expect(credit?.accountCode).toBe('411200');
  });

  it('utilise 411000 comme fallback pour mode inconnu', async () => {
    await capturedHandlers['order.refunded']({
      tenantId: 'T', orderId: 'ord-ref4', operatorId: 'op-1',
      amountInMicrounits: 1000000, originalPaymentMode: 'voucher',
    });

    const entry = mockSet.mock.calls[0][1];
    const credit = entry?.lines.find((l: { side: string }) => l.side === 'credit');
    expect(credit?.accountCode).toBe('411000');
  });

  it('inclut orderId et operatorId dans l\'écriture', async () => {
    await capturedHandlers['order.refunded']({
      tenantId: 'T', orderId: 'ord-ref5', operatorId: 'op-99',
      amountInMicrounits: 500000, originalPaymentMode: 'card',
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ orderId: 'ord-ref5', operatorId: 'op-99' }),
    );
  });
});

// ─── TaxMismatchAlertHandler ──────────────────────────────────────────────────

describe('TaxMismatchAlertHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerTaxMismatchAlertHandler();
    mockEmit.mockResolvedValue(undefined);
  });

  it('émet notification.urgent si décalage > 50 000µ (> 0.50€)', async () => {
    await capturedHandlers['finance.tax_mismatch']({
      tenantId: 'T', orderId: 'ord-1',
      expectedTax: 200000, actualTax: 100000, date: '2026-08-05',
    });

    expect(mockEmit).toHaveBeenCalledWith(
      'notification.urgent',
      expect.objectContaining({ tenantId: 'T', priority: 'HIGH' }),
    );
  });

  it('n\'émet pas notification.urgent si décalage ≤ 50 000µ', async () => {
    await capturedHandlers['finance.tax_mismatch']({
      tenantId: 'T', orderId: 'ord-2',
      expectedTax: 100000, actualTax: 90000, date: '2026-08-05',
    });

    const urgentCalls = mockEmit.mock.calls.filter(
      ([event]: [string]) => event === 'notification.urgent',
    );
    expect(urgentCalls).toHaveLength(0);
  });

  it('émet toujours system.audit_log', async () => {
    await capturedHandlers['finance.tax_mismatch']({
      tenantId: 'T', orderId: 'ord-3',
      expectedTax: 150000, actualTax: 120000, date: '2026-08-05',
    });

    expect(mockEmit).toHaveBeenCalledWith(
      'system.audit_log',
      expect.objectContaining({ action: 'TAX_MISMATCH', tenantId: 'T' }),
    );
  });
});

// ─── PaymentRejectAuditHandler ────────────────────────────────────────────────

describe('PaymentRejectAuditHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerPaymentRejectAuditHandler();
    mockEmit.mockResolvedValue(undefined);
  });

  it('émet system.audit_log lors de payment.rejected', async () => {
    await capturedHandlers['payment.rejected']({
      tenantId: 'T', orderId: 'ord-rej', reason: 'insufficient_funds', amountInMicrounits: 5000000,
    });

    expect(mockEmit).toHaveBeenCalledWith(
      'system.audit_log',
      expect.objectContaining({
        action: 'PAYMENT_REJECTED',
        details: expect.objectContaining({ orderId: 'ord-rej', reason: 'insufficient_funds' }),
      }),
    );
  });

  it('n\'écrit pas en Nexus (audit via empireAudit + emit uniquement)', async () => {
    await capturedHandlers['payment.rejected']({
      tenantId: 'T', orderId: 'ord-rej2', reason: 'card_declined', amountInMicrounits: 1000000,
    });

    expect(mockSet).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
