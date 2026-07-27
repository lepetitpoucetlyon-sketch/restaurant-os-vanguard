import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialNexusBridge } from '@/infrastructure/adapters/FinancialNexusBridge';
import { TaxCalculator } from '@/infrastructure/services/finance/TaxCalculator';
import { FiscalSealer } from '@/infrastructure/services/finance/FiscalSealer';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: {
    adapter: {
      batch: vi.fn(() => ({
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      })),
    },
  },
}));

vi.mock('@/infrastructure/services/finance/TaxCalculator', () => ({
  TaxCalculator: {
    calculateTotals: vi.fn().mockReturnValue({
      totalTTCInMicrounits: 10000000,
      tvaBreakdown: { '0.10': 909090 },
      totalHTInMicrounits: 9090910,
    }),
  },
}));

vi.mock('@/infrastructure/services/finance/FiscalSealer', () => ({
  FiscalSealer: {
    generateSequentialReceiptNumber: vi.fn().mockResolvedValue('2026-000001'),
    sealDataAtomically: vi.fn().mockResolvedValue({
      hash: 'test_hash',
      signature: 'test_sig',
      sealId: 'seal_1',
      previousHash: 'prev_hash',
    }),
  },
}));

vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: {
    emit: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@domain/services/CryptoService', () => ({
  CryptoService: {
    canonicalStringify: vi.fn().mockReturnValue('json_data'),
  },
}));

describe('FinancialNexusBridge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws on empty cart', async () => {
    await expect(FinancialNexusBridge.processOrder({
      cartItems: [],
      operatorId: 'op_1',
      tableId: 't_1',
      tenantId: 'tenant_1',
    })).rejects.toThrow(/panier vide/);
  });

  it('processes a valid order into a journal entry and seal', async () => {
    const payload = {
      cartItems: [{ cartId: 'c1', categoryId: 'cat_1', discountInMicrounits: 0, modifiers: [], productId: 'p1', name: 'Pizza', quantity: 1, unitPriceInMicrounits: 10000000, taxRate: '0.10' } as any],
      operatorId: 'op_1',
      tableId: 't_1',
      tenantId: 'tenant_1',
    };

    const result = await FinancialNexusBridge.processOrder(payload);

    expect(result.journalEntry).toBeDefined();
    expect(result.journalEntry.pieceNumber).toBe('2026-000001');
    expect(result.journalEntry.fiscalSealHash).toBe('test_hash');
    expect(result.journalEntry.amountInCents).toBe(1000); // 10000000 / 10000

    expect(result.seal).toBeDefined();
    expect(result.seal.id).toBe('seal_1');
    expect(result.seal.hash).toBe('test_hash');

    expect(TaxCalculator.calculateTotals).toHaveBeenCalledWith(payload.cartItems);
    expect(FiscalSealer.sealDataAtomically).toHaveBeenCalled();
    expect(NexusEventBus.emit).toHaveBeenCalledWith('order.paid', expect.any(Object));
  });
});
