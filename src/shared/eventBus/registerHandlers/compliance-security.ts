import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerComplianceSecurityHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("security.pin_locked", async (payload) => {
      try {
        const { EmergencyExitOpeningChecklistService } = await import("@/modules/compliance/qualite/haccp/services/EmergencyExitOpeningChecklistService");
        if (typeof (EmergencyExitOpeningChecklistService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).triggerDailyCheck === "function") {
          await (EmergencyExitOpeningChecklistService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).triggerDailyCheck(payload);
        }
        const { GdprDataAnonymizerService } = await import("@/modules/compliance/securite/GdprDataAnonymizerService");
        if (typeof (GdprDataAnonymizerService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).anonymize === "function") {
          await (GdprDataAnonymizerService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).anonymize(payload);
        }
      } catch (err) {
        logger.error("[security.pin_locked] Security handler error:", err);
      }
    })
  ];
}
