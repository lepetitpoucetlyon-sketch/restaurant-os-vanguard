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

/** @deprecated Use calculateVATMicrounits instead */
export function calculateVAT(amountInCents: number, rate: number = VAT_RATES.STANDARD): number {
    return Math.round(amountInCents * (rate / 100));
}

/** @deprecated Use extractVATMicrounits instead */
export function extractVAT(totalWithTaxInCents: number, rate: number = VAT_RATES.STANDARD): number {
    const baseAmount = totalWithTaxInCents / (1 + rate / 100);
    return Math.round(totalWithTaxInCents - baseAmount);
}

/** Calcule la TVA en microunits (1 € = 1 000 000 µ) */
export function calculateVATMicrounits(amountInMicrounits: number, rate: number = VAT_RATES.STANDARD): number {
    return Math.round(amountInMicrounits * (rate / 100));
}

/** Extrait la TVA depuis un montant TTC en microunits */
export function extractVATMicrounits(totalWithTaxInMicrounits: number, rate: number = VAT_RATES.STANDARD): number {
    const baseAmount = totalWithTaxInMicrounits / (1 + rate / 100);
    return Math.round(totalWithTaxInMicrounits - baseAmount);
}
