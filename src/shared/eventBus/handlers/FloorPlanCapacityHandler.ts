import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerFloorPlanCapacityHandler() {
  const handleCapacityEvent = async (payload: any, eventType: string) => {
    const { tenantId, scheduledAt, partySize } = payload;

    if (!scheduledAt) return;

    const dateStr = new Date(scheduledAt).toISOString().split('T')[0];
    const hour = new Date(scheduledAt).getHours();
    const service = hour < 16 ? 'lunch' : 'dinner';
    const capacityId = `${dateStr}-${service}`;

    const capacityPath = `tenants/${tenantId}/capacity/${capacityId}`;

    // Lire maxCovers depuis la config tenant (fallback 100)
    const tenantSettings = await Nexus.adapter.get<{ capacity?: number; maxCovers?: number }>(
      `tenants/${tenantId}/settings/general`
    );
    const configuredMaxCovers = tenantSettings?.maxCovers ?? tenantSettings?.capacity ?? 100;

    await Nexus.adapter.runTransaction(async (tx) => {
      const capacityDoc = await Nexus.adapter.get<any>(capacityPath) || { bookedCovers: 0, maxCovers: configuredMaxCovers };

      // Toujours synchroniser maxCovers depuis la config tenant
      capacityDoc.maxCovers = configuredMaxCovers;

      let diff = 0;
      if (eventType === 'reservation.created') diff = partySize;
      if (eventType === 'reservation.cancelled') diff = -partySize;
      if (eventType === 'reservation.updated') {
        diff = payload.updates?.partySizeDiff || 0;
      }

      const newTotal = Math.max(0, capacityDoc.bookedCovers + diff);

      await Nexus.adapter.set(capacityPath, {
        ...capacityDoc,
        bookedCovers: newTotal,
        updatedAt: Date.now()
      });

      // Alerte si le restaurant est complet pour ce service
      if (newTotal >= configuredMaxCovers && diff > 0) {
        logger.warn(`[FloorPlanCapacity] Restaurant complet pour ${capacityId} : ${newTotal}/${configuredMaxCovers} couverts`);
        NexusEventBus.emitDurable('notification.created', {
          v: 1,
          tenantId,
          id: `alert-capacity-full-${capacityId}`,
          type: 'warning',
          title: 'Restaurant Complet',
          message: `Le service ${service === 'lunch' ? 'du midi' : 'du soir'} du ${dateStr} est complet (${newTotal}/${configuredMaxCovers} couverts). Les nouvelles réservations risquent de dépasser la capacité.`,
          priority: 'high',
          read: false,
          timestamp: new Date().toISOString()
        });
      }

      empireAudit.log({
        module: 'ops',
        action: 'CAPACITY_UPDATED',
        details: { capacityId, oldTotal: capacityDoc.bookedCovers, newTotal, maxCovers: configuredMaxCovers },
        severity: newTotal >= configuredMaxCovers ? 'medium' : 'low',
        timestamp: new Date(),
      });
    });
  };

  const unsubCreated = NexusEventBus.on('reservation.created', (p) => handleCapacityEvent(p, 'reservation.created'), { id: 'capacity-created', priority: 'HIGH' });
  const unsubUpdated = NexusEventBus.on('reservation.updated', (p) => handleCapacityEvent(p, 'reservation.updated'), { id: 'capacity-updated', priority: 'HIGH' });
  const unsubCancelled = NexusEventBus.on('reservation.cancelled', (p) => handleCapacityEvent(p, 'reservation.cancelled'), { id: 'capacity-cancelled', priority: 'HIGH' });

  return () => {
    unsubCreated();
    unsubUpdated();
    unsubCancelled();
  };
}
