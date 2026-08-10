import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerFacilityHandlers() {
  const unsubFloorPlan = NexusEventBus.on(
    'facility.floor_plan_updated',
    async (payload) => {
      const { tenantId, floorId, tables } = payload;
      logger.info(`[Facility] Mis à jour plan de salle floorId=${floorId} (${tables.length} tables) pour tenant=${tenantId}`);
      await Nexus.adapter.set(`tenants/${tenantId}/floorPlans/${floorId}`, {
        floorId,
        tables,
        updatedAt: Date.now(),
      }, { merge: true });
    }
  );

  const unsubMaintenance = NexusEventBus.on(
    'facility.maintenance_required',
    async (payload) => {
      const { tenantId, assetId, assetType, description } = payload;
      logger.warn(`[Facility] Ticket de maintenance requis assetId=${assetId} (${assetType}): ${description}`);
      const ticketId = `maint_${assetId}_${Date.now()}`;
      await Nexus.adapter.set(`tenants/${tenantId}/maintenanceTickets/${ticketId}`, {
        assetId,
        assetType,
        description,
        status: 'open',
        createdAt: Date.now(),
      });
      empireAudit.log({
        module: 'inventory',
        action: 'MAINTENANCE_REQUIRED',
        details: { assetId, assetType, description },
        severity: 'medium',
        timestamp: new Date(),
      });
    }
  );

  return () => {
    unsubFloorPlan();
    unsubMaintenance();
  };
}
