import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';

export function registerStockTransferHandler() {
  return NexusEventBus.on(
    'stock.transfer',
    async (payload) => {
      const { tenantId: _tenantId, fromLocationId, toLocationId, itemId, quantity, operatorId } = payload;
      
      // En réalité "tenantId" pourrait être the main tenant, et "from/to" seraient des sous-locations.
      // Si c'est inter-tenant, il faudrait modifier les path. On suppose ici des sous-locations d'un même tenant,
      // ou bien fromLocation/toLocation sont les tenantIds ?
      // L'énoncé dit "déduction A, crédit B". Supposons que fromLocationId et toLocationId = tenantIds.
      
      const fromPath = `tenants/${fromLocationId}/stockItems/${itemId}`;
      const toPath = `tenants/${toLocationId}/stockItems/${itemId}`;

      // 1. Déduire fromLocation
      const fromItem = await Nexus.adapter.get<{ quantity?: number }>(fromPath);
      if (fromItem) {
        await Nexus.adapter.update(fromPath, {
          quantity: Math.max(0, (fromItem.quantity ?? 0) - quantity),
          updatedAt: Date.now()
        });
      }

      // 2. Créditer toLocation
      const toItem = await Nexus.adapter.get<{ quantity?: number }>(toPath);
      if (toItem) {
        await Nexus.adapter.update(toPath, {
          quantity: (toItem.quantity ?? 0) + quantity,
          updatedAt: Date.now()
        });
      }

      empireAudit.log({
        module: 'inventory',
        action: 'STOCK_TRANSFERRED',
        details: { fromLocationId, toLocationId, itemId, quantity, operatorId },
        severity: 'medium',
        timestamp: new Date(),
      });
    },
    { id: 'stock-transfer-handler', priority: 'HIGH' }
  );
}
