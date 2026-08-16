import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeFacilityAdapter } from '@/verticals/_shared/adapters';

/** Facility boulangerie = socle universel + alias métier maintenance four. */
export const BakeryFacilityAdapter = {
  ...makeFacilityAdapter(),
  emitOvenMaintenanceRequired(payload: { tenantId: string; assetId: string; assetType: string; description: string }) {
    NexusEventBus.emitDurable('facility.maintenance_required', payload);
  },
};
