import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

interface PurchaseOrderRecord {
  id: string;
  status: string;
  createdAt: string;
  supplierName?: string;
}

/**
 * DraftPOEscalationJob (P1-4.8)
 * Se déclenche quotidiennement à 08h00.
 * Scanne les bons de commande fournisseurs restés en statut "draft" depuis plus de 24h et alerte le manager.
 */
export const DraftPOEscalationJob = {
  name: 'DraftPOEscalationJob',
  schedule: '0 8 * * *', // 08h00 chaque matin
  async runForTenant(tenantId: string): Promise<void> {
    try {
      const pos = await Nexus.adapter.query<PurchaseOrderRecord>(`tenants/${tenantId}/purchaseOrders`);
      const now = Date.now();
      const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

      for (const po of pos) {
        if (po.status === 'draft') {
          const createdTime = new Date(po.createdAt).getTime();
          if (!isNaN(createdTime) && createdTime <= twentyFourHoursAgo) {
            logger.warn(`[DraftPOEscalationJob] PO brouillon ${po.id} en attente depuis > 24h (Fournisseur: ${po.supplierName || 'N/A'})`);

            await NexusEventBus.emitDurable('notification.urgent', {
              v: 1,
              tenantId,
              message: `Bon de commande fournisseur ${po.id} en attente de validation depuis plus de 24h.`,
              roles: ['manager', 'directeur'],
              priority: 'HIGH',
              metadata: { purchaseOrderId: po.id, supplierName: po.supplierName },
            });
          }
        }
      }
    } catch (err) {
      logger.error(`[DraftPOEscalationJob] Échec du scan POs brouillon pour tenant ${tenantId}`, toError(err).message);
    }
  },
};
