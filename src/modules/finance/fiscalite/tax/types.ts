/**
 * 🏛️ Tax & EDI Types - Grade X+++
 */

export interface TaxBreakdown {
    totalRevenueInMicrounits: number;
    totalRevenueInCents?: number;
    taxBaseByRate: Record<string, number>;
    taxCollectedByRate: Record<string, number>;
    totalTaxCollectedInMicrounits: number;
    totalTaxCollectedInCents?: number;
    deductibleTaxInMicrounits: number;
    deductibleTaxInCents?: number;
    netTaxToPayInMicrounits: number;
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
