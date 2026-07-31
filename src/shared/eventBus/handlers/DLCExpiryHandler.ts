import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerDLCExpiryHandler() {
  return NexusEventBus.on(
    'dlc.expired',
    async (payload) => {
      const { tenantId, itemId, quantity, batchNumber } = payload;

      const path = `tenants/${tenantId}/stockItems/${itemId}`;
      const item = await Nexus.adapter.get<{ quantity?: number; name?: string }>(path);
      
      if (item) {
        const newQty = Math.max(0, (item.quantity ?? 0) - quantity);
        await Nexus.adapter.update(path, {
          quantity: newQty,
          updatedAt: Date.now()
        });

        // Emet l'événement de perte HACCP qui va à son tour déduire le Food Cost etc.
        await NexusEventBus.emitDurable('waste.logged', {
          v: 1,
          tenantId,
          wasteId: crypto.randomUUID(),
          ingredientId: itemId,
          ingredientName: item.name ?? itemId,
          quantity,
          unit: 'unit', // On suppose
          reason: `DLC Expirée (Lot: ${batchNumber})`
        });
      }

      empireAudit.log({
        module: 'compliance',
        action: 'DLC_EXPIRED_DEDUCTED',
        details: { itemId, batchNumber, quantity },
        severity: 'high',
        timestamp: new Date(),
      });
    },
    { id: 'dlc-expiry-handler', priority: 'HIGH' }
  );
}
