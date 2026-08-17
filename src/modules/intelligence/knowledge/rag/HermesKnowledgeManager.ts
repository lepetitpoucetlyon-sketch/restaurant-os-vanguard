/**
 * 🧠 HermesKnowledgeManager — Sovereign RAG Orchestrator
 * Grade X Intelligence Layer
 *
 * This is the brain of each Vassal instance. It delegates all heavy RAG
 * operations to the Sovereign RAG sidecar via REST API.
 *
 * Copyright © 2026 Mohammed-ali Boudjaadar. Tous droits réservés.
 */

import { logger } from '@/lib/logger';
import { NexusTelemetryService } from '@/shared/nexus/telemetry/NexusTelemetryService';
import { AuditPulseType } from '@/shared/nexus/telemetry/types';
import { sovereignQuery, sovereignHealth } from './SovereignRAGClient';
import type { RAGHealthResult } from './SovereignRAGClient';
import type { PermissionRole } from '@/shared/nexus/contracts/permissions.types';
import type { LightRAGConfig } from './LightRAGConfig';
import { KnowledgeIndexer } from './knowledge-manager/KnowledgeIndexer';
import { PulseEmitter } from './knowledge-manager/PulseEmitter';

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
    private indexer: KnowledgeIndexer;
    private pulseEmitter: PulseEmitter;

    constructor(
        private readonly tenantId: string,
        pulseContext: PulseContext,
        _lightragConfig?: Partial<LightRAGConfig>
    ) {
        this.indexer = new KnowledgeIndexer(tenantId);
        this.pulseEmitter = new PulseEmitter(tenantId, pulseContext);
        logger.info(`[HermesKnowledge] Initialized for tenant: ${tenantId}`);
    }

    // ============================================
    // HEALTH
    // ============================================

    async isReady(): Promise<boolean> {
        const health = await sovereignHealth();
        return health.status === 'online';
    }

    async getHealth(): Promise<RAGHealthResult> {
        return sovereignHealth();
    }

    // ============================================
    // INDEXING
    // ============================================

    async indexCollection(
        collectionType: KnowledgeEntityType,
        documents: Array<Record<string, unknown>>
    ): Promise<{ indexed: number; failed: number }> {
        return this.indexer.indexCollection(collectionType, documents);
    }

    async indexText(text: string, id?: string): Promise<boolean> {
        return this.indexer.indexText(text, id);
    }

    async indexMedia(
        fileBlob: Blob,
        metadata: { fileName: string; type: 'pdf' | 'image'; category: KnowledgeEntityType; id?: string }
    ): Promise<boolean> {
        return this.indexer.indexMedia(fileBlob, metadata);
    }

    // ============================================
    // QUERYING
    // ============================================

    async query(query: KnowledgeQuery, role: PermissionRole = 'serveur'): Promise<KnowledgeAnswer> {
        const startTime = Date.now();

        try {
            const response = await sovereignQuery(query.question, {
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

    async getContext(question: string, role: PermissionRole = 'serveur'): Promise<string> {
        const result = await sovereignQuery(question, {
            workspaceId: this.tenantId,
            role,
            skipMacroRouting: true,
        });
        return result.answer;
    }

    // ============================================
    // PULSE EMISSION
    // ============================================

    async emitPulse(
        rawData: Record<string, unknown>,
        category: PulseCategory
    ): Promise<SanitizedPulse | null> {
        return this.pulseEmitter.emitPulse(rawData, category);
    }

    setPulseConsent(enabled: boolean): void {
        this.pulseEmitter.setPulseConsent(enabled);
    }
}
