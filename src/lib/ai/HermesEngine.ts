import { AgentEngine } from './AgentEngine';
import { AgentDomain, AgentRole } from '@/domain/agency/types';
import { 
    VanguardAgentConfig, 
    HermesPulseResult, 
    HermesAnomaly, 
    HermesManifest 
} from '@/domain/agency/hermes.types';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FiscalHACCPBridge } from '@/modules/finance/services/FiscalHACCPBridge';

/**
 * 📡 HermesEngine - Grade X Autonomous Orchestrator
 * Coordinates the Vanguard Agents and enforces business sovereignty.
 * DNA: "Fast, Reliable, Sovereign".
 */
export class HermesEngine {
    private static manifest: HermesManifest = {
        version: "1.0.0-hermes",
        lastPulse: null,
        currentFocus: 'synthesis',
        activeAgents: [
            {
                id: 'atlas',
                domain: 'general',
                role: 'admin',
                priority: 1,
                description: 'The Suture Agent - Technical Debt & Consistency.'
            },
            {
                id: 'themis',
                domain: 'accounting',
                role: 'admin',
                priority: 2,
                description: 'The Compliance Agent - Fiscal & HACCP Integrity.'
            },
            {
                id: 'cronos',
                domain: 'sales',
                role: 'manager',
                priority: 3,
                description: 'The Operations Agent - Yield & Performance.'
            }
        ]
    };

    /**
     * 🌀 Pulsate
     * The heartbeat of the autonomous system.
     * Checks for domain anomalies and triggers cross-domain bridges.
     */
    static async pulse(tenantId: string): Promise<HermesPulseResult> {
        logger.info(`📡 [HERMES] Heartbeat Pulse for Tenant: ${tenantId}`);
        
        const startTime = Date.now();
        const anomalies: HermesAnomaly[] = [];
        const actionsTaken: string[] = [];

        // 1. SCAN: HACCP -> Finance Anomaly Detection
        // Here we simulate an autonomous bridge trigger if temperature rises
        try {
            const haccpResults = await Nexus.adapter.query('haccp_readings', {
                where: [
                    { field: 'tenantId', operator: '==', value: tenantId },
                    { field: 'isAnomaly', operator: '==', value: true },
                    { field: 'processed', operator: '==', value: false }
                ],
                limit: 5
            });

            if (haccpResults.length > 0) {
                logger.warn(`🔥 [HERMES] Detected ${haccpResults.length} unprocessed HACCP anomalies.`);
                
                for (const reading of haccpResults) {
                    anomalies.push({
                        id: `ANOMALY_${reading.id}`,
                        domain: 'haccp',
                        severity: 'critical',
                        message: `Critical temperature reached: ${reading.value}${reading.unit} for ${reading.name}`,
                        detectedAt: reading.timestamp
                    });

                    // Auto-Trigger Bridge: Themis Agent Intervention
                    await FiscalHACCPBridge.processCriticalWaste(reading as import('@/types').SensorReading, [], tenantId);
                    actionsTaken.push(`[THEMIS] Provisioned fiscal loss for sensor ${reading.sensorId}`);
                    
                    // Mark as processed in Nexus
                    await Nexus.adapter.update(`haccp_readings`, reading.id, { processed: true });
                }
            }
        } catch (err) {
            logger.error('[HERMES] Pulse Scan (HACCP) failed:', err);
        }

        // 2. SCAN: Accounting Unmatched Invoices
        try {
            const unmatchedInvoices = await Nexus.adapter.query('accounting_invoices', {
                where: [
                    { field: 'tenantId', operator: '==', value: tenantId },
                    { field: 'status', operator: '==', value: 'unmatched' }
                ],
                limit: 3
            });

            if (unmatchedInvoices.length > 0) {
                anomalies.push({
                    id: 'ACC_PENDING_INVOICES',
                    domain: 'accounting',
                    severity: 'medium',
                    message: `Detected ${unmatchedInvoices.length} invoices awaiting matching. High impact on cash-flow precision.`,
                    detectedAt: new Date().toISOString()
                });
            }
        } catch (err) {
            // Log & proceed
        }

        this.manifest.lastPulse = new Date().toISOString();
        
        const duration = Date.now() - startTime;
        logger.info(`✅ [HERMES] Pulse cycle completed in ${duration}ms. ${anomalies.length} issues found.`);

        return {
            timestamp: this.manifest.lastPulse,
            anomalies,
            actionsTaken,
            insights: [] // To be populated by AgentEngine query if needed
        };
    }

    /**
     * 📜 Get Manifest
     */
    static getManifest(): HermesManifest {
        return this.manifest;
    }

    /**
     * 🔱 Delegate
     * Routes a specific problem to the correct Vanguard Agent.
     */
    static async delegate(domain: AgentDomain, prompt: string, context?: import('@/shared/nexus-contract').SovereignValue): Promise<import('@/domain/agency/types').AgentResponse> {

        const agent = this.manifest.activeAgents.find(a => a.domain === domain) || this.manifest.activeAgents[0];
        
        logger.info(`🤝 [HERMES] Delegating to Vanguard Agent: ${agent.id.toUpperCase()} (${domain})`);
        
        return AgentEngine.query({
            domain: agent.domain,
            userRole: agent.role,
            userPrompt: prompt,
            contextData: context,
            apiKey: process.env.VITE_GEMINI_API_KEY || 'NEXUS_INTERNAL',
            endpoint: 'https://generativelanguage.googleapis.com', // Base URL
            modelId: 'gemini-1.5-pro'
        });
    }
}
