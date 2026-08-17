/**
 * 🔌 LightRAGClient — TypeScript REST Client for LightRAG Server
 * Grade X Intelligence Layer
 *
 * This client wraps the LightRAG Server REST API, providing a type-safe
 * interface for the TypeScript codebase.
 *
 * Copyright © 2026 Mohammed-ali Boudjaadar. Tous droits réservés.
 */

import { logger } from '@/lib/logger';
import {
    DEFAULT_LIGHTRAG_CONFIG,
} from './LightRAGConfig';

import type {
    LightRAGConfig,
    LightRAGQueryMode,
    LightRAGQueryRequest,
    LightRAGQueryResponse,
    LightRAGInsertRequest,
    LightRAGInsertResponse,
    LightRAGDocumentStatus,
    LightRAGHealthResponse,
    LightRAGKnowledgeGraph,
} from './LightRAGConfig';
import { toError } from "@/lib/toError";
import { LightRAGTransport } from './rag-client/LightRAGTransport';

// ============================================
// LIGHTRAG CLIENT
// ============================================

export class LightRAGClient {
    private config: LightRAGConfig;
    private transport: LightRAGTransport;
    private isHealthy: boolean = false;
    private lastHealthCheck: number = 0;
    private readonly HEALTH_CHECK_INTERVAL_MS = 30_000;

    constructor(config: Partial<LightRAGConfig> & { workspace: string }) {
        this.config = {
            ...DEFAULT_LIGHTRAG_CONFIG,
            ...config,
        };
        this.transport = new LightRAGTransport(this.config);

        logger.info(
            `[LightRAGClient] Initialized for workspace "${this.config.workspace}" ` +
            `→ ${this.config.baseUrl}`
        );
    }

    // ============================================
    // HEALTH CHECK
    // ============================================

    async checkHealth(): Promise<LightRAGHealthResponse> {
        try {
            const response = await this.transport.request<LightRAGHealthResponse>('GET', '/health');
            this.isHealthy = response.status === 'healthy';
            this.lastHealthCheck = Date.now();
            return response;
        } catch {
            this.isHealthy = false;
            this.lastHealthCheck = Date.now();
            return { status: 'unhealthy' };
        }
    }

    async isAvailable(): Promise<boolean> {
        if (Date.now() - this.lastHealthCheck > this.HEALTH_CHECK_INTERVAL_MS) {
            await this.checkHealth();
        }
        return this.isHealthy;
    }

    // ============================================
    // QUERY
    // ============================================

    async query(
        question: string,
        mode: LightRAGQueryMode = 'mix',
        options: {
            onlyContext?: boolean;
            topK?: number;
            conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
        } = {}
    ): Promise<LightRAGQueryResponse> {
        const body: LightRAGQueryRequest = {
            query: question,
            mode,
            only_need_context: options.onlyContext ?? false,
            stream: false,
            top_k: options.topK,
            conversation_history: options.conversationHistory,
        };

        const response = await this.transport.request<LightRAGQueryResponse>(
            'POST',
            '/query',
            body
        );

        logger.info(
            `[LightRAGClient] Query [${mode}]: "${question.substring(0, 60)}..." → ` +
            `${response.response.length} chars`
        );

        return response;
    }

    async getContext(
        question: string,
        mode: LightRAGQueryMode = 'mix'
    ): Promise<string> {
        const response = await this.query(question, mode, { onlyContext: true });
        return response.context ?? response.response;
    }

    // ============================================
    // INSERT
    // ============================================

    async insert(text: string, id?: string): Promise<LightRAGInsertResponse> {
        const body: LightRAGInsertRequest = { text, id };

        const response = await this.transport.request<LightRAGInsertResponse>(
            'POST',
            '/documents/text',
            body,
            60_000
        );

        logger.info(
            `[LightRAGClient] Inserted document ${id ?? '(auto)'}: ${response.status}`
        );

        return response;
    }

    async insertBatch(
        documents: Array<{ text: string; id?: string }>
    ): Promise<LightRAGInsertResponse[]> {
        const results: LightRAGInsertResponse[] = [];

        for (const doc of documents) {
            try {
                const result = await this.insert(doc.text, doc.id);
                results.push(result);
            } catch (error) {
                logger.error(
                    `[LightRAGClient] Failed to insert document ${doc.id ?? '(auto)'}: ${error}`
                );
                results.push({
                    status: 'error',
                    message: toError(error).message,
                });
            }
        }

        logger.info(
            `[LightRAGClient] Batch insert: ${results.filter(r => r.status !== 'error').length}/${documents.length} succeeded`
        );

        return results;
    }

    async insertMedia(
        fileBlob: Blob,
        fileName: string,
        id?: string
    ): Promise<LightRAGInsertResponse> {
        const formData = new FormData();
        formData.append('file', fileBlob, fileName);
        if (id) {
            formData.append('id', id);
        }

        const response = await this.transport.request<LightRAGInsertResponse>(
            'POST',
            '/documents/upload',
            formData,
            300_000
        );

        logger.info(
            `[LightRAGClient] Inserted media ${fileName} (${id ?? 'auto'}): ${response.status}`
        );

        return response;
    }

    // ============================================
    // DOCUMENTS
    // ============================================

    async getDocuments(): Promise<Record<string, LightRAGDocumentStatus>> {
        return this.transport.request<Record<string, LightRAGDocumentStatus>>(
            'GET',
            '/documents'
        );
    }

    async deleteDocument(documentId: string): Promise<{ status: string; message: string }> {
        return this.transport.request<{ status: string; message: string }>(
            'DELETE',
            `/documents/${encodeURIComponent(documentId)}`,
            undefined,
            120_000
        );
    }

    // ============================================
    // KNOWLEDGE GRAPH
    // ============================================

    async getKnowledgeGraph(
        label: string = '*',
        maxDepth: number = 3,
        maxNodes: number = 500
    ): Promise<LightRAGKnowledgeGraph> {
        return this.transport.request<LightRAGKnowledgeGraph>(
            'GET',
            `/graph?label=${encodeURIComponent(label)}&max_depth=${maxDepth}&max_nodes=${maxNodes}`
        );
    }

    async getPopularLabels(limit: number = 50): Promise<string[]> {
        return this.transport.request<string[]>(
            'GET',
            `/graph/labels?limit=${limit}`
        );
    }

    async searchLabels(query: string, limit: number = 20): Promise<string[]> {
        return this.transport.request<string[]>(
            'GET',
            `/graph/labels/search?query=${encodeURIComponent(query)}&limit=${limit}`
        );
    }

    // ============================================
    // STORAGE
    // ============================================

    async dropWorkspace(): Promise<{ status: string; message: string }> {
        logger.warn(`[LightRAGClient] DROPPING workspace "${this.config.workspace}" — ALL DATA WILL BE LOST`);
        return this.transport.request<{ status: string; message: string }>(
            'DELETE',
            '/documents',
            undefined,
            60_000
        );
    }

    // ============================================
    // GETTERS
    // ============================================

    getWorkspace(): string {
        return this.config.workspace;
    }

    getBaseUrl(): string {
        return this.config.baseUrl;
    }
}
