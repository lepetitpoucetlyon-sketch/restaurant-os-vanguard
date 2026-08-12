import { z } from 'zod';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { SovereignData, SovereignValue, OperationalIdentity } from '@nexus/contracts/nexus-contract';
import { DomainRegistry } from '@nexus/engines/DomainRegistry';
import { ToolDefinition } from './types';

export const UpdateMenuSchema = z.object({
    tenantId: z.string().min(1),
    productName: z.string().min(1, "Le nom du produit est requis."),
    newPriceInMicrounits: z.number().int().nonnegative().optional(),
    newDescription: z.string().optional()
});

export type UpdateMenuArgs = z.infer<typeof UpdateMenuSchema>;

/**
 * 🍽️ MENU TOOL - Grade X
 * Allows Hermès to manage the restaurant's product catalog with extreme precision.
 */
export const MenuTool: ToolDefinition<UpdateMenuArgs> = {
    name: "update_menu_item",
    description: "Met à jour le prix ou la description d'un article du menu (plat, boisson, etc.).",
    parameters: {
        type: "object",
        properties: {
            tenantId: { type: "string", description: "ID de l'établissement" },
            productName: { type: "string", description: "Le nom exact du produit à modifier." },
            newPriceInMicrounits: { type: "number", description: "Le nouveau prix en microunits (ex: 15500000 pour 15.50€ ; 1 microunit = 0,000001€)." },
            newDescription: { type: "string", description: "La nouvelle description du produit." }
        },
        required: ["tenantId", "productName"]
    },
    schema: UpdateMenuSchema,
    category: "inventory",
    execute: async (args, user): Promise<SovereignValue> => {
        try {
            // Prompt-injection guard: LLM-supplied tenantId must match the authenticated session.
            if (user.tenantId && user.tenantId !== args.tenantId) {
                logger.error('[MenuTool] Cross-tenant injection attempt blocked', {
                    sessionTenant: user.tenantId,
                    requestedTenant: args.tenantId,
                    actor: user.id,
                });
                return { error: 'Accès refusé — le tenant demandé ne correspond pas à la session active.' };
            }

            const productName = args.productName;
            const newDescription = args.newDescription;
            const newPrice = args.newPriceInMicrounits;

            const resourcePath = `tenants/${args.tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}`;

            // 🏛️ SUTURE: Querying through Nexus Adapter
            const results = await Nexus.adapter.query<SovereignData>(resourcePath, {
                where: [{ field: 'name', operator: '==', value: productName }]
            });

            if (results.length === 0) {
                return { error: `Produit '${args.productName}' non trouvé. Peux-tu préciser le nom exact ?` };
            }

            const product = results[0];
            const updates: SovereignData = {};
            if (newPrice !== undefined) updates.priceInMicrounits = newPrice;
            if (newDescription !== undefined) updates.description = newDescription;
            updates.updatedAt = new Date().toISOString();

            await Nexus.adapter.update(`${resourcePath}/${product.id}`, updates);
            
            logger.info('MenuTool: Product updated', { id: product.id, updates });

            return { 
                success: true, 
                message: `L'article '${args.productName}' a été mis à jour avec succès.` 
            };
        } catch (error) {
            logger.error('MenuTool Error:', error);
            return { error: `Échec de la mise à jour : ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }
};
