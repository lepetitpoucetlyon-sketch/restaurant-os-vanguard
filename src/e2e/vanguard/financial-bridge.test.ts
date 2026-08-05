import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CartItem } from '@/modules/ops';
import { toMicrounits } from '@/domain/schemas/primitives';

// --- Mocks ---

const { mockBatchCommit, mockBatch } = vi.hoisted(() => {
  const mockBatchSet = vi.fn();
  const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
  const mockBatch = vi.fn(() => ({
    set: mockBatchSet,
    update: vi.fn(),
    delete: vi.fn(),
    commit: mockBatchCommit,
  }));
  return { mockBatchCommit, mockBatch };
});

// Removed NexusAdapter mock, will use spyOn in beforeEach

vi.mock('@/modules/finance/fiscalite/FiscalAdapter', () => ({
  FISCAL_CONSTANTS: {
    GENESIS_ROOT: 'GENESIS_ROOT_0000000000000000',
    TRAINING_MODE_HASH: 'TRAINING_MODE_UNSIGNED_HASH',
    SIGNATURE_PREFIX: 'EMP_NF525_',
  },
}));

// Removed CryptoService mock, will use spyOn in beforeEach

vi.mock('@/lib/shared-kernel', () => ({
  SharedKernel: {
    generateId: vi.fn((prefix: string) => `${prefix}-mock-id`),
  },
}));

vi.mock('@/lib/audit', () => ({
  empireAudit: { log: vi.fn() },
}));

// --- Tests ---

import { FinancialNexusBridge } from '@/modules/finance/comptabilite/FinancialNexusBridge';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CryptoService } from '@/lib/CryptoService';

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
    vi.spyOn(Nexus.adapter, 'query').mockResolvedValue([]);
    // @ts-expect-error - vitest mock does not match full adapter signature
    vi.spyOn(Nexus.adapter, 'batch').mockImplementation(() => mockBatch());
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

    vi.spyOn(CryptoService, 'canonicalStringify').mockImplementation((data) => JSON.stringify(data));
    vi.spyOn(CryptoService, 'generateHash').mockResolvedValue('a'.repeat(64));
    vi.spyOn(CryptoService, 'signFiscalData').mockResolvedValue('mock-signature');

    mockBatchCommit.mockResolvedValue(undefined);
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

  it('écrit JournalEntry dans Nexus (seal écrit via transaction)', async () => {
    const item = makeCartItem();
    const { journalEntry, seal } = await FinancialNexusBridge.processOrder({
      cartItems: [item],
      operatorId: 'op-1',
      tableId: 'table-1',
      tenantId: 'tenant-test',
    });
    expect(journalEntry.id).toBeDefined();
    expect(seal.id).toBeDefined();
    expect(Nexus.adapter.runTransaction).toHaveBeenCalled();
  });

  it('chaîne avec le hash du dernier seal existant', async () => {
    const prevHash = 'b'.repeat(64);
    // override the transaction just for this test
    vi.spyOn(Nexus.adapter, 'runTransaction').mockImplementation(async (cb: any) => {
      const tx = {
        get: vi.fn().mockResolvedValue({ hash: prevHash, sealId: 'seal-prev' }),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      return cb(tx);
    });

    const item = makeCartItem();
    await FinancialNexusBridge.processOrder({
      cartItems: [item],
      operatorId: 'op-1',
      tableId: null,
      tenantId: 'tenant-test',
    });
    expect(CryptoService.generateHash).toHaveBeenCalledWith(
      expect.any(String),
      prevHash
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
