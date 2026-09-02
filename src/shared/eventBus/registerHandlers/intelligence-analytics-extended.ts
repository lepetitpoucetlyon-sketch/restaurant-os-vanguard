import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerIntelligenceAnalyticsExtendedHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("intelligence.menu_engineering_requested", async (payload) => {
      try {
        const { MenuEngineeringService } = await import("@/modules/intelligence/analytique/analytics/MenuEngineeringService");
        const dishes = ((payload as Record<string, unknown>).dishes as import("@/modules/intelligence/analytique/analytics/MenuEngineeringService").DishPerformance[]) || [];
        const results = MenuEngineeringService.analyze(dishes);
        const { empireAudit } = await import("@/lib/audit");
        empireAudit.log({
          module: 'intelligence',
          action: 'MENU_ENGINEERING_COMPUTED',
          details: { itemsCount: results.length },
          timestamp: new Date(),
          instanceId: payload.tenantId,
        });
      } catch (err) {
        logger.error("[intelligence.menu_engineering_requested] Menu engineering error:", err);
      }
    })
  ];
}
