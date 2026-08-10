import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerTaxMismatchAlertHandler() {
  return NexusEventBus.on(
    'finance.tax_mismatch',
    async (payload) => {
      const { tenantId, orderId, expectedTax, actualTax, date } = payload;
      
      const mismatchAmount = Math.abs(expectedTax - actualTax);
      const isSevere = mismatchAmount > 50000; // Si plus de 0.50€ de décalage, c'est grave
      
      logger.warn(`[TaxMismatch] Décalage de TVA détecté (Attendu: ${expectedTax}, Actuel: ${actualTax}, Order: ${orderId || 'N/A'})`);
      
      empireAudit.log({
        module: 'finance',
        action: 'TAX_MISMATCH_DETECTED',
        details: { orderId, expectedTax, actualTax, date, mismatchAmount },
        severity: isSevere ? 'high' : 'medium',
        timestamp: new Date(),
      });
      
      // Alerter la direction ou le comptable si le décalage est significatif
      if (isSevere) {
        await NexusEventBus.emit('notification.urgent', {
          v: 1,
          tenantId,
          message: `ALERTE COMPTABILITÉ: Décalage de TVA détecté de ${(mismatchAmount/100000).toFixed(2)}€ sur l'ordre ${orderId || date}. Une vérification est requise.`,
          roles: ['admin', 'manager'],
          priority: 'HIGH',
        });
      }
      
      // Tracer dans l'audit système de façon inaltérable
      await NexusEventBus.emit('system.audit_log', {
        v: 1,
        tenantId,
        action: 'TAX_MISMATCH',
        userId: 'system',
        details: { orderId, expectedTax, actualTax, date },
        severity: isSevere ? 'high' : 'medium',
      });
    },
    { id: 'tax-mismatch-alert-handler', priority: 'HIGH' }
  );
}
