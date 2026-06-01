import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CartItem } from '@/modules/ops/engine/types';
import { toMicrounits } from '@/domain/schemas/primitives';

// --- Mocks ---

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: {
    adapter: {
      query: vi.fn().mockResolvedValue([]),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

vi.mock('@/infrastructure/adapters/FiscalAdapter', () => ({
  FISCAL_CONSTANTS: {
    GENESIS_ROOT: 'GENESIS_ROOT_0000000000000000',
    TRAINING_MODE_HASH: 'TRAINING_MODE_UNSIGNED_HASH',
    SIGNATURE_PREFIX: 'EMP_NF525_',
  },
}));

vi.mock('@/domain/services/CryptoService', () => ({
  CryptoService: {
    canonicalStringify: vi.fn((data) => JSON.stringify(data)),
    generateHash: vi.fn().mockResolvedValue('a'.repeat(64)),
    signFiscalData: vi.fn().mockResolvedValue('mock-signature'),
  },
}));

vi.mock('@/lib/shared-kernel', () => ({
  SharedKernel: {
    generateId: vi.fn((prefix: string) => `${prefix}-mock-id`),
  },
}));

vi.mock('@/lib/audit', () => ({
  empireAudit: { log: vi.fn() },
}));

// --- Tests ---

import { FinancialNexusBridge } from '@/infrastructure/adapters/FinancialNexusBridge';
import { Nexus } from '@/lib/nexus/NexusAdapter';

const makeCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  cartId: 'cart-1',
  productId: 'prod-1',
  categoryId: 'cat-1',
  name: 'Entrecôte',
  quantity: 2,
  unitPriceInMicrounits: toMicrounits(25_000_000), // 25€
  discountInMicrounits: toMicrounits(0),
  taxRate: '0.10',
  modifiers: [],
  ...overrides,
});

describe('🏦 FinancialNexusBridge — NF525 Suture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (Nexus.adapter.query as any).mockResolvedValue([]);
  });

  it('rejette un panier vide', async () => {
    await expect(
      FinancialNexusBridge.processOrder({
        cartItems: [],
        operatorId: 'op-1',
        tableId: 'table-5',
        tenantId: 'tenant-test',
      })
    ).rejects.toThrow('panier vide');
  });

  it('calcule les totaux en microunits correctement', async () => {
    const item = makeCartItem({ quantity: 3, unitPriceInMicrounits: toMicrounits(10_000_000) }); // 10€ × 3 = 30€
    const result = await FinancialNexusBridge.processOrder({
      cartItems: [item],
      operatorId: 'op-1',
      tableId: 'table-3',
      tenantId: 'tenant-test',
    });
    // totalTTC = 30_000_000 (30€ en microunits)
    expect(result.journalEntry.amountInCents).toBe(3000); // 30€ = 3000 centimes
  });

  it('écrit JournalEntry et FiscalSeal dans Nexus', async () => {
    const item = makeCartItem();
    await FinancialNexusBridge.processOrder({
      cartItems: [item],
      operatorId: 'op-1',
      tableId: 'table-1',
      tenantId: 'tenant-test',
    });
    expect(Nexus.adapter.set).toHaveBeenCalledTimes(2);
    const calls = (Nexus.adapter.set as any).mock.calls;
    expect(calls[0][0]).toContain('journalEntries/');
    expect(calls[1][0]).toContain('fiscalSeals/');
  });

  it('chaîne avec le hash du dernier seal existant', async () => {
    const mockLastSeal = {
      id: 'seal-prev',
      hash: 'b'.repeat(64),
      previousHash: 'GENESIS_ROOT_0000000000000000',
      timestamp: new Date().toISOString(),
      transactionId: 'je-prev',
      dataSnapshot: '{}',
      signature: 'sig',
      updatedAt: new Date().toISOString(),
    };
    (Nexus.adapter.query as any).mockResolvedValue([mockLastSeal]);

    const { CryptoService } = await import('@/domain/services/CryptoService');
    const item = makeCartItem();
    await FinancialNexusBridge.processOrder({
      cartItems: [item],
      operatorId: 'op-1',
      tableId: null,
      tenantId: 'tenant-test',
    });
    // generateHash should receive previousHash from last seal
    expect(CryptoService.generateHash).toHaveBeenCalledWith(
      expect.any(String),
      'b'.repeat(64)
    );
  });

  it('mode formation — utilise le hash de training', async () => {
    const item = makeCartItem();
    const result = await FinancialNexusBridge.processOrder({
      cartItems: [item],
      operatorId: 'op-1',
      tableId: null,
      tenantId: 'tenant-test',
      isTrainingMode: true,
    });
    expect(result.seal.hash).toBe('TRAINING_MODE_UNSIGNED_HASH');
    expect(result.seal.signature).toBe('VTC_SCHOOL_TRAINING_SIGNATURE');
  });

  it('le JournalEntry est marqué isSystemGenerated et isValidated', async () => {
    const item = makeCartItem();
    const { journalEntry } = await FinancialNexusBridge.processOrder({
      cartItems: [item],
      operatorId: 'op-1',
      tableId: 'table-2',
      tenantId: 'tenant-test',
    });
    expect(journalEntry.isSystemGenerated).toBe(true);
    expect(journalEntry.isValidated).toBe(true);
    expect(journalEntry.referenceType).toBe('order');
    expect(journalEntry.status).toBe('validated');
  });
});
