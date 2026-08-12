import { z } from 'zod';
import { FiscalSeal } from '@nexus/contracts';
import { ToolDefinition } from './types';
import { SovereignValue, OperationalIdentity } from '@/shared/nexus-contract';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { DomainRegistry } from '@nexus/engines/DomainRegistry';
// eslint-disable-next-line vanguard/no-inter-module-imports
import { FiscalEngine } from '@modules/finance/fiscalite/FiscalAdapter';

/**
 * 🛡️ FISCAL AUDIT TOOL - Grade X
 */
export const FiscalAuditSchema = z.object({
    tenantId: z.string().min(1)
});

export type FiscalAuditArgs = z.infer<typeof FiscalAuditSchema>;

export const FiscalAuditTool: ToolDefinition<FiscalAuditArgs> = {
    name: 'run_fiscal_audit',
    description: 'Vérifie l\'intégrité de la chaîne fiscale NF525. Détecte toute tentative d\'altération des données.',
    parameters: {
        type: 'object',
        properties: {
            tenantId: { type: 'string', description: 'ID de l\'établissement' }
        },
        required: ['tenantId']
    },
    schema: FiscalAuditSchema,
    category: 'finance',
    execute: async (args, _user): Promise<SovereignValue> => {
        const fiscalPath = `tenants/${args.tenantId}/${DomainRegistry.resolve(OperationalIdentity.LEDGER)}`;
        
        // 🏛️ GATHERING ALL SEALS
        const seals = await Nexus.adapter.query<FiscalSeal>(fiscalPath, {
            orderBy: { field: 'timestamp', direction: 'asc' }
        });

        if (seals.length === 0) {
            return { status: 'empty', message: 'Aucun scellé fiscal trouvé.' };
        }

        // 🛡️ RUN AUDIT (Titan Logic)
        const result = await FiscalEngine.runAudit(seals, args.tenantId);

        return {
            status: result.success ? 'success' : 'failure',
            integrity: result.integrity,
            sealedCount: result.sealedCount,
            lastAuditAt: result.timestamp,
            compliance: 'NF525'
        } as SovereignValue;
    }
};
