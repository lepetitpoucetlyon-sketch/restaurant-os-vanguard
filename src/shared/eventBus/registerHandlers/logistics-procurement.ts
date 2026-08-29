import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerLogisticsProcurementHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("stock.mercuriale_price_compared", async (payload) => {
      try {
        const { MercurialePriceComparisonService } = await import("@/modules/logistics/approvisionnement/procurement/services/MercurialePriceComparisonService");
        if (typeof (MercurialePriceComparisonService as any).compareInvoice === "function") {
          await (MercurialePriceComparisonService as any).compareInvoice(payload);
        }
      } catch (err) {
        logger.error("[stock.mercuriale_price_compared] Mercuriale compare error:", err);
      }
    }),
    NexusEventBus.on("stock.free_shipping_optimized", async (payload) => {
      try {
        const { FreeShippingThresholdOptimizerService } = await import("@/modules/logistics/approvisionnement/procurement/services/FreeShippingThresholdOptimizerService");
        if (typeof (FreeShippingThresholdOptimizerService as any).optimizeOrder === "function") {
          await (FreeShippingThresholdOptimizerService as any).optimizeOrder(payload);
        }
      } catch (err) {
        logger.error("[stock.free_shipping_optimized] Free shipping optimizer error:", err);
      }
    })
  ];
}
