import type { IEmailInvoiceProvider, EmailWithAttachments } from '../types';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";
import { fetchWithTimeout } from '@/lib/http/resilientFetch';

/**
 * Gmail — OAuth 2.0 Google, lecture inbox pour factures fournisseurs.
 * Variables requises : GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
 * Token stocké : tenants/{id}/connectors/invoices/gmail_token
 */
export class GmailInvoiceProvider implements IEmailInvoiceProvider {
    readonly id = 'gmail';

    async connect(tenantId: string, oauthCode: string): Promise<void> {
        const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID ?? '';
        const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '';
        const redirectUri  = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.restaurant-os.app'}/api/connectors/invoices/oauth/callback`;

        const res = await fetchWithTimeout('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: oauthCode, client_id: clientId, client_secret: clientSecret,
                redirect_uri: redirectUri, grant_type: 'authorization_code',
            }),
        }, 8_000);
        if (!res.ok) throw new Error(`Gmail OAuth → ${res.status}`);
        const token = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
        await Nexus.adapter.set(`tenants/${tenantId}/connectors/invoices/gmail_token`, {
            access_token:  token.access_token,
            refresh_token: token.refresh_token,
            expires_at:    Date.now() + (token.expires_in - 60) * 1000,
        });
        logger.info('[GmailInvoiceProvider] connected tenant', tenantId);
    }

    async isConnected(tenantId: string): Promise<boolean> {
        const token = await Nexus.adapter.get(`tenants/${tenantId}/connectors/invoices/gmail_token`);
        return !!token;
    }

    async fetchUnprocessed(tenantId: string): Promise<EmailWithAttachments[]> {
        const token = await this.getAccessToken(tenantId);
        const query  = encodeURIComponent('has:attachment filename:pdf -label:facture_traitee');
        const listRes = await fetchWithTimeout(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=20`,
            { headers: { 'Authorization': `Bearer ${token}` } },
            8_000,
        );
        if (!listRes.ok) throw new Error(`Gmail list → ${listRes.status}`);
        const list = await listRes.json() as { messages?: Array<{ id: string }> };
        if (!list.messages?.length) return [];

        const emails: EmailWithAttachments[] = [];
        for (const msg of list.messages) {
            try {
                const msgRes = await fetchWithTimeout(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
                    { headers: { 'Authorization': `Bearer ${token}` } },
                    8_000,
                );
                if (!msgRes.ok) continue;
                const msgData = await msgRes.json() as { payload: Record<string, unknown> };
                const headers = (msgData.payload['headers'] as Array<{ name: string; value: string }> ?? []);
                const from    = headers.find(h => h.name === 'From')?.value ?? '';
                const subject = headers.find(h => h.name === 'Subject')?.value ?? '';
                const date    = headers.find(h => h.name === 'Date')?.value ?? '';
                const parts   = (msgData.payload['parts'] as Array<Record<string, unknown>> ?? [])
                    .filter(p => p['filename'] && String(p['filename']).endsWith('.pdf'));

                if (parts.length) {
                    emails.push({
                        messageId:   msg.id,
                        from, subject, date,
                        attachments: parts.map(p => ({
                            filename:    String(p['filename'] ?? ''),
                            contentType: String(p['mimeType'] ?? 'application/pdf'),
                            data:        String((p['body'] as Record<string, unknown> | undefined)?.['attachmentId'] ?? ''),
                        })),
                    });
                }
            } catch (e) {
                logger.warn('[GmailInvoiceProvider] message parse error', toError(e).message);
            }
        }
        return emails;
    }

    async markProcessed(messageId: string): Promise<void> {
        logger.info('[GmailInvoiceProvider] markProcessed', messageId);
    }

    private async getAccessToken(tenantId: string): Promise<string> {
        const stored = await Nexus.adapter.get(
            `tenants/${tenantId}/connectors/invoices/gmail_token`
        ) as { access_token: string; refresh_token: string; expires_at: number } | null;
        if (!stored) throw new Error('Gmail non connecté pour ce tenant');

        if (Date.now() > (stored.expires_at ?? 0)) {
            const res = await fetchWithTimeout('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'refresh_token', refresh_token: stored.refresh_token,
                    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
                    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
                }),
            }, 8_000);
            const refreshed = await res.json() as { access_token: string; expires_in: number };
            await Nexus.adapter.set(`tenants/${tenantId}/connectors/invoices/gmail_token`, {
                ...stored,
                access_token: refreshed.access_token,
                expires_at: Date.now() + (refreshed.expires_in - 60) * 1000,
            });
            return refreshed.access_token;
        }
        return stored.access_token;
    }
}
