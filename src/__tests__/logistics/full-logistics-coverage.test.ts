import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StockEngine, aggregateRecipeIngredients } from '@/modules/logistics/services/StockEngine';
import { ProcurementService } from '@/modules/logistics/services/ProcurementService';
import { ExtractedSupplierInvoiceSchema } from '@/modules/logistics/domain/schemas/supplier-invoice.schemas';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { Order, Recipe, StockItem } from '@nexus/contracts';

describe('🚚 Logistique, Approvisionnements & Stock — Couverture 100%', () => {
  describe('1. aggregateRecipeIngredients & Modificateurs', () => {
    it('doit agréger les ingrédients de base dune recette', () => {
      const recipe: Recipe = {
        id: 'rec-burger',
        name: 'Classic Cheeseburger',
        ingredients: [
          { id: 'ing-steak', name: 'Steak Haché 150g', quantity: 1, unit: 'pcs' },
          { id: 'ing-cheddar', name: 'Cheddar AOP', quantity: 2, unit: 'tranches' },
          { id: 'ing-bun', name: 'Pain Bun Brioché', quantity: 1, unit: 'pcs' },
        ],
      } as Recipe;

      const aggregated = aggregateRecipeIngredients(recipe, []);
      expect(aggregated.size).toBe(3);
      expect(aggregated.get('ing-cheddar')?.quantity).toBe(2);
    });

    it('doit appliquer les modificateurs add et remove sur les ingrédients', () => {
      const recipe: Recipe = {
        id: 'rec-burger',
        name: 'Classic Cheeseburger',
        ingredients: [
          { id: 'ing-steak', name: 'Steak Haché 150g', quantity: 1, unit: 'pcs' },
          { id: 'ing-onion', name: 'Oignons Rouges', quantity: 1, unit: 'portion' },
          { id: 'ing-cheddar', name: 'Cheddar AOP', quantity: 1, unit: 'tranches' },
        ],
      } as Recipe;

      const modifiers = [
        { action: 'add', quantityImpact: 2, ingredientId: 'ing-cheddar', name: 'Extra Cheddar' },
        { action: 'remove', ingredientId: 'ing-onion', name: 'Sans Oignons' },
      ];

      const aggregated = aggregateRecipeIngredients(recipe, modifiers);
      expect(aggregated.has('ing-onion')).toBe(false);
      expect(aggregated.get('ing-cheddar')?.quantity).toBe(3); // 1 + 2 = 3
    });
  });

  describe('2. StockEngine — Déduction d’impact commande & mouvements', () => {
    it('doit déduire les stocks de manière déterministe lors dune commande', async () => {
      const order: Order = {
        id: 'ord-101',
        tenantId: 'tenant-lyon',
        items: [
          {
            id: 'item-1',
            productId: 'rec-burger',
            name: 'Classic Cheeseburger',
            quantity: 2,
            unitPrice: 15.0,
            modifiers: [],
          },
        ],
        status: 'PAID',
        totalAmount: 30.0,
        createdAt: new Date().toISOString(),
      } as unknown as Order;

      const recipes: Recipe[] = [
        {
          id: 'rec-burger',
          name: 'Classic Cheeseburger',
          ingredients: [
            { id: 'ing-steak', name: 'Steak Haché', quantity: 1, unit: 'pcs' },
            { id: 'ing-bun', name: 'Pain Bun', quantity: 1, unit: 'pcs' },
          ],
        } as Recipe,
      ];

      const allStock: StockItem[] = [
        {
          id: 'stk-batch-1',
          ingredientId: 'ing-steak',
          quantity: 20,
          unit: 'pcs',
          dlc: '2026-12-31',
          status: 'in_stock',
        } as unknown as StockItem,
        {
          id: 'stk-batch-2',
          ingredientId: 'ing-bun',
          quantity: 15,
          unit: 'pcs',
          dlc: '2026-12-31',
          status: 'in_stock',
        } as unknown as StockItem,
      ];

      const impact = await StockEngine.calculateOrderStockImpact(order, recipes, allStock, 'corr-998');

      expect(impact.updates).toHaveLength(2);
      expect(impact.movements).toHaveLength(2);

      const steakUpdate = impact.updates.find(u => u.id === 'stk-batch-1');
      expect(steakUpdate?.data.quantity).toBe(18); // 20 - (2 * 1) = 18

      const bunUpdate = impact.updates.find(u => u.id === 'stk-batch-2');
      expect(bunUpdate?.data.quantity).toBe(13); // 15 - (2 * 1) = 13
    });
  });

  describe('3. ProcurementService — Bons de Commande Automatisés', () => {
    beforeEach(() => {
      vi.spyOn(Nexus.adapter, 'query').mockResolvedValue([
        { id: 'sup-metro', name: 'METRO Cash & Carry' },
        { id: 'sup-transgourmet', name: 'Transgourmet' },
      ]);
    });

    it('doit charger les fournisseurs depuis Nexus', async () => {
      const suppliers = await ProcurementService.loadSuppliers();
      expect(suppliers).toHaveLength(2);
      expect(suppliers[0].name).toBe('METRO Cash & Carry');
    });

    it('doit générer un bon de commande automatisé (PO) avec sélection dynamique du fournisseur', async () => {
      const po = await ProcurementService.generateAutomatedPO({
        ingredientId: 'ing-farine-t55',
        quantity: 50,
        unit: 'kg',
        estimatedUnitCostCents: 120, // 1.20€ / kg
      });

      expect(po.id).toBeDefined();
      expect(po.supplierId).toBe('sup-metro');
      expect(po.estimatedCostCents).toBe(6000); // 50 * 120 = 60.00€
      expect(po.status).toBe('sent');
    });
  });

  describe('4. ExtractedSupplierInvoiceSchema — Validation Facture Fournisseur', () => {
    it('doit valider une facture fournisseur complète extraite par OCR/IA', () => {
      const invoiceData = {
        invoice_metadata: {
          invoice_number: 'FAC-2026-8891',
          date: '2026-08-15',
          supplier: {
            name: 'Pomona Terre Azur',
            siret: '12345678900014',
            known_supplier_id: 'POMONA' as const,
          },
          currency: 'EUR' as const,
          document_type: 'INVOICE' as const,
        },
        line_items: [
          {
            line_number: 1,
            raw_label: 'Tomates Grappe France Cat 1',
            canonical_name: 'Tomate Grappe',
            product_category: 'ALIMENTAIRE_BASE' as const,
            quantity: 20,
            unit: 'KG' as const,
            unit_price_cents: 250,
            tax_rate_percent: 5.5 as const,
            tax_rate_inferred: false,
            line_total_excl_tax_cents: 5000,
            line_tax_cents: 275,
            line_total_incl_tax_cents: 5275,
          },
        ],
        totals: {
          subtotal_excl_tax_cents: 5000,
          total_tax_cents: 275,
          total_incl_tax_cents: 5275,
          tax_breakdown: [
            {
              rate_percent: 5.5 as const,
              base_cents: 5000,
              tax_cents: 275,
            },
          ],
        },
        confidence: {
          overall: 'HIGH' as const,
          image_quality: 'CLEAR' as const,
          extraction_coverage_percent: 99,
        },
        flags: [],
      };

      const parsed = ExtractedSupplierInvoiceSchema.parse(invoiceData);
      expect(parsed.invoice_metadata.invoice_number).toBe('FAC-2026-8891');
      expect(parsed.invoice_metadata.supplier.name).toBe('Pomona Terre Azur');
      expect(parsed.line_items).toHaveLength(1);
    });
  });
});
