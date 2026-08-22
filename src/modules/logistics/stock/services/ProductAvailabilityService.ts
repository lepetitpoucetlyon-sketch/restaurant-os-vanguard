import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import type { Product } from '@/modules/commerce';

/**
 * Service centralisé garantissant qu'il n'y ait pas de race-conditions 
 * lors de la mise hors-vente d'un produit (Stock = 0, HACCP, Rappel).
 */
export const ProductAvailabilityService = {
  async flagUnavailable(tenantId: string, productId: string, reason: string): Promise<void> {
    const path = `tenants/${tenantId}/products/${productId}`;
    
    // We fetch the current state to check if it's already unavailable
    const product = await Nexus.adapter.get<Product>(path);
    if (!product) {
      logger.warn(`[ProductAvailability] Produit introuvable: ${productId}`);
      return;
    }

    if (!product.isAvailable) {
      // Déjà hors-vente, on ne fait rien pour éviter les audits en doublon
      return;
    }

    await Nexus.adapter.update(path, {
      isAvailable: false,
      updatedAt: Date.now(),
    });

    logger.warn(`[ProductAvailability] Produit ${productId} mis HORS-VENTE. Raison: ${reason}`);

    empireAudit.log({
      module: 'inventory',
      action: 'PRODUCT_BLOCKED',
      details: { productId, productName: product.name, reason },
      severity: 'high',
      timestamp: new Date(),
    });
  }
};
