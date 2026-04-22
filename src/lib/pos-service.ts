import { OrderItem } from "@/modules/ops/types";

export class POSService {
    /**
     * Calculates the projected margin based on total revenue and global inflation.
     * Simple linear projection for Grade X demo stability.
     */
    static getProjectedMargin(totalRevenue: number, inflationRate: number): number {
        // Base margin 75%, reduced by 0.5x the inflation rate as a simplified model
        const baseMargin = 75;
        const adjustedMargin = baseMargin - (inflationRate * 0.5);
        
        // Return percentage (e.g. 72.5)
        return Math.max(0, adjustedMargin);
    }

    /**
     * Formats prices for the POS system with currency and alignment.
     */
    static formatPOSPrice(amountInCents: number): string {
        return `${(amountInCents / 100).toFixed(2)}€`;
    }

    /**
     * Calculates the total for a set of cart items.
     */
    static calculateCartTotal(items: OrderItem[]): number {
        return items.reduce((acc, item) => acc + (item.priceInCents * item.quantity), 0);
    }

    /**
     * Formats car items for the Kitchen Display System (KDS).
     */
    static formatForKitchen(items: OrderItem[]): { name: string; quantity: number; notes: string }[] {
        return items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            notes: item.notes || ""
        }));
    }
}
