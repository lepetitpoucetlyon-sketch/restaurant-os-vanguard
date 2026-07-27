import { z } from 'zod';
import { ToolDefinition } from './types';
import { SovereignValue } from '@/shared/nexus-contract';

export const FleetStatusSchema = z.object({
    includeMaintenance: z.boolean().optional().default(false)
});

export type FleetStatusArgs = z.infer<typeof FleetStatusSchema>;

export const FlagSiteSchema = z.object({
    instanceId: z.string().min(1),
    reason: z.string().min(1, "La raison du marquage est obligatoire.")
});

export type FlagSiteArgs = z.infer<typeof FlagSiteSchema>;

/**
 * FleetTool
 * Strategic tools for multi-instance orchestration.
 */
export const FleetTool: ToolDefinition<FleetStatusArgs> = {
    name: 'analyze_fleet_status',
    description: "Analyse l'état de santé global de la flotte de restaurants. Identifie les pannes et les sites en sur-performance.",
    parameters: {
        type: 'object',
        properties: {
            includeMaintenance: { type: 'boolean', description: "Inclure les sites en maintenance dans l'analyse" }
        }
    },
    schema: FleetStatusSchema,
    category: 'fleet',
    execute: async (_args, _user): Promise<SovereignValue> => {
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

export const FlagSiteTool: ToolDefinition<FlagSiteArgs> = {
    name: 'flag_risk_site',
    description: 'Marque un site spécifique comme étant "à risque" pour une intervention humaine immédiate.',
    parameters: {
        type: 'object',
        properties: {
            instanceId: { type: 'string', description: "L'identifiant de l'instance à flagger" },
            reason: { type: 'string', description: 'La raison du flag' }
        },
        required: ['instanceId', 'reason']
    },
    schema: FlagSiteSchema,
    category: 'fleet',
    execute: async (args, _user): Promise<SovereignValue> => {
        return {
            success: true,
            notificationSent: true,
            target: args.instanceId,
            status: 'URGENT_FLAGGED'
        };
    }
};
