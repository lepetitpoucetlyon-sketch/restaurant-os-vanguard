import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerOpsPrintHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("pos.printer_failover", async (payload) => {
      try {
        const { UniversalPrinterBridgeService } = await import("@/modules/ops/service/restaurant/pos/services/UniversalPrinterBridgeService");
        if (typeof (UniversalPrinterBridgeService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).handlePrintRequest === "function") {
          await (UniversalPrinterBridgeService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).handlePrintRequest(payload);
        }
      } catch (err) {
        logger.error("[pos.printer_failover] Print bridge error:", err);
      }
    })
  ];
}
