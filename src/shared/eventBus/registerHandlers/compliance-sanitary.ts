import { NexusEventBus } from "../NexusEventBus";
import { logger } from "@/lib/logger";

export function registerComplianceSanitaryHandlers(): Array<() => void> {
  return [
    NexusEventBus.on("haccp.alert", async (payload) => {
      try {
        const { empireAudit } = await import("@/lib/audit");
        empireAudit.log({
          module: 'haccp',
          action: 'HACCP_ALERT_TRIGGERED',
          details: { sensorId: payload.sensorId, alertType: payload.alertType, severity: payload.severity, message: payload.message },
          severity: payload.severity === 'CRITICAL' ? 'critical' : payload.severity === 'HIGH' ? 'high' : 'medium',
          timestamp: new Date(),
          instanceId: payload.tenantId,
        });
      } catch (err) {
        logger.error("[haccp.alert] Sanitary alert audit error:", err);
      }
    }),
    NexusEventBus.on("haccp.temperature_logged", async (payload) => {
      try {
        if (payload.sensorId?.includes('hood')) {
          const { KitchenHoodDeltaTMonitoringService } = await import("@/modules/compliance/qualite/haccp/services/KitchenHoodDeltaTMonitoringService");
          KitchenHoodDeltaTMonitoringService.evaluateHoodThermalDynamics(
            payload.tenantId,
            'SYSTEM_IOT_SENSOR',
            {
              hoodId: payload.sensorId,
              station: 'extraction_principale',
              currentTempCelsius: payload.temperature,
              previousTempCelsius: payload.temperature,
              timeDeltaSeconds: 60,
            }
          );
        }
      } catch (err) {
        logger.error("[haccp.temperature_logged] Hood thermal dynamics check error:", err);
      }
    })
  ];
}
