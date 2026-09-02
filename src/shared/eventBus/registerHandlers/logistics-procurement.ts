import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerLogisticsProcurementHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("stock.mercuriale_price_compared", async (payload) => {
      try {
        const { empireAudit } = await import("@/lib/audit");
        empireAudit.log({
          module: 'logistics',
          action: 'MERCURIALE_PRICE_COMPARED',
          details: {
            sku: payload.sku,
            lowestSupplierId: payload.lowestSupplierId,
            bestPriceInMicrounits: payload.bestPriceInMicrounits,
            potentialSavingsInMicrounits: payload.potentialSavingsInMicrounits,
          },
          timestamp: new Date(),
          instanceId: payload.tenantId,
        });
      } catch (err) {
        logger.error("[stock.mercuriale_price_compared] Mercuriale compare audit error:", err);
      }
    }),
    NexusEventBus.on("stock.free_shipping_optimized", async (payload) => {
      try {
        const { empireAudit } = await import("@/lib/audit");
        empireAudit.log({
          module: 'logistics',
          action: 'FREE_SHIPPING_OPTIMIZED',
          details: {
            supplierId: payload.supplierId,
            currentCartInMicrounits: payload.currentCartInMicrounits,
            francoThresholdInMicrounits: payload.francoThresholdInMicrounits,
            suggestedBufferSkus: payload.suggestedBufferSkus,
          },
          timestamp: new Date(),
          instanceId: payload.tenantId,
        });
      } catch (err) {
        logger.error("[stock.free_shipping_optimized] Free shipping optimizer audit error:", err);
      }
    })
  ];
}
