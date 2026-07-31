import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { NotificationGateway } from '@/infrastructure/adapters/NotificationGateway';

export class StripePaymentRetryHandler {
  static register() {
    return NexusEventBus.on('finance.payment_failed', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, invoiceId, customerId, amountInMicrounits, reason } = payload;
      
      logger.warn(`[StripePaymentRetry] Paiement échoué pour la facture ${invoiceId} (Client: ${customerId}). Motif: ${reason}`);

      try {
        const retryId = `retry_${invoiceId}_${Date.now()}`;
        await Nexus.adapter.update(`tenants/${tenantId}/finance/retries/${retryId}`, {
            invoiceId,
            customerId,
            amountInMicrounits,
            reason,
            status: 'pending',
            nextRetryAt: Date.now() + 86400000, // +24 hours
            updatedAt: Date.now()
        });

        empireAudit.log({
            module: 'finance',
            action: 'STRIPE_PAYMENT_FAILED',
            userId: 'system',
            instanceId: tenantId,
            details: { invoiceId, amountInMicrounits, reason, retryId },
            severity: 'high',
            timestamp: new Date(),
        });
        
        // Email de relance (dunning) au propriétaire du tenant
        const nextRetryDate = new Date(Date.now() + 86400000).toLocaleDateString('fr-FR');
        try {
          const tenantSettings = await Nexus.adapter.get<{ contact?: { emailGeneral?: string } }>(
            `tenants/${tenantId}/settings/general`
          );
          const ownerEmail = tenantSettings?.contact?.emailGeneral;
          if (ownerEmail) {
            await NotificationGateway.send({
              tenantId,
              to: ownerEmail,
              subject: `Échec de paiement — Facture ${invoiceId}`,
              text: [
                `Le paiement de ${(amountInMicrounits / 1_000_000).toFixed(2)} € pour la facture ${invoiceId} a échoué.`,
                `Motif : ${reason}`,
                `Une relance automatique est programmée le ${nextRetryDate}.`,
                `Veuillez vérifier votre moyen de paiement pour éviter toute interruption de service.`
              ].join('\n'),
              channel: 'email'
            });
          } else {
            logger.warn(`[StripePaymentRetryHandler] Pas d'email propriétaire configuré pour tenant ${tenantId}, dunning email non envoyé.`);
          }
        } catch (emailErr) {
          logger.error('[StripePaymentRetryHandler] Erreur envoi email dunning', String(emailErr));
        }

        // Notification in-app DAF
        NexusEventBus.emitDurable('notification.created', {
            v: 1,
            tenantId,
            id: `alert-stripe-fail-${invoiceId}`,
            type: 'error',
            title: 'Échec de paiement (SaaS)',
            message: `Le paiement de ${(amountInMicrounits / 1000000).toFixed(2)}€ a échoué (${reason}). Une relance automatique a été planifiée pour demain.`,
            priority: 'high',
            read: false,
            timestamp: new Date().toISOString()
        });
      } catch (err) {
        logger.error('[StripePaymentRetryHandler] Error queuing retry', String(err));
      }
    }, { id: 'stripe-payment-retry', priority: 'HIGH' });
  }
}
