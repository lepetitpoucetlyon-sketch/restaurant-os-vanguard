import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerHumanLegalHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("hr.dpae_submitted", async (payload) => {
      try {
        const { empireAudit } = await import("@/lib/audit");
        empireAudit.log({
          module: 'human',
          action: 'DPAE_SUBMISSION_AUDITED',
          details: { employeeId: payload.employeeId },
          timestamp: new Date(),
          instanceId: payload.tenantId,
        });
      } catch (err) {
        logger.error("[hr.dpae_submitted] Dpae audit log error:", err);
      }
    }),
    NexusEventBus.on("hr.rest_period_violation", async (payload) => {
      try {
        const { empireAudit } = await import("@/lib/audit");
        empireAudit.log({
          module: 'human',
          action: 'REST_PERIOD_VIOLATION_RECORDED',
          details: {
            employeeId: payload.employeeId,
            gapMinutes: payload.gapMinutes,
            requiredMinutes: payload.requiredMinutes,
          },
          severity: 'high',
          timestamp: new Date(),
          instanceId: payload.tenantId,
        });
      } catch (err) {
        logger.error("[hr.rest_period_violation] Rest period audit error:", err);
      }
    })
  ];
}
