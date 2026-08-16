import { makeMccAdapter } from '@/verticals/_shared/adapters';

/** MCC hôtel = socle universel + métriques santé (PMS en ligne, taux d'occupation). */
export const HotelMccAdapter = makeMccAdapter<{ pmsOnline: boolean; occupancy: number }>();
