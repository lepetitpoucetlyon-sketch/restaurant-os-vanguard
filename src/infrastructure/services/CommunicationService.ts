import type { CommunicationPulse } from '@/modules/finance/collection/types';

/**
 * 📡 CommunicationService
 * Gère l'envoi de messages transactionnels (Email, SMS) indépendamment du Bridge.
 */
export class CommunicationService {
    /**
     * 🖋️ Suture GRADE X+++: Emission CommunicationPulse (Email/SMS)
     */
    static async sendCommunicationPulse(pulse: CommunicationPulse): Promise<void> {
        const { sendEmail } = await import('@/infrastructure/services/email-service');

        // Handle EMAIL and MIXED types (SMS would need separate provider)
        if (pulse.type === 'EMAIL' || pulse.type === 'MIXED') {
            try {
                const result = await sendEmail({
                    to: pulse.recipient,
                    subject: pulse.subject,
                    html: pulse.content
                });

                if (result.success) {
                    // Track successful send in local audit log
                    const { logger } = await import('@/lib/logger');
                    logger.info('[CommunicationPulse] Email sent', {
                        recipient: pulse.recipient,
                        type: pulse.type,
                        messageId: result.messageId
                    });
                } else {
                    throw new Error(result.error || 'Email send failed');
                }
            } catch (error) {
                const { logger } = await import('@/lib/logger');
                logger.error('[CommunicationPulse] Failed to send email', {
                    recipient: pulse.recipient,
                    type: pulse.type,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }
}
