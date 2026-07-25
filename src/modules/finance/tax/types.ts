/**
 * 🏛️ Tax & EDI Types - Grade X+++
 */

export interface TaxBreakdown {
    totalRevenueInCents: number;
    taxBaseByRate: Record<string, number>; // e.g. "20.0": 10000, "10.0": 5000
    taxCollectedByRate: Record<string, number>;
    totalTaxCollectedInCents: number;
    deductibleTaxInCents: number;
    netTaxToPayInCents: number;
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
