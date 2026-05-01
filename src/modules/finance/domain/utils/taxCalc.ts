/**
 * 🏛️ NEXUS TAX CALCULATOR - Grade X Utility
 * Standardized VAT calculations for NF525 compliance.
 */

export const VAT_RATES = {
    STANDARD: 20,
    REDUCED: 10,
    MINIMUM: 5.5,
    ZERO: 0
};

export function calculateVAT(amountInCents: number, rate: number = VAT_RATES.STANDARD): number {
    return Math.round(amountInCents * (rate / 100));
}

export function extractVAT(totalWithTaxInCents: number, rate: number = VAT_RATES.STANDARD): number {
    const baseAmount = totalWithTaxInCents / (1 + rate / 100);
    return Math.round(totalWithTaxInCents - baseAmount);
}
