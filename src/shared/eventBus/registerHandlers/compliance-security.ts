import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerComplianceSecurityHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("security.pin_locked", async (payload) => {
      try {
        const { empireAudit } = await import("@/lib/audit");
        empireAudit.log({
          module: 'security',
          action: 'PIN_LOCKED_MAX_ATTEMPTS',
          details: {
            terminalId: (payload as Record<string, unknown>).terminalId,
            lockedAt: Date.now(),
          },
          severity: 'high',
          timestamp: new Date(),
          instanceId: payload.tenantId,
          userId: ((payload as Record<string, unknown>).operatorId as string) || 'SYSTEM_PIN_GUARD',
        });
      } catch (err) {
        logger.error("[security.pin_locked] Security audit error:", err);
      }
    })
  ];
}
