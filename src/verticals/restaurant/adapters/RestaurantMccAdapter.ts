import { makeMccAdapter } from '@/verticals/_shared/adapters';

/** MCC restaurant = socle universel + métriques santé (POS/KDS/imprimante en ligne). */
export const RestaurantMccAdapter = makeMccAdapter<{ posOnline: boolean; kdsOnline: boolean; printerOnline: boolean }>();
