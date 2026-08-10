'use client';

import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { nexusPulseAtom } from '../store/accountingAtoms';
import { logger } from '@/lib/logger';

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export function useFinanceReflex() {
    const pulse = useAtomValue(nexusPulseAtom);
    const lastPulseId = useRef<string | null>(null);

    useEffect(() => {
        // Écoute de l'événement waste validé via NexusEventBus (pas de hashes falsifiés)
        const unsub = NexusEventBus.on('inventory.waste_logged', async (payload) => {
            logger.info(`[FINANCE_REFLEX] Pertes inventaire détectées : ${payload.wasteId}`);
            await NexusEventBus.emit('finance.food_cost_impacted', {
                v: 1,
                tenantId: payload.tenantId,
                reason: `perte_inventory_${payload.wasteId}`,
                affectedItems: payload.items.map(item => item.productId),
                impactDate: new Date().toISOString(),
            });
        });

        if (pulse && pulse.id !== lastPulseId.current) {
            lastPulseId.current = pulse.id;
            if (pulse.type === 'HACCP_SET_WASTELOGS' || pulse.type === 'HACCP_WASTE') {
                logger.info(`[FINANCE_REFLEX] Traitement pulse waste : ${pulse.id}`);
            }
        }

        return () => {
            unsub();
        };
    }, [pulse]);
}
