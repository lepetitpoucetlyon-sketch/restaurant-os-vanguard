'use client';

import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { inventoryMovementsAtom } from '../stock/inventory/store/inventoryAtoms';
import type { OraclePrediction } from '../domain/schemas/inventory';
import type { Quantity } from '@/lib/branding/brands';

interface UseOraclePredictionResult {
    prediction: OraclePrediction | null;
    loading: boolean;
}

export function useStockPrediction(
    itemId: string,
    currentQty: number
): UseOraclePredictionResult {
    const allMovements = useAtomValue(inventoryMovementsAtom);
    const [prediction, setPrediction] = useState<OraclePrediction | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const itemMovements = (allMovements || []).filter((m: { stockItemId?: string }) => m.stockItemId === itemId);
        setLoading(true);
        import('@/modules/intelligence/services/OracleEngine')
            .then(({ OracleEngine }) => OracleEngine.predictStockout(itemId, itemMovements, currentQty as Quantity))
            .then(setPrediction)
            .finally(() => setLoading(false));
    }, [itemId, currentQty, allMovements]);

    return { prediction, loading };
}
