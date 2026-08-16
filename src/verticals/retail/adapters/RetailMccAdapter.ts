import { makeMccAdapter } from '@/verticals/_shared/adapters';

/** MCC retail = socle universel + métriques santé (POS en ligne, alertes stock). */
export const RetailMccAdapter = makeMccAdapter<{ posOnline: boolean; stockAlertsCount: number }>();
