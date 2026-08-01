/**
 * ⚙️ LightRAG Configuration
 * Grade X Intelligence Layer
 *
 * Configuration types and defaults for the LightRAG Server sidecar.
 * LightRAG runs as a Python Docker sidecar exposing a REST API.
 * This config controls how the TypeScript client connects to it.
 *
 * Copyright © 2026 Mohammed-ali Boudjaadar. Tous droits réservés.
 */

// ============================================
// CONNECTION CONFIG
// ============================================

export interface LightRAGConfig {
    /** Base URL of the LightRAG Server (e.g., http://localhost:9621) */
    baseUrl: string;

    /** API key for authentication (optional, depends on server config) */
    apiKey?: string;

    /** Workspace name for tenant isolation — maps to NexusInterceptor tenantId */
    workspace: string;

    /** Request timeout in milliseconds */
    timeoutMs: number;

    /** Maximum retries on transient failures */
    maxRetries: number;

    /** Delay between retries in milliseconds */
    retryDelayMs: number;
}

export const DEFAULT_LIGHTRAG_CONFIG: LightRAGConfig = {
    // Server URL is environment-driven so the same build runs in dev (localhost),
    // docker-compose (http://lightrag:9621) and prod without code changes.
    baseUrl:
        (typeof process !== 'undefined' && process.env?.LIGHTRAG_SERVER_URL) ||
        'http://localhost:9621',
    workspace: '',
    timeoutMs: 30_000,
    maxRetries: 3,
    retryDelayMs: 1_000,
};

// ============================================
// QUERY MODES
// ============================================

/**
 * LightRAG query modes as defined in the server API.
 *
 * - `local`:  Focus on entity neighbours (best for "what is X?")
 * - `global`: Focus on relations (best for "how are X and Y related?")
 * - `hybrid`: Combines local + global
 * - `naive`:  Plain vector search on chunks (classic RAG fallback)
 * - `mix`:    KG + vector + reranker — RECOMMENDED for production
 * - `bypass`: Skip retrieval, send directly to LLM
 */
export type LightRAGQueryMode = 'local' | 'global' | 'hybrid' | 'naive' | 'mix' | 'bypass';

// ============================================
// API REQUEST / RESPONSE TYPES
// ============================================

export interface LightRAGQueryRequest {
    query: string;
    mode?: LightRAGQueryMode;
    /** Only return the retrieved context, not the LLM-generated answer */
    only_need_context?: boolean;
    /** Streaming response */
    stream?: boolean;
    /** Number of top entities/relations to retrieve */
    top_k?: number;
    /** Conversation history for multi-turn context */
    conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface LightRAGQueryResponse {
    response: string;
    /** Retrieved context (only present if only_need_context is true) */
    context?: string;
}

export interface LightRAGInsertRequest {
    /** Text content to index */
    text: string;
    /** Optional document ID for tracking */
    id?: string;
}

export interface LightRAGInsertResponse {
    status: string;
    message: string;
    document_count?: number;
}

export interface LightRAGDocumentStatus {
    id: string;
    status: 'pending' | 'processing' | 'preprocessed' | 'processed' | 'failed';
    content_summary: string;
    content_length: number;
    file_path: string;
    chunks_count: number | null;
    created_at: string;
    updated_at: string;
    error_msg: string | null;
}

export interface LightRAGHealthResponse {
    status: 'healthy' | 'unhealthy';
    version?: string;
    workspace?: string;
    storage_status?: string;
}

export interface LightRAGGraphNode {
    id: string;
    label: string;
    entity_type?: string;
    description?: string;
    source_id?: string;
}

export interface LightRAGGraphEdge {
    source: string;
    target: string;
    description?: string;
    keywords?: string;
    weight?: number;
}

export interface LightRAGKnowledgeGraph {
    nodes: LightRAGGraphNode[];
    edges: LightRAGGraphEdge[];
    is_truncated: boolean;
}

// ============================================
// ERROR TYPES
// ============================================

export class LightRAGError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly endpoint: string,
        public readonly retryable: boolean
    ) {
        super(`[LightRAG] ${endpoint}: ${message} (HTTP ${statusCode})`);
        this.name = 'LightRAGError';
    }
}

export class LightRAGUnavailableError extends LightRAGError {
    constructor(endpoint: string) {
        super('LightRAG Server is unavailable', 503, endpoint, true);
        this.name = 'LightRAGUnavailableError';
    }
}

export class LightRAGTimeoutError extends LightRAGError {
    constructor(endpoint: string, timeoutMs: number) {
        super(`Request timed out after ${timeoutMs}ms`, 408, endpoint, true);
        this.name = 'LightRAGTimeoutError';
    }
}
