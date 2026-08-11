import { useState, useCallback } from "react";
import { CartItem } from '@/modules/ops/workflow/engine/types';
import { SplitCalculator } from "../../domain/splitCalculator";

export type SplitMode = 'equal' | 'by-item' | 'custom';
export type PaymentMethod = 'card' | 'cash' | 'mobile';

export interface ConvivePayment {
    paid: boolean;
    amount: number;
    method?: PaymentMethod;
}

interface UseSplitBillStateProps {
    total: number;
    coverCount: number;
    items: CartItem[];
    onClose: () => void;
}

export function useSplitBillState({ total, coverCount, items, onClose }: UseSplitBillStateProps) {
    const initialSplitCount = coverCount || 2;
    const [mode, setMode] = useState<SplitMode>('equal');
    const [splitCount, setSplitCount] = useState(initialSplitCount);
    const [convivePayments, setConvivePayments] = useState<ConvivePayment[]>(() =>
        SplitCalculator.createEqualPayments(initialSplitCount, total)
    );
    const [selectedItems, setSelectedItems] = useState<Record<number, string[]>>({}); // conviveIndex -> cartIds
    const [customAmounts, setCustomAmounts] = useState<number[]>(() =>
        Array(initialSplitCount).fill(total / initialSplitCount)
    );
    const [payingConvive, setPayingConvive] = useState<number | null>(null);

    const syncSplitState = useCallback((nextSplitCount: number) => {
        setSplitCount(nextSplitCount);
        setConvivePayments(SplitCalculator.createEqualPayments(nextSplitCount, total));
        setCustomAmounts(Array(nextSplitCount).fill(total / nextSplitCount));
        setSelectedItems({});
        setPayingConvive(null);
    }, [total]);

    const handleClose = useCallback(() => {
        setMode('equal');
        syncSplitState(coverCount || 2);
        onClose();
    }, [coverCount, onClose, syncSplitState]);

    const amountPerPerson = total / splitCount;
    const paidCount = convivePayments.filter(g => g.paid).length;
    const remainingAmount = SplitCalculator.calculateRemainingAmount(total, convivePayments);

    const getConviveTotal = useCallback((conviveIndex: number): number => {
        return SplitCalculator.getConviveTotal(mode, conviveIndex, amountPerPerson, customAmounts, selectedItems, items);
    }, [mode, amountPerPerson, customAmounts, selectedItems, items]);

    const handlePayConvive = useCallback((conviveIndex: number) => {
        setPayingConvive(conviveIndex);
    }, []);

    const markConvivePaid = useCallback((conviveIndex: number, method: PaymentMethod) => {
        setConvivePayments(prev => prev.map((g, i) =>
            i === conviveIndex ? { ...g, paid: true, method } : g
        ));
        setPayingConvive(null);
    }, []);

    const allPaid = convivePayments.every(g => g.paid);

    return {
        mode,
        setMode,
        splitCount,
        convivePayments,
        selectedItems,
        setSelectedItems,
        customAmounts,
        setCustomAmounts,
        payingConvive,
        setPayingConvive,
        syncSplitState,
        handleClose,
        amountPerPerson,
        paidCount,
        remainingAmount,
        getConviveTotal,
        handlePayConvive,
        markConvivePaid,
        allPaid,
    };
}
