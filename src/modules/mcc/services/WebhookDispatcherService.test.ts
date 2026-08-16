import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookDispatcherService, WebhookConfig } from './WebhookDispatcherService';
import { empireAudit } from '@/lib/audit';

describe('🔗 WebhookDispatcherService — Envoi & Signature HMAC Webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const webhookConfig: WebhookConfig = {
    id: 'wh_ubereats_sync',
    tenantId: 'tenant_lyon_centre',
    url: 'https://api.external-partner.com/nexus-webhook',
    secret: 'super_secret_hmac_key_2026',
    events: ['order.placed', 'order.paid'],
    isActive: true,
  };

  it('ne devrait rien envoyer si le webhook est inactif ou si l\'événement n\'est pas souscrit', async () => {
    const inactiveConfig = { ...webhookConfig, isActive: false };
    const result1 = await WebhookDispatcherService.dispatchWebhook(inactiveConfig, 'order.placed', { orderId: '123' });
    expect(result1).toBe(false);

    const result2 = await WebhookDispatcherService.dispatchWebhook(webhookConfig, 'user.created', { userId: 'u1' });
    expect(result2).toBe(false);
  });

  it('devrait envoyer le webhook avec entêtes HMAC et payload JSON si l\'événement correspond', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    global.fetch = mockFetch;

    const spyAudit = vi.spyOn(empireAudit, 'log');

    const result = await WebhookDispatcherService.dispatchWebhook(
      webhookConfig,
      'order.placed',
      { orderId: 'ord_999', totalInMicrounits: 45000000 }
    );

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      webhookConfig.url,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Nexus-Event': 'order.placed',
        }),
      })
    );

    expect(spyAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'system',
        action: 'WEBHOOK_DISPATCHED',
        severity: 'low',
      })
    );
  });

  it('devrait retenter jusqu\'à 3 fois en cas d\'erreur réseau puis échouer gracieusement', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network connection timeout'));
    global.fetch = mockFetch;

    const spyAudit = vi.spyOn(empireAudit, 'log');

    const result = await WebhookDispatcherService.dispatchWebhook(
      webhookConfig,
      'order.paid',
      { orderId: 'ord_failed' }
    );

    expect(result).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(spyAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'system',
        action: 'WEBHOOK_DISPATCHED',
        severity: 'high',
        details: expect.objectContaining({
          attempts: 3,
          success: false,
        }),
      })
    );
  });
});
