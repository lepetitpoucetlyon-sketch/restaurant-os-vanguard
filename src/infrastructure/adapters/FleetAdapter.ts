import { EmpireInstance } from '@domain/types/empire';
import { MacroBrain, FleetInsight } from '@modules/intelligence/services/MacroBrain';
import { logger } from '@/lib/logger';
import type { FiscalSeal } from '@nexus/contracts';

/**
 * 🛰️ NexusFleetEngine (Grade VII)
 * The real-time aggregation bridge for Empire-wide intelligence.
 * This engine synchronizes all individual node metrics into the Strategic Oracle.
 */

export class NexusFleetEngine {
    private static instance: NexusFleetEngine;
    private _lastAggregation: Date | null = null;
    private _isSyncing = false;

    private constructor() {}

    public static getInstance(): NexusFleetEngine {
        if (!NexusFleetEngine.instance) {
            NexusFleetEngine.instance = new NexusFleetEngine();
        }
        return NexusFleetEngine.instance;
    }

    /**
     * 👑 AGGREGATE FLEET REALITY
     * Fetches real-time telemetry from Firestore and generates strategic insights.
     */
    public async updateFleetIntelligence(instances: EmpireInstance[]): Promise<{
        metrics: import('@modules/intelligence/services/MacroBrain').ConsolidatedMetrics | null;
        insights: FleetInsight[];
    }> {
        if (this._isSyncing) return { metrics: null, insights: [] };
        this._isSyncing = true;

        try {
            logger.info(`[NexusFleetEngine] Bridging ${instances.length} nodes to MacroBrain...`);

            // 1. Generate Strategic Insights via MacroBrain
            const insights = MacroBrain.analyzeFleet(instances);

            // 2. Calculate Real Deep-Metrics (Labor, Food, Waste)
            // In a real production setup, these would be derived from Cross-Tenant BigQuery or Spark jobs.
            // Here we provide the high-fidelity aggregation logic.
            const metrics = MacroBrain.getConsolidatedMetrics(instances);

            this._lastAggregation = new Date();
            
            return {
                metrics,
                insights
            };

        } catch (error) {
            logger.error('[NexusFleetEngine] Intelligence Bridge Failure', error);
            return { metrics: null, insights: [] };
        } finally {
            this._isSyncing = false;
        }
    }

    /**
     * 🛡️ AUDIT COMPLIANCE BRIDGE
     * Triggers a cross-fleet check of NF525 ledger integrity.
     */
    public async verifyFleetCompliance(tenantIds: string[]): Promise<{
        verified: boolean;
        results: Array<{ tenantId: string; chainValid: boolean; lastSealAt: string | null }>;
    }> {
        logger.info(`[NexusFleetEngine] Running cross-ledger verification for ${tenantIds.length} tenants...`);

        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        const { FiscalEngine } = await import('@/infrastructure/adapters/FiscalAdapter');


        const results = [];
        let allVerified = true;

        for (const tenantId of tenantIds) {
            try {
                // Fetch the seals for the tenant
                const seals = await Nexus.adapter.query(
                    `tenants/${tenantId}/fiscalSeals`,
                    { orderBy: { field: 'timestamp', direction: 'asc' } }
                ) as FiscalSeal[];

                if (seals.length === 0) {
                    results.push({ tenantId, chainValid: true, lastSealAt: null });
                    continue;
                }

                const isValid = await FiscalEngine.verifyChain(seals);
                if (!isValid) {
                    allVerified = false;
                }

                results.push({
                    tenantId,
                    chainValid: isValid,
                    lastSealAt: seals[seals.length - 1]?.timestamp ?? null
                });

            } catch (error) {
                logger.error(`[NexusFleetEngine] Erreur de vérification pour tenant ${tenantId}`, error);
                allVerified = false;
                results.push({ tenantId, chainValid: false, lastSealAt: null });
            }
        }

        return {
            verified: allVerified,
            results
        };
    }
}

export const fleetEngine = NexusFleetEngine.getInstance();
