import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export interface NotificationPayload {
    tenantId: string;
    to: string; // email or phone number
    subject: string;
    text: string;
    channel?: 'email' | 'sms';
}

export class NotificationGateway {
    static async send(payload: NotificationPayload): Promise<void> {
        const resendKey = process.env.RESEND_API_KEY;
        const twilioSid = process.env.TWILIO_SID;
        const channel = payload.channel || (payload.to.includes('@') ? 'email' : 'sms');

        try {
            if (channel === 'email' && resendKey) {
                const { Resend } = await import('resend');
                const resend = new Resend(resendKey);
                const from = process.env.RESEND_FROM_EMAIL ?? 'noreply@restaurant-os.app';
                const { error } = await resend.emails.send({
                    from,
                    to: [payload.to],
                    subject: payload.subject,
                    text: payload.text,
                });
                if (error) throw new Error(error.message);
                logger.info(`[NotificationGateway] Email envoyé à ${payload.to} via Resend`);
                return;
            }

            if (channel === 'sms' && twilioSid) {
                const twilioToken = process.env.TWILIO_AUTH_TOKEN;
                const twilioFrom = process.env.TWILIO_FROM_NUMBER;
                if (!twilioToken || !twilioFrom) {
                    logger.warn('[NotificationGateway] TWILIO_AUTH_TOKEN ou TWILIO_FROM_NUMBER manquant');
                } else {
                    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
                    const body = new URLSearchParams({ To: payload.to, From: twilioFrom, Body: payload.text });
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}` },
                        body,
                    });
                    if (!res.ok) throw new Error(`Twilio HTTP ${res.status}`);
                    logger.info(`[NotificationGateway] SMS envoyé à ${payload.to} via Twilio`);
                    return;
                }
            }

            // MODE DÉGRADÉ : Aucune clé configurée, écriture dans la file d'attente
            logger.warn(`[NotificationGateway] Mode dégradé : pas de clé API pour le canal ${channel}. Mise en attente de la notification.`);
            await Nexus.adapter.create(`tenants/${payload.tenantId}/crm/pendingNotifications`, {
                to: payload.to,
                subject: payload.subject,
                text: payload.text,
                channel,
                status: 'queued',
                createdAt: Date.now()
            });

        } catch (error) {
            logger.error(`[NotificationGateway] Échec de l'envoi de notification`, String(error));
            // En cas d'erreur de l'API externe, on fallback sur la file d'attente
            await Nexus.adapter.create(`tenants/${payload.tenantId}/crm/pendingNotifications`, {
                to: payload.to,
                subject: payload.subject,
                text: payload.text,
                channel,
                status: 'error_queued',
                error: String(error),
                createdAt: Date.now()
            });
        }
    }
}
