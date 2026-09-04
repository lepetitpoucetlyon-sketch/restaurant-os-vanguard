import type { IEmailMarketingProvider, Campaign, CampaignStats, Contact, AutomationTrigger } from '../types';
import { logger } from '@/lib/logger';
import { fetchWithTimeout } from '@/lib/http/resilientFetch';

const BREVO_BASE = 'https://api.brevo.com/v3';

/**
 * Brevo (ex-Sendinblue) — API REST v3, excellente doc.
 * Variable requise : BREVO_API_KEY
 * Doc : https://developers.brevo.com/
 */
export class BrevoProvider implements IEmailMarketingProvider {
    readonly id = 'brevo';

    private get apiKey(): string {
        const key = process.env.BREVO_API_KEY;
        if (!key) throw new Error('BREVO_API_KEY manquant');
        return key;
    }

    private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
        const res = await fetchWithTimeout(`${BREVO_BASE}${path}`, {
            ...options,
            headers: {
                'api-key': this.apiKey,
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });
        if (!res.ok) throw new Error(`Brevo ${path} → ${res.status}`);
        return res.json() as Promise<T>;
    }

    async sendCampaign(campaign: Campaign): Promise<string> {
        const result = await this.fetch<{ id: number }>('/emailCampaigns', {
            method: 'POST',
            body: JSON.stringify({
                name:       campaign.id,
                subject:    campaign.subject,
                htmlContent: campaign.htmlContent,
                sender:     { name: 'Restaurant OS', email: process.env.RESEND_FROM_EMAIL ?? 'noreply@restaurant-os.app' },
                recipients: { listIds: [] },
                scheduledAt: campaign.scheduledAt,
            }),
        });
        logger.info('[BrevoProvider] campaign created', result.id);
        return String(result.id);
    }

    async fetchStats(campaignId: string): Promise<CampaignStats> {
        const data = await this.fetch<{ statistics: Record<string, unknown> }>(`/emailCampaigns/${campaignId}`);
        const s = data.statistics;
        return {
            sent:         Number(s['sent'] ?? 0),
            delivered:    Number(s['delivered'] ?? 0),
            opened:       Number(s['uniqueOpens'] ?? 0),
            clicked:      Number(s['uniqueClicks'] ?? 0),
            bounced:      Number(s['hardBounces'] ?? 0) + Number(s['softBounces'] ?? 0),
            unsubscribed: Number(s['unsubscriptions'] ?? 0),
        };
    }

    async syncContacts(contacts: Contact[]): Promise<void> {
        await this.fetch('/contacts/import', {
            method: 'POST',
            body: JSON.stringify({
                contacts: contacts.map(c => ({
                    email:      c.email,
                    attributes: { FIRSTNAME: c.name, PHONE: c.phone, ...(c.attributes ?? {}) },
                })),
                updateEnabled: true,
            }),
        });
    }

    async createAutomation(trigger: AutomationTrigger): Promise<string> {
        logger.info('[BrevoProvider] createAutomation', trigger.type);
        return `brevo_auto_${trigger.type}`;
    }
}
