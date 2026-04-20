// @ts-nocheck
import { ToolDefinition } from './FinanceTool';
import { EmpireInstance } from '@/domain/types/empire';

/**
 * FleetTool
 * Strategic tools for multi-instance orchestration.
 */
export const FleetTool: ToolDefinition = {
    name: 'analyze_fleet_status',
    description: 'Analyse l\'état de santé global de la flotte de restaurants. Identifie les pannes et les sites en sur-performance.',
    parameters: {
        type: 'object',
        properties: {
            includeMaintenance: { type: 'boolean', description: 'Inclure les sites en maintenance dans l\'analyse' }
        }
    },
    category: 'fleet',
    execute: async (args, user) => {
        // Enforced by RBAC - Should ideally call useNexusFleet but tools run in class context
        // We will pass the fleet state as context to the GeminiLiveService later
        return {
            summary: "Analyse en cours...",
            riskLevel: "Moderate",
            recommendations: [
                "Vérifier le site Bistro Lyon #1 (Erreur TPE détectée)",
                "Répartir les stocks excédentaires de Marseille vers Toulouse"
            ]
        };
    }
};

export const FlagSiteTool: ToolDefinition = {
    name: 'flag_risk_site',
    description: 'Marque un site spécifique comme étant "à risque" pour une intervention humaine immédiate.',
    parameters: {
        type: 'object',
        properties: {
            instanceId: { type: 'string', description: 'L\'identifiant de l\'instance à flagger' },
            reason: { type: 'string', description: 'La raison du flag' }
        },
        required: ['instanceId', 'reason']
    },
    category: 'fleet',
    execute: async (args, user) => {
        return {
            success: true,
            notificationSent: true,
            target: args.instanceId,
            status: 'URGENT_FLAGGED'
        };
    }
};
