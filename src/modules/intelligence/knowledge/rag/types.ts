/**
 * 🛡️ Sanitized Pulse Protocol — Type Contracts
 * Grade X Intelligence Layer
 *
 * These types define the data contracts for the three-layer intelligence architecture:
 * 1. LightRAG Local (Vassal) — Private knowledge graph per tenant
 * 2. Pulse Sanitizer (Douane) — PII stripping & anonymization
 * 3. Market Oracle (MCC) — Aggregated cross-fleet intelligence
 *
 * Copyright © 2026 Mohammed-ali Boudjaadar. Tous droits réservés.
 */

// ============================================
// KNOWLEDGE GRAPH — LOCAL ENTITIES
// ============================================

export type KnowledgeEntityType =
    | 'product'
    | 'ingredient'
    | 'supplier'
    | 'recipe'
    | 'employee'
    | 'journal_entry'
    | 'customer'
    | 'category'
    | 'equipment';

export type KnowledgeRelationType =
    | 'composed_of'    // Product → Ingredient
    | 'supplied_by'    // Ingredient → Supplier
    | 'used_in'        // Ingredient → Recipe
    | 'sold_to'        // Product → Customer
    | 'prepared_by'    // Recipe → Employee
    | 'invoiced_for'   // JournalEntry → Product
    | 'billed_by'      // Supplier → JournalEntry
    | 'belongs_to'     // Product → Category
    | 'maintained_by'  // Equipment → Employee
    | 'price_history'; // Ingredient → PricePoint (temporal)

export interface KnowledgeEntity {
    /** Unique identifier within the tenant-scoped graph */
    id: string;
    type: KnowledgeEntityType;
    /** Human-readable label */
    label: string;
    /** Structured attributes (type-dependent) */
    attributes: Record<string, string | number | boolean>;
    /** Source document or collection path */
    sourceRef: string;
    /** Epoch timestamp of last indexing */
    indexedAt: number;
}

export interface KnowledgeRelation {
    id: string;
    type: KnowledgeRelationType;
    sourceEntityId: string;
    targetEntityId: string;
    /** Strength/confidence of the relation (0-1) */
    weight: number;
    /** Optional temporal context */
    validFrom?: number; // epoch
    validTo?: number;   // epoch
    /** Additional metadata */
    metadata?: Record<string, string | number>;
}

export interface KnowledgeGraph {
    entities: KnowledgeEntity[];
    relations: KnowledgeRelation[];
    /** Tenant this graph belongs to (never crosses boundaries) */
    tenantId: string;
    /** Last full reindex timestamp */
    lastReindexAt: number;
    /** Graph version for incremental updates */
    version: number;
}

// ============================================
// KNOWLEDGE QUERY
// ============================================

export interface KnowledgeQuery {
    /** Natural language question from the user */
    question: string;
    /** Optional entity types to focus the traversal */
    focusTypes?: KnowledgeEntityType[];
    /** Maximum traversal depth (hops) */
    maxDepth?: number;
    /** Time range filter */
    timeRange?: {
        from: number; // epoch
        to: number;   // epoch
    };
}

export interface KnowledgeAnswer {
    /** Natural language response */
    answer: string;
    /** Confidence score (0-1) */
    confidence: number;
    /** Entities traversed to produce this answer */
    traversedEntities: KnowledgeEntity[];
    /** Relations used in reasoning */
    traversedRelations: KnowledgeRelation[];
    /** Source references for auditability */
    sources: string[];
}

// ============================================
// SANITIZED PULSE — CROSS-TENANT PROTOCOL
// ============================================

/**
 * 🛡️ SanitizedPulse — The ONLY format that crosses the Douane.
 * Zero PII. Zero identifying data. Zero individual traceability.
 */
export interface SanitizedPulse {
    /** Unique pulse identifier (UUID, not linked to tenant) */
    pulseId: string;

    /** One-way SHA-256 hash of the tenant ID — cannot be reversed */
    sourceHash: string;

    /** Timestamp rounded to the hour (never minute-level) */
    emittedAt: string; // ISO 8601, rounded to HH:00:00

    /** Pulse category */
    category: PulseCategory;

    /** Sanitized data payload */
    payload: SanitizedPayload;

    /** Anonymized context metadata */
    context: PulseContext;

    /** Integrity hash of the entire pulse (tamper detection) */
    integrityHash: string;
}

export type PulseCategory =
    | 'MARKET_PRICE'       // Supplier price trends
    | 'CATALOG_PERFORMANCE' // Item/dish/service category performance
    | 'LABOR_PATTERN'      // Staffing patterns
    | 'WASTE_TREND'        // Waste/loss trends
    | 'COMPLIANCE_SCORE'   // Aggregated HACCP/NF525 scores
    | 'REVENUE_BAND'       // Revenue banding
    | 'STOCK_SIGNAL';      // Stock shortage/surplus signals

