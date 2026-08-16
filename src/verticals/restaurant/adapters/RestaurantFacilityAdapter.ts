import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeFacilityAdapter } from '@/verticals/_shared/adapters';

/** Facility restaurant = socle universel (emitMaintenanceRequired) + delta plan de salle. */
export const RestaurantFacilityAdapter = {
  ...makeFacilityAdapter(),
  emitTableLayoutChanged(payload: { tenantId: string; floorId: string; tables: { id: string; capacity: number; x: number; y: number }[] }) {
    NexusEventBus.emit('facility.floor_plan_updated', payload);
  },
};
