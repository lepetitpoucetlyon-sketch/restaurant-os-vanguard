/**
 * 🧠 HermesKnowledgeManager — LightRAG Orchestrator
 * Grade X Intelligence Layer
 *
 * This is the brain of each Vassal instance. It delegates all heavy KG
 * operations to the LightRAG Server sidecar via REST API, and handles:
 *
 * 1. Proxying queries to LightRAG Server
 * 2. Indexing tenant data (products, recipes, suppliers, etc.)
 * 3. Emitting Sanitized Pulses to the MCC via PulseSanitizer
 * 4. Ingesting legacy data through the Air-lock pipeline
 *
 * ISOLATION: All operations are scoped to the tenant via the workspace
 * parameter sent to LightRAG Server (maps to NexusInterceptor tenantId).
 *
 * Architecture:
 *   HermesKnowledgeManager → LightRAGClient → HTTP → LightRAG Server (Python)
 *
 * Copyright © 2026 Mohammed-ali Boudjaadar. Tous droits réservés.
 */

import { logger } from '@/lib/logger';
import { NexusTelemetryService } from '@/shared/nexus/telemetry/NexusTelemetryService';
import { AuditPulseType } from '@/shared/nexus/telemetry/types';
import { PulseSanitizer } from './PulseSanitizer';
import { LightRAGClient } from './LightRAGClient';

import type { LightRAGQueryMode, LightRAGConfig } from './LightRAGConfig';
import type { LightRAGKnowledgeGraph } from './LightRAGConfig';

import type {
    KnowledgeQuery,
    KnowledgeAnswer,
    KnowledgeEntityType,
    SanitizedPulse,
    PulseCategory,
    PulseContext,
} from './types';

// ============================================
// HERMES KNOWLEDGE MANAGER
// ============================================

export class HermesKnowledgeManager {
    private client: LightRAGClient;
    private sanitizer: PulseSanitizer;
    private pulseConsentEnabled: boolean;
    private lastPulseTimestamps: Map<PulseCategory, number>;

    constructor(
        private readonly tenantId: string,
        private readonly pulseContext: PulseContext,
        lightragConfig?: Partial<LightRAGConfig>
    ) {
        // Initialize the LightRAG REST client with tenant-scoped workspace
        this.client = new LightRAGClient({
            workspace: tenantId,
            ...lightragConfig,
        });

        this.sanitizer = new PulseSanitizer();
        this.pulseConsentEnabled = false; // Opt-in by default
        this.lastPulseTimestamps = new Map();

        logger.info(`[HermesKnowledge] Initialized for tenant: ${tenantId}`);
    }

    // ============================================
    // HEALTH — Check LightRAG Server availability
    // ============================================

    /**
     * 🏥 Checks if the LightRAG Server sidecar is reachable.
     */
    async isReady(): Promise<boolean> {
        return this.client.isAvailable();
    }

    // ============================================
    // INDEXING — Feed data to LightRAG Server
    // ============================================

    /**
     * 📥 Indexes a collection of documents into the Knowledge Graph.
     * LightRAG Server handles chunking, entity extraction, and KG construction.
     *
     * @param collectionType Type of entity being indexed (for labeling)
     * @param documents Raw documents to index
     */
    async indexCollection(
        collectionType: KnowledgeEntityType,
        documents: Array<Record<string, unknown>>
    ): Promise<{ indexed: number; failed: number }> {
        const startTime = Date.now();
        let indexed = 0;
        let failed = 0;

        for (const doc of documents) {
            try {
                // Convert document to indexable text
                const text = this.documentToText(collectionType, doc);
                if (!text) {
                    failed++;
                    continue;
                }

                const docId = `${collectionType}_${doc.id ?? Date.now()}`;
                await this.client.insert(text, docId);
                indexed++;

            } catch (error) {
                logger.error(
                    `[HermesKnowledge] Failed to index ${collectionType} document: ${error}`
                );
                failed++;
            }
        }

        // Telemetry
        await NexusTelemetryService.emit({
            pulse: AuditPulseType.KNOWLEDGE_QUERY,
            vassalId: this.tenantId,
            actorId: 'hermes',
            payload: {
                action: 'index_collection',
                collectionType,
                indexed,
                failed,
                durationMs: Date.now() - startTime,
            },
            severity: failed > 0 ? 'WARNING' : 'INFO',
            timestamp: new Date().toISOString(),
        });

        logger.info(
            `[HermesKnowledge] Indexed ${indexed}/${documents.length} ${collectionType} documents ` +
            `(${failed} failed, ${Date.now() - startTime}ms)`
        );

        return { indexed, failed };
    }

