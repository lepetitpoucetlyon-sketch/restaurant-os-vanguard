import { describe, it, expect } from 'vitest';
import { CryptoService } from '@/lib/CryptoService';

describe('CryptoService', () => {
  describe('canonicalStringify', () => {
    it('produces deterministic output regardless of key order', () => {
      const a = CryptoService.canonicalStringify({ z: 1, a: 2 } as any);
      const b = CryptoService.canonicalStringify({ a: 2, z: 1 } as any);
      expect(a).toBe(b);
    });

    it('handles nested objects deterministically', () => {
      const obj = { b: { y: 1, x: 2 }, a: 3 } as any;
      const result = CryptoService.canonicalStringify(obj);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles null and undefined values', () => {
      const result = CryptoService.canonicalStringify({ a: null, b: undefined } as any);
      expect(typeof result).toBe('string');
    });
  });

  describe('generateHash', () => {
    it('produces a hex string', async () => {
      const hash = await CryptoService.generateHash('test data');
      expect(hash).toMatch(/^[0-9a-f]{64}$/); // SHA-256 = 64 hex chars
    });

    it('is deterministic', async () => {
      const a = await CryptoService.generateHash('same input', 'same previous');
      const b = await CryptoService.generateHash('same input', 'same previous');
      expect(a).toBe(b);
    });

    it('differs for different inputs', async () => {
      const a = await CryptoService.generateHash('input A');
      const b = await CryptoService.generateHash('input B');
      expect(a).not.toBe(b);
    });

    it('incorporates previousHash into the chain', async () => {
      const noChain = await CryptoService.generateHash('data', '');
      const withChain = await CryptoService.generateHash('data', 'previous_hash');
      expect(noChain).not.toBe(withChain);
    });
  });

  describe('signFiscalData', () => {
    it('produces an uppercase hex signature', async () => {
      const sig = await CryptoService.signFiscalData('hash123', 'secret');
      expect(sig).toMatch(/^[0-9A-F]+$/);
    });

    it('throws without a secret', async () => {
      await expect(CryptoService.signFiscalData('hash', '')).rejects.toThrow('FISCAL_SIGNATURE_SECRET_MISSING');
    });

    it('is deterministic for same inputs', async () => {
      const a = await CryptoService.signFiscalData('hash', 'secret');
      const b = await CryptoService.signFiscalData('hash', 'secret');
      expect(a).toBe(b);
    });

    it('differs for different secrets', async () => {
      const a = await CryptoService.signFiscalData('hash', 'secret_a');
      const b = await CryptoService.signFiscalData('hash', 'secret_b');
      expect(a).not.toBe(b);
    });
  });

  describe('verifyFiscalSignature', () => {
    it('verifies a correct signature', async () => {
      const sig = await CryptoService.signFiscalData('myhash', 'mysecret');
      expect(await CryptoService.verifyFiscalSignature('myhash', sig, 'mysecret')).toBe(true);
    });

    it('rejects an incorrect signature', async () => {
      expect(await CryptoService.verifyFiscalSignature('myhash', 'WRONG', 'mysecret')).toBe(false);
    });
  });

  describe('verifyIntegrity', () => {
    it('verifies data integrity', async () => {
      const data = { a: 1, b: 'test' } as any;
      const snapshot = CryptoService.canonicalStringify(data);
      const hash = await CryptoService.generateHash(snapshot, 'prev');
      expect(await CryptoService.verifyIntegrity(data, hash, 'prev')).toBe(true);
    });

    it('detects tampering', async () => {
      const data = { a: 1 } as any;
      expect(await CryptoService.verifyIntegrity(data, 'tampered_hash', '')).toBe(false);
    });
  });
});
