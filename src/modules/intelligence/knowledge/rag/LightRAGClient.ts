/**
 * 🔌 LightRAGClient — TypeScript REST Client for LightRAG Server
 * Grade X Intelligence Layer
 *
 * This client wraps the LightRAG Server REST API, providing a type-safe
 * interface for the TypeScript codebase. LightRAG Server runs as a Python
 * Docker sidecar and handles all KG operations internally.
 *
 * Architecture:
 *   Restaurant OS (TypeScript) → LightRAGClient → HTTP → LightRAG Server (Python)
 *                                                          ├── Neo4j (Graph)
 *                                                          ├── VectorDB (Embeddings)
 *                                                          └── LLM (Gemini/Ollama)
 *
 * Copyright © 2026 Mohammed-ali Boudjaadar. Tous droits réservés.
 */

import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

import {
    DEFAULT_LIGHTRAG_CONFIG,
    LightRAGError,
    LightRAGUnavailableError,
    LightRAGTimeoutError,
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

// ============================================
// LIGHTRAG CLIENT
// ============================================

export class LightRAGClient {
    private config: LightRAGConfig;
    private isHealthy: boolean = false;
    private lastHealthCheck: number = 0;
    private readonly HEALTH_CHECK_INTERVAL_MS = 30_000; // 30 seconds

    constructor(config: Partial<LightRAGConfig> & { workspace: string }) {
        this.config = {
            ...DEFAULT_LIGHTRAG_CONFIG,
            ...config,
        };

        logger.info(
            `[LightRAGClient] Initialized for workspace "${this.config.workspace}" ` +
            `→ ${this.config.baseUrl}`
        );
    }

    // ============================================
    // HEALTH CHECK
    // ============================================

    /**
     * 🏥 Checks if the LightRAG Server is reachable and healthy.
     */
    async checkHealth(): Promise<LightRAGHealthResponse> {
        try {
            const response = await this.request<LightRAGHealthResponse>('GET', '/health');
            this.isHealthy = response.status === 'healthy';
            this.lastHealthCheck = Date.now();
            return response;
        } catch {
            this.isHealthy = false;
            this.lastHealthCheck = Date.now();
            return { status: 'unhealthy' };
        }
    }

    /**
     * Returns cached health status, refreshing if stale.
     */
    async isAvailable(): Promise<boolean> {
        if (Date.now() - this.lastHealthCheck > this.HEALTH_CHECK_INTERVAL_MS) {
            await this.checkHealth();
        }
        return this.isHealthy;
    }

    // ============================================
    // QUERY — Ask questions to the Knowledge Graph
    // ============================================

    /**
     * 🔍 Queries the LightRAG Knowledge Graph.
     *
     * @param question Natural language question
     * @param mode Query mode (default: 'mix' for KG + vector + reranker)
     * @param options Additional query options
     */
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

        const response = await this.request<LightRAGQueryResponse>(
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

    /**
     * 📋 Retrieves only the context (no LLM generation) for a question.
     * Useful for feeding context to our own LLM pipeline.
     */
    async getContext(
        question: string,
        mode: LightRAGQueryMode = 'mix'
    ): Promise<string> {
        const response = await this.query(question, mode, { onlyContext: true });
        return response.context ?? response.response;
    }

    // ============================================
    // INSERT — Index documents into the Knowledge Graph
    // ============================================

    /**
     * 📥 Inserts a single text document into LightRAG for indexing.
     * The server will chunk, extract entities/relations, and build the KG.
     */
    async insert(text: string, id?: string): Promise<LightRAGInsertResponse> {
        const body: LightRAGInsertRequest = { text, id };

        const response = await this.request<LightRAGInsertResponse>(
            'POST',
            '/documents/text',
            body,
            60_000 // Longer timeout for indexing (LLM extraction is slow)
        );

        logger.info(
            `[LightRAGClient] Inserted document ${id ?? '(auto)'}: ${response.status}`
        );

        return response;
    }

    /**
     * 📥 Batch inserts multiple text documents.
     */
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

    /**
     * 📥 Inserts a multimodal file (PDF, Image, etc.) for processing by RAGAnything/MinerU.
     */
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

        const response = await this.request<LightRAGInsertResponse>(
            'POST',
            '/documents/upload',
            formData,
            300_000 // 5 minutes timeout for multimodal extraction
        );

        logger.info(
            `[LightRAGClient] Inserted media ${fileName} (${id ?? 'auto'}): ${response.status}`
        );

        return response;
    }

    // ============================================
    // DOCUMENTS — Manage indexed documents
    // ============================================

    /**
     * 📄 Gets the processing status of all indexed documents.
     */
    async getDocuments(): Promise<Record<string, LightRAGDocumentStatus>> {
        return this.request<Record<string, LightRAGDocumentStatus>>(
            'GET',
            '/documents'
        );
    }

    /**
     * 🗑️ Deletes a document and regenerates the affected KG.
     */
    async deleteDocument(documentId: string): Promise<{ status: string; message: string }> {
        return this.request<{ status: string; message: string }>(
            'DELETE',
            `/documents/${encodeURIComponent(documentId)}`,
            undefined,
            120_000 // KG regeneration can be slow
        );
    }

    // ============================================
    // KNOWLEDGE GRAPH — Direct graph operations
    // ============================================

    /**
     * 🕸️ Retrieves a subgraph centered on a label (entity name).
     */
    async getKnowledgeGraph(
        label: string = '*',
        maxDepth: number = 3,
        maxNodes: number = 500
    ): Promise<LightRAGKnowledgeGraph> {
        return this.request<LightRAGKnowledgeGraph>(
            'GET',
            `/graph?label=${encodeURIComponent(label)}&max_depth=${maxDepth}&max_nodes=${maxNodes}`
        );
    }

    /**
     * 🏷️ Gets the most connected entity labels (for autocomplete, exploration).
     */
    async getPopularLabels(limit: number = 50): Promise<string[]> {
        return this.request<string[]>(
            'GET',
            `/graph/labels?limit=${limit}`
        );
    }

    /**
     * 🔎 Searches entity labels with fuzzy matching.
     */
    async searchLabels(query: string, limit: number = 20): Promise<string[]> {
        return this.request<string[]>(
            'GET',
            `/graph/labels/search?query=${encodeURIComponent(query)}&limit=${limit}`
        );
    }

    // ============================================
    // STORAGE — Manage the workspace
    // ============================================

    /**
     * 🧹 Drops all data in the current workspace. DESTRUCTIVE.
     */
    async dropWorkspace(): Promise<{ status: string; message: string }> {
        logger.warn(`[LightRAGClient] DROPPING workspace "${this.config.workspace}" — ALL DATA WILL BE LOST`);
        return this.request<{ status: string; message: string }>(
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

    // ============================================
    // PRIVATE — HTTP Transport
    // ============================================

    private buildHeaders(body: unknown): Record<string, string> {
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json';
        if (this.config.apiKey) headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        if (this.config.workspace) headers['X-Workspace'] = this.config.workspace;
        return headers;
    }

    private classifyFetchError(error: unknown, label: string, timeoutMs: number): Error {
        if (error instanceof DOMException && error.name === 'AbortError') return new LightRAGTimeoutError(label, timeoutMs);
        if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) return new LightRAGUnavailableError(label);
        return error instanceof Error ? error : new Error(toError(error).message);
    }

    private async request<T>(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        path: string,
        body?: unknown,
        customTimeoutMs?: number
    ): Promise<T> {
        const url = `${this.config.baseUrl}${path}`;
        const timeoutMs = customTimeoutMs ?? this.config.timeoutMs;
        const label = `${method} ${path}`;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                const fetchOptions: RequestInit = {
                    method,
                    headers: this.buildHeaders(body),
                    signal: controller.signal,
                };

                if (body && (method === 'POST' || method === 'PUT')) {
                    fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
                }

                const response = await fetch(url, fetchOptions);
                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorBody = await response.text().catch(() => 'No response body');
                    const retryable = response.status >= 500 || response.status === 429;

                    if (retryable && attempt < this.config.maxRetries) {
                        const delay = this.config.retryDelayMs * Math.pow(2, attempt);
                        logger.warn(`[LightRAGClient] ${label} failed (${response.status}), retrying in ${delay}ms (${attempt + 1}/${this.config.maxRetries})`);
                        await this.sleep(delay);
                        continue;
                    }

                    throw new LightRAGError(errorBody, response.status, label, retryable);
                }

                return await response.json() as T;

            } catch (error) {
                if (error instanceof LightRAGError) throw error;

                lastError = this.classifyFetchError(error, label, timeoutMs);

                if (attempt < this.config.maxRetries) {
                    const delay = this.config.retryDelayMs * Math.pow(2, attempt);
                    logger.warn(`[LightRAGClient] ${label} error: ${lastError.message}, retrying in ${delay}ms (${attempt + 1}/${this.config.maxRetries})`);
                    await this.sleep(delay);
                }
            }
        }

        if (lastError) {
            empireAudit.log({
                module: 'system',
                action: 'LIGHTRAG_RETRY_EXHAUSTED',
                details: { label, error: lastError.message },
                severity: 'critical',
                timestamp: new Date()
            });
        }
        throw lastError ?? new LightRAGUnavailableError(label);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
