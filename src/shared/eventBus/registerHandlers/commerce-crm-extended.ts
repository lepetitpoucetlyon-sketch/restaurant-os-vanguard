import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerCommerceCrmExtendedHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("crm.birthday_approaching", async (payload) => {
      try {
        const { empireAudit } = await import("@/lib/audit");
        empireAudit.log({
          module: 'crm',
          action: 'CUSTOMER_BIRTHDAY_ALERT',
          details: { customerId: (payload as Record<string, unknown>).customerId },
          timestamp: new Date(),
          instanceId: payload.tenantId,
        });
      } catch (err) {
        logger.error("[crm.birthday_approaching] Birthday reminder audit error:", err);
      }
    })
  ];
}
