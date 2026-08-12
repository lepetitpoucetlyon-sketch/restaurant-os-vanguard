import { SovereignMath } from '@/lib/services/SovereignMath';
import type { CartItem as SplitCartItem, ConvivePayment, SplitMode } from '@/modules/ops';

export const SplitBillDomainService = {
    createEqualPayments(count: number, totalInCents: number): ConvivePayment[] {
        const totalMicro = SovereignMath.toMicrounits(totalInCents);
        const countMicro = SovereignMath.toMicrounits(count);
        
        const exactSplitMicro = SovereignMath.divide(totalMicro, countMicro);
        const baseAmountNumber = Math.floor(SovereignMath.fromMicrounits(exactSplitMicro));
        
        const baseAmountMicro = SovereignMath.toMicrounits(baseAmountNumber);
        const baseTotalMicro = SovereignMath.multiply(baseAmountMicro, countMicro);
        const remainderMicro = SovereignMath.subtract(totalMicro, baseTotalMicro);
        const remainderNumber = Math.round(SovereignMath.fromMicrounits(remainderMicro));

        const oneMicro = SovereignMath.toMicrounits(1);
        const basePlusOneMicro = SovereignMath.add(baseAmountMicro, oneMicro);
        const basePlusOneNumber = SovereignMath.fromMicrounits(basePlusOneMicro);

        return Array.from({ length: count }, (_, i) => ({
            paid: false,
            amount: i < remainderNumber ? basePlusOneNumber : baseAmountNumber
        }));
    },

    getConviveTotal(
        mode: SplitMode,
        conviveIndex: number,
        amountPerPerson: number,
        customAmounts: number[],
        selectedItems: Record<number, string[]>,
        items: SplitCartItem[]
    ): number {
        if (mode === 'equal') return amountPerPerson;
        if (mode === 'custom') return customAmounts[conviveIndex] || 0;
        
        const conviveItems = selectedItems[conviveIndex] || [];
        const itemsForConvive = items.filter(item => conviveItems.includes(item.cartId));
        
        let sumMicro = 0;
        for (const item of itemsForConvive) {
            const lineTotalMicro = ((item as { unitPriceInMicrounits?: number }).unitPriceInMicrounits ?? 0) * item.quantity;
            sumMicro = SovereignMath.add(sumMicro, lineTotalMicro);
        }
        
        return SovereignMath.fromMicrounits(sumMicro);
    },

    calculateRemaining(totalInCents: number, payments: ConvivePayment[]): number {
        let paidMicro = 0;
        for (const p of payments) {
            if (p.paid) {
                paidMicro = SovereignMath.add(paidMicro, SovereignMath.toMicrounits(p.amount));
            }
        }
        const totalMicro = SovereignMath.toMicrounits(totalInCents);
        const remainMicro = SovereignMath.subtract(totalMicro, paidMicro);
        return SovereignMath.fromMicrounits(remainMicro);
    },

    calculateAmountPerPerson(totalInCents: number, count: number): number {
        const totalMicro = SovereignMath.toMicrounits(totalInCents);
        const countMicro = SovereignMath.toMicrounits(count);
        return SovereignMath.fromMicrounits(SovereignMath.divide(totalMicro, countMicro));
    },

    divideCustom(totalInCents: number, count: number): number[] {
        const totalMicro = SovereignMath.toMicrounits(totalInCents);
        const countMicro = SovereignMath.toMicrounits(count);
        const exactMicro = SovereignMath.divide(totalMicro, countMicro);
        const amount = SovereignMath.fromMicrounits(exactMicro);
        return Array(count).fill(amount);
    },

    // ── Microunits-native entry points ────────────────────────────────────────

    createEqualPaymentsFromMicrounits(count: number, totalInMicrounits: number): ConvivePayment[] {
        return SplitBillDomainService.createEqualPayments(count, Math.round(totalInMicrounits / 10_000));
    },

    calculateRemainingFromMicrounits(totalInMicrounits: number, payments: ConvivePayment[]): number {
        return SplitBillDomainService.calculateRemaining(Math.round(totalInMicrounits / 10_000), payments);
    },

    calculateAmountPerPersonFromMicrounits(totalInMicrounits: number, count: number): number {
        return SplitBillDomainService.calculateAmountPerPerson(Math.round(totalInMicrounits / 10_000), count);
    },
};
