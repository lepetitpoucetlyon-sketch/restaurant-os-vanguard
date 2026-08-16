import { makeMccAdapter } from '@/verticals/_shared/adapters';

/** MCC clinique = socle universel + métriques santé (conformité HDS, lits dispos). */
export const HealthMccAdapter = makeMccAdapter<{ hdsCompliant: boolean; bedsAvailable: number }>();
