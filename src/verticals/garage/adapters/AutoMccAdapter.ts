import { makeMccAdapter } from '@/verticals/_shared/adapters';

/** MCC garage = socle universel + métriques santé (ponts opérationnels, OR actifs). */
export const AutoMccAdapter = makeMccAdapter<{ liftsOperational: number; activeWorkOrders: number }>();
