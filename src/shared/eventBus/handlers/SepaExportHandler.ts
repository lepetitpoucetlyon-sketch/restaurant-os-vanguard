import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerSepaExportHandler() {
  return NexusEventBus.on(
    'finance.payment_dispatched',
    async (payload) => {
      const { tenantId, paymentBatchId, totalAmountInMicrounits, dispatchedBy } = payload;
      
      logger.info(`[SepaExport] Fichier SEPA ${paymentBatchId} émis par ${dispatchedBy} pour un total de ${totalAmountInMicrounits / 1000000} EUR.`);

      // En réalité, on mettrait à jour toutes les factures contenues dans ce batch
      // pour passer leur statut à 'paid' et générer l'écriture de décaissement (Cash Out).

      empireAudit.log({
        module: 'finance',
        action: 'SEPA_PAYMENT_DISPATCHED',
        details: { paymentBatchId, totalAmountInMicrounits },
        severity: 'high', // Impact financier direct
        timestamp: new Date(),
      });
    },
    { id: 'sepa-export', priority: 'BACKGROUND' }
  );
}
