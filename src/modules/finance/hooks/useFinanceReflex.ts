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
            
            const wasteData = pulse.payload.data;
            
            addJournalEntry({
                date: new Date().toISOString(),
                pieceNumber: `WST-${pulse.id.substring(0, 5)}`,
                description: `Pertes HACCP automatiques : ${wasteData.item || 'Produit inconnu'}`,
                type: 'expense',
                amountInCents: (wasteData.quantity || 1) * 1000, // Débit par défaut 10€ pour simuler
                lines: [
                    { accountCode: '601', accountName: 'Achats stockés - Matières premières', side: 'debit', amountInCents: 1000, accountId: 'acc_601' },
                    { accountCode: '371', accountName: 'Stocks de matières premières', side: 'credit', amountInCents: 1000, accountId: 'acc_371' }
                ],
                isSystemGenerated: true,
                isValidated: false
            });
        }

    }, [pulse, addJournalEntry]);
}
