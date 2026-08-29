import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerComplianceSecurityHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("security.pin_locked", async (payload) => {
      try {
        const { EmergencyExitOpeningChecklistService } = await import("@/modules/compliance/qualite/haccp/services/EmergencyExitOpeningChecklistService");
        if (typeof (EmergencyExitOpeningChecklistService as any).triggerDailyCheck === "function") {
          await (EmergencyExitOpeningChecklistService as any).triggerDailyCheck(payload);
        }
        const { GdprDataAnonymizerService } = await import("@/modules/compliance/securite/GdprDataAnonymizerService");
        if (typeof (GdprDataAnonymizerService as any).anonymize === "function") {
          await (GdprDataAnonymizerService as any).anonymize(payload);
        }
      } catch (err) {
        logger.error("[security.pin_locked] Security handler error:", err);
      }
    })
  ];
}
