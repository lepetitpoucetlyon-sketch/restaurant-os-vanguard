import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerFloorPlanCapacityHandler() {
  const handleCapacityEvent = async (payload: any, eventType: string) => {
    const { tenantId, scheduledAt, partySize } = payload;
    
    if (!scheduledAt) return; 

    const dateStr = new Date(scheduledAt).toISOString().split('T')[0];
    const hour = new Date(scheduledAt).getHours();
    const service = hour < 16 ? 'lunch' : 'dinner';
    const capacityId = `${dateStr}-${service}`;
    
    const capacityPath = `tenants/${tenantId}/capacity/${capacityId}`;

    await Nexus.adapter.runTransaction(async (tx) => {
      const capacityDoc = await Nexus.adapter.get<any>(capacityPath) || { bookedCovers: 0, maxCovers: 100 };
      
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

      empireAudit.log({
        module: 'ops',
        action: 'CAPACITY_UPDATED',
        details: { capacityId, oldTotal: capacityDoc.bookedCovers, newTotal },
        severity: 'low',
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
