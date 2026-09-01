import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateCreditNote } from '@/modules/finance/comptabilite/billing/domain/CreditNoteBuilder';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import type { GeneratedInvoice } from '@/modules/finance/comptabilite/billing/domain/types/invoice.types';

const TENANT_ID = 'tenant_credit_note_test';

describe('CreditNoteBuilder — Facturation légale & Avoirs (§7.7)', () => {
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    Nexus.adapter = mockAdapter;
    vi.restoreAllMocks();
  });

  it('lève une erreur si la facture originale est introuvable', async () => {
    await expect(
      generateCreditNote(TENANT_ID, 'inv_non_existent', {
        reason: 'Erreur de saisie',
        operatorId: 'op_123',
      })
    ).rejects.toThrow('Invoice inv_non_existent not found');
  });

  it('lève une erreur si la facture originale est déjà annulée', async () => {
    const cancelledInvoice: GeneratedInvoice = {
      id: 'inv_cancelled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderId: 'order_1',
      sourceJournalEntryId: 'je_1',
      invoiceNumber: 'FACT-2026-000001',
      invoiceType: 'invoice',
      customerName: 'Client Test',
      subTotalInMicrounits: 10_000_000,
      subTotalInCents: 1000,
      taxTotalInMicrounits: 2_000_000,
      taxTotalInCents: 200,
      totalInMicrounits: 12_000_000,
      totalInCents: 1200,
      taxDetails: [
        {
          rate: 20,
          baseInMicrounits: 10_000_000,
          baseInCents: 1000,
          amountInMicrounits: 2_000_000,
          amountInCents: 200,
        },
      ],
      status: 'cancelled',
      issuedAt: new Date().toISOString(),
      seal: 'seal_123',
    };

    await Nexus.adapter.set(`tenants/${TENANT_ID}/invoices/inv_cancelled`, cancelledInvoice);

    await expect(
      generateCreditNote(TENANT_ID, 'inv_cancelled', {
        reason: 'Double facturation',
        operatorId: 'op_123',
      })
    ).rejects.toThrow('Invoice inv_cancelled already cancelled');
  });

  it('génère un avoir valide avec montants négatifs exacts en micro-unités et sceau WORM', async () => {
    const originalInvoice: GeneratedInvoice = {
      id: 'inv_original_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderId: 'order_999',
      sourceJournalEntryId: 'je_999',
      invoiceNumber: 'FACT-2026-000042',
      invoiceType: 'invoice',
      customerName: 'Entreprise Dupont SAS',
      customerAddress: '10 Rue de la Paix, 75001 Paris',
      customerSiret: '12345678900012',
      subTotalInMicrounits: 100_000_000, // 100 €
      subTotalInCents: 10000,
      taxTotalInMicrounits: 20_000_000,  // 20 €
      taxTotalInCents: 2000,
      totalInMicrounits: 120_000_000,    // 120 €
      totalInCents: 12000,
      taxDetails: [
        {
          rate: 20,
          baseInMicrounits: 100_000_000,
          baseInCents: 10000,
          amountInMicrounits: 20_000_000,
          amountInCents: 2000,
        },
      ],
      status: 'issued',
      issuedAt: new Date().toISOString(),
      seal: 'seal_original_42',
    };

    await Nexus.adapter.set(`tenants/${TENANT_ID}/invoices/inv_original_1`, originalInvoice);

    const creditNote = await generateCreditNote(TENANT_ID, 'inv_original_1', {
      reason: 'Retour marchandise conforme',
      operatorId: 'manager_007',
    });

    expect(creditNote).toBeDefined();
    expect(creditNote.invoiceNumber).toMatch(/^AV-\d{4}-\d{6}$/);
    expect(creditNote.invoiceType).toBe('credit_note');
    expect(creditNote.originalInvoiceId).toBe('inv_original_1');
    expect(creditNote.originalInvoiceNumber).toBe('FACT-2026-000042');
    expect(creditNote.customerName).toBe('Entreprise Dupont SAS');
    expect(creditNote.customerSiret).toBe('12345678900012');

    // Inversions exactes des montants
    expect(creditNote.subTotalInMicrounits).toBe(-100_000_000);
    expect(creditNote.subTotalInCents).toBe(-10000);
    expect(creditNote.taxTotalInMicrounits).toBe(-20_000_000);
    expect(creditNote.taxTotalInCents).toBe(-2000);
    expect(creditNote.totalInMicrounits).toBe(-120_000_000);
    expect(creditNote.totalInCents).toBe(-12000);

    // Détail TVA inversé
    expect(creditNote.taxDetails).toHaveLength(1);
    expect(creditNote.taxDetails[0].rate).toBe(20);
    expect(creditNote.taxDetails[0].baseInMicrounits).toBe(-100_000_000);
    expect(creditNote.taxDetails[0].amountInMicrounits).toBe(-20_000_000);

    // Scellement WORM
    expect(creditNote.seal).toBeDefined();
    expect(typeof creditNote.seal).toBe('string');
    expect(creditNote.seal!.length).toBe(64); // SHA-256 hex string

    // Vérification de la persistance dans le store
    const stored = await Nexus.adapter.get<GeneratedInvoice>(
      `tenants/${TENANT_ID}/invoices/${creditNote.id}`
    );
    expect(stored).toEqual(creditNote);
  });
});
