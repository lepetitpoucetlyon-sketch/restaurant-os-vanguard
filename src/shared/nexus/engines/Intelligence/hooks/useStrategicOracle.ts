import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useNexusFleet as useFleet } from '@/shared/hooks/useNexusFleet';
import { useGeminiAgent } from '@/shared/hooks/useGeminiAgent';
import { MacroBrain, FleetInsight } from '@modules/intelligence/services/MacroBrain';
import { logger } from '@/lib/axiom';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/client/authedFetch';

/**
 * useStrategicOracle (Empire Grade)
 * The bridge between the MCC UI and the MacroBrain intelligence layer.
 * Manages fleet-wide strategy and autonomous action execution.
 */
export function useStrategicOracle() {
    const fleet = useFleet() as import('@/shared/nexus/contracts/nexus.types').NexusFleetState;
    const { instances, refreshFleet: _refreshFleet } = fleet;
    const agent = useGeminiAgent();
    const notifiedInsightIds = useRef<Set<string>>(new Set());

    // 1. Analyze Fleet - Get strategic insights from MacroBrain
    const insights = useMemo(() => {
        return MacroBrain.analyzeFleet(instances);
    }, [instances]);

    // 2. Notify fleet_admin via WebPush when new CRITICAL insights appear
    useEffect(() => {
        const fresh = insights.filter(
            i => i.impact === 'CRITICAL' && !notifiedInsightIds.current.has(i.id),
        );
        if (fresh.length === 0) return;

        fresh.forEach(i => notifiedInsightIds.current.add(i.id));

        authedFetch('/api/admin/mcc/notify-critical', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ insights: fresh.map(i => ({ id: i.id, title: i.title, impact: i.impact })) }),
        }).catch(err => logger.error('notify-critical failed', { err: String(err) }));
    }, [insights]);

    // 2. Executive Briefing - AI-driven fleet analysis
    const getExecutiveBriefing = useCallback(async () => {
        logger.info('Oracle: Generating Empire-wide Briefing');
        const context = {
            fleetSize: instances.length,
            metrics: MacroBrain.getConsolidatedMetrics(instances),
            topInsights: insights.slice(0, 3),
            timestamp: new Date().toISOString()
        };
        
        await agent.sendMessage(
            "Analyse l'état global de l'empire à partir des insights fournis. Donne-moi 3 priorités stratégiques immédiates.",
            context as unknown as import("@/shared/nexus-contract").SovereignMap
        );
    }, [agent, instances, insights]);

    // 3. Execute Strategic Action
    const executeAction = useCallback(async (insight: FleetInsight) => {
        logger.info('Oracle: Executing action', { id: insight.id });

        const toastId = toast.loading(`Exécution : ${insight.title}…`);

        try {
            const result = await MacroBrain.executeStrategicAction(insight);

            const affected = result.affectedInstanceIds.length;
            const label =
                insight.id === 'insight_dna_drift'      ? `${affected} instance(s) redémarrée(s)` :
                insight.id === 'insight_auto_rebalance'  ? `Ticket de transfert de stock créé` :
                insight.id === 'insight_bulk_seal'       ? `${affected} sceau(x) NF525 appliqué(s)` :
                `${affected} instance(s) traitée(s)`;

            toast.success(label, {
                id:          toastId,
                description: `Audit log : ${result.auditLogId}`,
                duration:    6000,
            });

            logger.info('Oracle: Action success', {
                auditLogId: result.auditLogId,
                affected:   result.affectedInstanceIds,
            });

            return result;
        } catch (err) {
            toast.error(`Échec : ${insight.title}`, {
                id:          toastId,
                description: err instanceof Error ? err.message : 'Erreur inconnue',
            });
            logger.error('Oracle: Action failed', { insightId: insight.id, err: String(err) });
            throw err;
        }
    }, []);

    return {
        // State
        insights,
        messages: agent.messages,
        isProcessing: agent.isProcessing,
        error: agent.error,

        // Actions
        getExecutiveBriefing,
        executeAction,
        askStrategicQuestion: (q: string) => agent.sendMessage(q, { fleetData: instances }),
        
        // Utils
        clearHistory: agent.startNewSession
    };
}
