import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerFinanceTreasuryHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("finance.cash_pool_balanced", async (payload) => {
      try {
        const { empireAudit } = await import("@/lib/audit");
        empireAudit.log({
          module: 'finance',
          action: 'CASH_POOL_TRANSFER_RECORDED',
          details: {
            fromTenantId: payload.fromTenantId,
            toTenantId: payload.toTenantId,
            transferAmountInMicrounits: payload.transferAmountInMicrounits,
          },
          timestamp: new Date(),
          instanceId: payload.groupTenantId,
        });
      } catch (err) {
        logger.error("[finance.cash_pool_balanced] Cash pool audit error:", err);
      }
    })
  ];
}
