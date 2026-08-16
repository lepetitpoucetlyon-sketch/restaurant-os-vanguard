import { makeMccAdapter } from '@/verticals/_shared/adapters';

/** MCC boulangerie = socle universel + métriques santé (fours en ligne, fournées actives). */
export const BakeryMccAdapter = makeMccAdapter<{ ovensOnline: number; activeBatches: number }>();
