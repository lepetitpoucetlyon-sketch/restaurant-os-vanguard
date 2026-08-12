import { NexusEventBus } from '@orchestration/NexusEventBus';

export const RestaurantFacilityAdapter = {
  emitTableLayoutChanged(payload: { tenantId: string; floorId: string; tables: { id: string; capacity: number; x: number; y: number }[] }) {
    NexusEventBus.emit('facility.floor_plan_updated', payload);
  },
  emitMaintenanceRequired(payload: { tenantId: string; assetId: string; assetType: string; description: string }) {
    NexusEventBus.emitDurable('facility.maintenance_required', payload);
  },
};
