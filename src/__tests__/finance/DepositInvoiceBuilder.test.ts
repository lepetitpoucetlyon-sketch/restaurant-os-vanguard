import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateDeposit, convertQuoteToInvoice } from '@/modules/finance/comptabilite/billing/domain/DepositInvoiceBuilder';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import type { GeneratedInvoice } from '@/modules/finance/comptabilite/billing/domain/types/invoice.types';

const TENANT_ID = 'tenant_deposit_test';

describe('DepositInvoiceBuilder — Acomptes & Conversion Devis (§7.7)', () => {
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    Nexus.adapter = mockAdapter;
    vi.restoreAllMocks();
  });

  describe('generateDeposit', () => {
    it('génère un acompte valide avec numérotation AC, calcul TVA et scellement WORM', async () => {
      const deposit = await generateDeposit(TENANT_ID, {
        customerName: 'Client Événementiel SARL',
        customerSiret: '98765432100099',
        depositAmountHTInMicrounits: 50_000_000, // 50 € HT
        taxRate: 20,
        groupId: 'group_banquet_2026',
        description: 'Acompte 30% privatisation salle',
      });

      expect(deposit).toBeDefined();
      expect(deposit.invoiceNumber).toMatch(/^AC-\d{4}-\d{6}$/);
      expect(deposit.invoiceType).toBe('deposit');
      expect(deposit.depositGroupId).toBe('group_banquet_2026');
      expect(deposit.customerName).toBe('Client Événementiel SARL');
      expect(deposit.customerSiret).toBe('98765432100099');

      // Calculs montants en micro-unités
      expect(deposit.subTotalInMicrounits).toBe(50_000_000);
      expect(deposit.taxTotalInMicrounits).toBe(10_000_000); // 20% de 50€
      expect(deposit.totalInMicrounits).toBe(60_000_000); // 60€ TTC

      // Détail TVA
      expect(deposit.taxDetails).toHaveLength(1);
      expect(deposit.taxDetails[0].rate).toBe(20);
      expect(deposit.taxDetails[0].baseInMicrounits).toBe(50_000_000);
      expect(deposit.taxDetails[0].amountInMicrounits).toBe(10_000_000);

      // Sceau cryptographique WORM
      expect(deposit.seal).toBeDefined();
      expect(typeof deposit.seal).toBe('string');
      expect(deposit.seal!.length).toBe(64);

      // Persistance
      const stored = await Nexus.adapter.get<GeneratedInvoice>(
        `tenants/${TENANT_ID}/invoices/${deposit.id}`
      );
      expect(stored).toEqual(deposit);
    });
  });

  describe('convertQuoteToInvoice', () => {
    it('lève une erreur si le devis est introuvable', async () => {
      await expect(
        convertQuoteToInvoice(TENANT_ID, 'quote_non_existent')
      ).rejects.toThrow('Quote quote_non_existent not found');
    });

    it('lève une erreur si le devis n\'est pas au statut accepted', async () => {
      await Nexus.adapter.set(`tenants/${TENANT_ID}/quotes/quote_pending`, {
        id: 'quote_pending',
        customerId: 'cust_1',
        customerName: 'Client En Attente',
        items: [],
        total: 150,
        status: 'draft',
      });

      await expect(
        convertQuoteToInvoice(TENANT_ID, 'quote_pending')
      ).rejects.toThrow('Quote quote_pending is draft, must be accepted');
    });

    it('convertit un devis accepté en facture FACT avec mise à jour du devis', async () => {
      await Nexus.adapter.set(`tenants/${TENANT_ID}/quotes/quote_accepted_1`, {
        id: 'quote_accepted_1',
        customerId: 'cust_42',
        customerName: 'Hôtel Le Grand Siècle',
        items: [{ id: 'item_1', name: 'Prestation Buffet', quantity: 1, price: 200 }],
        total: 200, // 200 € HT
        status: 'accepted',
      });

      const invoice = await convertQuoteToInvoice(TENANT_ID, 'quote_accepted_1', {
        customerSiret: '11223344556677',
      });

      expect(invoice).toBeDefined();
      expect(invoice.invoiceNumber).toMatch(/^FACT-\d{4}-\d{6}$/);
      expect(invoice.invoiceType).toBe('from_quote');
      expect(invoice.quoteId).toBe('quote_accepted_1');
      expect(invoice.customerName).toBe('Hôtel Le Grand Siècle');
      expect(invoice.customerSiret).toBe('11223344556677');

      // Montants HT: 200€ = 200_000_000µ, TVA 20%: 40_000_000µ, TTC: 240_000_000µ
      expect(invoice.subTotalInMicrounits).toBe(200_000_000);
      expect(invoice.taxTotalInMicrounits).toBe(40_000_000);
      expect(invoice.totalInMicrounits).toBe(240_000_000);

      // Scellement WORM
      expect(invoice.seal).toBeDefined();
      expect(invoice.seal!.length).toBe(64);

      // Vérification mise à jour du devis
      const updatedQuote = await Nexus.adapter.get<{
        status: string;
        invoiceId: string;
        invoiceNumber: string;
      }>(`tenants/${TENANT_ID}/quotes/quote_accepted_1`);

      expect(updatedQuote?.status).toBe('invoiced');
      expect(updatedQuote?.invoiceId).toBe(invoice.id);
      expect(updatedQuote?.invoiceNumber).toBe(invoice.invoiceNumber);
    });
  });
});
