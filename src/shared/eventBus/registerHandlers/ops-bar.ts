import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerOpsBarHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("bar.spout_variance_detected", async (payload) => {
      try {
        const { SmartSpoutTelemetryService } = await import("@/modules/ops/service/pos/services/SmartSpoutTelemetryService");
        if (typeof (SmartSpoutTelemetryService as any).notifyOrder === "function") {
          await (SmartSpoutTelemetryService as any).notifyOrder(payload);
        }
      } catch (err) {
        logger.error("[bar.spout_variance_detected] SmartSpout error:", err);
      }
    }),
    NexusEventBus.on("bar.flash_inventory_completed", async (payload) => {
      try {
        const { FlashAlcoholInventoryService } = await import("@/modules/ops/service/pos/services/FlashAlcoholInventoryService");
        if (typeof (FlashAlcoholInventoryService as any).performFlashCount === "function") {
          await (FlashAlcoholInventoryService as any).performFlashCount(payload);
        }
      } catch (err) {
        logger.error("[bar.flash_inventory_completed] Flash inventory error:", err);
      }
    })
  ];
}
