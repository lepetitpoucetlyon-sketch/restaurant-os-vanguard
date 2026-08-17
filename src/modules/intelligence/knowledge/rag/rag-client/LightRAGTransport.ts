/**
 * 🔌 LightRAGTransport — HTTP transport layer with retries & error classification
 */

import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import {
    LightRAGError,
    LightRAGUnavailableError,
    LightRAGTimeoutError,
} from '../LightRAGConfig';
import type { LightRAGConfig } from '../LightRAGConfig';
import { toError } from "@/lib/toError";

export class LightRAGTransport {
    constructor(private config: LightRAGConfig) {}

    public buildHeaders(body: unknown): Record<string, string> {
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json';
        if (this.config.apiKey) headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        if (this.config.workspace) headers['X-Workspace'] = this.config.workspace;
        return headers;
    }

    public classifyFetchError(error: unknown, label: string, timeoutMs: number): Error {
        if (error instanceof DOMException && error.name === 'AbortError') return new LightRAGTimeoutError(label, timeoutMs);
        if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) return new LightRAGUnavailableError(label);
        return error instanceof Error ? error : new Error(toError(error).message);
    }

    public async request<T>(
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
