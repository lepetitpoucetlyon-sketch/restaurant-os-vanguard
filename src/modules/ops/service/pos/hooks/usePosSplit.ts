'use client';

import { useState, useMemo, useCallback } from 'react';
import { SovereignMath } from '@/shared/services/SovereignMath';
import { CartItem } from '../../../workflow/engine/types';

export type SplitMode = 'equal' | 'by-item' | 'custom';
export type PaymentMethod = 'card' | 'cash' | 'mobile';

export interface ConvivePaymentState {
    index: number;
    amountInMicrounits: number;
    paid: boolean;
    method?: PaymentMethod;
    paidAt?: number;
}

export interface UsePosSplitProps {
    items: CartItem[];
    totalInMicrounits: number;
    initialCovers?: number;
    onSplitComplete?: () => void;
}

export function usePosSplit({
    items,
    totalInMicrounits,
    initialCovers = 2,
    onSplitComplete,
}: UsePosSplitProps) {
    const [mode, setMode] = useState<SplitMode>('equal');
    const [coversCount, setCoversCount] = useState<number>(Math.max(1, initialCovers));
    const [paidConvives, setPaidConvives] = useState<Record<number, ConvivePaymentState>>({});
    const [selectedItemsByConvive, setSelectedItemsByConvive] = useState<Record<number, string[]>>({});
    const [customAmountsByConvive, setCustomAmountsByConvive] = useState<Record<number, number>>({});
    const [activePayingConvive, setActivePayingConvive] = useState<number | null>(null);

    // 1. Calcul des parts en mode égalitaire avec règle du reliquat (Invariant #5)
    const equalParts = useMemo(() => {
        return SovereignMath.splitRemainder(totalInMicrounits, coversCount);
    }, [totalInMicrounits, coversCount]);

    // 2. Calcul du montant dû par convive selon le mode
    const getConviveAmount = useCallback((conviveIndex: number): number => {
        if (mode === 'equal') {
            return equalParts[conviveIndex] ?? 0;
        }

        if (mode === 'custom') {
            return customAmountsByConvive[conviveIndex] ?? 0;
        }

        // Mode par article
        const assignedCartIds = selectedItemsByConvive[conviveIndex] || [];
        return items
            .filter(item => assignedCartIds.includes(item.cartId))
            .reduce((sum, item) => {
                const itemTotal = item.unitPriceInMicrounits * item.quantity;
                return sum + itemTotal;
            }, 0);
    }, [mode, equalParts, customAmountsByConvive, selectedItemsByConvive, items]);

    // 3. Montant total déjà réglé
    const totalPaidInMicrounits = useMemo(() => {
        return Object.values(paidConvives)
            .filter(p => p.paid)
            .reduce((acc, p) => acc + p.amountInMicrounits, 0);
    }, [paidConvives]);

    // 4. Solde restant
    const remainingInMicrounits = useMemo(() => {
        return Math.max(0, totalInMicrounits - totalPaidInMicrounits);
    }, [totalInMicrounits, totalPaidInMicrounits]);

    // 5. Vérification si l'addition est 100% soldée
    const isFullyPaid = useMemo(() => {
        return remainingInMicrounits === 0 && totalPaidInMicrounits >= totalInMicrounits;
    }, [remainingInMicrounits, totalPaidInMicrounits, totalInMicrounits]);

    // Action : Payer une part
    const recordConvivePayment = useCallback((conviveIndex: number, method: PaymentMethod) => {
        const amount = getConviveAmount(conviveIndex);

        setPaidConvives(prev => {
            const updated = {
                ...prev,
                [conviveIndex]: {
                    index: conviveIndex,
                    amountInMicrounits: amount,
                    paid: true,
                    method,
                    paidAt: Date.now(),
                }
            };

            // Vérifier si toutes les parts sont maintenant réglées
            const newTotalPaid = Object.values(updated)
                .filter(p => p.paid)
                .reduce((acc, p) => acc + p.amountInMicrounits, 0);

            if (newTotalPaid >= totalInMicrounits) {
                onSplitComplete?.();
            }

            return updated;
        });

        setActivePayingConvive(null);
    }, [getConviveAmount, totalInMicrounits, onSplitComplete]);

    // Action : Assigner un article à un convive
    const toggleItemForConvive = useCallback((conviveIndex: number, cartId: string) => {
        setSelectedItemsByConvive(prev => {
            const current = prev[conviveIndex] || [];
            const exists = current.includes(cartId);
            return {
                ...prev,
                [conviveIndex]: exists
                    ? current.filter(id => id !== cartId)
                    : [...current, cartId]
            };
        });
    }, []);

    // Action : Ajuster le nombre de convives
    const setCovers = useCallback((nextCovers: number) => {
        const validated = Math.max(1, nextCovers);
        setCoversCount(validated);
        setPaidConvives({});
        setSelectedItemsByConvive({});
        setCustomAmountsByConvive({});
        setActivePayingConvive(null);
    }, []);

    // Action : Définir un montant personnalisé
    const setCustomAmount = useCallback((conviveIndex: number, amountInMicrounits: number) => {
        setCustomAmountsByConvive(prev => ({
            ...prev,
            [conviveIndex]: Math.max(0, amountInMicrounits)
        }));
    }, []);

    return {
        mode,
        setMode,
        coversCount,
        setCovers,
        equalParts,
        getConviveAmount,
        paidConvives,
        recordConvivePayment,
        selectedItemsByConvive,
        toggleItemForConvive,
        customAmountsByConvive,
        setCustomAmount,
        activePayingConvive,
        setActivePayingConvive,
        totalPaidInMicrounits,
        remainingInMicrounits,
        isFullyPaid,
    };
}
