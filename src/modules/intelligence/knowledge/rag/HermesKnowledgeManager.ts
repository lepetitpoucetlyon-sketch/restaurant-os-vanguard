/**
 * 🧠 HermesKnowledgeManager — Sovereign RAG Orchestrator
 * Grade X Intelligence Layer
 *
 * This is the brain of each Vassal instance. It delegates all heavy RAG
 * operations to the Sovereign RAG sidecar via REST API, and handles:
 *
 * 1. Proxying queries to Sovereign RAG (with RBAC role filtering)
 * 2. Indexing tenant data (products, recipes, suppliers, etc.)
 * 3. Emitting Sanitized Pulses to the MCC via PulseSanitizer
 * 4. Ingesting legacy data through the Air-lock pipeline
 *
 * ISOLATION: All operations are scoped to the tenant via workspace_id.
 * RBAC: role is passed on every query — Sovereign RAG veto membrane
 *       restricts document access to the caller's permission level.
 *
 * Architecture:
 *   HermesKnowledgeManager → SovereignRAGClient → HTTP → Sovereign RAG (Python)
 *
 * Copyright © 2026 Mohammed-ali Boudjaadar. Tous droits réservés.
 */

import { logger } from '@/lib/logger';
import { NexusTelemetryService } from '@nexus/telemetry/NexusTelemetryService';
import { AuditPulseType } from '@nexus/telemetry/types';
import { PulseSanitizer } from './PulseSanitizer';
import * as RAGClient from './SovereignRAGClient';
import type { RAGHealthResult } from './SovereignRAGClient';
import type { PermissionRole } from '@nexus/contracts/permissions.types';
import type { LightRAGQueryMode, LightRAGConfig } from './LightRAGConfig';
import { documentToText, resolveQueryMode, hashTenantId } from './subservices/documentHelpers';
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
    private sanitizer: PulseSanitizer;
    private pulseConsentEnabled: boolean;
    private lastPulseTimestamps: Map<PulseCategory, number>;

    constructor(
        private readonly tenantId: string,
        private readonly pulseContext: PulseContext,
        _lightragConfig?: Partial<LightRAGConfig>
    ) {
        this.sanitizer = new PulseSanitizer();
        this.pulseConsentEnabled = false;
        this.lastPulseTimestamps = new Map();
        logger.info(`[HermesKnowledge] Initialized for tenant: ${tenantId}`);
    }

    // ============================================
    // HEALTH — Check Sovereign RAG availability
    // ============================================

    async isReady(): Promise<boolean> {
        const health = await RAGClient.sovereignHealth();
        return health.status === 'online';
    }

    async getHealth(): Promise<RAGHealthResult> {
        return RAGClient.sovereignHealth();
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
                const text = this.documentToText(collectionType, doc);
                if (!text) { failed++; continue; }

                const fileName = `${collectionType}_${doc.id ?? Date.now()}.txt`;
                    await RAGClient.sovereignIngest({
                    workspaceId: this.tenantId,
                    fileName,
                    fileContent: new Blob([text], { type: 'text/plain' }),
                    mimeType: 'text/plain',
                });
                indexed++;

            } catch (error) {
                logger.error(`[HermesKnowledge] Failed to index ${collectionType} document: ${error}`);
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

    async indexText(text: string, id?: string): Promise<boolean> {
        try {
            await RAGClient.sovereignIngest({
                workspaceId: this.tenantId,
                fileName: `text_${id ?? Date.now()}.txt`,
                fileContent: new Blob([text], { type: 'text/plain' }),
                mimeType: 'text/plain',
            });
            return true;
        } catch (error) {
            logger.error(`[HermesKnowledge] Failed to index text: ${error}`);
            return false;
        }
    }

    async indexMedia(
        fileBlob: Blob,
        metadata: { fileName: string; type: 'pdf' | 'image'; category: KnowledgeEntityType; id?: string }
    ): Promise<boolean> {
        const startTime = Date.now();

        try {
            logger.info(`[HermesKnowledge] Starting media ingestion for ${metadata.fileName} [${metadata.type}]`);
            await RAGClient.sovereignIngest({
                workspaceId: this.tenantId,
                fileName: metadata.fileName,
                fileContent: fileBlob,
                mimeType: metadata.type === 'pdf' ? 'application/pdf' : 'image/jpeg',
            });

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
     * 🔍 Answers a question via Sovereign RAG with RBAC filtering.
     * The role parameter restricts which documents the veto membrane allows.
     */
    async query(query: KnowledgeQuery, role: PermissionRole = 'serveur'): Promise<KnowledgeAnswer> {
        const startTime = Date.now();

        try {
            const response = await RAGClient.sovereignQuery(query.question, {
                workspaceId: this.tenantId,
                role,
            });

            await NexusTelemetryService.emit({
                pulse: AuditPulseType.KNOWLEDGE_QUERY,
                vassalId: this.tenantId,
                actorId: 'hermes',
                payload: {
                    action: 'query',
                    questionLength: query.question.length,
                    responseLength: response.answer.length,
                    durationMs: Date.now() - startTime,
                },
                severity: 'INFO',
                timestamp: new Date().toISOString(),
            });

            return {
                answer: response.answer,
                confidence: response.vetoed ? 0 : 0.85,
                traversedEntities: [],
                traversedRelations: [],
                sources: response.sources?.map(s => s.title) ?? [],
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

    /** Retrieves raw context (no LLM) for prompt injection. */
    async getContext(question: string, role: PermissionRole = 'serveur'): Promise<string> {
        const result = await RAGClient.sovereignQuery(question, {
            workspaceId: this.tenantId,
            role,
            skipMacroRouting: true,
        });
        return result.answer;
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

    private documentToText(type: KnowledgeEntityType, doc: Record<string, unknown>): string | null {
        return documentToText(type, doc);
    }

    private resolveQueryMode(query: KnowledgeQuery): LightRAGQueryMode {
        return resolveQueryMode(query);
    }

    private async hashTenantId(tenantId: string): Promise<string> {
        return hashTenantId(tenantId);
    }
}
