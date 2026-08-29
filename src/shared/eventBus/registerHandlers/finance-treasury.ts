import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerFinanceTreasuryHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("finance.cash_pool_balanced", async (payload) => {
      try {
        const { CrossTenantCashPoolTreasuryService } = await import("@/modules/finance/tresorerie/CrossTenantCashPoolTreasuryService");
        if (typeof (CrossTenantCashPoolTreasuryService as any).balancePool === "function") {
          await (CrossTenantCashPoolTreasuryService as any).balancePool(payload);
        }
      } catch (err) {
        logger.error("[finance.cash_pool_balanced] Cash pool error:", err);
      }
    })
  ];
}
