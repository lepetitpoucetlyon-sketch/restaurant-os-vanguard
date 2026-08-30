import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerOpsTpeHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("pos.tpe_simulation_completed", async (payload) => {
      try {
        const { TpeReconciliationService } = await import("@/modules/ops/service/pos/services/TpeReconciliationService");
        if (typeof (TpeReconciliationService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).reconcilePayment === "function") {
          await (TpeReconciliationService as unknown as Record<string, (payload: unknown) => Promise<unknown>>).reconcilePayment(payload);
        }
      } catch (err) {
        logger.error("[pos.tpe_simulation_completed] Tpe reconciliation error:", err);
      }
    })
  ];
}
