import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

interface IntegrationConfig {
  autoAccept?: boolean;
  notifyRoles?: string[];
}

export function registerOrderAcceptanceWindowHandler() {
  return NexusEventBus.on(
    'integration.delivery_order_received',
    async (payload) => {
      const { tenantId, integrationId, platform, rawPayload } = payload;
      
      const config = await Nexus.adapter.get<IntegrationConfig>(`tenants/${tenantId}/integrations/${integrationId}`);
      
      if (!config || !config.autoAccept) {
        // Multi-RBAC : L'admin peut choisir qui reçoit l'alerte (POS, KDS, Manager...)
        const notifyRoles = config?.notifyRoles || ['pos_cashier'];
        
        logger.info(`[OrderAcceptanceWindow] Commande ${platform} en attente de validation manuelle. Alertes routées vers: ${notifyRoles.join(', ')}`);
        
        // Stockage dans une file d'attente. Le frontend (POS ou KDS) s'abonne à cette collection
        // en fonction de ses propres rôles.
        const pendingId = `pending_${rawPayload.id || Date.now()}`;
        
        await Nexus.adapter.set(`tenants/${tenantId}/pendingDeliveries/${pendingId}`, {
          platform,
          rawPayload,
          receivedAt: Date.now(),
          status: 'awaiting_validation',
          notifyRoles
        });

        // (Si le caissier valide, c'est le frontend/controller qui émettra order.placed et order.paid)

        empireAudit.log({
          module: 'ops',
          action: 'MANUAL_ACCEPTANCE_REQUIRED',
          details: { pendingId, platform },
          severity: 'low',
          timestamp: new Date(),
        });
      }
    },
    { id: 'order-acceptance-window', priority: 'HIGH' }
  );
}
