'use client';

import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { inventoryMovementsAtom } from '../inventory/store/inventoryAtoms';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { OracleEngine } from '@/modules/intelligence/services/OracleEngine';
import type { OraclePrediction } from '@/domain/schemas/inventory';
import type { Quantity } from '@/infrastructure/branding/brands';

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
