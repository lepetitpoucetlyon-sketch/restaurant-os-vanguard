import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerPaymentRejectAuditHandler() {
  return NexusEventBus.on(
    'payment.rejected',
    async (payload) => {
      const { tenantId, orderId, reason, amountInMicrounits } = payload;
      
      logger.warn(`[PaymentReject] Rejet de paiement sur commande ${orderId} (${reason})`);
      
      // Enregistrer une entrée suspicieuse dans l'audit ledger (P08-C)
      empireAudit.log({
        module: 'finance',
        action: 'PAYMENT_REJECTED',
        details: { orderId, reason, amountInMicrounits },
        severity: 'medium', // Peut devenir high si fréquences élevées
        timestamp: new Date(),
      });
      
      // On peut aussi consigner ce rejet de façon immuable via un appel à system.audit_log 
      // pour le stocker dans la base avec le TechAuditLedgerHandler
      await NexusEventBus.emit('system.audit_log', {
        v: 1,
        tenantId,
        action: 'PAYMENT_REJECTED',
        userId: 'system',
        details: { orderId, reason, amountInMicrounits },
        severity: 'medium',
      });
    },
    { id: 'payment-reject-audit-handler', priority: 'HIGH' }
  );
}
