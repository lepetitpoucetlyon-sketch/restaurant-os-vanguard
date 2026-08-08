import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export interface WebhookConfig {
  id: string;
  tenantId: string;
  url: string;
  secret: string; // HMAC secret
  events: string[]; // e.g. ['order.placed', 'reservation.created']
  isActive: boolean;
}

/**
 * 🔗 WebhookDispatcherService (Item 9.1)
 * Service d'envoi et de signature HMAC SHA-256 de webhooks sortants génériques.
 * Supporte la politique d'essais répétés (Retry) avec Exponential Backoff.
 */
export class WebhookDispatcherService {
  /**
   * Calcule la signature HMAC SHA-256 du payload
   */
  private static async computeHmac(secret: string, payload: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Dispatche un événement vers une URL externe avec signature HMAC
   */
  static async dispatchWebhook(
    config: WebhookConfig,
    eventName: string,
    payloadData: Record<string, unknown>
  ): Promise<boolean> {
    if (!config.isActive || !config.events.includes(eventName)) {
      return false;
    }

    const payloadJson = JSON.stringify({
      event: eventName,
      tenantId: config.tenantId,
      timestamp: new Date().toISOString(),
      data: payloadData,
    });

    const signature = await this.computeHmac(config.secret, payloadJson);

    let attempt = 0;
    const maxAttempts = 3;
    let success = false;

    while (attempt < maxAttempts && !success) {
      attempt++;
      try {
        const response = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Nexus-Signature': signature,
            'X-Nexus-Event': eventName,
          },
          body: payloadJson,
        });

        if (response.ok) {
          success = true;
          logger.info(`[WebhookDispatcher] Event ${eventName} envoyé avec succès à ${config.url} (Attempt ${attempt})`);
        } else {
          logger.warn(`[WebhookDispatcher] Échec HTTP ${response.status} pour ${config.url} (Attempt ${attempt})`);
        }
      } catch (err) {
        logger.error(`[WebhookDispatcher] Erreur réseau webhook ${config.url} (Attempt ${attempt})`, err);
      }

      if (!success && attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
      }
    }

    empireAudit.log({
      module: 'system',
      action: 'WEBHOOK_DISPATCHED',
      details: { url: config.url, eventName, success, attempts: attempt },
      severity: success ? 'low' : 'high',
      timestamp: new Date(),
    });

    return success;
  }
}
