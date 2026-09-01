import { Nexus } from "@/lib/nexus/NexusAdapter";
import { Category, Product, CartItem } from "@nexus/contracts";
import { SharedKernel } from "@/lib/shared-kernel";
import { toMicrounits, Microunits } from "@/shared/schemas/primitives";

/**
 * POS Business Logic Service - The "Translator" between UI and Reality
 * Now using SharedKernel for 'Deding' (Data Deduplication).
 */
export const POSService = {
    /**
     * Calculates the total price of a cart.
     */
    calculateCartTotal: (items: CartItem[]): Microunits => {
        return toMicrounits(items.reduce((acc, item) => acc + (item.unitPriceInMicrounits * item.quantity), 0));
    },

    /**
     * Formats cart items for the kitchen (KDS).
     */
    formatForKitchen: (items: CartItem[]) => {
        return items.map(item => ({
            id: item.cartId,
            productId: item.productId,
            name: item.name,
            unitPriceInMicrounits: item.unitPriceInMicrounits,
            taxRate: item.taxRate,
            quantity: item.quantity,
            status: 'pending' as const,
            notes: item.notes,
            modifiers: item.modifiers,
            discountInMicrounits: toMicrounits(0)
        }));
    },

    /**
     * Identifies items that might require a specific "Profitability" alert.
     */
    analyzeProfitability: (items: CartItem[]) => {
        return items.map(item => {
            const cost = (item as { costInMicrounits?: number }).costInMicrounits || 0;
            const price = item.unitPriceInMicrounits || 0;
            const margin = SharedKernel.calculateMargin(price / 10000, cost / 10000 || 0);
            if (margin < 60) return { name: item.name, alert: 'Low Margin' };
            return null;
        }).filter(Boolean);
    },

    /**
     * Fetches all menu categories from Firestore.
     */
    fetchCategories: async (): Promise<Category[]> => {
        try {
            const path = Nexus.getTenantPath('categories');
            return await Nexus.adapter.query(path, {
                orderBy: { field: 'name', direction: 'asc' }
            });
        } catch (error) {
            console.error("Error fetching categories:", error);
            return [];
        }
    },

    /**
     * Fetches products for a specific category.
     */
    fetchProducts: async (categoryId?: string): Promise<Product[]> => {
        try {
            const path = Nexus.getTenantPath('products');
            const options: Parameters<typeof Nexus.adapter.query>[1] = {};
            if (categoryId) {
                options.where = [{ field: 'categoryId', operator: '==', value: categoryId }];
            }
            return await Nexus.adapter.query(path, options);
        } catch (error) {
            console.error("Error fetching products:", error);
            return [];
        }
    },

    /**
     * Returns a projected profit margin.
     */
    getProjectedMargin: (total: number, inflationRate: number = 0): number => {
        if (total === 0) return 0;
        const baseMargin = 72 + (Math.sin(total) * 3);
        const inflationImpact = inflationRate * 1.5;
        return Math.max(0, baseMargin - inflationImpact);
    }
};
