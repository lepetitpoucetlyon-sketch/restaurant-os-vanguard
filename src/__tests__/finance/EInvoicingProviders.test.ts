import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SuperPdpProvider } from '@/modules/finance/comptabilite/einvoicing/SuperPdpProvider';
import { DirectApiEInvoicingProvider } from '@/modules/finance/comptabilite/einvoicing/DirectApiEInvoicingProvider';
import { EInvoiceProviderFactory } from '@/modules/finance/comptabilite/einvoicing/EInvoiceProviderFactory';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { OutboundEInvoice } from '@/modules/finance/comptabilite/einvoicing/IEInvoicingProvider';
import { createHmac } from 'crypto';

describe('⚡ E-Invoicing Providers & Connectors (Option 1 Super-PDP & Option 2 Direct API)', () => {
  const sampleOutbound: OutboundEInvoice = {
    internalRef: 'POS-2026-001',
    invoiceNumber: 'FAC-2026-0001',
    issueDate: '2026-09-01T10:00:00.000Z',
    dueDate: '2026-10-01T10:00:00.000Z',
    clientType: 'b2b',
    seller: {
      name: 'Restaurant Le Gourmet',
      siret: '12345678901234',
      vatNumber: 'FR12345678901',
      address: '12 Rue de la Paix 75001 Paris',
      country: 'FR',
    },
    buyer: {
      name: 'Société Acquéreur SAS',
      siret: '98765432109876',
      vatNumber: 'FR98765432109',
      address: '45 Avenue de la République 69002 Lyon',
      country: 'FR',
    },
    lines: [
      {
        description: 'Menu Déjeuner Affaires',
        quantity: 2,
        unitPriceHTInMicrounits: 45_000_000,
        vatRate: 0.10,
        totalHTInMicrounits: 90_000_000,
        totalTTCInMicrounits: 99_000_000,
      },
    ],
    totalHTInMicrounits: 90_000_000,
    totalVATInMicrounits: 9_000_000,
    totalTTCInMicrounits: 99_000_000,
    currency: 'EUR',
  };

  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Option 1: SuperPdpProvider (Accréditation PA DGFiP)', () => {
    it('devrait vérifier correctement la signature HMAC-SHA256 du webhook', () => {
      const provider = new SuperPdpProvider('sk_test_123', true);
      const secret = 'super_webhook_secret_xyz';
      const eventType = 'invoice.received';
      const invoiceId = 'inv_pdp_999';
      const timestamp = '2026-09-01T12:00:00Z';

      const validSignature = createHmac('sha256', secret)
        .update(`${eventType}:${invoiceId}:${timestamp}`)
        .digest('hex');

      const isValid = provider.verifyWebhookSignature(
        {
          eventType,
          invoiceId,
          timestamp,
          signature: validSignature,
        },
        secret,
      );

      expect(isValid).toBe(true);

      const isInvalid = provider.verifyWebhookSignature(
        {
          eventType,
          invoiceId,
          timestamp,
          signature: 'fake_signature_abc',
        },
        secret,
      );

      expect(isInvalid).toBe(false);
    });

    it('devrait émettre une facture avec en-tête Idempotency-Key', async () => {
      const provider = new SuperPdpProvider('sk_test_123', true);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'pdp_inv_12345',
          status: 'submitted',
        }),
      } as unknown as Response);

      const result = await provider.emitInvoice(sampleOutbound);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://sandbox.superdp.fr/api/v1/invoices/outbound',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk_test_123',
            'X-Idempotency-Key': 'POS-2026-001',
          }),
        }),
      );
      expect(result.providerInvoiceId).toBe('pdp_inv_12345');
      expect(result.status).toBe('submitted');
    });

    it('devrait récupérer le statut outbound d une facture émise', async () => {
      const provider = new SuperPdpProvider('sk_test_123', false);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'deposee' }),
      } as unknown as Response);

      const status = await provider.getOutboundStatus('pdp_inv_12345');
      expect(status).toBe('deposee');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.superdp.fr/api/v1/invoices/outbound/pdp_inv_12345',
        expect.anything(),
      );
    });
  });

  describe('Option 2: DirectApiEInvoicingProvider (Passerelle / API Directe)', () => {
    it('devrait supporter une URL personnalisée et des requêtes directes', async () => {
      const customUrl = 'https://custom-pdp.mycompany.com/v1';
      const provider = new DirectApiEInvoicingProvider('api_direct_key_456', customUrl, false);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          providerInvoiceId: 'direct_inv_789',
          status: 'submitted',
        }),
      } as unknown as Response);

      const result = await provider.emitInvoice(sampleOutbound);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://custom-pdp.mycompany.com/v1/outbound/invoices',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer api_direct_key_456',
            'X-Idempotency-Key': 'POS-2026-001',
          }),
        }),
      );
      expect(result.providerInvoiceId).toBe('direct_inv_789');
    });

    it('devrait enregistrer une société avec tolérance 409 (déjà enregistrée)', async () => {
      const provider = new DirectApiEInvoicingProvider('api_direct_key_456', undefined, true);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
      } as unknown as Response);

      // Doit réussir sans lancer d'exception
      await expect(provider.registerCompany('12345678901234', 'Mon Restaurant')).resolves.not.toThrow();
    });

    it('devrait rejeter une facture fournisseur entrante avec motif', async () => {
      const provider = new DirectApiEInvoicingProvider('api_direct_key_456', undefined, true);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
      } as unknown as Response);

      await provider.rejectInvoice('inv_inbound_99', 'tenant_lyon', 'Montant TTC erroné');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/inbound/inv_inbound_99/reject'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Montant TTC erroné'),
        }),
      );
    });
  });

  describe('EInvoiceProviderFactory (Résolution Multi-Tenants & Options)', () => {
    it('devrait instancier DirectApiEInvoicingProvider quand configuré pour un tenant', async () => {
      vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce({
        providerId: 'direct-api',
        apiKey: 'key_tenant_direct',
        webhookSecret: 'secret_tenant',
        customEndpointUrl: 'https://api.merchant-corp.fr/einvoice',
        siret: '11111111111111',
        sandboxMode: false,
        registeredWithPdp: true,
        updatedAt: new Date().toISOString(),
      });

      const provider = await EInvoiceProviderFactory.forTenant('tenant_custom');
      expect(provider.name).toBe('direct-api');
    });

    it('devrait instancier SuperPdpProvider en mode SaaS standard', async () => {
      vi.spyOn(Nexus.adapter, 'get')
        .mockResolvedValueOnce(null) // Pas d'override tenant
        .mockResolvedValueOnce({    // Config plateforme
          providerId: 'super-pdp',
          apiKey: 'key_platform_superpdp',
          webhookSecret: 'secret_platform',
          siret: '22222222222222',
          sandboxMode: true,
          registeredWithPdp: true,
          platformName: 'Restaurant OS Platform',
          platformAddress: '10 Rue de la Paix',
          platformCountry: 'FR',
          multiCompanyMode: true,
          updatedAt: new Date().toISOString(),
        });

      const provider = await EInvoiceProviderFactory.forTenant('tenant_standard');
      expect(provider.name).toBe('super-pdp');
    });

    it('devrait fallback sur MockEInvoicingProvider si aucune configuration trouvée', async () => {
      vi.spyOn(Nexus.adapter, 'get').mockResolvedValue(null);

      const provider = await EInvoiceProviderFactory.forTenant('tenant_dev');
      expect(provider.name).toBe('mock');
    });
  });
});
