import { useCallback, useMemo } from 'react';
import { useNexusFleet as useFleet } from '@/hooks/useNexusFleet';
import { useGeminiAgent } from './useGeminiAgent';
import { MacroBrain, FleetInsight } from '@domain/services/MacroBrain';
import { logger } from '@/lib/axiom';

/**
 * useStrategicOracle (Empire Grade)
 * The bridge between the MCC UI and the MacroBrain intelligence layer.
 * Manages fleet-wide strategy and autonomous action execution.
 */
export function useStrategicOracle() {
    const { instances, refreshFleet } = useFleet();
    const agent = useGeminiAgent();

    // 1. Analyze Fleet - Get strategic insights from MacroBrain
    const insights = useMemo(() => {
        return MacroBrain.analyzeFleet(instances);
    }, [instances]);

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
            context as any
        );
    }, [agent, instances, insights]);

    // 3. Execute Strategic Action
    const executeAction = useCallback(async (insight: FleetInsight) => {
        logger.info('Oracle: Executing action', { id: insight.id });
        const success = await MacroBrain.executeStrategicAction(insight);
        
        if (success) {
            // Logic to update local instances state if needed (e.g. clearing stock alerts)
            // This would normally be handled by a real backend update
            logger.info('Oracle: Action success, syncing state');
        }
        
        return success;
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
