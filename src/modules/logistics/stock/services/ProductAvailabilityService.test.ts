import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductAvailabilityService } from './ProductAvailabilityService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';

describe('🚫 ProductAvailabilityService — Mise Hors-Vente Produit Sécurisée', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 'tenant_lyon_gourmet';
  const productId = 'prod_tartare_boeuf';

  it('devrait passer le produit à isAvailable: false et émettre un audit si disponible', async () => {
    const mockProduct = {
      id: productId,
      name: 'Tartare de Bœuf Charolais',
      isAvailable: true,
      price: 18000000,
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(mockProduct);
    const spyUpdate = vi.spyOn(Nexus.adapter, 'update').mockResolvedValueOnce(undefined);
    const spyAudit = vi.spyOn(empireAudit, 'log');

    await ProductAvailabilityService.flagUnavailable(tenantId, productId, 'Rupture stock viande hachée');

    expect(spyUpdate).toHaveBeenCalledWith(
      `tenants/${tenantId}/products/${productId}`,
      expect.objectContaining({
        isAvailable: false,
      })
    );

    expect(spyAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'inventory',
        action: 'PRODUCT_BLOCKED',
        severity: 'high',
        details: expect.objectContaining({
          productId,
          productName: 'Tartare de Bœuf Charolais',
          reason: 'Rupture stock viande hachée',
        }),
      })
    );
  });

  it('ne devrait rien faire si le produit est déjà marqué isAvailable: false (anti-doublon)', async () => {
    const mockProduct = {
      id: productId,
      name: 'Tartare de Bœuf Charolais',
      isAvailable: false, // Déjà hors vente
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(mockProduct);
    const spyUpdate = vi.spyOn(Nexus.adapter, 'update');
    const spyAudit = vi.spyOn(empireAudit, 'log');

    await ProductAvailabilityService.flagUnavailable(tenantId, productId, 'Rupture stock viande hachée');

    expect(spyUpdate).not.toHaveBeenCalled();
    expect(spyAudit).not.toHaveBeenCalled();
  });

  it('ne devrait pas planter si le produit est introuvable', async () => {
    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(null);
    const spyUpdate = vi.spyOn(Nexus.adapter, 'update');

    await expect(
      ProductAvailabilityService.flagUnavailable(tenantId, 'prod_inconnu', 'Test')
    ).resolves.not.toThrow();

    expect(spyUpdate).not.toHaveBeenCalled();
  });
});
