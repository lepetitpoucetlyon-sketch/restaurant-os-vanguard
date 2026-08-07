import { CollectionService } from '@/modules/finance';
import type { InvoiceTarget } from '@/modules/finance';
import { NexusTelemetryService } from '@/lib/NexusTelemetryService';
import { NotificationGateway } from '@/lib/adapters/NotificationGateway';

/**
 * 🏛️ ThemisCollectorJob - Grade X+++
 * Tâche Cronos pour la relance automatique des impayés avec escalade.
 */
export const ThemisCollectorJob = {
    name: 'ThemisCollector',
    schedule: '0 8 * * *', // Tous les jours à 08h00 UTC
    
    /**
     * Exécute le batch de relances
     * @param getOverdueInvoices Fonction d'injection pour récupérer les factures
     */
    async execute(getOverdueInvoices: () => Promise<InvoiceTarget[]>) {
        try {
            const invoices = await getOverdueInvoices();
            
            // Exécution du service de collection Sovereign
            const actions = await CollectionService.processOverdueInvoices(invoices);
            
            NexusTelemetryService.emitAuditPulse('FINANCE', 'THEMIS_JOB_SUCCESS', {
                processedCount: actions.length
            });

            return {
                success: true,
                processedCount: actions.length,
                actions
            };
        } catch (error) {
            NexusTelemetryService.emitAuditPulse('FINANCE', 'THEMIS_JOB_FAILED', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            // FALLBACK RESILIENCE: Si l'envoi primaire a échoué (Resend), on sécurise via NotificationGateway local
            const invoices = await getOverdueInvoices().catch(() => []);
            for (const inv of invoices) {
                await NotificationGateway.send({
                    tenantId: (inv as { tenantId?: string }).tenantId || 'global',
                    to: inv.customerEmail,
                    subject: `Urgent - Retard de paiement pour la facture ${inv.id}`,
                    text: `La facture ${inv.id} est en retard de paiement. (Fallback System)`,
                    channel: 'email'
                }).catch(() => {});
            }

            throw error;
        }
    }
};
