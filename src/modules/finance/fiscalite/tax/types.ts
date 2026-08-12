/**
 * 🏛️ Tax & EDI Types - Grade X+++
 */

export interface TaxBreakdown {
    totalRevenueInMicrounits: number;
    /** @deprecated use totalRevenueInMicrounits */
    totalRevenueInCents?: number;
    taxBaseByRate: Record<string, number>;
    taxCollectedByRate: Record<string, number>;
    totalTaxCollectedInMicrounits: number;
    /** @deprecated use totalTaxCollectedInMicrounits */
    totalTaxCollectedInCents?: number;
    deductibleTaxInMicrounits: number;
    /** @deprecated use deductibleTaxInMicrounits */
    deductibleTaxInCents?: number;
    netTaxToPayInMicrounits: number;
    /** @deprecated use netTaxToPayInMicrounits */
    netTaxToPayInCents?: number;
}

export interface CA3Declaration {
    period: string; // YYYY-MM
    siren: string;
    breakdown: TaxBreakdown;
    generatedAt: string;
}

export interface EDISubmissionResult {
    success: boolean;
    submissionId: string;
    status: 'ACCEPTED' | 'REJECTED' | 'PENDING';
    dgfipReceiptHash?: string;
    errors?: string[];
}
