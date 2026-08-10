import fc from 'fast-check';
import { describe, it } from 'vitest';
import { SovereignMath } from '@/shared/services/SovereignMath';

describe('Invariant: Conversion Monétaire', () => {
  it('fromMicrounits(toMicrounits(x)) === x', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }), // large range of cents/euros depending on context
        (val) => {
          const inMicro = SovereignMath.toMicrounits(val);
          const backToVal = SovereignMath.fromMicrounits(inMicro);
          return val === backToVal;
        }
      )
    );
  });
});
