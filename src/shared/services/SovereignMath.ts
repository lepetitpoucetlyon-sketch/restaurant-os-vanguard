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
     * Converts a float value to microunits (number) with Epsilon safety.
     * Use this at the PhysicalNode / Input layer.
     */
    toMicrounits: (value: number): number => {
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
        
        return roundedValue;
    },

    /**
     * Converts microunits back to a display/fiscal value (number).
     */
    fromMicrounits: (microunits: number): number => {
        return microunits / Number(SovereignMath.PRECISION);
    },

    /**
     * Converts cents to microunits.
     */
    fromCents: (cents: number): number => {
        return cents * 10_000;
    },

    /**
     * Converts microunits to cents (integer) for legacy formatters.
     */
    toCents: (microunits: bigint): number => {
        return Math.round(Number(microunits) / 10000);
    },

    /**
     * Performs a multiplication with full precision.
     */
    multiply: (valA: number, valB: number): number => {
        return Math.round((valA * valB) / Number(SovereignMath.PRECISION));
    },

    /**
     * Adds two microunit values (number).
     */
    add: (a: number, b: number): number => {
        return a + b;
    },

    /**
     * Subtracts two microunit values (number).
     */
    subtract: (a: number, b: number): number => {
        return a - b;
    },

    /**
     * Divides two microunit values, returning microunits (number).
     */
    divide: (numerator: number, denominator: number): number => {
        if (denominator === 0) {
            throw new Error('FISCAL_DIVISION_BY_ZERO: Sovereign arithmetic violation.');
        }
        return Math.round((numerator * Number(SovereignMath.PRECISION)) / denominator);
    },

    /**
     * Calculates tax amount for a given microunit value and tax rate.
     */
    calculateTax: (microunits: number, rate: number | string): number => {
        const rateNum = typeof rate === 'string' ? parseFloat(rate) : rate;
        return Math.round(microunits * rateNum);
    },

    /**
     * Formats microunits to a currency string (EUR).
     */
    format: (microunits: number): string => {
        return `${SovereignMath.fromMicrounits(microunits).toFixed(2)}€`;
    },

    /**
     * Suture check: Ensures a value is a valid microunit integer.
     */
    isSovereignInteger: (value: unknown): value is number => {
        return typeof value === 'number' && Number.isInteger(value);
    }
};
