import { z } from 'zod';
import { StockItem, Ingredient } from '@nexus/contracts';
import { ToolDefinition } from './types';
import { SovereignValue, OperationalIdentity } from '@/shared/nexus-contract';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { DomainRegistry } from '@shared/nexus/engines/DomainRegistry';
import { StockEngine } from '@/modules/logistics';

/**
 * 📦 STOCK TOOL - Grade X
 */
export const LowStockSchema = z.object({
    tenantId: z.string().min(1, "L'identifiant de l'établissement est requis pour l'analyse de stock.")
});

export type LowStockArgs = z.infer<typeof LowStockSchema>;

export const StockTool: ToolDefinition<LowStockArgs> = {
    name: 'check_low_stock',
    description: 'Vérifie les articles en rupture ou en stock faible dans l\'inventaire.',
    parameters: {
        type: 'object',
        properties: {
            tenantId: { type: 'string', description: 'ID de l\'établissement' }
        },
        required: ['tenantId']
    },
    schema: LowStockSchema,
    category: 'inventory',
    execute: async (args, _user): Promise<SovereignValue> => {
        const inventoryPath = `tenants/${args.tenantId}/${DomainRegistry.resolve(OperationalIdentity.LOGISTICS)}`;
        const resourcePath = `tenants/${args.tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}`;

        // 🏛️ GATHERING (Grade X Parallel Query)
        const [allStock, ingredients] = await Promise.all([
            Nexus.adapter.query<StockItem>(inventoryPath),
            Nexus.adapter.query<Ingredient>(resourcePath)
        ]);

        // 📊 ANALYSIS (Powered by StockEngine)
        const lowStockItems = StockEngine.calculateLowStock(allStock, ingredients);

        return lowStockItems.map(s => ({
            id: s.id,
            item: s.ingredientName,
            current: s.quantity,
            unit: s.unit,
            status: s.status,
            dlc: s.dlc
        })) as SovereignValue;
    }
};
