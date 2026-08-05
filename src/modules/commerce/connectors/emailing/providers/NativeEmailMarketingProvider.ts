import type { IEmailMarketingProvider, Campaign, CampaignStats, Contact, AutomationTrigger } from '../types';
import { logger } from '@/lib/logger';

/**
 * Campagnes natives — utilise l'infrastructure Resend existante (MarketingService).
 * Pas de dépendance externe au-delà de RESEND_API_KEY.
 */
export class NativeEmailMarketingProvider implements IEmailMarketingProvider {
    readonly id = 'native';

    async sendCampaign(campaign: Campaign): Promise<string> {
        const { sendEmail } = await import('@/lib/email-service');
        const errors: string[] = [];
        for (const recipient of campaign.recipients) {
            let html = campaign.htmlContent;
            if (recipient.vars) {
                for (const [key, val] of Object.entries(recipient.vars)) {
                    html = html.replaceAll(`{{${key}}}`, val);
                }
            }
            try {
                await sendEmail({ to: recipient.email, subject: campaign.subject, html });
            } catch (err) {
                errors.push(`${recipient.email}: ${String(err)}`);
            }
        }
        if (errors.length) logger.warn('[NativeEmailMarketing] partial errors', errors);
        logger.info(`[NativeEmailMarketing] campaign ${campaign.id} sent to ${campaign.recipients.length} recipients`);
        return campaign.id;
    }

    async fetchStats(_campaignId: string): Promise<CampaignStats> {
        // Stats Resend accessibles via leur API dashboard — à brancher si nécessaire.
        return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 };
    }

    async syncContacts(contacts: Contact[]): Promise<void> {
        // Contacts stockés dans Nexus CRM — pas de liste externe à synchroniser.
        logger.info('[NativeEmailMarketing] syncContacts', contacts.length);
    }

    async createAutomation(trigger: AutomationTrigger): Promise<string> {
        // Automatisations stockées dans Nexus — déclenchées par les cron jobs existants.
        logger.info('[NativeEmailMarketing] createAutomation', trigger.type);
        return `native_auto_${trigger.type}_${Date.now()}`;
    }
}
