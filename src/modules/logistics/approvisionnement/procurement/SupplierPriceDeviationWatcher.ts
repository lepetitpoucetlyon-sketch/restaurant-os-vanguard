/**
 * T59 — Dérive prix fournisseur > 5 % (hausse silencieuse d'un article).
 *
 * Un fournisseur peut augmenter silencieusement un article de 8 % d'une
 * livraison à l'autre sans que le restaurateur ne s'en aperçoive (il valide
 * la facture sans comparer à la mercuriale précédente).
 *
 * Ce service compare le prix facturé au prix de référence et alerte si la
 * déviation dépasse le seuil configurable.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § T59 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';

const DEFAULT_THRESHOLD_PCT = 5;

export interface PriceDeviationCheck {
  tenantId: string;
  supplierId: string;
  productId: string;
  newPriceInMicrounits: number;
  thresholdPct?: number;
  checkedBy: string;
  now?: number;
}

export interface DeviationResult {
  alerted: boolean;
  previousPrice?: number;
  deviationPct?: number;
}

export class SupplierPriceDeviationWatcher {
  private static refPath(tenantId: string, supplierId: string, productId: string): string {
    return `tenants/${tenantId}/supplier_price_refs/${supplierId}_${productId}`;
  }

  static async check(input: PriceDeviationCheck): Promise<DeviationResult> {
    const now = input.now ?? Date.now();
    const threshold = input.thresholdPct ?? DEFAULT_THRESHOLD_PCT;
    const path = this.refPath(input.tenantId, input.supplierId, input.productId);

    const existing = await Nexus.adapter.get<{ price: number; updatedAt: number }>(path);

    if (!existing) {
      await Nexus.adapter.set(path, { price: input.newPriceInMicrounits, updatedAt: now });
      return { alerted: false };
    }

    const deviationPct = Math.abs((input.newPriceInMicrounits - existing.price) / existing.price) * 100;

    await Nexus.adapter.set(path, { price: input.newPriceInMicrounits, updatedAt: now });

    if (deviationPct >= threshold) {
      await NexusEventBus.emit('logistics.supplier_price_deviation', {
        v: 1,
        tenantId: input.tenantId,
        supplierId: input.supplierId,
        productId: input.productId,
        previousPrice: existing.price,
        newPrice: input.newPriceInMicrounits,
        deviationPct: Math.round(deviationPct * 10) / 10,
        detectedAt: now,
      });

      await AuditLogger.logAction(
        input.checkedBy,
        'SUPPLIER_PRICE_DEVIATION',
        input.productId,
        { supplierId: input.supplierId, previousPrice: existing.price, newPrice: input.newPriceInMicrounits, deviationPct },
      ).catch(() => null);

      return { alerted: true, previousPrice: existing.price, deviationPct };
    }

    return { alerted: false, previousPrice: existing.price, deviationPct };
  }
}
