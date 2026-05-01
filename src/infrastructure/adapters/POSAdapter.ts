import { OrderItem } from "@nexus/contracts";
import { CartItem } from "@modules/ops";
import { MasterBridge } from "@/lib/MasterBridge"; // For master-level context if needed

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
            // Simulated cost calculation (In Grade VI, this would pull from Inventory)
            const simulatedCost = item.priceInCents * 0.42; 
            const margin = ((item.priceInCents - simulatedCost) / item.priceInCents) * 100;
            
            if (margin < 60) {
                alerts.push({ name: item.name, alert: 'Low Margin' });
            }
        });
        return alerts;
    }

    /**
     * Formats prices for the POS system with currency and alignment.
     */
    static formatPOSPrice(amountInCents: number): string {
        return `${(amountInCents / 100).toFixed(2)}€`;
    }

    /**
     * Calculates the total for a set of items (Cart or Order).
     */
    static calculateCartTotal(items: (OrderItem | CartItem)[]): number {
        return items.reduce((acc, item) => acc + (item.priceInCents * item.quantity), 0);
    }

    /**
     * Formats items for the Kitchen Display System (KDS).
     */
    static formatForKitchen(items: (OrderItem | CartItem)[]): OrderItem[] {
        const now = new Date().toISOString();
        return items.map(item => ({
            id: (item as any).id || `item_${Math.random().toString(36).substring(2, 11)}`,
            productId: (item as CartItem).productId || (item as OrderItem).productId,
            categoryId: (item as CartItem).categoryId || (item as OrderItem).categoryId,
            name: item.name,
            priceInCents: item.priceInCents,
            quantity: item.quantity,
            notes: item.notes || "",
            modifiers: item.modifiers || [],
            status: 'pending',
            createdAt: (item as any).createdAt || now,
            updatedAt: (item as any).updatedAt || now
        }));
    }
}
