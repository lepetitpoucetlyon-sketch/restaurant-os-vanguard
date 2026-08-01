import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { NotificationGateway } from '@/infrastructure/adapters/NotificationGateway';
import { WebPushService } from '@/lib/push/webPushService';
import { logger } from '@/lib/logger';

type ReminderLevel = 'J+30' | 'J+60' | 'contentieux';

/**
 * OverdueInvoiceHandler (P07-I)
 * Écoute invoice.overdue et applique une escalade par palier :
 * - <= 30 j   : relance douce (email)
 * - 31–60 j   : relance ferme + tag 'payment_risk'
 * - > 60 j    : contentieux + alerte haute priorité + WebPush manager
 */
export function registerOverdueInvoiceHandler(): () => void {
  return NexusEventBus.on(
    'invoice.overdue',
    async (payload) => {
      const { tenantId, invoiceId, customerId, amountInMicrounits, dueDaysOverdue } = payload;

      const now = new Date().toISOString();

      // Déterminer le niveau de relance
      let niveau: ReminderLevel;
      if (dueDaysOverdue <= 30) {
        niveau = 'J+30';
      } else if (dueDaysOverdue <= 60) {
        niveau = 'J+60';
      } else {
        niveau = 'contentieux';
      }

      // Lire la facture pour enrichissement
      const invoice = await Nexus.adapter.get<{
        customerEmail?: string;
        customerName?: string;
        number?: string;
      }>(`tenants/${tenantId}/invoices/${invoiceId}`);

      const customerEmail = invoice?.customerEmail;
      const customerName = invoice?.customerName ?? customerId;
      const invoiceNumber = invoice?.number ?? invoiceId;

      logger.info(`[OverdueInvoice] Facture ${invoiceId} en retard de ${dueDaysOverdue}j — niveau ${niveau}`);

      // Logique par palier
      if (niveau === 'J+30') {
        // Email relance douce
        if (customerEmail) {
          await NotificationGateway.send({
            tenantId,
            to: customerEmail,
            subject: `Rappel de paiement — Facture ${invoiceNumber}`,
            text: `Bonjour ${customerName},\n\nNous vous rappelons que la facture ${invoiceNumber} est en attente de règlement depuis ${dueDaysOverdue} jours.\n\nMerci de procéder au paiement dans les meilleurs délais.\n\nCordialement`,
            channel: 'email',
          });
        }

      } else if (niveau === 'J+60') {
        // Email relance ferme
        if (customerEmail) {
          await NotificationGateway.send({
            tenantId,
            to: customerEmail,
            subject: `URGENT — Facture ${invoiceNumber} impayée depuis ${dueDaysOverdue} jours`,
            text: `Bonjour ${customerName},\n\nMalgré nos précédents rappels, la facture ${invoiceNumber} reste impayée depuis ${dueDaysOverdue} jours.\n\nNous vous demandons de régulariser cette situation sous 48h.\n\nCordialement`,
            channel: 'email',
          });
        }

        // Tag client 'payment_risk'
        const customer = await Nexus.adapter.get<{ tags?: string[] }>(
          `tenants/${tenantId}/customers/${customerId}`
        );
        const existingTags: string[] = customer?.tags ?? [];
        if (!existingTags.includes('payment_risk')) {
          await Nexus.adapter.update(`tenants/${tenantId}/customers/${customerId}`, {
            tags: [...existingTags, 'payment_risk'],
          });
        }

      } else {
        // Contentieux
        // Tag client 'contentieux'
        const customer = await Nexus.adapter.get<{ tags?: string[] }>(
          `tenants/${tenantId}/customers/${customerId}`
        );
        const existingTags: string[] = customer?.tags ?? [];
        const newTags = [...new Set([...existingTags, 'contentieux', 'payment_risk'])];
        await Nexus.adapter.update(`tenants/${tenantId}/customers/${customerId}`, {
          tags: newTags,
        });

        // Alerte haute priorité
        await Nexus.adapter.set(
          `tenants/${tenantId}/finance/alerts/CONTENTIEUX-${invoiceId}`,
          {
            type: 'contentieux',
            invoiceId,
            invoiceNumber,
            customerId,
            customerName,
            amountInMicrounits,
            dueDaysOverdue,
            status: 'open',
            priority: 'high',
            createdAt: now,
          }
        );

        // WebPush manager
        await WebPushService.sendToRole(tenantId, 'manager', {
          title: `Contentieux — Facture ${invoiceNumber}`,
          body: `${dueDaysOverdue}j de retard — ${customerName}`,
        });

        // Email contentieux
        if (customerEmail) {
          await NotificationGateway.send({
            tenantId,
            to: customerEmail,
            subject: `Mise en demeure — Facture ${invoiceNumber}`,
            text: `Bonjour ${customerName},\n\nLa facture ${invoiceNumber} est impayée depuis ${dueDaysOverdue} jours. Sans règlement immédiat, nous nous verrons contraints d'engager une procédure de recouvrement.\n\nCordialement`,
            channel: 'email',
          });
        }
      }

      // Mise à jour de la facture
      await Nexus.adapter.update(`tenants/${tenantId}/invoices/${invoiceId}`, {
        reminderLevel: niveau,
        lastReminderAt: now,
      });

      // Audit
      empireAudit.log({
        module: 'finance',
        action: `INVOICE_REMINDER_${niveau.toUpperCase()}`,
        details: { invoiceId, invoiceNumber, customerId, amountInMicrounits, dueDaysOverdue, niveau },
        severity: niveau === 'contentieux' ? 'high' : 'medium',
        timestamp: new Date(),
      });
    },
    { id: 'overdue-invoice', priority: 'HIGH' }
  );
}
