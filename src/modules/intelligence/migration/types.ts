/**
 * 🏗️ Migration Air-lock — Type Contracts
 * Grade X Intelligence Layer
 *
 * Copyright © 2026 Mohammed-ali Boudjaadar. Tous droits réservés.
 */

export * from '@/shared/nexus/contracts/migration.types';

export interface FiscalIssue {
    type: 'INVALID_VAT_RATE' | 'TOTAL_MISMATCH' | 'NEGATIVE_AMOUNT' | 'MISSING_DATE' | 'VAT_MISMATCH' | 'TOTAL_IMBALANCE' | 'MISSING_FIELD' | 'DATE_ANOMALY';
    description: string;
    expectedValue?: string | number;
    actualValue?: string | number;
    autoFixable: boolean;
}
