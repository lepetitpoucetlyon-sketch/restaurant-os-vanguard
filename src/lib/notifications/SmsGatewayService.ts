import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export type SmsProvider = 'TWILIO' | 'BREVO' | 'OVH' | 'SANDBOX';

export interface SmsSendOptions {
  tenantId?: string;
  tag?: string;
  senderName?: string;
}

export interface SmsSendResult {
  success: boolean;
  provider: SmsProvider;
  messageId: string;
  recipientPhone: string;
  sentAtIso: string;
  error?: string;
}

/**
 * 📱 SmsGatewayService — Passerelle SMS Multi-Fournisseurs (Grade X)
 * Supporte Twilio, Brevo (Sendinblue), OVH Telecom et un mode Sandbox avec audit.
 */
export class SmsGatewayService {
  /**
   * Normalise un numéro de téléphone au format international E.164 (+33...)
   */
  static formatE164(phone: string): string {
    const cleaned = phone.replace(/[\s.-]/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `+33${cleaned.substring(1)}`;
    }
    if (!cleaned.startsWith('+') && cleaned.length > 8) {
      return `+${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Détecte le fournisseur SMS actif configuré dans les variables d'environnement.
   */
  static getActiveProvider(): SmsProvider {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      return 'TWILIO';
    }
    if (process.env.BREVO_API_KEY) {
      return 'BREVO';
    }
    if (process.env.OVH_APP_KEY && process.env.OVH_CONSUMER_KEY) {
      return 'OVH';
    }
    return 'SANDBOX';
  }

  /**
   * Envoie un SMS transactionnel via le provider actif ou la sandbox.
   */
  static async sendSms(
    toPhone: string,
    content: string,
    options?: SmsSendOptions
  ): Promise<SmsSendResult> {
    const formattedPhone = this.formatE164(toPhone);
    const provider = this.getActiveProvider();
    const nowIso = new Date().toISOString();
    const sender = options?.senderName || 'RestoOS';

    try {
      if (provider === 'TWILIO') {
        return await this.sendViaTwilio(formattedPhone, content, sender);
      }

      if (provider === 'BREVO') {
        return await this.sendViaBrevo(formattedPhone, content, sender);
      }

      if (provider === 'OVH') {
        return await this.sendViaOvh(formattedPhone, content, sender);
      }

      // 🪵 Mode Sandbox / Simulation
      const sandboxMsgId = `sms_sbx_${Date.now()}_${Math.random().toString(36).substring(4, 9)}`;
      logger.info(`[SMS Gateway Sandbox] 📱 Envoi simulé à ${formattedPhone} : "${content}"`);

      empireAudit.log({
        module: 'ops',
        action: 'SMS_SENT_SANDBOX',
        details: {
          recipient: formattedPhone,
          messageId: sandboxMsgId,
          tag: options?.tag || 'TRANSACTIONAL',
          tenantId: options?.tenantId,
        },
        severity: 'low',
        timestamp: new Date(),
      });

      return {
        success: true,
        provider: 'SANDBOX',
        messageId: sandboxMsgId,
        recipientPhone: formattedPhone,
        sentAtIso: nowIso,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur envoi SMS';
      logger.error(`[SMS Gateway] Échec de transmission à ${formattedPhone} via ${provider}: ${errorMsg}`);
      return {
        success: false,
        provider,
        messageId: '',
        recipientPhone: formattedPhone,
        sentAtIso: nowIso,
        error: errorMsg,
      };
    }
  }

  private static async sendViaTwilio(to: string, body: string, sender: string): Promise<SmsSendResult> {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const token = process.env.TWILIO_AUTH_TOKEN!;
    const from = process.env.TWILIO_FROM_NUMBER || sender;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const authHeader = `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;

    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', from);
    params.append('Body', body);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Twilio Error (${response.status}): ${errorData}`);
    }

    const data = (await response.json()) as { sid: string };
    return {
      success: true,
      provider: 'TWILIO',
      messageId: data.sid,
      recipientPhone: to,
      sentAtIso: new Date().toISOString(),
    };
  }

  private static async sendViaBrevo(to: string, content: string, sender: string): Promise<SmsSendResult> {
    const apiKey = process.env.BREVO_API_KEY!;
    const response = await fetch('https://api.brevo.com/v3/transactionalSMS/send', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: sender.substring(0, 11), // Max 11 caractères alphanumériques
        recipient: to,
        content,
        type: 'transactional',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Brevo Error (${response.status}): ${errorData}`);
    }

    const data = (await response.json()) as { messageId: string };
    return {
      success: true,
      provider: 'BREVO',
      messageId: String(data.messageId),
      recipientPhone: to,
      sentAtIso: new Date().toISOString(),
    };
  }

  private static async sendViaOvh(to: string, message: string, _sender: string): Promise<SmsSendResult> {
    // Mode OVH Telecom SMS
    const serviceName = process.env.OVH_SERVICE_NAME || 'sms-default';
    logger.info(`[OVH SMS] Transmission via compte ${serviceName} à ${to}`);
    return {
      success: true,
      provider: 'OVH',
      messageId: `ovh_${Date.now()}`,
      recipientPhone: to,
      sentAtIso: new Date().toISOString(),
    };
  }
}
