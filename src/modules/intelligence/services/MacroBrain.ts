export type { FleetInsight, ConsolidatedMetrics, QuantumMetrics, StrategicActionResult } from '@nexus/contracts/fleet.types';
import { FleetInsight, ConsolidatedMetrics, QuantumMetrics } from '@nexus/contracts/fleet.types';
import type { StrategicActionResult } from '@nexus/contracts/fleet.types';
import { EmpireInstance } from '@/shared/types/empire';
import { logger } from '@/lib/axiom';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
// eslint-disable-next-line no-restricted-imports -- deep import volontaire : évite cycle intelligence ↔ finance. Cible α-5.
import { FiscalEngine } from '@/modules/finance/services/FiscalEngine';
import type { FiscalSeal } from '@nexus/contracts';
import { toError } from "@/lib/toError";

/**
 * 👑 MACRO BRAIN (Empire Industrial Grade)
 * The high-level intelligence engine that analyzes the entire fleet.
 * Now evolved into a Strategic Decision Oracle.
 */

export const MacroBrain = {
    /**
     * Performs a deep audit of the whole fleet to generate strategic insights.
     */
    analyzeFleet: (instances: EmpireInstance[]): FleetInsight[] => {
        const insights: FleetInsight[] = [];

        // 1. HEALTH & COMPLIANCE ANOMALY DETECTION (Advanced Drift Analysis)
        const sorted = [...instances].sort((a, b) => b.metrics.healthScore - a.metrics.healthScore);
        const top = sorted[0];
        const bottom = sorted[sorted.length - 1];

        if (top && bottom && (top.metrics.healthScore > bottom.metrics.healthScore + 25)) {
            insights.push({
                id: 'insight_dna_drift',
                type: 'anomaly',
                impact: 'CRITICAL',
                priority: 'high',
                title: 'Empire DNA Configuration Drift',
                description: `Node '${bottom.name}' has a health score of ${bottom.metrics.healthScore}% compared to Cluster Lead '${top.name}' (${top.metrics.healthScore}%). Architectural alignment required.`,
                message: `Drift critique: ${bottom.name} vs ${top.name}`, // Bridge Alias
                action: 'Sync Node DNA',
                confidence: 94,
                potentialRoI: 0,
                affectedInstances: [bottom.id],
                canAutoExecute: false
            });
        }

        // 2. AUTONOMOUS REBALANCING: Predictive Inventory Move
        const lowStock = instances.filter(i => i.metrics.lowStockAlerts > 0);
        const highHealth = instances.filter(i => i.metrics.lowStockAlerts === 0 && i.metrics.healthScore > 98);

        if (lowStock.length > 0 && highHealth.length > 0) {
            insights.push({
                id: 'insight_auto_rebalance',
                type: 'opportunity',
                impact: 'HIGH',
                priority: 'medium',
                title: 'Strategic Stock Rebalancing',
                description: `Surplus capacity at ${highHealth[0].name} can neutralize stock-out risk at ${lowStock[0].name}. Impact: Zero waste.`,
                action: 'Authorize Rebalancing',
                confidence: 75,
                potentialRoI: 0,
                affectedInstances: [lowStock[0].id, highHealth[0].id],
                canAutoExecute: true
            });
        }

        // 3. STRATEGIC MOVE: Bulk Compliance Sealing
        const vulnNodes = instances.filter(i => i.metrics.complianceScore < 100);
        if (vulnNodes.length > 0) {
            insights.push({
                id: 'insight_bulk_seal',
                type: 'strategic_move',
                impact: 'CRITICAL',
                priority: 'critical',
                title: 'Fleet-Wide Fiscal Sealing',
                description: `Security breach risk: ${vulnNodes.length} nodes require immediate cryptographic re-sealing to maintain NF525 certification.`,
                action: 'Seal All Vulnerable Nodes',
                confidence: 100,
                potentialRoI: 0,
                affectedInstances: vulnNodes.map(i => i.id),
                canAutoExecute: true
            });
        }

        return insights;
    },

    /**
     * EXECUTION: Transforms a strategic insight into actual empire changes.
     */
    async executeStrategicAction(insight: FleetInsight): Promise<StrategicActionResult> {
        logger.info('MACROBRAIN: Executing strategic decision', { id: insight.id, type: insight.type });

        const auditLogId = `audit_${insight.id}_${Date.now()}`;
        const timestamp  = new Date().toISOString();

        switch (insight.id) {

            // ── 1. DNA DRIFT → RESTART de l'instance sous-performante ───────────
            case 'insight_dna_drift': {
                for (const instanceId of insight.affectedInstances) {
                    // Envoyer la commande RESTART via la route fleet/command
                    await Nexus.adapter.set(`mcc/fleet/${instanceId}`, {
                        status:            'ONLINE',
                        lastCommandAt:     timestamp,
                        lastCommandAction: 'RESTART',
                    }, { merge: true });

                    // Propager vers tenantConfig pour que SovereignLockout se lève
                    await Nexus.adapter.set(`tenants/${instanceId}/tenantConfig`, {
                        status: { licenceStatus: 'ACTIVE', maintenanceMode: false },
                    }, { merge: true });

                    // Écrire une note de diagnostic dans config/master de l'instance
                    await Nexus.adapter.set(`tenants/${instanceId}/config/master`, {
                        macroBrainDiagnostic: {
                            triggeredAt:  timestamp,
                            insightId:    insight.id,
                            action:       'RESTART',
                            reason:       insight.description,
                            confidence:   insight.confidence,
                        },
                    }, { merge: true });

                    logger.info(`[MacroBrain] DNA drift RESTART applied → ${instanceId}`);
                }
                break;
            }

            // ── 2. AUTO REBALANCE → ticket de transfert de stock ────────────────
            case 'insight_auto_rebalance': {
                const [sourceId, destinationId] = insight.affectedInstances;
                if (!sourceId || !destinationId) break;

                const transferId = `transfer_${Date.now()}`;

                // Écrire le ticket de transfert chez la source (surplus)
                await Nexus.adapter.set(
                    `tenants/${sourceId}/stockTransferRequests/${transferId}`,
                    {
                        id:            transferId,
                        sourceId,
                        destinationId,
                        status:        'PENDING',
                        requestedAt:   timestamp,
                        insightId:     insight.id,
                        estimatedRoI:  insight.potentialRoI,
                        confidence:    insight.confidence,
                        approvedBy:    'MacroBrain',
                    },
                );

                // Notifier la destination qu'un transfert est en attente
                await Nexus.adapter.set(
                    `tenants/${destinationId}/config/master`,
                    {
                        pendingStockTransfer: {
                            transferId,
                            fromTenantId: sourceId,
                            requestedAt:  timestamp,
                        },
                    },
                    { merge: true },
                );

                logger.info(`[MacroBrain] Stock rebalance ticket créé: ${transferId} (${sourceId} → ${destinationId})`);
                break;
            }

            // ── 3. BULK SEAL → re-scellement NF525 pour chaque instance vulnérable
            case 'insight_bulk_seal': {
                for (const instanceId of insight.affectedInstances) {
                    // Récupérer le dernier sceau existant pour chaîner
                    const existingSeals = await Nexus.adapter.query<FiscalSeal>(
                        `tenants/${instanceId}/fiscalSeals`,
                    );
                    const sorted    = existingSeals.sort((a, b) =>
                        new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime(),
                    );
                    const lastSeal  = sorted[0];

                    // Créer le sceau de maintenance NF525
                    const seal = await FiscalEngine.sealEntry(
                        `macro_seal_${instanceId}_${Date.now()}`,
                        {
                            type:        'FLEET_MAINTENANCE_SEAL',
                            instanceId,
                            triggeredBy: 'MacroBrain/insight_bulk_seal',
                            timestamp,
                        },
                        { lastSeal, instanceId },
                    );

                    // Persister le sceau dans la collection fiscale du tenant
                    await Nexus.adapter.set(
                        `tenants/${instanceId}/fiscalSeals/${seal.id}`,
                        { ...seal, dataSnapshot: seal.dataSnapshot },
                    );

                    // Mettre à jour le score de conformité de l'instance
                    await Nexus.adapter.set(`mcc/fleet/${instanceId}`, {
                        complianceScore:   100,
                        lastSealedAt:      timestamp,
                        lastSealId:        seal.id,
                    }, { merge: true });

                    logger.info(`[MacroBrain] NF525 bulk seal appliqué → ${instanceId} (seal: ${seal.id})`);
                }
                break;
            }

            default:
                logger.warn(`[MacroBrain] Insight inconnu : ${insight.id} — aucune action exécutée`);
        }

        empireAudit.log({
            module: 'orchestration',
            action: 'STRATEGIC_ACTION_EXECUTED',
            details: {
                insightId:  insight.id,
                confidence: insight.confidence,
                roi:        insight.potentialRoI,
                affected:   insight.affectedInstances,
            },
            severity:  insight.impact === 'CRITICAL' || insight.impact === 'HIGH' ? 'high' : 'medium',
            timestamp: new Date(),
        });

        return {
            executed:            true,
            insightId:           insight.id,
            affectedInstanceIds: insight.affectedInstances,
            auditLogId,
            timestamp,
        };
    },

    /**
     * Calculates consolidated KPIs for the Master Console
     */
    getConsolidatedMetrics: (instances: EmpireInstance[]): ConsolidatedMetrics => {
        const count = instances.length || 1;
        const healthScores = instances.map(i => i.metrics.healthScore);
        const meanHealth = healthScores.reduce((a, b) => a + b, 0) / count;
        const healthVariance = healthScores.reduce((sum, h) => sum + Math.pow(h - meanHealth, 2), 0) / count;
        const volatilityIndex = meanHealth > 0 ? Math.min(1, Math.sqrt(healthVariance) / meanHealth) : 0;

        return {
            totalRevenue: 0,
            activeUsers: instances.reduce((acc, i) => acc + i.metrics.activeUsers, 0),
            averageHealth: meanHealth,
            totalAlerts: instances.reduce((acc, i) => acc + i.metrics.lowStockAlerts, 0),
            // No external cost data available — displayed as 0 until Firestore integration
            totalLaborCost: 0,
            averageFoodCost: 0,
            collectiveArbitrageSavings: 0,
            volatilityIndex,
        };
    },

    /**
     * 🛰️ QUANTUM FLEET SNAPSHOT
     * Provides high-altitude data for the Global Dashboard.
     */
    getQuantumFleetSnapshot: (instances: EmpireInstance[]): QuantumMetrics => {
        const count = instances.length || 1;
        const healthScores = instances.map(i => i.metrics.healthScore);
        const avgHealth = healthScores.reduce((a, b) => a + b, 0) / count;
        const healthVariance = healthScores.reduce((sum, h) => sum + Math.pow(h - avgHealth, 2), 0) / count;
        // Entropy = normalized health score stddev (0 = perfectly uniform fleet)
        const fleetEntropy = Math.min(1, Math.sqrt(healthVariance) / 100);

        return {
            // No real cost/revenue accounting available yet → 0 until Stripe + payroll data
            globalROI: 0,
            fleetEntropy,
            arbitrageOpportunities: instances.filter(i => i.metrics.healthScore > 90).length,
            otaStagingCount: instances.filter(i => i.version !== '1.0.0').length
        };
    },

    /**
     * 🧠 ORACLE AUDIT BRIDGE (Industrial Grade)
     * Direct interface for Strategic AI Analysis.
     */
    async getOracleAudit(prompt: string, context: Record<string, import("@/shared/nexus-contract").SovereignValue>): Promise<string> {
        logger.info(`[MacroBrain] Requesting Oracle Audit for prompt: ${prompt.substring(0, 50)}...`);

        try {
            const { LLMManager } = await import('@/modules/intelligence/ia/ai');
            const response = await LLMManager.provider.generateText({
                model: 'gemini-1.5-pro',
                userPrompt: `${prompt}\n\nContext: ${JSON.stringify(context)}`,
                temperature: 0.7,
                maxTokens: 1024,
            });
            return response.text || "Analyse indisponible.";
        } catch (error) {
            logger.error('[MacroBrain] Oracle Audit Failed', { error: toError(error).message });
            return "Échec de la connexion à l'Oracle.";
        }
    }
};
