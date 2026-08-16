import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteEngine, QuoteSchema } from './QuoteEngine';
import { NexusTransaction } from '@/lib/adapters/NexusTransaction';

describe('📜 QuoteEngine — Générateur de Devis & Validation Zod', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait valider un devis conforme avec QuoteSchema', () => {
    const validQuote = {
      customerId: 'cust_privatisation_01',
      customerName: 'Entreprise NexaCorp',
      items: [
        { id: 'item_1', name: 'Menu Dégustation 5 Temps (x30)', quantity: 30, price: 6500 },
        { id: 'item_2', name: 'Accord Mets & Vins Sommelier (x30)', quantity: 30, price: 3500 },
      ],
      total: 300000,
      validTo: '2026-12-31',
    };

    const parsed = QuoteSchema.safeParse(validQuote);
    expect(parsed.success).toBe(true);
  });

  it('devrait rejeter un devis avec un total ou une quantité invalide', () => {
    const invalidQuote = {
      customerId: '',
      customerName: 'Test',
      items: [],
      total: -50,
      validTo: '2026-12-31',
    };

    const parsed = QuoteSchema.safeParse(invalidQuote);
    expect(parsed.success).toBe(false);
  });

  it('devrait exécuter la transaction de création de devis atomique', async () => {
    vi.spyOn(NexusTransaction, 'run').mockImplementation(async (_opts, callback) => {
      const mockTx = {
        set: vi.fn(),
      };
      return await callback(mockTx as never);
    });

    const result = await QuoteEngine.createQuote({
      customerId: 'cust_01',
      customerName: 'Client Événement',
      items: [{ id: 'it_1', name: 'Buffet Cocktail', quantity: 1, price: 1500 }],
      total: 1500,
      validTo: '2026-10-01',
    });

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
  });
});