    /**
     * 📥 Indexes a single text blob directly.
     */
    async indexText(text: string, id?: string): Promise<boolean> {
        try {
            await this.client.insert(text, id);
            return true;
        } catch (error) {
            logger.error(`[HermesKnowledge] Failed to index text: ${error}`);
            return false;
        }
    }

    /**
     * 📥 Indexes a multimodal file (PDF, Image, etc.) using RAGAnything extraction.
     * This handles long-running extraction jobs from MinerU/VLM.
     *
     * @param fileBlob The actual file blob
     * @param metadata File metadata
     */
    async indexMedia(
        fileBlob: Blob,
        metadata: { fileName: string; type: 'pdf' | 'image'; category: KnowledgeEntityType; id?: string }
    ): Promise<boolean> {
        const startTime = Date.now();
        const docId = metadata.id ?? `${metadata.category}_media_${Date.now()}`;

        try {
            logger.info(`[HermesKnowledge] Starting media extraction for ${metadata.fileName} [${metadata.type}]`);
            await this.client.insertMedia(fileBlob, metadata.fileName, docId);

            // Emit telemetry for successful extraction
            await NexusTelemetryService.emit({
                pulse: AuditPulseType.KNOWLEDGE_QUERY,
                vassalId: this.tenantId,
                actorId: 'hermes',
                payload: {
                    action: 'index_media',
                    mediaType: metadata.type,
                    category: metadata.category,
                    durationMs: Date.now() - startTime,
                },
                severity: 'INFO',
                timestamp: new Date().toISOString(),
            });

            logger.info(`[HermesKnowledge] Successfully indexed media ${metadata.fileName} in ${Date.now() - startTime}ms`);
            return true;
        } catch (error) {
            logger.error(`[HermesKnowledge] Failed to index media ${metadata.fileName}: ${error}`);

            // Emit telemetry for failure
            await NexusTelemetryService.emit({
                pulse: AuditPulseType.KNOWLEDGE_QUERY,
                vassalId: this.tenantId,
                actorId: 'hermes',
                payload: {
                    action: 'index_media',
                    mediaType: metadata.type,
                    category: metadata.category,
                    failed: true,
                    durationMs: Date.now() - startTime,
                },
                severity: 'WARNING',
                timestamp: new Date().toISOString(),
            });

            return false;
        }
    }

    // ============================================
    // QUERYING — Ask questions via LightRAG Server
    // ============================================

    /**
     * 🔍 Answers a natural language question using the Knowledge Graph.
     * Delegates to LightRAG Server's hybrid KG + vector retrieval.
     */
    async query(query: KnowledgeQuery): Promise<KnowledgeAnswer> {
        const startTime = Date.now();

        // Map our query mode to LightRAG modes
        const mode: LightRAGQueryMode = this.resolveQueryMode(query);

        try {
            const response = await this.client.query(query.question, mode, {
                topK: query.maxDepth ? query.maxDepth * 20 : undefined,
            });

            // Telemetry
            await NexusTelemetryService.emit({
                pulse: AuditPulseType.KNOWLEDGE_QUERY,
                vassalId: this.tenantId,
                actorId: 'hermes',
                payload: {
                    action: 'query',
                    questionLength: query.question.length,
                    mode,
                    responseLength: response.response.length,
                    durationMs: Date.now() - startTime,
                },
                severity: 'INFO',
                timestamp: new Date().toISOString(),
            });

            return {
                answer: response.response,
                confidence: 0.85, // LightRAG doesn't return confidence, use default
                traversedEntities: [],
                traversedRelations: [],
                sources: [],
            };

        } catch (error) {
            logger.error(`[HermesKnowledge] Query failed: ${error}`);

            return {
                answer: 'Le service d\'intelligence est temporairement indisponible. Veuillez réessayer.',
                confidence: 0,
                traversedEntities: [],
                traversedRelations: [],
                sources: [],
            };
        }
    }

