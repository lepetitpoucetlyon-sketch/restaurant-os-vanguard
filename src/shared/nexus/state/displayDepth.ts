'use client';

import { z } from 'zod';
import { useAtom } from 'jotai';
import { SovereignStorage } from '@/shared/services/SovereignStorage';

export const DisplayDepthSchema = z.enum(['essential', 'manager', 'enterprise']).default('manager');
export type DisplayDepthLevel = z.infer<typeof DisplayDepthSchema>;

/**
 * 🎛️ displayDepthAtom — Niveau de profondeur d'affichage du tenant / session
 * - 'essential'  : Vue Focus (3 boutons clés, zéro surcharge cognitive, pilote auto pour compta/stocks)
 * - 'manager'    : Vue Gestionnaire (statistiques, marges, écarts, gestion complète)
 * - 'enterprise' : Vue Expert (Grand Livre, audit trail SHA-256, FEC 19 col, télémétrie IoT)
 */
export const displayDepthAtom = SovereignStorage.atomWithSovereignStorage<DisplayDepthLevel>(
    'nexus_display_depth',
    DisplayDepthSchema,
    'manager'
);

export function useDisplayDepth() {
    const [depth, setDepth] = useAtom(displayDepthAtom);

    const isEssential = depth === 'essential';
    const isManager = depth === 'manager';
    const isEnterprise = depth === 'enterprise';

    const setNextDepth = () => {
        if (depth === 'essential') setDepth('manager');
        else if (depth === 'manager') setDepth('enterprise');
        else setDepth('essential');
    };

    return {
        depth,
        isEssential,
        isManager,
        isEnterprise,
        setDepth,
        setNextDepth,
    };
}
