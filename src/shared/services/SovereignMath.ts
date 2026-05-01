import { logger } from '@/lib/logger';

/**
 * 🏛️ SovereignMath - Grade X OFFICIAL STANDARD
 * Enforces the Microunits Protocol across the Empire.
 * Precision: 10^-6 (Microunits).
 * 1 Unit = 1,000,000 Microunits.
 */
export const SovereignMath = {
    PRECISION: BigInt(1_000_000),
    EPSILON: 1e-10, // Kept for float input validation

    /**
     * Converts a float value to microunits (bigint) with Epsilon safety.
     * Use this at the PhysicalNode / Input layer.
     */
    toMicrounits: (value: number): bigint => {
        const rawValue = value * Number(SovereignMath.PRECISION);
        const roundedValue = Math.round(rawValue);
        
        // 🛡️ EPSILON SECURITY: Detect real precision loss (> 1e-10)
        if (Math.abs(rawValue - roundedValue) > SovereignMath.EPSILON) {
            import('@sentry/nextjs').then(Sentry => {
                Sentry.captureException(new Error(`FISCAL_PRECISION_CORRUPTION: Data exceeds 6 decimal places. Value: ${value}`), {
                    tags: { protocol: "Microunits", security: "EPSILON_GUARD" },
                    extra: { rawValue, roundedValue, delta: Math.abs(rawValue - roundedValue) }
                });
            });
        }
        
        return BigInt(roundedValue);
    },

    /**
     * Converts microunits back to a display/fiscal value (number).
     */
    fromMicrounits: (microunits: bigint): number => {
        return Number(microunits) / Number(SovereignMath.PRECISION);
    },

    /**
     * Performs a multiplication with full BigInt precision.
     */
    multiply: (valA: bigint, valB: bigint): bigint => {
        return (valA * valB) / SovereignMath.PRECISION;
    },

    /**
     * Adds two microunit values (bigint).
     */
    add: (a: bigint, b: bigint): bigint => {
        return a + b;
    },

    /**
     * Subtracts two microunit values (bigint).
     */
    subtract: (a: bigint, b: bigint): bigint => {
        return a - b;
    },

    /**
     * Divides two microunit values, returning microunits (bigint).
     */
    divide: (numerator: bigint, denominator: bigint): bigint => {
        if (denominator === BigInt(0)) {
            throw new Error('FISCAL_DIVISION_BY_ZERO: Sovereign arithmetic violation.');
        }
        return (numerator * SovereignMath.PRECISION) / denominator;
    },

    /**
     * Suture check: Ensures a value is a valid BigInt.
     */
    isSovereignInteger: (value: any): value is bigint => {
        return typeof value === 'bigint';
    }
};
