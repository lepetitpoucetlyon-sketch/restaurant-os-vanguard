import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerHumanLegalHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("hr.dpae_submitted", async (payload) => {
      try {
        const { DpaeConnectorService } = await import("@/modules/human/effectifs/hr/services/DpaeConnectorService");
        if (typeof (DpaeConnectorService as any).prepareDpae === "function") {
          await (DpaeConnectorService as any).prepareDpae(payload);
        }
      } catch (err) {
        logger.error("[hr.dpae_submitted] Dpae connector error:", err);
      }
    }),
    NexusEventBus.on("hr.rest_period_violation", async (payload) => {
      try {
        const { RestPeriodGuard } = await import("@/modules/human/effectifs/hr/services/RestPeriodGuard");
        if (typeof (RestPeriodGuard as any).validateShiftEnd === "function") {
          await (RestPeriodGuard as any).validateShiftEnd(payload);
        }
      } catch (err) {
        logger.error("[hr.rest_period_violation] Rest period check error:", err);
      }
    })
  ];
}
