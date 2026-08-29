import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerIntelligenceAnalyticsExtendedHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("intelligence.menu_engineering_requested", async (payload) => {
      try {
        const { MenuEngineeringService } = await import("@/modules/intelligence/analytique/analytics/MenuEngineeringService");
        if (typeof (MenuEngineeringService as any).analyzeMenu === "function") {
          await (MenuEngineeringService as any).analyzeMenu(payload);
        }
      } catch (err) {
        logger.error("[intelligence.menu_engineering_requested] Menu engineering error:", err);
      }
    })
  ];
}
