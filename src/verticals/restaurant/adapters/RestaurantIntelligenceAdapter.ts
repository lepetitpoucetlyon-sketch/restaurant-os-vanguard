import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeIntelligenceAdapter } from '@/verticals/_shared/adapters';

/** Intelligence restaurant = socle universel (anomalies) + deltas ventes & menu engineering. */
export const RestaurantIntelligenceAdapter = {
  ...makeIntelligenceAdapter(),
  emitSalesDataReady(payload: { tenantId: string; periodStart: string; periodEnd: string; totalInMicrounits: number; covers: number }) {
    NexusEventBus.emit('analytics.sales_data_ready', payload);
  },
  emitMenuEngineeringRequest(payload: { tenantId: string; periodDays: number }) {
    NexusEventBus.emit('intelligence.menu_engineering_requested', payload);
  },
};
