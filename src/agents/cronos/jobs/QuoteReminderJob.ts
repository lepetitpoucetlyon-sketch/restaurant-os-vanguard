import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { NotificationGateway } from '@/infrastructure/adapters/NotificationGateway';

/**
 * 💼 QuoteReminderJob - Grade X
 * Vérifie quotidiennement les devis en attente et relance ceux qui datent de plus de 7 jours.
 */
export const QuoteReminderJob = {
    name: 'QuoteReminderJob',
    schedule: '0 9 * * *', // Tous les jours à 09:00
    
    async execute(tenantIds: string[]) {
        try {
            let reminderCount = 0;
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

            for (const tenantId of tenantIds) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const quotes = await Nexus.adapter.query<any>(`tenants/${tenantId}/quotes`, { limit: 1000 });
                
                for (const quote of quotes) {
                    if (quote.status === 'pending' && quote.createdAt < sevenDaysAgo && !quote.reminderSent) {
                        await NotificationGateway.send({
                            tenantId,
                            to: quote.customerEmail,
                            subject: `Relance : Votre devis ${quote.id || ''} est en attente`,
                            text: `Bonjour, nous vous rappelons que votre devis est toujours en attente d'acceptation. N'hésitez pas à nous contacter si vous avez des questions.`,
                            channel: 'email'
                        }).catch(() => {});
                        
                        await Nexus.adapter.update(`tenants/${tenantId}/quotes/${quote.id || quote.quoteId}`, {
                            reminderSent: true,
                            reminderSentAt: Date.now()
                        });
                        
                        reminderCount++;
                    }
                }
            }
            
            logger.info(`[QuoteReminderJob] Exécution terminée. ${reminderCount} relances envoyées.`);
            return { success: true, reminderCount };
        } catch (error) {
            logger.error(`[QuoteReminderJob] Erreur:`, String(error));
            throw error;
        }
    }
};
