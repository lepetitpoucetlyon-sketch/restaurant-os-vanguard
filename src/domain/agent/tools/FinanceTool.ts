import { User } from '@/types';
import { SovereignData, SovereignValue } from '@/shared/nexus-contract';

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: SovereignData;
    category: string; // RBAC Category
    execute: (args: SovereignData, user: User, context?: SovereignData) => Promise<SovereignValue>;
}

export const FinanceTool: ToolDefinition = {
    name: 'get_revenue_report',
    description: 'Obtient le rapport de revenus (CA) pour une période donnée. Nécessite des droits financiers.',
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', enum: ['day', 'week', 'month'], description: 'La période du rapport' }
        },
        required: ['period']
    },
    category: 'finance',
    execute: async (args, user) => {
        // Enforced by GeminiLiveService's RBAC Sentinel
        // Mock data for now, would call FiscalEngine in production
        return {
            period: args.period,
            totalRevenueInCents: 1545050, // 15,450.50 €
            currency: 'EUR',
            status: 'validated_nf525'
        };
    }
};