    /**
     * 📋 Retrieves raw context from the KG without LLM generation.
     * Useful for feeding into our own prompts.
     */
    async getContext(question: string, mode: LightRAGQueryMode = 'mix'): Promise<string> {
        return this.client.getContext(question, mode);
    }

    // ============================================
    // KNOWLEDGE GRAPH — Exploration
    // ============================================

    /**
     * 🕸️ Retrieves a subgraph for visualization.
     */
    async getGraph(
        label: string = '*',
        maxDepth: number = 3,
        maxNodes: number = 500
    ): Promise<LightRAGKnowledgeGraph> {
        return this.client.getKnowledgeGraph(label, maxDepth, maxNodes);
    }

    /**
     * 🏷️ Gets the most connected entities for dashboard display.
     */
    async getTopEntities(limit: number = 20): Promise<string[]> {
        return this.client.getPopularLabels(limit);
    }

    /**
     * 🔎 Searches entities by name (for autocomplete).
     */
    async searchEntities(query: string, limit: number = 10): Promise<string[]> {
        return this.client.searchLabels(query, limit);
    }

    // ============================================
    // DOCUMENTS — Manage indexed content
    // ============================================

    /**
     * 📄 Gets the status of all indexed documents.
     */
    async getDocumentStatuses() {
        return this.client.getDocuments();
    }

    /**
     * 🗑️ Removes a document and regenerates affected KG portions.
     */
    async removeDocument(documentId: string) {
        return this.client.deleteDocument(documentId);
    }

    // ============================================
    // PULSE EMISSION — Sanitized Data to MCC
    // ============================================

    /**
     * 📡 Emits a sanitized pulse to the MCC.
     * Only works if the tenant has opted-in to pulse sharing.
     */
    async emitPulse(
        rawData: Record<string, unknown>,
        category: PulseCategory
    ): Promise<SanitizedPulse | null> {
        // 1. Consent gate
        if (!this.pulseConsentEnabled) {
            logger.info(`[HermesKnowledge] Pulse emission blocked: consent not granted for ${this.tenantId}`);
            return null;
        }

        // 2. Schedule gate
        const lastEmitted = this.lastPulseTimestamps.get(category);
        if (!this.sanitizer.canEmit(category, lastEmitted)) {
            logger.info(`[HermesKnowledge] Pulse throttled: ${category} — too soon since last emission`);
            return null;
        }

        // 3. Build the sanitized pulse
        const tenantHash = await this.hashTenantId(this.tenantId);
        const pulse = this.sanitizer.buildPulse(rawData, category, tenantHash, this.pulseContext);

        // 4. Final validation — HARD GATE
        const validation = this.sanitizer.validatePulse(pulse);
        if (!validation.valid) {
            logger.error(
                `[HermesKnowledge] PULSE BLOCKED — PII detected in final validation:\n` +
                validation.violations.join('\n')
            );

            await NexusTelemetryService.emit({
                pulse: AuditPulseType.PULSE_BLOCKED,
                vassalId: this.tenantId,
                actorId: 'hermes',
                payload: { category, violations: validation.violations },
                severity: 'CRITICAL',
                timestamp: new Date().toISOString(),
            });

            return null;
        }

        // 5. Log PII detections
        const detections = this.sanitizer.getDetections();
        if (detections.length > 0) {
            await NexusTelemetryService.emit({
                pulse: AuditPulseType.PII_DETECTED,
                vassalId: this.tenantId,
                actorId: 'hermes',
                payload: {
                    category,
                    detectionCount: detections.length,
                    categories: [...new Set(detections.map(d => d.category))],
                },
                severity: 'WARNING',
                timestamp: new Date().toISOString(),
            });
        }

        // 6. Record emission
        this.lastPulseTimestamps.set(category, Date.now());

        await NexusTelemetryService.emit({
            pulse: AuditPulseType.PULSE_EMITTED,
            vassalId: this.tenantId,
            actorId: 'hermes',
            payload: {
                pulseId: pulse.pulseId,
                category,
                metricsCount: Object.keys(pulse.payload.metrics).length,
                tagsCount: Object.keys(pulse.payload.tags).length,
                trendsCount: Object.keys(pulse.payload.trends).length,
            },
            severity: 'INFO',
            timestamp: new Date().toISOString(),
        });

        logger.info(`[HermesKnowledge] Pulse emitted: ${pulse.pulseId} [${category}]`);
        return pulse;
    }

