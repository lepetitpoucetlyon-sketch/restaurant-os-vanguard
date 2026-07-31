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
        const sendgridKey = process.env.SENDGRID_API_KEY;
        const twilioSid = process.env.TWILIO_SID;
        const channel = payload.channel || (payload.to.includes('@') ? 'email' : 'sms');

        try {
            if (channel === 'email' && sendgridKey) {
                // TODO: Vrai appel SendGrid avec @sendgrid/mail
                logger.info(`[NotificationGateway] Envoi d'email à ${payload.to} via SendGrid`);
                return;
            }

            if (channel === 'sms' && twilioSid) {
                // TODO: Vrai appel Twilio
                logger.info(`[NotificationGateway] Envoi de SMS à ${payload.to} via Twilio`);
                return;
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
