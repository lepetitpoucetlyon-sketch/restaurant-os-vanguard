import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerComplianceSanitaryHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("haccp.alert", async (payload) => {
      try {
        const { ChillingComplianceService } = await import("@/modules/compliance/qualite/haccp/services/ChillingComplianceService");
        if (typeof (ChillingComplianceService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).evaluateReading === "function") {
          await (ChillingComplianceService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).evaluateReading(payload);
        }
      } catch (err) {
        logger.error("[haccp.alert] Sanitary handler error:", err);
      }
    }),
    NexusEventBus.on("haccp.temperature_logged", async (payload) => {
      try {
        const { KitchenHoodDeltaTMonitoringService } = await import("@/modules/compliance/qualite/haccp/services/KitchenHoodDeltaTMonitoringService");
        if (typeof (KitchenHoodDeltaTMonitoringService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).recordAlert === "function") {
          await (KitchenHoodDeltaTMonitoringService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).recordAlert(payload);
        }
      } catch (err) {
        logger.error("[haccp.temperature_logged] Cooling handler error:", err);
      }
    })
  ];
}
