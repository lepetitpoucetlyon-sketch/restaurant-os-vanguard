import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface BufferStapleItem {
  sku: string;
  name: string;
  unitPriceInMicrounits: number;
  shelfLifeDays: number; // Produits longue conservation (farine, huile, conserves)
}

export interface FrancoOptimizationRequest {
  tenantId: string;
  supplierId: string;
  currentCartInMicrounits: number;
  francoThresholdInMicrounits: number; // ex: 250 € (250_000_000)
  shippingCostInMicrounits: number; // ex: 35 € (35_000_000)
  availableBufferStaples: BufferStapleItem[];
}

export interface FrancoOptimizationResult {
  hasReachedFranco: boolean;
  shortfallToFrancoInMicrounits: number;
  suggestedItemsToFillCart: BufferStapleItem[];
  netSavingsInMicrounits: number; // Économie des frais de port
}

/**
 * FreeShippingThresholdOptimizerService — Angle mort T56.
 * Optimiseur de franco de port fournisseur : suggère d'ajouter des matières premières de base non-périssables pour combler le panier et économiser 30€ à 50€ de frais de port.
 */
export class FreeShippingThresholdOptimizerService {
  static optimizeCart(req: FrancoOptimizationRequest): FrancoOptimizationResult {
    const shortfall = Math.max(0, req.francoThresholdInMicrounits - req.currentCartInMicrounits);
    const hasReachedFranco = shortfall === 0;

    const suggestedItems: BufferStapleItem[] = [];
    let filledAmount = 0;

    if (!hasReachedFranco) {
      // Pick durable staples until franco is reached
      for (const item of req.availableBufferStaples) {
        if (filledAmount < shortfall) {
          suggestedItems.push(item);
          filledAmount += item.unitPriceInMicrounits;
        }
      }

      NexusEventBus.emit('stock.free_shipping_optimized', {
        v: 1,
        tenantId: req.tenantId,
        supplierId: req.supplierId,
        currentCartInMicrounits: req.currentCartInMicrounits,
        francoThresholdInMicrounits: req.francoThresholdInMicrounits,
        suggestedBufferSkus: suggestedItems.map(i => i.sku),
        optimizedAt: Date.now(),
      });
    }

    return {
      hasReachedFranco,
      shortfallToFrancoInMicrounits: shortfall,
      suggestedItemsToFillCart: suggestedItems,
      netSavingsInMicrounits: req.shippingCostInMicrounits,
    };
  }
}
