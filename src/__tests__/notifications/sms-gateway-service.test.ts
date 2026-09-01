import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmsGatewayService } from '@/modules/ops/service/core/notifications/SmsGatewayService';

describe('SmsGatewayService — Passerelle SMS Multi-Fournisseurs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.BREVO_API_KEY;
    delete process.env.OVH_APP_KEY;
  });

  it('devrait formater correctement les numéros français et internationaux en format E.164', () => {
    expect(SmsGatewayService.formatE164('06 12 34 56 78')).toBe('+33612345678');
    expect(SmsGatewayService.formatE164('07.99.88.77.66')).toBe('+33799887766');
    expect(SmsGatewayService.formatE164('+33612345678')).toBe('+33612345678');
    expect(SmsGatewayService.formatE164('+14155552671')).toBe('+14155552671');
  });

  it('devrait utiliser le mode Sandbox sécurisé lorsque aucun provider n est configuré', async () => {
    const result = await SmsGatewayService.sendSms('0612345678', 'Test message de vérification', {
      tenantId: 'resto-demo',
      tag: 'TEST_VERIF',
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe('SANDBOX');
    expect(result.recipientPhone).toBe('+33612345678');
    expect(result.messageId).toContain('sms_sbx_');
  });

  it('devrait détecter Twilio lorsque les variables d environnement sont présentes', () => {
    process.env.TWILIO_ACCOUNT_SID = 'AC_test_123';
    process.env.TWILIO_AUTH_TOKEN = 'secret_token_123';

    expect(SmsGatewayService.getActiveProvider()).toBe('TWILIO');
  });

  it('devrait détecter Brevo lorsque la clé API est fournie', () => {
    process.env.BREVO_API_KEY = 'xkeysib-test-key';

    expect(SmsGatewayService.getActiveProvider()).toBe('BREVO');
  });
});
