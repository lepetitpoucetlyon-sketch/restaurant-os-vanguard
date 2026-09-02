import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerComplianceEnvironmentalHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("haccp.nonconform", async (payload) => {
      try {
        const { BiodechetsRegistryService } = await import("@/modules/compliance/qualite/biodechets/BiodechetsRegistryService");
        await BiodechetsRegistryService.recordDailyWeighing({
          tenantId: payload.tenantId,
          dateIso: new Date().toISOString().split('T')[0],
          category: 'expired_raw',
          quantityKg: ((payload as Record<string, unknown>).quantityKg as number) || 1.0,
          destination: 'methanization',
          weighedBy: ((payload as Record<string, unknown>).operatorId as string) || 'SYSTEM_HACCP',
          notes: ((payload as Record<string, unknown>).reason as string) || 'HACCP Nonconformity auto-record',
        });
      } catch (err) {
        logger.error("[haccp.nonconform] Biodechets handler error:", err);
      }
    }),
    NexusEventBus.on("compliance.deadline_approaching", async (payload) => {
      try {
        const { empireAudit } = await import("@/lib/audit");
        empireAudit.log({
          module: 'compliance',
          action: 'COMPLIANCE_DEADLINE_APPROACHING',
          details: {
            deadlineType: (payload as Record<string, unknown>).deadlineType,
            targetDate: (payload as Record<string, unknown>).targetDate,
          },
          timestamp: new Date(),
          instanceId: payload.tenantId,
        });
      } catch (err) {
        logger.error("[compliance.deadline_approaching] Compliance deadline audit error:", err);
      }
    })
  ];
}
