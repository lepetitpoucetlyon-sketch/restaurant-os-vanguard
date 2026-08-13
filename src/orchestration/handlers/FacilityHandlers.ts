import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { assertHandlerTenant } from '../guards/assertHandlerTenant';

export function registerFacilityHandlers() {
  const unsubFloorPlan = NexusEventBus.on(
    'facility.floor_plan_updated',
    async (payload) => {
      const { tenantId, floorId, tables } = payload;
      const path = `tenants/${tenantId}/floorPlans/${floorId}`;
      assertHandlerTenant('facility-floor-plan', tenantId, path);
      logger.info(`[Facility] Mis à jour plan de salle floorId=${floorId} (${tables.length} tables) pour tenant=${tenantId}`);
      await Nexus.adapter.set(path, {
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
      const ticketId = `maint_${assetId}_${Date.now()}`;
      const path = `tenants/${tenantId}/maintenanceTickets/${ticketId}`;
      assertHandlerTenant('facility-maintenance', tenantId, path);
      logger.warn(`[Facility] Ticket de maintenance requis assetId=${assetId} (${assetType}): ${description}`);
      await Nexus.adapter.set(path, {
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
