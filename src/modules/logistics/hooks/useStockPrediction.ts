'use client';

import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { inventoryMovementsAtom } from '../inventory/store/inventoryAtoms';
import { OracleEngine, OraclePrediction } from '@/domain/services/OracleEngine';
import type { Quantity } from '@/lib/brands';

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
        const itemMovements = allMovements.filter(m => m.stockItemId === itemId);
        setLoading(true);
        OracleEngine.predictStockout(itemId, itemMovements, currentQty as Quantity)
            .then(setPrediction)
            .finally(() => setLoading(false));
    }, [itemId, currentQty, allMovements]);

    return { prediction, loading };
}
