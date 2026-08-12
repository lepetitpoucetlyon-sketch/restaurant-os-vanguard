import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialNexusBridge } from '@/modules/finance/comptabilite/FinancialNexusBridge';
import { TaxCalculator } from '@/modules/finance/fiscalite/TaxCalculator';
import { FiscalSealer } from '@/modules/finance/fiscalite/FiscalSealer';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';

// Removed NexusAdapter mock, will use spyOn in beforeEach

import { CryptoService } from '@/lib/CryptoService';

describe('FinancialNexusBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(TaxCalculator, 'calculateTotals').mockReturnValue({
      totalTTCInMicrounits: 10000000,
      tvaBreakdown: { '0.10': 909090 },
      totalHTInMicrounits: 9090910,
    } as any);

    vi.spyOn(FiscalSealer, 'generateSequentialReceiptNumber').mockResolvedValue('2026-000001');
    vi.spyOn(FiscalSealer, 'sealDataAtomically').mockResolvedValue({
      hash: 'test_hash',
      signature: 'test_sig',
      sealId: 'seal_1',
      previousHash: 'prev_hash',
    } as any);

    vi.spyOn(NexusEventBus, 'emit').mockResolvedValue(undefined);
    vi.spyOn(NexusEventBus, 'emitDurable').mockResolvedValue(undefined);

    vi.spyOn(CryptoService, 'canonicalStringify').mockReturnValue('json_data');
    // @ts-expect-error - vitest mock
    vi.spyOn(Nexus.adapter, 'batch').mockImplementation(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    }));
    vi.spyOn(Nexus.adapter, 'serverTimestamp').mockReturnValue('SERVER_TS');
    vi.spyOn(Nexus.adapter, 'runTransaction').mockImplementation(async (cb: any) => {
      const tx = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      return cb(tx);
    });
  });

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

    expect(TaxCalculator.calculateTotals).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ cartId: 'c1' })
      ])
    );
    expect(FiscalSealer.sealDataAtomically).toHaveBeenCalled();
    expect(NexusEventBus.emitDurable).toHaveBeenCalledWith('order.paid', expect.any(Object));
  });
});
