import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerOpsBarHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("bar.spout_variance_detected", async (payload) => {
      try {
        const { SmartSpoutTelemetryService } = await import("@/modules/ops/service/restaurant/pos/services/SmartSpoutTelemetryService");
        if (typeof (SmartSpoutTelemetryService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).notifyOrder === "function") {
          await (SmartSpoutTelemetryService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).notifyOrder(payload);
        }
      } catch (err) {
        logger.error("[bar.spout_variance_detected] SmartSpout error:", err);
      }
    })
  ];
}
