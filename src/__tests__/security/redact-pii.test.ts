import { describe, it, expect } from 'vitest';
import { redactPII, redactStringPII } from '@/lib/security/redactPII';

describe('Sécurité & RGPD : Masquage Automatique des PII dans les Logs (redactPII)', () => {

  it('devrait masquer les adresses email en clair', () => {
    const raw = 'Client contact: mohammed.ali@restaurant-empire.fr';
    const redacted = redactStringPII(raw);
    expect(redacted).toBe('Client contact: m***@restaurant-empire.fr');
  });

  it('devrait masquer les numéros de carte bancaire (PAN 16 chiffres)', () => {
    const raw = 'Tentative de paiement avec CB 4970-1234-5678-9876 échouée';
    const redacted = redactStringPII(raw);
    expect(redacted).toBe('Tentative de paiement avec CB ****-****-****-9876 échouée');
  });

  it('devrait masquer les numéros de téléphone', () => {
    const raw = 'SMS envoyé au 06 12 34 56 78';
    const redacted = redactStringPII(raw);
    expect(redacted).toBe('SMS envoyé au 06 ** ** ** 78');
  });

  it('devrait masquer les IBAN bancaires', () => {
    const raw = 'Virement vers FR7630006000011234567890189 validé';
    const redacted = redactStringPII(raw);
    expect(redacted).toBe('Virement vers FR76 **** 189 validé');
  });

  it('devrait masquer récursivement les objets complexes et les clés de secrets', () => {
    const logPayload = {
      tenantId: 'bistro-opera',
      user: {
        email: 'sarah.connor@gmail.com',
        phone: '0698765432',
      },
      apiKey: 'sk_live_51AbcDef123456SecretKey',
      password: 'super_secret_password',
      auth: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
      },
    };

    const sanitized = redactPII(logPayload);

    expect(sanitized.user.email).toBe('s***@gmail.com');
    expect(sanitized.user.phone).toBe('06 ** ** ** 32');
    expect(sanitized.apiKey).toBe('[REDACTED_SECRET]');
    expect(sanitized.password).toBe('[REDACTED_SECRET]');
    expect(sanitized.auth.token).toBe('[REDACTED_SECRET]');
  });
});
