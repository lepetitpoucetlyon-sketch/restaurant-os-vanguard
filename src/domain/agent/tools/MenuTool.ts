import { getTenantPath } from '@/lib/firebase';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { ToolDefinition } from './FinanceTool';

/**
 * MENU TOOL
 * Allows NEXUS to manage the restaurant's product catalog.
 */
export const MenuTool: ToolDefinition = {
    name: "update_menu_item",
    description: "Met à jour le prix ou la description d'un article du menu (plat, boisson, etc.).",
    parameters: {
        type: "object",
        properties: {
            productName: { type: "string", description: "Le nom exact ou partiel du produit à modifier." },
            newPrice: { type: "number", description: "Le nouveau prix en euros (ex: 15.50)." },
            newDescription: { type: "string", description: "La nouvelle description du produit." }
        },
        required: ["productName"]
    },
    category: "inventory",
    execute: async (args: { productName: string, newPrice?: number, newDescription?: string }, user: any) => {
        try {
            const productsPath = getTenantPath('products');
            const results = await Nexus.adapter.query(productsPath, {
                where: [{ field: 'name', operator: '==', value: args.productName }]
            });

            if (results.length === 0) {
                // Fallback: search by partial name if exact match fails
                return { error: `Produit '${args.productName}' non trouvé. Peux-tu préciser le nom exact ?` };
            }

            const product = results[0];
            const updates: any = {};
            if (args.newPrice !== undefined) updates.price = args.newPrice;
            if (args.newDescription) updates.description = args.newDescription;
            updates.updatedAt = new Date().toISOString();

            await Nexus.adapter.update(`${productsPath}/${product.id}`, updates);
            
            logger.info('MenuTool: Product updated', { id: product.id, updates });

            return { 
                success: true, 
                message: `L'article '${args.productName}' a été mis à jour avec succès : ${args.newPrice ? `${args.newPrice}€` : ''} ${args.newDescription ? 'Description modifiée' : ''}` 
            };
        } catch (error: any) {
            logger.error('MenuTool Error:', error);
            return { error: `Échec de la mise à jour : ${error.message}` };
        }
    }
};
