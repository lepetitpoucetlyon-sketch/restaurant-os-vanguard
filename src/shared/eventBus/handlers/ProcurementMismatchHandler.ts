import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { toError } from "@/lib/toError";

/**
 * ProcurementMismatchHandler (P0-1.6)
 * Écoute `procurement.mismatch_detected`.
 * Traite les écarts de prix/quantité entre PO et livraison, émet `finance.food_cost_impacted` et alerte le comptable.
 */
export function registerProcurementMismatchHandler(): () => void {
  return NexusEventBus.on(
    'procurement.mismatch_detected',
    async (payload) => {
      const { tenantId, purchaseOrderId, invoiceId, discrepancies } = payload;

      try {
        logger.warn(`[ProcurementMismatchHandler] Écart livraison vs commande PO ${purchaseOrderId} (Invoice: ${invoiceId}): ${discrepancies.join('; ')}`);

        // 1. Marquer la facture en révision dans la base
        await Nexus.adapter.runTransaction(async (transaction) => {
          const po = await transaction.get<Record<string, unknown>>(`tenants/${tenantId}/purchaseOrders/${purchaseOrderId}`);
          if (po) {
            transaction.update(`tenants/${tenantId}/purchaseOrders/${purchaseOrderId}`, {
              hasDiscrepancies: true,
              discrepancies,
              status: 'mismatch_flagged',
            });
          }
        });

        // 2. Émettre finance.food_cost_impacted pour redéclencher le recalcul de la marge
        await NexusEventBus.emitDurable('finance.food_cost_impacted', {
          v: 1,
          tenantId,
          reason: 'procurement_mismatch',
          affectedItems: discrepancies,
          impactDate: new Date().toISOString(),
        });

        // 3. Alerte comptable / manager
        await NexusEventBus.emitDurable('notification.urgent', {
          v: 1,
          tenantId,
          message: `Écart de livraison détecté sur le PO ${purchaseOrderId} : ${discrepancies.join(', ')}`,
          roles: ['comptable', 'manager'],
          priority: 'HIGH',
          metadata: { purchaseOrderId, invoiceId, discrepancies },
        });

        // 4. Audit
        empireAudit.log({
          module: 'inventory',
          action: 'PROCUREMENT_MISMATCH',
          details: { purchaseOrderId, invoiceId, discrepancies },
          severity: 'medium',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error(`[ProcurementMismatchHandler] Échec du traitement de l'écart PO ${purchaseOrderId}`, toError(err).message);
      }
    },
    { id: 'procurement-mismatch-handler', priority: 'HIGH' }
  );
}
