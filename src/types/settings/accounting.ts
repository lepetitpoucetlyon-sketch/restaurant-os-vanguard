// @ts-nocheck
import { AccountingMode } from "@/lib/shared-kernel";

export interface AccountingConfig {
    fiscalYearStart: string;
    accountingMethod: 'accrual' | 'cash';
    defaultPaymentTerms: number;
    vatRates: { rate: number; name: string; category: string }[];
    invoicePrefix: string;
    invoiceNextNumber: number;
    bankName: string;
    iban: string;
    bic: string;
    exportFormat: 'csv' | 'xlsx' | 'pdf';
    
    // --- Grade X : Sovereign Ledger Complexity ---
    complexityMode: AccountingMode;

    // --- Phase 29 : The Fiscal Shield (Facturation Électronique) ---
    electronicInvoicingEnabled: boolean;
    vatIdNumber: string; // ex: FR...
    siren: string;
    pdpEndpoint: string; // Plateforme de Dématérialisation Partenaire
    facturXProfile: 'minimum' | 'basic' | 'en16931';
}
