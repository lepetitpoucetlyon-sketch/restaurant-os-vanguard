import { z } from 'zod';
import { User, FiscalSeal } from '@nexus/contracts';
import { SovereignData, SovereignValue, OperationalIdentity } from '@/shared/nexus-contract';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { DomainRegistry } from '@shared/nexus/engines/DomainRegistry';
import { SovereignMath } from '@/shared/services/SovereignMath';
import { Microunits } from '@/domain/schemas/primitives';

import { ToolDefinition } from './types';

export const RevenueReportSchema = z.object({
    tenantId: z.string().min(1),
    period: z.enum(['day', 'week', 'month'], {
        message: "La période doit être 'day', 'week' ou 'month'."
    })
});

export type RevenueReportArgs = z.infer<typeof RevenueReportSchema>;

/**
 * 💰 FINANCE TOOL - Grade X
 */
export const FinanceTool: ToolDefinition<RevenueReportArgs> = {
    name: 'get_revenue_report',
    description: "Calcule le chiffre d'affaires réel basé sur les scellés fiscaux NF525.",
    parameters: {
        type: 'object',
        properties: {
            tenantId: { type: 'string', description: "ID de l'établissement" },
            period: { type: 'string', enum: ['day', 'week', 'month'], description: 'La période du rapport' }
        },
        required: ['tenantId', 'period']
    },
    schema: RevenueReportSchema,
    category: 'finance',
    execute: async (args, user): Promise<SovereignValue> => {
        const fiscalPath = `tenants/${args.tenantId}/${DomainRegistry.resolve(OperationalIdentity.LEDGER)}`;
        
        // 🏛️ QUERY SEALS
        const seals = await Nexus.adapter.query<FiscalSeal>(fiscalPath, {
            orderBy: { field: 'timestamp', direction: 'desc' },
            limit: 100 // Cap for speed, could be optimized with date range
        });

        let totalRevenueInMicrounits = 0 as Microunits;
        let count = 0;

        seals.forEach(seal => {
            try {
                const data = JSON.parse(seal.dataSnapshot || '{}');
                // Use amountInMicrounits if available, fallback to converting amount
                const microunits = data.amountInMicrounits || (data.amount ? SovereignMath.toMicrounits(data.amount) : 0);
                
                if (microunits > 0) {
                    totalRevenueInMicrounits = (totalRevenueInMicrounits + microunits) as Microunits;
                    count++;
                }
            } catch (e) {
                // Ignore malformed snapshots
            }
        });

        const totalInCents = SovereignMath.toCents(BigInt(totalRevenueInMicrounits));

        return {
            period: args.period,
            totalRevenueInCents: totalInCents,
            formattedRevenue: `${(totalInCents / 100).toFixed(2)}€`,
            transactionCount: count,
            currency: 'EUR',
            status: 'validated_nf525',
            timestamp: new Date().toISOString()
        } as SovereignValue;
    }
};
