import { describe, it, expect } from 'vitest';
import { SharedKernel } from '@/lib/shared-kernel';

describe('SharedKernel', () => {
  describe('Sovereign.wrap', () => {
    it('wraps a string', () => {
      const result = SharedKernel.Sovereign.wrap('hello');
      expect(result).toEqual({ type: 'string', value: 'hello' });
    });

    it('wraps a number', () => {
      expect(SharedKernel.Sovereign.wrap(42)).toEqual({ type: 'number', value: 42 });
    });

    it('wraps a boolean', () => {
      expect(SharedKernel.Sovereign.wrap(true)).toEqual({ type: 'boolean', value: true });
    });

    it('wraps null', () => {
      expect(SharedKernel.Sovereign.wrap(null)).toEqual({ type: 'null', value: null });
    });

    it('wraps an array', () => {
      const result = SharedKernel.Sovereign.wrap([1, 2]);
      expect(result).toEqual({ type: 'array', value: [1, 2] });
    });

    it('wraps an object', () => {
      const result = SharedKernel.Sovereign.wrap({ key: 'val' });
      expect(result).toEqual({ type: 'object', value: { key: 'val' } });
    });
  });

  describe('Sovereign.unwrap', () => {
    it('unwraps a typed field', () => {
      expect(SharedKernel.Sovereign.unwrap({ type: 'string', value: 'test' })).toBe('test');
    });

    it('returns raw value for non-typed fields', () => {
      expect(SharedKernel.Sovereign.unwrap('raw')).toBe('raw');
      expect(SharedKernel.Sovereign.unwrap(42)).toBe(42);
    });
  });

  describe('Sovereign.cleanNumber', () => {
    it('parses a number', () => {
      expect(SharedKernel.Sovereign.cleanNumber(42)).toBe(42);
    });

    it('parses a numeric string', () => {
      expect(SharedKernel.Sovereign.cleanNumber('12.5')).toBe(12.5);
    });

    it('handles comma-separated decimals', () => {
      expect(SharedKernel.Sovereign.cleanNumber('12,5')).toBe(12.5);
    });

    it('strips currency symbols', () => {
      expect(SharedKernel.Sovereign.cleanNumber('€12.50')).toBe(12.50);
    });

    it('returns 0 for garbage', () => {
      expect(SharedKernel.Sovereign.cleanNumber('abc')).toBe(0);
      expect(SharedKernel.Sovereign.cleanNumber(undefined)).toBe(0);
    });
  });

  describe('Sovereign.cleanString', () => {
    it('trims and normalizes whitespace', () => {
      expect(SharedKernel.Sovereign.cleanString('  hello   world  ')).toBe('hello world');
    });

    it('returns empty string for falsy', () => {
      expect(SharedKernel.Sovereign.cleanString(null)).toBe('');
      expect(SharedKernel.Sovereign.cleanString(undefined)).toBe('');
    });
  });

  describe('eurosToCents', () => {
    it('converts euros to cents', () => {
      expect(SharedKernel.eurosToCents(12.99)).toBe(1299);
    });

    it('handles floating-point edge cases', () => {
      expect(SharedKernel.eurosToCents(0.1 + 0.2)).toBe(30);
    });

    it('handles zero', () => {
      expect(SharedKernel.eurosToCents(0)).toBe(0);
    });
  });

  describe('centsToEuros', () => {
    it('converts cents to euros', () => {
      expect(SharedKernel.centsToEuros(1299)).toBe(12.99);
    });
  });

  describe('formatCurrency', () => {
    it('formats cents as EUR currency', () => {
      const result = SharedKernel.formatCurrency(1299);
      expect(result).toContain('12,99');
      expect(result).toContain('€');
    });

    it('formats zero', () => {
      const result = SharedKernel.formatCurrency(0);
      expect(result).toContain('0,00');
    });
  });

  describe('calculateHT', () => {
    it('calculates HT from TTC at default rate (10%)', () => {
      // 1100 cents TTC at 10% → HT = 1100 / 1.10 = 1000
      expect(SharedKernel.calculateHT(1100)).toBe(1000);
    });

    it('calculates HT at 20% rate', () => {
      // 1200 cents TTC at 20% → HT = 1200 / 1.20 = 1000
      expect(SharedKernel.calculateHT(1200, 0.20)).toBe(1000);
    });
  });

  describe('calculateMargin', () => {
    it('calculates margin percentage', () => {
      // Price 1000, cost 600 → margin = 40%
      expect(SharedKernel.calculateMargin(1000, 600)).toBe(40);
    });

    it('returns 0 for zero price', () => {
      expect(SharedKernel.calculateMargin(0, 100)).toBe(0);
    });
  });
});
