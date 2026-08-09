import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { toError } from "@/lib/toError";

const ANOMALY_THRESHOLD_MICROUNITS = 5_000_000; // 5€ (5 millions de microunités)

/**
 * CashCountReconciliationHandler (P0-1.4)
 * Écoute `finance.cash_counted`.
 * Calcule l'écart (actual vs expected), persiste le log et déclenche une alerte si |delta| > 5€.
 */
export function registerCashCountReconciliationHandler(): () => void {
  return NexusEventBus.on(
    'finance.cash_counted',
    async (payload) => {
      const { tenantId, drawerId, expectedAmountInMicrounits, actualAmountInMicrounits, countedBy } = payload;
      const deltaInMicrounits = actualAmountInMicrounits - expectedAmountInMicrounits;
      const logId = Nexus.adapter.generateId(`tenants/${tenantId}/cashCountLogs`);
      const timestamp = new Date().toISOString();

      try {
        // 1. Persistance du rapport de réconciliation de caisse
        await Nexus.adapter.set(`tenants/${tenantId}/cashCountLogs/${logId}`, {
          id: logId,
          drawerId,
          expectedAmountInMicrounits,
          actualAmountInMicrounits,
          deltaInMicrounits,
          countedBy,
          timestamp,
        });

        logger.info(`[CashCountReconciliation] Réconciliation tiroir ${drawerId}: Écart = ${(deltaInMicrounits / 1_000_000).toFixed(2)}€`);

        // 2. Détection d'anomalie si |delta| > 5€
        if (Math.abs(deltaInMicrounits) > ANOMALY_THRESHOLD_MICROUNITS) {
          const deltaEuros = (deltaInMicrounits / 1_000_000).toFixed(2);
          logger.warn(`[CashCountReconciliation] Écart de caisse critique détecté (${deltaEuros}€ par ${countedBy})`);

          // Alerte urgente vers manager, directeur et comptable
          await NexusEventBus.emitDurable('notification.urgent', {
            v: 1,
            tenantId,
            message: `Écart de caisse significatif (${deltaEuros}€) constaté par ${countedBy} sur le tiroir ${drawerId}.`,
            roles: ['manager', 'directeur', 'comptable'],
            priority: 'HIGH',
            metadata: { drawerId, deltaInMicrounits, logId },
          });
        }

        // 3. Audit Empire
        empireAudit.log({
          module: 'finance',
          action: 'CASH_COUNTED',
          details: { drawerId, expectedAmountInMicrounits, actualAmountInMicrounits, deltaInMicrounits, countedBy },
          severity: Math.abs(deltaInMicrounits) > ANOMALY_THRESHOLD_MICROUNITS ? 'medium' : 'low',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error(`[CashCountReconciliation] Erreur lors de la réconciliation de caisse ${drawerId}`, toError(err).message);
        throw err;
      }
    },
    { id: 'cash-count-reconciliation-handler', priority: 'HIGH' }
  );
}
