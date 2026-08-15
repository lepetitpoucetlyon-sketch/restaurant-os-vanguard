import { makeMccAdapter } from '@/verticals/_shared/adapters';

/** MCC salon = socle universel + métriques santé propres (fauteuils, RDV du jour). */
export const SalonMccAdapter = makeMccAdapter<{ chairsActive: number; appointmentsToday: number }>();
