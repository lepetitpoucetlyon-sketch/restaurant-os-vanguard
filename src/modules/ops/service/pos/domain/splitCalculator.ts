import { SovereignMath } from "@/shared/services/SovereignMath";
import type { CartItem } from '../../../workflow/engine/types';
import type { ConvivePayment, SplitMode } from '../../../domain/schemas/pos';

export const SplitCalculator = {
    createEqualPayments(count: number, total: number): ConvivePayment[] {
        if (count <= 0) return [];
        const baseAmount = Math.floor(total / count);
        const remainder = total % count;
        
        return Array.from({ length: count }, (_, i) => ({ 
            paid: false, 
            amount: i < remainder ? baseAmount + 1 : baseAmount 
        }));
    },

    getConviveTotal(
        mode: SplitMode,
        conviveIndex: number,
        amountPerPerson: number,
        customAmounts: number[],
        selectedItems: Record<number, string[]>,
        items: CartItem[]
    ): number {
        if (mode === 'equal') return amountPerPerson;
        if (mode === 'custom') return customAmounts[conviveIndex] || 0;
        
        // by-item mode
        const conviveItems = selectedItems[conviveIndex] || [];
        return items
            .filter(item => conviveItems.includes(item.cartId))
            .reduce((sum, item) => sum + Number(SovereignMath.multiply(item.unitPriceInMicrounits, item.quantity)), 0);
    },

    calculateRemainingAmount(total: number, payments: ConvivePayment[]): number {
        const paidAmount = payments.filter(g => g.paid).reduce((sum, g) => sum + g.amount, 0);
        return total - paidAmount;
    }
};
