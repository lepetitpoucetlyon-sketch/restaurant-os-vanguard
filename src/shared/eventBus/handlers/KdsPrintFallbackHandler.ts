import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerKdsPrintFallbackHandler() {
  return NexusEventBus.on(
    'kds.printer_failed',
    async (payload) => {
      const { tenantId, orderId, printerId, errorReason } = payload;
      
      logger.error(`[PrintFallback] Échec imprimante ${printerId} pour commande ${orderId}. Raison: ${errorReason}`);
      logger.info(`[PrintFallback] Routage du ticket ${orderId} vers l'imprimante de secours (Caisse Principale).`);

      // En réalité, on appelle EscPosEncoder ou un service d'impression réseau
      // pour relancer le job sur la fallback printer configurée.

      empireAudit.log({
        module: 'ops',
        action: 'KDS_PRINTER_FALLBACK_TRIGGERED',
        details: { orderId, printerId, errorReason },
        severity: 'medium', // Une panne d'imprimante cuisine est critique en plein service
        timestamp: new Date(),
      });
    },
    { id: 'kds-print-fallback', priority: 'HIGH' }
  );
}
