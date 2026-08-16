import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Auto86Service } from './Auto86Service';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';

describe('⛔ Auto86Service — Propagation & Détection Automatique Rupture Recettes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 'tenant_bistrot_marseille';

  it('devrait calculer la matrice de criticité triée par ratio quantité/seuil critique', () => {
    const mockStockItems = [
      { id: 'item_1', name: 'Farine', quantity: 50, minQuantity: 10 }, // ratio: 5
      { id: 'item_2', name: 'Beurre', quantity: 2, minQuantity: 5 }, // ratio: 0.4 (critique)
      { id: 'item_3', name: 'Sucre', quantity: 15, minQuantity: 15 }, // ratio: 1.0 (seuil)
      { id: 'item_4', name: 'Sel', quantity: 100, minQuantity: 0 }, // ignoré (minQuantity=0)
    ] as never[];

    const matrix = Auto86Service.getCriticalityMatrix(mockStockItems);

    expect(matrix.length).toBe(3);
    expect(matrix[0].stockItemId).toBe('item_2'); // Le plus critique en 1er
    expect(matrix[1].stockItemId).toBe('item_3');
    expect(matrix[2].stockItemId).toBe('item_1');
  });

  it('devrait mettre hors vente (86) les produits dont un ingrédient est en rupture critique', async () => {
    const mockStock = [
      { id: 'stock_saumon', ingredientId: 'ing_saumon', quantity: 0, minQuantity: 2 }, // Rupture
      { id: 'stock_riz', ingredientId: 'ing_riz', quantity: 10, minQuantity: 1 },
    ];

    const mockRecipes = [
      {
        id: 'recipe_pave_saumon',
        name: 'Pavé de Saumon Rôti',
        ingredients: [{ ingredientId: 'ing_saumon', quantity: 1 }],
      },
      {
        id: 'recipe_riz_nature',
        name: 'Riz Blanc',
        ingredients: [{ ingredientId: 'ing_riz', quantity: 1 }],
      },
    ];

    const mockProducts = [
      { id: 'prod_saumon', recipeId: 'recipe_pave_saumon', isAvailable: true },
      { id: 'prod_riz', recipeId: 'recipe_riz_nature', isAvailable: true },
    ];

    vi.spyOn(Nexus.adapter, 'query')
      .mockResolvedValueOnce(mockStock as never[])
      .mockResolvedValueOnce(mockRecipes as never[])
      .mockResolvedValueOnce(mockProducts as never[]);

    const spyUpdate = vi.spyOn(Nexus.adapter, 'update').mockResolvedValue(undefined);
    const spyAudit = vi.spyOn(empireAudit, 'log');

    const result = await Auto86Service.evaluate(tenantId);

    expect(result.eightySixed).toContain('prod_saumon');
    expect(result.restored.length).toBe(0);

    expect(spyUpdate).toHaveBeenCalledWith(
      `tenants/${tenantId}/products/prod_saumon`,
      expect.objectContaining({ isAvailable: false })
    );

    expect(spyAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'inventory',
        action: 'auto_86_propagation',
      })
    );
  });

  it('devrait restaurer un produit (isAvailable: true) si tous ses ingrédients repassent au-dessus du seuil', async () => {
    const mockStock = [
      { id: 'stock_saumon', ingredientId: 'ing_saumon', quantity: 10, minQuantity: 2 }, // Stock réapprovisionné
    ];

    const mockRecipes = [
      {
        id: 'recipe_pave_saumon',
        name: 'Pavé de Saumon Rôti',
        ingredients: [{ ingredientId: 'ing_saumon', quantity: 1 }],
      },
    ];

    const mockProducts = [
      { id: 'prod_saumon', recipeId: 'recipe_pave_saumon', isAvailable: false }, // Était hors vente
    ];

    vi.spyOn(Nexus.adapter, 'query')
      .mockResolvedValueOnce(mockStock as never[])
      .mockResolvedValueOnce(mockRecipes as never[])
      .mockResolvedValueOnce(mockProducts as never[]);

    const spyUpdate = vi.spyOn(Nexus.adapter, 'update').mockResolvedValue(undefined);

    const result = await Auto86Service.evaluate(tenantId);

    expect(result.restored).toContain('prod_saumon');
    expect(result.eightySixed.length).toBe(0);

    expect(spyUpdate).toHaveBeenCalledWith(
      `tenants/${tenantId}/products/prod_saumon`,
      expect.objectContaining({ isAvailable: true })
    );
  });
});
