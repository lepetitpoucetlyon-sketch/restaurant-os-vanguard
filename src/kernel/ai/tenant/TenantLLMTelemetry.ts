/**
 * TenantLLMTelemetry — Télémétrie dédiée aux appels LLM du scope Tenant.
 *
 * Écrit dans tenants/{tenantId}/telemetry/llm_spend/{YYYY-MM}/{callerModule} via Nexus.
 * Jamais dans un path MCC (isolation stricte R9).
 */

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import type { AITelemetryRecord } from '../core/types';

export class TenantLLMTelemetry {
    static async record(
        tenantId: string,
        entry: Omit<AITelemetryRecord, 'timestamp'>,
    ): Promise<void> {
        const timestamp = new Date().toISOString();
        const monthISO = timestamp.slice(0, 7);
        const sanitizedCaller = entry.callerModule.replace(/[^a-zA-Z0-9_-]/g, '_');
        const path = `tenants/${tenantId}/telemetry/llm_spend/${monthISO}/${sanitizedCaller}`;

        try {
            const existing = await Nexus.adapter.get(path) as Record<string, unknown> | null;

            const prevCalls = (existing?.totalCalls as number) ?? 0;
            const prevInput = (existing?.totalInputTokens as number) ?? 0;
            const prevOutput = (existing?.totalOutputTokens as number) ?? 0;
            const prevLatency = (existing?.totalLatencyMs as number) ?? 0;
            const prevErrors = (existing?.totalErrors as number) ?? 0;

            await Nexus.adapter.set(path, {
                totalCalls: prevCalls + 1,
                totalInputTokens: prevInput + entry.inputTokens,
                totalOutputTokens: prevOutput + entry.outputTokens,
                totalLatencyMs: prevLatency + entry.latencyMs,
                totalErrors: prevErrors + (entry.success ? 0 : 1),
                lastProvider: entry.provider,
                lastModel: entry.model,
                lastCallAt: timestamp,
                lastError: entry.error ?? null,
                updatedAt: timestamp,
            }, { merge: true });
        } catch (err) {
            logger.warn('[TenantLLMTelemetry] Échec écriture télémétrie (non bloquant)', {
                path,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }
}
