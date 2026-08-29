import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerComplianceSanitaryHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("haccp.alert", async (payload) => {
      try {
        const { ChillingComplianceService } = await import("@/modules/compliance/qualite/haccp/services/ChillingComplianceService");
        if (typeof (ChillingComplianceService as any).evaluateReading === "function") {
          await (ChillingComplianceService as any).evaluateReading(payload);
        }
      } catch (err) {
        logger.error("[haccp.alert] Sanitary handler error:", err);
      }
    }),
    NexusEventBus.on("haccp.temperature_logged", async (payload) => {
      try {
        const { KitchenHoodDeltaTMonitoringService } = await import("@/modules/compliance/qualite/haccp/services/KitchenHoodDeltaTMonitoringService");
        if (typeof (KitchenHoodDeltaTMonitoringService as any).recordAlert === "function") {
          await (KitchenHoodDeltaTMonitoringService as any).recordAlert(payload);
        }
      } catch (err) {
        logger.error("[haccp.temperature_logged] Cooling handler error:", err);
      }
    })
  ];
}
