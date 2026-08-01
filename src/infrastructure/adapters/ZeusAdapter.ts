import { AgentEngine } from '@/modules/intelligence/ia/ai/AgentEngine';
import { AgentDomain } from '@/modules/intelligence/domain/agency/types';
import {
    ZeusPulseResult,
    ZeusAnomaly,
    ZeusManifest,
} from '@/modules/intelligence/domain/agency/Zeus';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FiscalHACCPMapper } from '@modules/finance';

/**
 * ⚡ ZeusEngine - Grade X Autonomous Orchestrator
 * Coordinates the Vanguard Agents and enforces business sovereignty.
 * DNA: "Fast, Reliable, Sovereign".
 */
export class ZeusEngine {
    private static manifest: ZeusManifest = {
        version: '1.0.0-zeus',
        lastPulse: null,
        currentFocus: 'synthesis',
        activeAgents: [
            {
                id: 'atlas',
                domain: 'general',
                role: 'admin',
                priority: 1,
                description: 'The Suture Agent - Technical Debt & Consistency.',
            },
            {
                id: 'themis',
                domain: 'accounting',
                role: 'admin',
                priority: 2,
                description: 'The Compliance Agent - Fiscal & HACCP Integrity.',
            },
            {
                id: 'cronos',
                domain: 'sales',
                role: 'manager',
                priority: 3,
                description: 'The Operations Agent - Yield & Performance.',
            },
        ],
    };

    /**
     * 🌀 Pulsate
     * The heartbeat of the autonomous system.
     * Checks for domain anomalies and triggers cross-domain bridges.
     */
    static async pulse(tenantId: string): Promise<ZeusPulseResult> {
        logger.info(`⚡ [ZEUS] Heartbeat Pulse for Tenant: ${tenantId}`);

        const startTime = Date.now();
        const anomalies: ZeusAnomaly[] = [];
        const actionsTaken: string[] = [];

        // 1. SCAN: HACCP -> Finance Anomaly Detection
        // Here we simulate an autonomous bridge trigger if temperature rises
        try {
            const haccpPath = Nexus.getTenantPath('haccp_readings', tenantId);
            const haccpResults = await Nexus.adapter.query<
                import('@nexus/contracts').SensorReading
            >(haccpPath, {
                where: [
                    { field: 'isAnomaly', operator: '==', value: true },
                    { field: 'processed', operator: '==', value: false },
                ],
                limit: 5,
            });

            if (haccpResults.length > 0) {
                logger.warn(
                    `🔥 [ZEUS] Detected ${haccpResults.length} unprocessed HACCP anomalies.`,
                );

                for (const reading of haccpResults) {
                    anomalies.push({
                        id: `ANOMALY_${reading.id}`,
                        domain: 'haccp',
                        severity: 'critical',
                        message: `Critical temperature reached: ${reading.value}${reading.unit} for ${reading.name}`,
                        detectedAt:
                            reading.lastUpdated instanceof Date
                                ? reading.lastUpdated.toISOString()
                                : String(reading.lastUpdated),
                    });

                    // Auto-Trigger Mapper: Themis Agent Intervention
                    await FiscalHACCPMapper.processCriticalWaste(reading, [], tenantId);
                    actionsTaken.push(
                        `[THEMIS] Provisioned fiscal loss for sensor ${reading.sensorId || reading.id}`,
                    );

                    // Mark as processed in Nexus
                    await Nexus.adapter.update(`${haccpPath}/${reading.id}`, { processed: true });
                }
            }
        } catch (err) {
            logger.error('[ZEUS] Pulse Scan (HACCP) failed:', err);
        }

        // 2. SCAN: Accounting Unmatched Invoices
        try {
            const accountingPath = Nexus.getTenantPath('accounting_invoices', tenantId);
            const unmatchedInvoices = await Nexus.adapter.query(accountingPath, {
                where: [{ field: 'status', operator: '==', value: 'unmatched' }],
                limit: 3,
            });

            if (unmatchedInvoices.length > 0) {
                anomalies.push({
                    id: 'ACC_PENDING_INVOICES',
                    domain: 'accounting',
                    severity: 'medium',
                    message: `Detected ${unmatchedInvoices.length} invoices awaiting matching. High impact on cash-flow precision.`,
                    detectedAt: new Date().toISOString(),
                });
            }
        } catch (_err) {
            // Log & proceed
        }

        this.manifest.lastPulse = new Date().toISOString();

        const duration = Date.now() - startTime;
        logger.info(
            `✅ [ZEUS] Pulse cycle completed in ${duration}ms. ${anomalies.length} issues found.`,
        );

        return {
            timestamp: this.manifest.lastPulse as string,
            anomalies,
            actionsTaken,
            insights: [], // To be populated by AgentEngine query if needed
        };
    }

    /**
     * 📜 Get Manifest
     */
    static getManifest(): ZeusManifest {
        return this.manifest;
    }

    /**
     * 🔱 Delegate
     * Routes a specific problem to the correct Vanguard Agent.
     */
    static async delegate(
        domain: AgentDomain,
        prompt: string,
        context?: import('@/shared/nexus-contract').SovereignValue,
    ): Promise<import('@/modules/intelligence/domain/agency/types').AgentResponse> {
        const agent =
            this.manifest.activeAgents.find((a) => a.domain === domain) ||
            this.manifest.activeAgents[0];

        logger.info(
            `🤝 [ZEUS] Delegating to Vanguard Agent: ${agent.id.toUpperCase()} (${domain})`,
        );

        return AgentEngine.query({
            domain: agent.domain,
            userRole: agent.role,
            userPrompt: prompt,
            contextData: context,
            apiKey: process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || 'NEXUS_INTERNAL',
            endpoint: process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com',
            modelId: process.env.LLM_MODEL_REASONING || 'gemini-1.5-pro',
        });
    }
}
