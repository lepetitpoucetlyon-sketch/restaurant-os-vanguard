import { OrderItem } from "@nexus/contracts";
import { CartItem } from "@/verticals/restaurant/ops/workflow/engine/types";
import { toMicrounits, Microunits } from "@/domain/schemas/primitives";

export class POSService {
    /**
     * Calculates the projected margin based on total revenue and global inflation.
     */
    static getProjectedMargin(totalRevenue: number, inflationRate: number): number {
        if (totalRevenue === 0) return 0;
        const baseMargin = 75;
        const adjustedMargin = baseMargin - (inflationRate * 0.5);
        return Math.max(0, adjustedMargin);
    }

    /**
     * Analyzes cart items for potential profitability alerts.
     */
    static analyzeProfitability(items: CartItem[]): { name: string; alert: string }[] {
        const alerts: { name: string; alert: string }[] = [];
        items.forEach(item => {
            // Simulated cost calculation
            const simulatedCost = item.unitPriceInMicrounits * 0.42; 
            const margin = ((item.unitPriceInMicrounits - simulatedCost) / item.unitPriceInMicrounits) * 100;
            
            if (margin < 60) {
                alerts.push({ name: item.name, alert: 'Low Margin' });
            }
        });
        return alerts;
    }

    /**
     * Calculates the total for a set of items (Cart or Order).
     */
    static calculateCartTotal(items: (OrderItem | CartItem)[]): Microunits {
        return toMicrounits(items.reduce((acc, item) => acc + (((item as { unitPriceInMicrounits?: number }).unitPriceInMicrounits ?? 0) * item.quantity), 0));
    }

    /**
     * Formats items for the Kitchen Display System (KDS).
     */
    static formatForKitchen(items: (OrderItem | CartItem)[]): OrderItem[] {
        const now = Date.now();
        return items.map(item => {
            if (!('cartId' in item)) {
                // It's an OrderItem (no cartId)
                return {
                    ...item,
                    status: item.status || 'pending',
                    createdAt: item.createdAt || now,
                    updatedAt: item.updatedAt || now
                };
            } else {
                // It's a CartItem, convert to OrderItem
                return {
                    id: item.cartId,
                    productId: item.productId,
                    name: item.name,
                    unitPriceInMicrounits: item.unitPriceInMicrounits,
                    taxRate: item.taxRate,
                    quantity: item.quantity,
                    notes: item.notes || "",
                    status: 'pending',
                    createdAt: now,
                    updatedAt: now,
                    discountInMicrounits: toMicrounits(0)
                } as OrderItem;
            }
        });
    }
}
