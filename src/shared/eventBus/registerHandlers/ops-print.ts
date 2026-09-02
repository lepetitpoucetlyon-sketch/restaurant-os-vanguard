import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerOpsPrintHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("pos.printer_failover", async (payload) => {
      try {
        const { empireAudit } = await import("@/lib/audit");
        empireAudit.log({
          module: 'ops',
          action: 'PRINTER_FAILOVER_REDIRECTED',
          details: {
            failedPrinterId: payload.failedPrinterId,
            targetPrinterId: payload.targetPrinterId,
            reason: payload.reason,
            station: payload.station,
          },
          severity: 'medium',
          timestamp: new Date(),
          instanceId: payload.tenantId,
        });
      } catch (err) {
        logger.error("[pos.printer_failover] Print bridge failover audit error:", err);
      }
    })
  ];
}