export interface SanitizedPayload {
    /** Numeric metrics (rounded, banded) */
    metrics: Record<string, number>;

    /** Categorical tags (never unique values) */
    tags: Record<string, string>;

    /** Calculated trends (%, delta) */
    trends: Record<string, PulseTrend>;
}

export interface PulseTrend {
    direction: 'up' | 'down' | 'stable';
    magnitudePercent: number;
    periodDays: number;
}

export interface PulseContext {
    /** Geographic region at département level, NEVER city */
    region: string; // e.g. "FR-69" (Rhône), never "Lyon 2ème"

    /** Generic cuisine type */
    businessType: string; // e.g. "french_traditional", "auto_repair", "hair_salon"

    /** Establishment size band */
    sizeBand: 'micro' | 'small' | 'medium' | 'large';

    /** Price range band */
    priceBand: 'budget' | 'mid_range' | 'upscale' | 'premium';
}

// ============================================
// PULSE EMISSION SCHEDULE
// ============================================

export interface PulseScheduleEntry {
    category: PulseCategory;
    /** Cron-like frequency */
    frequency: 'realtime_throttled' | 'daily' | 'weekly' | 'monthly';
    /** Maximum emissions per period */
    maxPerPeriod: number;
    /** Delay after period close (e.g., J+1 for daily) */
    delayHours: number;
}

export const PULSE_SCHEDULE: readonly PulseScheduleEntry[] = [
    { category: 'MARKET_PRICE',     frequency: 'weekly',            maxPerPeriod: 1,  delayHours: 24 },
    { category: 'CATALOG_PERFORMANCE', frequency: 'daily',           maxPerPeriod: 1,  delayHours: 6  },
    { category: 'LABOR_PATTERN',    frequency: 'weekly',            maxPerPeriod: 1,  delayHours: 24 },
    { category: 'WASTE_TREND',      frequency: 'daily',             maxPerPeriod: 1,  delayHours: 6  },
    { category: 'COMPLIANCE_SCORE', frequency: 'monthly',           maxPerPeriod: 1,  delayHours: 48 },
    { category: 'REVENUE_BAND',     frequency: 'daily',             maxPerPeriod: 1,  delayHours: 6  },
    { category: 'STOCK_SIGNAL',     frequency: 'realtime_throttled', maxPerPeriod: 24, delayHours: 0  },
] as const;

// ============================================
// PII DETECTION — BLOCKLIST
// ============================================

export type PIICategory =
    | 'NAME'
    | 'EMAIL'
    | 'PHONE'
    | 'ADDRESS'
    | 'IBAN'
    | 'CARD_NUMBER'
    | 'HEALTH_DATA'    // Allergies, medical conditions — GDPR Article 9
    | 'SSN'            // Numéro de sécurité sociale
    | 'IP_ADDRESS';

export interface PIIDetection {
    field: string;
    category: PIICategory;
    value: string; // The detected PII (for logging only, never transmitted)
    action: 'STRIPPED' | 'BLOCKED' | 'GENERALIZED';
}

// ============================================
// MARKET ORACLE — MCC AGGREGATION
// ============================================

export interface MarketInsight {
    id: string;
    /** Type of market intelligence */
    type: 'price_trend' | 'benchmark' | 'anomaly' | 'opportunity' | 'risk';
    /** Human-readable title */
    title: string;
    /** Detailed description */
    description: string;
    /** Number of distinct sources (vassals) — must be ≥ k for publication */
    sourceCount: number;
    /** k-Anonymity threshold met */
    isPublishable: boolean;
    /** Confidence score (0-1) */
    confidence: number;
    /** Affected regions */
    regions: string[];
    /** Affected business types (cuisine type for F&B, activity type for others) */
    businessTypes: string[];
    /** Monetization tier this insight is available to */
    availableTier: 'TIER_2' | 'TIER_3' | 'INTERNAL_ONLY';
    /** Timestamp of generation */
    generatedAt: string;
}

/** k-Anonymity minimum threshold — no insight published below this */
export const K_ANONYMITY_THRESHOLD = 5;

export type MonetizationTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

export interface TierAccess {
    tier: MonetizationTier;
    name: string;
    description: string;
    features: string[];
}

export const MONETIZATION_TIERS: readonly TierAccess[] = [
    {
        tier: 'TIER_1',
        name: 'Intelligence Locale',
        description: 'LightRAG privé — questions sur VOS données uniquement',
        features: ['knowledge_query', 'legacy_archive', 'migration_report'],
    },
    {
        tier: 'TIER_2',
        name: 'Benchmarking Sectoriel',
        description: 'Comparez-vous anonymement au marché régional',
        features: ['regional_benchmark', 'food_cost_comparison', 'labor_index'],
    },
    {
        tier: 'TIER_3',
        name: 'Market Intelligence',
        description: 'Rapports de tendances pour industriels et investisseurs',
        features: ['market_reports', 'price_forecasting', 'sector_analysis', 'api_access'],
    },
] as const;
