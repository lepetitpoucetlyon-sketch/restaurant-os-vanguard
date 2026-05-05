'use client';

import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { nexusPulseAtom } from '../store/accountingAtoms';
import { useAccounting } from './useAccounting';
import { logger } from '@/lib/logger';

export function useFinanceReflex() {
    const pulse = useAtomValue(nexusPulseAtom);
    const { addJournalEntry } = useAccounting();
    const lastPulseId = useRef<string | null>(null);

    useEffect(() => {
        if (!pulse || pulse.id === lastPulseId.current) return;
        lastPulseId.current = pulse.id;

        // 🏛️ RÉFLEXE : HACCP WASTE -> FINANCE EXPENSE
        if (pulse.type === 'HACCP_SET_WASTELOGS' || pulse.type === 'HACCP_WASTE') {
            logger.info(`[FINANCE_REFLEX] Reaction to HACCP Waste: ${pulse.id}`);
            
            const wasteData = pulse.payload.data as { item?: string; quantity?: number };
            const { toMicrounits } = require('@/domain/schemas/primitives');
            const { SovereignMath } = require('@/shared/services/SovereignMath');
            
            addJournalEntry({
                id: `ref_${pulse.id.substring(0, 8)}`,
                serverTimestamp: Date.now(),
                pieceNumber: `WST-${pulse.id.substring(0, 5)}`,
                description: `Pertes HACCP automatiques : ${wasteData.item || 'Produit inconnu'}`,
                type: 'expense',
                amountInMicrounits: toMicrounits(SovereignMath.fromCents((wasteData.quantity || 1) * 1000)), // 10€ par unité
                taxRate: '0.20',
                taxAmountInMicrounits: toMicrounits(0),
                operatorId: 'SYSTEM',
                deviceId: 'HACCP_SCANNER',
                correlationId: pulse.id,
                status: 'validated',
                hash: '1'.repeat(64),
                hashPrecedent: '0'.repeat(64),
            } as any);
        }

    }, [pulse, addJournalEntry]);
}
