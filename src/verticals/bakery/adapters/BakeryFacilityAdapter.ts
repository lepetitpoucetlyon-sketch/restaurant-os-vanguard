import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const BakeryFacilityAdapter = {
  emitOvenMaintenanceRequired(payload: { tenantId: string; assetId: string; assetType: string; description: string }) {
    NexusEventBus.emitDurable('facility.maintenance_required', payload);
  },
};
