import { OrderItem, CartItem } from "@/modules/ops/types";
import { MasterBridge } from "./MasterBridge"; // For master-level context if needed

export class POSService {
    /**
     * Calculates the projected margin based on total revenue and global inflation.
     */
    static getProjectedMargin(totalRevenue: number, inflationRate: number): number {
        const baseMargin = 75;
        const adjustedMargin = baseMargin - (inflationRate * 0.5);
        return Math.max(0, adjustedMargin);
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
        return items.map(item => ({
            productId: (item as CartItem).productId || (item as OrderItem).productId,
            categoryId: (item as CartItem).categoryId || (item as OrderItem).categoryId,
            name: item.name,
            priceInCents: item.priceInCents,
            quantity: item.quantity,
            notes: item.notes || "",
            modifiers: item.modifiers || [],
            status: 'pending'
        }));
    }
}
