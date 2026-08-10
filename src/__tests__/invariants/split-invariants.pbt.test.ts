import fc from 'fast-check';
import { describe, it } from 'vitest';
import { SplitBillDomainService } from '@/modules/finance/services/SplitBillDomainService';

describe('Invariant: Split', () => {
  it('split(total, n) : Σ parts === total exactement', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }), // total in cents (up to 10k)
        fc.integer({ min: 1, max: 100 }), // number of people
        (totalInCents, count) => {
          const payments = SplitBillDomainService.createEqualPayments(count, totalInCents);
          const sumParts = payments.reduce((acc, p) => acc + p.amount, 0);
          return sumParts === totalInCents;
        }
      )
    );
  });
});
