import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusYieldEngine } from './NexusYieldEngine';
import { MarketingService } from '@modules/commerce/acquisition/marketing/services/MarketingService';
import { ProcurementService } from '@modules/logistics/services/ProcurementService';
import type { StockItem } from '@nexus/contracts';

describe('🌀 NexusYieldEngine — Yield Management & Reassort Automatique', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProducts = [
    { id: 'prod_entrecote', name: 'Entrecôte Maturée', basePriceCents: 2800 },
    { id: 'prod_pasta', name: 'Pâtes Fraîches Truffe', basePriceCents: 1600 },
  ];

  it('devrait appliquer le yieldFactor de +15% en cas de rush ET de stock critique', async () => {
    const mockStock: StockItem[] = [
      {
        id: 'stk_1',
        ingredientId: 'prod_entrecote',
        name: 'Entrecôte',
        quantity: 2000, // < 5000 (critique)
        minQuantity: 5000,
        reorderQuantity: 10000,
        unit: 'g',
        location: 'fridge_1',
        lotNumber: 'L1',
        expirationDate: '2026-09-01',
      } as unknown as StockItem,
      {
        id: 'stk_2',
        ingredientId: 'prod_pasta',
        name: 'Pâtes',
        quantity: 20000, // Normal
        minQuantity: 5000,
        reorderQuantity: 10000,
        unit: 'g',
        location: 'dry_1',
        lotNumber: 'L2',
        expirationDate: '2026-10-01',
      } as unknown as StockItem,
    ];

    const spyMarketing = vi.spyOn(MarketingService, 'updateDynamicPricing').mockImplementation(() => {});
    const spyProcurement = vi.spyOn(ProcurementService, 'generateAutomatedPO').mockResolvedValue(undefined as never);
    vi.spyOn(ProcurementService, 'getRecentCostForIngredient').mockReturnValue(1200);

    const results = await NexusYieldEngine.processYieldCycle({
      products: mockProducts,
      allStock: mockStock,
      currentVelocity: 65, // > 50 (Rush)
    });

    expect(results.length).toBe(2);

    // Entrecôte: Rush + Critique -> +15%
    expect(results[0].productId).toBe('prod_entrecote');
    expect(results[0].isCritical).toBe(true);
    expect(results[0].yieldFactor).toBe(1.15);
    expect(results[0].adjustedPriceCents).toBe(3220); // 2800 * 1.15 = 3220
    expect(spyMarketing).toHaveBeenCalledWith('prod_entrecote', 1.15);
    expect(spyProcurement).toHaveBeenCalledWith(
      expect.objectContaining({
        ingredientId: 'prod_entrecote',
        quantity: 10000,
      })
    );

    // Pâtes: Rush mais stock sain -> 1.0x
    expect(results[1].productId).toBe('prod_pasta');
    expect(results[1].isCritical).toBe(false);
    expect(results[1].yieldFactor).toBe(1.0);
    expect(results[1].adjustedPriceCents).toBe(1600);
  });

  it('devrait maintenir le prix normal (1.0x) en période calme même si le stock est bas', async () => {
    const mockStock: StockItem[] = [
      {
        id: 'stk_1',
        ingredientId: 'prod_entrecote',
        name: 'Entrecôte',
        quantity: 1000,
        minQuantity: 5000,
        unit: 'g',
        location: 'fridge_1',
        lotNumber: 'L1',
        expirationDate: '2026-09-01',
      } as unknown as StockItem,
    ];

    vi.spyOn(MarketingService, 'updateDynamicPricing').mockImplementation(() => {});
    vi.spyOn(ProcurementService, 'generateAutomatedPO').mockResolvedValue(undefined as never);

    const results = await NexusYieldEngine.processYieldCycle({
      products: [mockProducts[0]],
      allStock: mockStock,
      currentVelocity: 20, // Calme (< 50)
    });

    expect(results[0].yieldFactor).toBe(1.0);
    expect(results[0].adjustedPriceCents).toBe(2800);
  });
});
