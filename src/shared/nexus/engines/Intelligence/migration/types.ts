/**
 * 🏗️ Migration Air-lock — Type Contracts
 * Grade X Intelligence Layer
 *
 * Defines the data structures for the Legacy Migration pipeline:
 * - Raw Vault (incoming dirty data)
 * - Decontamination stages
 * - Migration reports
 * - Opening entries (Écriture d'Ouverture)
 *
 * Copyright © 2026 Mohammed-ali Boudjaadar. Tous droits réservés.
 */

// ============================================
// RAW VAULT — Incoming Legacy Data
// ============================================

export type LegacySourceFormat = 'csv' | 'excel' | 'json' | 'pdf' | 'api_export';

export type LegacySourceSystem =
    | 'zelty'
    | 'lightspeed'
    | 'square'
    | 'toast'
    | 'clover'
    | 'caisse_enregistreuse'
    | 'excel_manual'
    | 'unknown';

export interface LegacyImportConfig {
    /** Unique import session ID */
    sessionId: string;
    /** Source system identifier */
    sourceSystem: LegacySourceSystem;
    /** File format */
    format: LegacySourceFormat;
    /** Date before which all data is considered "archive" */
    genesisDate: string; // ISO 8601 — The Cut-off
    /** Integration option chosen by the client */
    integrationMode: IntegrationMode;
    /** Tenant this import belongs to */
    tenantId: string;
    /** User who initiated the import */
    initiatedBy: string;
    /** Start timestamp */
    startedAt: string;
}

export type IntegrationMode =
    | 'TABULA_RASA'    // Option A: Clean slate, no import
    | 'PONT'           // Option B: Opening balances only (80% of clients)
    | 'SUTURE_TOTALE'; // Option C: Full historical import (Premium service)

// ============================================
// DECONTAMINATION PIPELINE
// ============================================

export interface RawLegacyDocument {
    /** Auto-generated ID for tracking */
    id: string;
    /** Original row/entry number from source */
    sourceRowIndex: number;
    /** Raw key-value pairs as extracted */
    rawFields: Record<string, string | number | null>;
    /** Source file reference */
    sourceFile: string;
    /** Decontamination status */
    status: DecontaminationStatus;
    /** Issues found during processing */
    issues: DecontaminationIssue[];
    /** Normalized output (if decontaminated successfully) */
    normalizedOutput?: NormalizedLegacyRecord;
}

export type DecontaminationStatus =
    | 'RAW'              // Just ingested, not processed
    | 'PARSED'           // Successfully parsed from source format
    | 'DEDUPLICATED'     // Duplicate check passed
    | 'VALIDATED'        // Fiscal validation passed
    | 'ENRICHED'         // Missing categories/relations added
    | 'READY'            // Ready for injection into Archive
    | 'REJECTED'         // Permanently rejected (unfixable)
    | 'NEEDS_REVIEW';    // Requires human decision

export interface DecontaminationIssue {
    stage: 'PARSE' | 'DEDUP' | 'VALIDATE' | 'ENRICH';
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';
    code: string;
    message: string;
    field?: string;
    suggestedFix?: string;
}

export interface NormalizedLegacyRecord {
    /** Target entity type in Restaurant OS */
    entityType: 'product' | 'ingredient' | 'supplier' | 'transaction' | 'employee' | 'customer';
    /** Normalized key-value pairs */
    fields: Record<string, string | number | boolean>;
    /** Confidence of the normalization (0-1) */
    confidence: number;
    /** Mapping source: which legacy field became which OS field */
    fieldMapping: Record<string, string>;
}

// ============================================
// DUPLICATE DETECTION
// ============================================

export interface DuplicateCandidate {
    /** ID of the potentially duplicate document */
    documentId: string;
    /** ID of the existing document it matches */
    matchedWithId: string;
    /** Similarity score (0-1) using fuzzy matching */
    similarityScore: number;
    /** Fields that matched */
    matchedFields: string[];
    /** Resolution */
    resolution: 'MERGED' | 'KEPT_BOTH' | 'DISCARDED' | 'PENDING';
}

// ============================================
// FISCAL VALIDATION
// ============================================

export interface FiscalValidationResult {
    documentId: string;
    /** Is the VAT calculation correct? */
    vatValid: boolean;
    /** Do the line totals match the grand total? */
    totalsBalanced: boolean;
    /** Are required fiscal fields present? */
    requiredFieldsPresent: boolean;
    /** Specific issues */
    issues: FiscalIssue[];
}

export interface FiscalIssue {
    type: 'VAT_MISMATCH' | 'TOTAL_IMBALANCE' | 'MISSING_FIELD' | 'DATE_ANOMALY' | 'NEGATIVE_AMOUNT';
    description: string;
    expectedValue?: string | number;
    actualValue?: string | number;
    /** Can this be auto-corrected? */
    autoFixable: boolean;
}

// ============================================
// MIGRATION REPORT
// ============================================

export interface MigrationReport {
    sessionId: string;
    tenantId: string;
    sourceSystem: LegacySourceSystem;
    integrationMode: IntegrationMode;
    genesisDate: string;

    /** Timing */
    startedAt: string;
    completedAt: string;
    durationMs: number;

    /** Statistics */
    stats: {
        totalDocumentsIngested: number;
        successfullyNormalized: number;
        duplicatesFound: number;
        duplicatesMerged: number;
        fiscalIssuesFound: number;
        fiscalIssuesAutoFixed: number;
        rejectedDocuments: number;
        needsReviewDocuments: number;
    };

    /** Opening balances extracted for the Écriture d'Ouverture */
    openingBalances: OpeningBalance[];

    /** Category breakdown */
    entityBreakdown: Record<string, number>;

    /** Top issues for the client to review */
    topIssues: DecontaminationIssue[];

    /** Human-readable summary */
    summary: string;
}

// ============================================
// OPENING ENTRY (Écriture d'Ouverture)
// ============================================

export interface OpeningBalance {
    /** Account code in the Plan Comptable */
    accountCode: string;
    accountName: string;
    /** Balance in cents */
    balanceInCents: number;
    /** Debit or Credit side */
    side: 'debit' | 'credit';
    /** Source of this balance */
    source: 'legacy_import' | 'manual_input' | 'bank_statement';
}

export interface OpeningEntry {
    /** Unique sealed entry ID */
    id: string;
    /** The Genesis Date — all opening balances as of this date */
    asOfDate: string;
    /** Opening balance lines */
    lines: OpeningBalance[];
    /** Total debits must equal total credits */
    totalDebitInCents: number;
    totalCreditInCents: number;
    isBalanced: boolean;
    /** NF525 seal for immutability */
    fiscalSealHash: string;
    /** Migration session reference */
    migrationSessionId: string;
    /** Sealed timestamp */
    sealedAt: string;
    /** Sealed by (system or user) */
    sealedBy: string;
}

// ============================================
// LEGACY ARCHIVE (Read-Only)
// ============================================

export interface LegacyArchiveEntry {
    id: string;
    /** Original source system */
    sourceSystem: LegacySourceSystem;
    /** Original date of the record */
    originalDate: string;
    /** Entity type in normalized form */
    entityType: string;
    /** Normalized and safe data (PII stripped) */
    data: Record<string, string | number | boolean>;
    /** Is this entry accessible to the LightRAG for graph enrichment? */
    ragIndexable: boolean;
    /** Import session reference */
    migrationSessionId: string;
    /** Archived timestamp */
    archivedAt: string;
}
