import { toError } from "@/lib/toError";

export interface CommunicationPulse {
    type: 'EMAIL' | 'SMS' | 'PUSH' | 'MIXED';
    recipient: string;
    subject: string;
    content: string;
    attachments?: Array<{ filename: string; content: string | Buffer }>;
}

/**
 * 📡 CommunicationService
 * Gère l'envoi de messages transactionnels (Email, SMS) indépendamment du Bridge.
 */
export class CommunicationService {
    /**
     * 🖋️ Suture GRADE X+++: Emission CommunicationPulse (Email/SMS)
     */
    static async sendCommunicationPulse(pulse: CommunicationPulse): Promise<void> {
        const { sendEmail } = await import('@/lib/email-service');

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
                    const { NexusTelemetryService } = await import('@/lib/NexusTelemetryService');
                    NexusTelemetryService.emitAuditPulse('system', 'SYSTEM_COMMUNICATION', {
                        status: 'OK',
                        recipient: pulse.recipient,
                        subject: pulse.subject,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (err: unknown) {
                const e = toError(err);
                console.error(`[CommunicationService] Failed to emit transactional email: ${e.message}`);
                throw e;
            }
        }
    }
}
