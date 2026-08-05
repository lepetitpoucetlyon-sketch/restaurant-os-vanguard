import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FiscalSealer } from '@/modules/finance/fiscalite/FiscalSealer';

// Mock the Nexus adapter
vi.mock('@/lib/nexus/NexusAdapter', () => {
  const store: Record<string, unknown> = {};
  return {
    Nexus: {
      adapter: {
        query: vi.fn().mockResolvedValue([]),
        serverTimestamp: vi.fn(() => 'SERVER_TS'),
        runTransaction: vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
          const tx = {
            get: vi.fn(async (path: string) => store[path] ?? null),
            set: vi.fn((path: string, data: unknown) => { store[path] = data; }),
            update: vi.fn((path: string, data: unknown) => { store[path] = { ...(store[path] as object ?? {}), ...data as object }; }),
          };
          await cb(tx);
        }),
      },
    },
  };
});

vi.mock('../../infrastructure/adapters/FiscalAdapter', () => ({
  FISCAL_CONSTANTS: {
    GENESIS_ROOT: 'GENESIS_ROOT_0000000000000000',
    TRAINING_MODE_HASH: 'TRAINING_MODE_UNSIGNED_HASH',
    SIGNATURE_PREFIX: 'EMP_NF525_',
  },
}));

import { CryptoService } from '@/lib/CryptoService';

vi.mock('@domain/services/FiscalKeyService', () => ({
  FiscalKeyService: {
    requireKey: vi.fn().mockReturnValue('test-fiscal-key'),
  },
}));

vi.mock('@/lib/utils/IdGenerator', () => ({
  IdGenerator: {
    generateWithPrefix: vi.fn((prefix: string) => `${prefix}_test_001`),
  },
}));

describe('FiscalSealer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(CryptoService, 'generateHash').mockResolvedValue('test_hash_abc123');
    vi.spyOn(CryptoService, 'signFiscalData').mockResolvedValue('test_signature_xyz');
    vi.spyOn(CryptoService, 'canonicalStringify').mockImplementation((d: unknown) => JSON.stringify(d));
  });

  describe('generateSequentialReceiptNumber', () => {
    it('generates a sequential receipt number in format YEAR-NNNNNN', async () => {
      const receipt = await FiscalSealer.generateSequentialReceiptNumber('tenant_1');
      const year = new Date().getFullYear().toString();
      expect(receipt).toMatch(new RegExp(`^${year}-\\d{6}$`));
    });

    it('starts from 000001 for a new tenant', async () => {
      const receipt = await FiscalSealer.generateSequentialReceiptNumber('tenant_new');
      const year = new Date().getFullYear().toString();
      expect(receipt).toBe(`${year}-000001`);
    });
  });

  describe('generateReceiptNumberFallback (deprecated)', () => {
    it('generates a receipt number in format YEAR-TS-RND', () => {
      const receipt = FiscalSealer.generateReceiptNumberFallback();
      const year = new Date().getFullYear().toString();
      expect(receipt.startsWith(year + '-')).toBe(true);
      const parts = receipt.split('-');
      expect(parts.length).toBe(3);
    });

    it('generates unique values', () => {
      const a = FiscalSealer.generateReceiptNumberFallback();
      const b = FiscalSealer.generateReceiptNumberFallback();
      expect(a).not.toBe(b);
    });
  });

  describe('getLastSeal', () => {
    it('returns undefined when no seals exist', async () => {
      const result = await FiscalSealer.getLastSeal('empty_tenant');
      expect(result).toBeUndefined();
    });
  });

  describe('sealData', () => {
    it('returns training hash/signature in training mode', async () => {
      const result = await FiscalSealer.sealData('data', 'tenant_1', true, 'prev');
      expect(result.hash).toBe('TRAINING_MODE_UNSIGNED_HASH');
      expect(result.signature).toBe('VTC_SCHOOL_TRAINING_SIGNATURE');
    });

    it('computes real hash and signature in production mode', async () => {
      const result = await FiscalSealer.sealData('data', 'tenant_1', false, 'prev_hash');
      expect(result.hash).toBe('test_hash_abc123');
      expect(result.signature).toBe('test_signature_xyz');
    });
  });
  describe('sealDataAtomically', () => {
    it('chaque seal contient le hash du précédent', async () => {
      const seal1 = await FiscalSealer.sealDataAtomically('data1', 'tenant_1', false);
      const seal2 = await FiscalSealer.sealDataAtomically('data2', 'tenant_1', false);
      expect(seal2.previousHash).toBe(seal1.hash);
    });
  });
});
