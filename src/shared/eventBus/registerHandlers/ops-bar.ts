import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerOpsBarHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("bar.spout_variance_detected", async (payload) => {
      try {
        const { SmartSpoutTelemetryService } = await import("@/modules/ops/service/pos/services/SmartSpoutTelemetryService");
        if (typeof (SmartSpoutTelemetryService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).notifyOrder === "function") {
          await (SmartSpoutTelemetryService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).notifyOrder(payload);
        }
      } catch (err) {
        logger.error("[bar.spout_variance_detected] SmartSpout error:", err);
      }
    }),
    NexusEventBus.on("bar.flash_inventory_completed", async (payload) => {
      try {
        const { FlashAlcoholInventoryService } = await import("@/modules/ops/service/pos/services/FlashAlcoholInventoryService");
        if (typeof (FlashAlcoholInventoryService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).performFlashCount === "function") {
          await (FlashAlcoholInventoryService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).performFlashCount(payload);
        }
      } catch (err) {
        logger.error("[bar.flash_inventory_completed] Flash inventory error:", err);
      }
    })
  ];
}
