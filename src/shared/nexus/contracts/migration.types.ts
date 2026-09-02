/**
 * 🏛️ Universal Migration & Legacy Contracts — Grade X
 * Contrats partagés pour la reprise d'antériorité, l'isolation des données legacy,
 * l'Airlock de décontamination, et l'écriture d'ouverture comptable/fiscale NF525.
 *
 * Copyright © 2026 Mohammed-ali Boudjaadar. Tous droits réservés.
 */

export type OriginType = 'live' | 'legacy' | 'seeded';

export interface LegacyMeta {
    source: string; // 'zelty' | 'lightspeed' | 'fec' | 'excel' | 'slayer' ...
    migrationSessionId: string;
    originalId?: string;
    originalDate: string; // ISO 8601
    ingestedAt: string;   // ISO 8601
    rawChecksum?: string;
}

export type LegacySourceFormat = 'csv' | 'excel' | 'json' | 'pdf' | 'api_export';

export type LegacySourceSystem =
    | 'zelty'
    | 'lightspeed'
    | 'laddition'
    | 'tiller'
    | 'square'
    | 'toast'
    | 'clover'
    | 'caisse_enregistreuse'
    | 'excel_manual'
    | 'pennylane'
    | 'sage'
    | 'cashpad'
    | 'popina'
    | 'fec'
    | 'unknown';

export type IntegrationMode =
    | 'TABULA_RASA'    // Option A: Clean slate, no import
    | 'PONT'           // Option B: Opening balances only (80% of clients)
    | 'SUTURE_TOTALE'; // Option C: Full historical import (Premium service)

export interface LegacyImportConfig {
    sessionId: string;
    sourceSystem: LegacySourceSystem;
    format: LegacySourceFormat;
    genesisDate: string; // ISO 8601 — The Cut-off
    integrationMode: IntegrationMode;
    tenantId: string;
    initiatedBy: string;
    startedAt: string;
}

export type DecontaminationStatus =
    | 'RAW'
    | 'PARSED'
    | 'DEDUPLICATED'
    | 'VALIDATED'
    | 'ENRICHED'
    | 'READY'
    | 'REJECTED'
    | 'NEEDS_REVIEW';

export interface DecontaminationIssue {
    stage: 'PARSE' | 'DEDUP' | 'VALIDATE' | 'ENRICH';
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';
    code: string;
    message: string;
    field?: string;
    suggestedFix?: string;
}

export interface NormalizedLegacyRecord {
    entityType: 'product' | 'ingredient' | 'supplier' | 'transaction' | 'employee' | 'customer';
    fields: Record<string, string | number | boolean>;
    confidence: number;
    fieldMapping?: Record<string, string>;
}

export interface RawLegacyDocument {
    id: string;
    sourceRowIndex: number;
    rawFields: Record<string, string | number | null>;
    sourceFile: string;
    status: DecontaminationStatus;
    issues: DecontaminationIssue[];
    normalizedOutput?: NormalizedLegacyRecord;
}

export interface DuplicateCandidate {
    documentId: string;
    matchedWithId: string;
    similarityScore: number;
    matchedFields: string[];
    resolution: 'PENDING' | 'MERGED' | 'KEPT_BOTH' | 'DISCARDED';
}

export interface FiscalValidationResult {
    documentId: string;
    vatValid: boolean;
    totalsBalanced: boolean;
    requiredFieldsPresent?: boolean;
    issues: Array<{
        type: 'INVALID_VAT_RATE' | 'TOTAL_MISMATCH' | 'NEGATIVE_AMOUNT' | 'MISSING_DATE' | 'VAT_MISMATCH' | 'TOTAL_IMBALANCE' | 'MISSING_FIELD' | 'DATE_ANOMALY';
        description: string;
        expectedValue?: string | number;
        actualValue?: string | number;
        autoFixable: boolean;
    }>;
}

export interface OpeningBalance {
    accountCode: string; // '701', '607', '512'...
    accountName: string;
    balanceInMicrounits: number;
    side: 'debit' | 'credit';
    source: string;
}

export interface OpeningEntry {
    id: string;
    asOfDate: string; // ISO 8601 (Genesis Date)
    lines: OpeningBalance[];
    totalDebitInMicrounits: number;
    totalCreditInMicrounits: number;
    isBalanced: boolean;
    fiscalSealHash: string;
    migrationSessionId: string;
    sealedAt: string;
    sealedBy: string;
    sequence?: number;
    previousHash?: string;
}

export interface LegacyArchiveEntry {
    id: string;
    sourceSystem: LegacySourceSystem;
    originalDate: string;
    entityType: string;
    data: Record<string, string | number | boolean>;
    ragIndexable: boolean;
    migrationSessionId: string;
    archivedAt: string;
}

export interface MigrationStats {
    totalDocumentsIngested: number;
    successfullyNormalized: number;
    duplicatesFound: number;
    duplicatesMerged: number;
    fiscalIssuesFound: number;
    fiscalIssuesAutoFixed: number;
    rejectedDocuments: number;
    needsReviewDocuments: number;
}

export interface MigrationReport {
    sessionId: string;
    tenantId: string;
    sourceSystem: LegacySourceSystem;
    integrationMode: IntegrationMode;
    genesisDate: string;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    stats: MigrationStats;
    openingBalances: OpeningBalance[];
    entityBreakdown: Record<string, number>;
    topIssues: DecontaminationIssue[];
    summary: string;
}
