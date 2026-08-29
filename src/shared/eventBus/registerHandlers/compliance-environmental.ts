import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerComplianceEnvironmentalHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("haccp.nonconform", async (payload) => {
      try {
        const { BiodechetsRegistryService } = await import("@/modules/compliance/qualite/biodechets/BiodechetsRegistryService");
        if (typeof (BiodechetsRegistryService as any).recordWaste === "function") {
          await (BiodechetsRegistryService as any).recordWaste(payload);
        }
      } catch (err) {
        logger.error("[haccp.nonconform] Biodechets handler error:", err);
      }
    }),
    NexusEventBus.on("compliance.deadline_approaching", async (payload) => {
      try {
        const { BsddWasteOilService } = await import("@/modules/compliance/qualite/biodechets/BsddWasteOilService");
        if (typeof (BsddWasteOilService as any).recordOilCheck === "function") {
          await (BsddWasteOilService as any).recordOilCheck(payload);
        }
      } catch (err) {
        logger.error("[compliance.deadline_approaching] Bsdd handler error:", err);
      }
    })
  ];
}
