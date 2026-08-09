import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

import { withRoleGuard } from '../middleware/withRoleGuard';

export function registerSepaExportHandler() {
  return NexusEventBus.on(
    'finance.payment_dispatched',
    withRoleGuard('admin', async (payload) => {
      const { tenantId, paymentBatchId, totalAmountInMicrounits, dispatchedBy } = payload;

      logger.info(`[SepaExport] Fichier SEPA ${paymentBatchId} émis par ${dispatchedBy} pour un total de ${totalAmountInMicrounits / 1000000} EUR.`);

      try {
        const pendingInvoices = await Nexus.adapter.query<{ id: string; status: string; sepaBatchId?: string }>(
          `tenants/${tenantId}/supplierInvoices`,
          { where: [{ field: 'sepaBatchId', operator: '==', value: paymentBatchId }] }
        );

        for (const inv of pendingInvoices) {
          if (inv.status !== 'paid') {
            await Nexus.adapter.update(
              `tenants/${tenantId}/supplierInvoices/${inv.id}`,
              { status: 'paid', paidAt: Date.now() }
            );
          }
        }

        logger.info(`[SepaExport] ${pendingInvoices.length} facture(s) marquées payées pour le batch ${paymentBatchId}`);
      } catch (err) {
        logger.error(`[SepaExport] Erreur lors de la mise à jour des factures du batch ${paymentBatchId}`, toError(err).message);
        throw err;
      }

      empireAudit.log({
        module: 'finance',
        action: 'SEPA_PAYMENT_DISPATCHED',
        details: { paymentBatchId, totalAmountInMicrounits, dispatchedBy },
        severity: 'high',
        timestamp: new Date(),
      });
    }),
    { id: 'sepa-export', priority: 'BACKGROUND' }
  );
}
