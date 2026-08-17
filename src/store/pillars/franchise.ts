/**
 * 🏛️ FRANCHISE & MULTI-SITES JOTAI ATOMS
 * State management pour le pilotage réseau multi-restaurants.
 */

import { atom } from 'jotai';
import type {
    FranchiseSiteOverview,
    FranchiseConsolidatedMetrics,
    InterSiteTransfer
} from '@/shared/nexus/contracts/franchise.types';

export const franchiseSitesAtom = atom<FranchiseSiteOverview[]>([]);
export const franchiseConsolidatedMetricsAtom = atom<FranchiseConsolidatedMetrics | null>(null);
export const franchiseTransfersAtom = atom<InterSiteTransfer[]>([]);
export const isFranchiseLoadingAtom = atom<boolean>(false);
export const activeFranchiseSiteFilterAtom = atom<string>('ALL');
