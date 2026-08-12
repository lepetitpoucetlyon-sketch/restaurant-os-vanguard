import { describe, it, expect } from 'vitest';
import { PCG_ACCOUNTS } from '@/lib/seeds/pcg-accounts';

describe('PCG Accounts seed data', () => {
  it('contains accounts across all 7 classes', () => {
    const classes = new Set(PCG_ACCOUNTS.map((a) => a.class));
    expect(classes.size).toBe(7);
    for (let c = 1; c <= 7; c++) {
      expect(classes.has(c as 1 | 2 | 3 | 4 | 5 | 6 | 7)).toBe(true);
    }
  });

  it('has no duplicate account numbers', () => {
    const numbers = PCG_ACCOUNTS.map((a) => a.number);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('classes 1-5 are bilan, classes 6-7 are resultat', () => {
    for (const a of PCG_ACCOUNTS) {
      if (a.class <= 5) expect(a.nature).toBe('bilan');
      else expect(a.nature).toBe('resultat');
    }
  });

  it('account numbers start with their class digit', () => {
    for (const a of PCG_ACCOUNTS) {
      expect(a.number[0]).toBe(String(a.class));
    }
  });

  it('has at least 40 accounts', () => {
    expect(PCG_ACCOUNTS.length).toBeGreaterThanOrEqual(40);
  });
});
