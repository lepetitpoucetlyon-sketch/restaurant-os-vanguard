import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EInvoicingService } from '@/modules/finance/comptabilite/einvoicing/EInvoicingService';
import type { InboundEInvoice, OutboundEInvoice } from '@/modules/finance/comptabilite/einvoicing/IEInvoicingProvider';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

const TENANT_ID = 'tenant_service_test';

describe('EInvoicingService — Service Facturation Électronique B2B/B2G (§7.3)', () => {
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    Nexus.adapter = mockAdapter;
    vi.restoreAllMocks();
  });

  describe('configureForTenant', () => {
    it('enregistre la configuration PDP du tenant', async () => {
      await EInvoicingService.configureForTenant(
        TENANT_ID,
        {
          providerId: 'mock',
          apiKey: 'mock_api_key_123',
          webhookSecret: 'mock_webhook_secret_456',
          siret: '12345678900012',
          sandboxMode: true,
          registeredWithPdp: false,
          updatedAt: new Date().toISOString(),
        },
        'Mon Entreprise SAS'
      );

      const saved = await Nexus.adapter.get<{ providerId: string; siret: string; registeredWithPdp?: boolean }>(
        `tenants/${TENANT_ID}/config/einvoice_provider`
      );

      expect(saved).toBeDefined();
      expect(saved?.providerId).toBe('mock');
      expect(saved?.siret).toBe('12345678900012');
      expect(saved?.registeredWithPdp).toBe(true);
    });
  });

  describe('receiveInvoice', () => {
    it('enregistre une facture entrante et émet les événements associés', async () => {
      const inbound: InboundEInvoice = {
        providerInvoiceId: 'pdp_inbound_99',
        invoiceNumber: 'FAC-2026-IN-01',
        issueDate: '2026-09-01',
        dueDate: '2026-09-30',
        format: 'factur-x',
        seller: {
          name: 'Fournisseur Fruits SAS',
          siret: '99887766554433',
          address: '10 Rue des Vergers, 69000 Lyon',
          country: 'FR',
        },
        buyer: {
          name: 'Restaurant Test',
          siret: '12345678900012',
          address: '5 Place Bellecour, 69002 Lyon',
          country: 'FR',
        },
        lines: [
          {
            description: 'Pommes Golden (kg)',
            quantity: 50,
            unitPriceHTInMicrounits: 2_000_000,
            vatRate: 0.055,
            totalHTInMicrounits: 100_000_000,
            totalTTCInMicrounits: 105_500_000,
          },
        ],
        totalHTInMicrounits: 100_000_000,
        totalVATInMicrounits: 5_500_000,
        totalTTCInMicrounits: 105_500_000,
        currency: 'EUR',
      };

      const busSpy = vi.spyOn(NexusEventBus, 'emitDurable');

      const invoiceId = await EInvoicingService.receiveInvoice(TENANT_ID, inbound);
      expect(invoiceId).toBe('pdp_inbound_99');

      const stored = await Nexus.adapter.get<{ invoiceNumber: string; status: string }>(
        `tenants/${TENANT_ID}/inboundInvoices/pdp_inbound_99`
      );
      expect(stored?.invoiceNumber).toBe('FAC-2026-IN-01');
      expect(stored?.status).toBe('received');

      expect(busSpy).toHaveBeenCalledWith(
        'supplier.invoice_processed',
        expect.objectContaining({
          tenantId: TENANT_ID,
          invoiceId: 'pdp_inbound_99',
          supplierId: '99887766554433',
        })
      );
    });

    it('est idempotent si la facture a déjà été reçue', async () => {
      await Nexus.adapter.set(`tenants/${TENANT_ID}/inboundInvoices/pdp_inbound_already`, {
        id: 'pdp_inbound_already',
        status: 'received',
      });

      const inbound: InboundEInvoice = {
        providerInvoiceId: 'pdp_inbound_already',
        invoiceNumber: 'FAC-2026-ALREADY',
        issueDate: '2026-09-01',
        format: 'factur-x',
        seller: {
          name: 'Fournisseur Existant',
          siret: '99887766554433',
          address: '10 Rue des Vergers',
          country: 'FR',
        },
        buyer: {
          name: 'Restaurant Test',
          siret: '12345678900012',
          address: '5 Place Bellecour',
          country: 'FR',
        },
        lines: [
          {
            description: 'Produit test',
            quantity: 1,
            unitPriceHTInMicrounits: 10_000_000,
            vatRate: 0.2,
            totalHTInMicrounits: 10_000_000,
            totalTTCInMicrounits: 12_000_000,
          },
        ],
        totalHTInMicrounits: 10_000_000,
        totalVATInMicrounits: 2_000_000,
        totalTTCInMicrounits: 12_000_000,
        currency: 'EUR',
      };

      const res = await EInvoicingService.receiveInvoice(TENANT_ID, inbound);
      expect(res).toBe('pdp_inbound_already');
    });
  });

  describe('emitInvoice', () => {
    it('émet une facture sortante vers le PDP et enregistre le record', async () => {
      const outbound: OutboundEInvoice = {
        internalRef: 'ref_outbound_001',
        invoiceNumber: 'FACT-2026-000888',
        issueDate: '2026-09-01',
        dueDate: '2026-09-30',
        clientType: 'b2b',
        seller: {
          name: 'Restaurant Test',
          siret: '12345678900012',
          address: '5 Place Bellecour, 69002 Lyon',
          country: 'FR',
        },
        buyer: {
          name: 'Client Entreprise',
          siret: '55667788990011',
          address: '10 Avenue Foch, 75016 Paris',
          country: 'FR',
        },
        lines: [
          {
            description: 'Repas séminaire',
            quantity: 10,
            unitPriceHTInMicrounits: 30_000_000,
            vatRate: 0.1,
            totalHTInMicrounits: 300_000_000,
            totalTTCInMicrounits: 330_000_000,
          },
        ],
        totalHTInMicrounits: 300_000_000,
        totalVATInMicrounits: 30_000_000,
        totalTTCInMicrounits: 330_000_000,
        currency: 'EUR',
      };

      const busSpy = vi.spyOn(NexusEventBus, 'emitDurable');

      const providerId = await EInvoicingService.emitInvoice(TENANT_ID, outbound);
      expect(providerId).toBeDefined();

      const stored = await Nexus.adapter.get<{ invoiceNumber: string; providerInvoiceId: string }>(
        `tenants/${TENANT_ID}/outboundInvoices/ref_outbound_001`
      );
      expect(stored?.invoiceNumber).toBe('FACT-2026-000888');
      expect(stored?.providerInvoiceId).toBe(providerId);

      expect(busSpy).toHaveBeenCalledWith(
        'einvoice.outbound_emitted',
        expect.objectContaining({
          tenantId: TENANT_ID,
          internalRef: 'ref_outbound_001',
          invoiceNumber: 'FACT-2026-000888',
          totalTTCInMicrounits: 330_000_000,
        })
      );
    });
  });
});
