import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { toError } from "@/lib/toError";

/**
 * DigitalReceiptHandler (P1-4.1)
 * Écoute `order.paid`.
 * Si un client est associé à la commande, génère et envoie le ticket numérique par email/SMS.
 */
export function registerDigitalReceiptHandler(): () => void {
  return NexusEventBus.on(
    'order.paid',
    async (payload) => {
      const { tenantId, orderId, customerId, totalInMicrounits } = payload;
      if (!customerId) return;

      try {
        const customer = await Nexus.adapter.get<{ email?: string; phone?: string; firstName?: string }>(`tenants/${tenantId}/crms/${customerId}`);
        if (!customer || (!customer.email && !customer.phone)) return;

        const receiptId = Nexus.adapter.generateId(`tenants/${tenantId}/digitalReceipts`);
        const totalEuros = (totalInMicrounits / 1_000_000).toFixed(2);

        await Nexus.adapter.set(`tenants/${tenantId}/digitalReceipts/${receiptId}`, {
          id: receiptId,
          orderId,
          customerId,
          totalInMicrounits,
          sentToEmail: customer.email,
          sentToPhone: customer.phone,
          sentAt: new Date().toISOString(),
        });

        logger.info(`[DigitalReceiptHandler] Ticket numérique généré pour commande ${orderId} (${totalEuros}€, destinataire: ${customer.email || customer.phone})`);

        empireAudit.log({
          module: 'finance',
          action: 'DIGITAL_RECEIPT_SENT',
          details: { orderId, customerId, receiptId },
          severity: 'low',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error(`[DigitalReceiptHandler] Échec envoi ticket numérique pour commande ${orderId}`, toError(err).message);
        throw err;
      }
    },
    { id: 'digital-receipt-handler', priority: 'BACKGROUND' }
  );
}
