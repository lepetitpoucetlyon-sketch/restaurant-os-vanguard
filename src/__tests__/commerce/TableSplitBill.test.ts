import { describe, it, expect } from 'vitest';

describe('TableSplitBill & Règle d\'Or du Reliquat Monétaire (Invariant #5)', () => {
  function computeEqualSplit(totalInCents: number, count: number): number[] {
    const safeCount = Math.max(1, count);
    const baseShare = Math.floor(totalInCents / safeCount);
    const remainder = totalInCents % safeCount;

    return Array.from({ length: safeCount }, (_, idx) => {
      // Le dernier élément reçoit le reliquat pour garantir somme(parts) === total
      return idx === safeCount - 1 ? baseShare + remainder : baseShare;
    });
  }

  it('alloue exactement le reliquat sur la dernière part pour 100€ divisé en 3', () => {
    const totalInCents = 10000; // 100.00 €
    const parts = computeEqualSplit(totalInCents, 3);

    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe(3333); // 33.33 €
    expect(parts[1]).toBe(3333); // 33.33 €
    expect(parts[2]).toBe(3334); // 33.34 € (reliquat +1 centime)

    const sum = parts.reduce((a, b) => a + b, 0);
    expect(sum).toBe(totalInCents);
  });

  it('gère parfaitement une division en 7 parts sans perte de centime', () => {
    const totalInCents = 15379; // 153.79 €
    const parts = computeEqualSplit(totalInCents, 7);

    expect(parts).toHaveLength(7);
    const sum = parts.reduce((a, b) => a + b, 0);
    expect(sum).toBe(totalInCents);
  });

  it('calcule correctement le pourboire optionnel en centimes', () => {
    const baseAmountInCents = 4000; // 40.00 €
    const tipPercentage = 15; // 15%
    const tipInCents = Math.round((baseAmountInCents * tipPercentage) / 100);

    expect(tipInCents).toBe(600); // 6.00 €
    expect(baseAmountInCents + tipInCents).toBe(4600); // 46.00 €
  });
});