    /**
     * Enables or disables pulse consent for this tenant.
     */
    setPulseConsent(enabled: boolean): void {
        this.pulseConsentEnabled = enabled;
        logger.info(`[HermesKnowledge] Pulse consent ${enabled ? 'GRANTED' : 'REVOKED'} for ${this.tenantId}`);
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    /**
     * Converts a structured document into indexable text for LightRAG.
     */
    private documentToText(
        type: KnowledgeEntityType,
        doc: Record<string, unknown>
    ): string | null {
        const id = doc.id as string;
        if (!id) return null;

        const name = (doc.name ?? doc.label ?? doc.description ?? id) as string;
        const parts: string[] = [`[${type.toUpperCase()}] ${name}`];

        // Extract meaningful fields
        const textFields = [
            'description', 'category', 'type', 'status',
            'notes', 'instructions', 'tags',
        ];

        for (const field of textFields) {
            const value = doc[field];
            if (value && typeof value === 'string') {
                parts.push(`${field}: ${value}`);
            }
        }

        // Numeric fields with labels
        const numericFields = [
            'priceInCents', 'costInCents', 'quantity', 'weight',
        ];

        for (const field of numericFields) {
            const value = doc[field];
            if (typeof value === 'number') {
                parts.push(`${field}: ${value}`);
            }
        }

        // Recipe ingredients
        const ingredients = doc.ingredients as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(ingredients)) {
            const ingredientText = ingredients
                .map(ing => `${ing.name ?? ing.ingredientId} (${ing.quantity ?? ''} ${ing.unit ?? ''})`.trim())
                .join(', ');
            parts.push(`Ingrédients: ${ingredientText}`);
        }

        // Supplier info
        if (doc.supplierName) {
            parts.push(`Fournisseur: ${doc.supplierName}`);
        }

        return parts.join('\n');
    }

    /**
     * Maps our query structure to LightRAG query modes.
     */
    private resolveQueryMode(query: KnowledgeQuery): LightRAGQueryMode {
        // If focusing on specific entity types, use local mode
        if (query.focusTypes && query.focusTypes.length === 1) {
            return 'local';
        }

        // If the question is about relationships between things, use hybrid
        const relationKeywords = ['entre', 'between', 'lien', 'relation', 'comparaison', 'compare'];
        const lower = query.question.toLowerCase();
        if (relationKeywords.some(kw => lower.includes(kw))) {
            return 'hybrid';
        }

        // Default: mix (KG + vector + reranker) — best overall performance
        return 'mix';
    }

    private async hashTenantId(tenantId: string): Promise<string> {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(tenantId + '_sovereign_salt_2026');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        let hash = 0;
        const str = tenantId + '_sovereign_salt_2026';
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `tenant_${Math.abs(hash).toString(16)}`;
    }
}
