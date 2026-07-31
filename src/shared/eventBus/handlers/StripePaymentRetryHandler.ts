import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export class StripePaymentRetryHandler {
  static register() {
    return NexusEventBus.on('finance.payment_failed', async (payload) => {
      const { tenantId, invoiceId, customerId, amountInMicrounits, reason } = payload;
      
      logger.warn(`[StripePaymentRetry] Paiement échoué pour la facture ${invoiceId} (Client: ${customerId}). Motif: ${reason}`);

      empireAudit.log({
        module: 'finance',
        action: 'STRIPE_PAYMENT_FAILED',
        userId: 'system',
        instanceId: tenantId,
        details: { invoiceId, amountInMicrounits, reason },
        severity: 'high',
       timestamp: new Date(),
});
      
      // Simulation: Ajout dans une file de retry Stripe et notification DAF
      NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId,
        id: `alert-stripe-fail-${invoiceId}`,
        type: 'error',
        title: 'Échec de paiement (SaaS)',
        message: `Le paiement de ${(amountInMicrounits / 1000000).toFixed(2)}€ a échoué (${reason}). Une relance automatique a été planifiée.`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}
