import { logger } from '@/lib/logger';

/**
 * 🏛️ SovereignMath - Grade X+++
 * Enforces the Microunits Protocol across the Empire.
 * 1 Unit = 1,000,000 Microunits.
 */
export const SovereignMath = {
    PRECISION: 1_000_000,
    EPSILON: 1e-10,

    /**
     * Converts a float value to microunits with Epsilon safety.
     * Use this at the PhysicalNode / Input layer.
     */
    toMicrounits: (value: number): number => {
        const rawValue = value * SovereignMath.PRECISION;
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
        
        return Math.floor(rawValue + SovereignMath.EPSILON);
    },

    /**
     * Converts microunits back to a display/fiscal value.
     */
    fromMicrounits: (microunits: number): number => {
        return microunits / SovereignMath.PRECISION;
    },

    /**
     * Performs a multiplication with full precision.
     */
    multiply: (valA: number, valB: number): number => {
        // Calculation is done in microunits to prevent float drift
        return Math.floor((valA * valB) / SovereignMath.PRECISION);
    },

    /**
     * Adds two microunit values with integer safety.
     */
    add: (a: number, b: number): number => {
        return Math.round(a + b);
    },

    /**
     * Subtracts two microunit values with integer safety.
     */
    subtract: (a: number, b: number): number => {
        return Math.round(a - b);
    },

    /**
     * Divides two microunit values, returning microunits.
     */
    divide: (numerator: number, denominator: number): number => {
        if (denominator === 0) {
            throw new Error('FISCAL_DIVISION_BY_ZERO: Sovereign arithmetic violation.');
        }
        return Math.floor((numerator * SovereignMath.PRECISION) / denominator);
    },

    /**
     * Suture check: Ensures a value is a safe integer before fiscal sealing.
     */
    isSovereignInteger: (value: number): boolean => {
        return Number.isInteger(value);
    }
};
