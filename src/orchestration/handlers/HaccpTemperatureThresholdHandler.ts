import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { assertHandlerTenant } from '../guards/assertHandlerTenant';

/** HACCP seuil froid légal UE : +8 °C → alerte, +12 °C → critique */
const COLD_THRESHOLD_WARN_C = 8;
const COLD_THRESHOLD_CRIT_C = 12;

function toCelsius(temperature: number, unit: string): number {
  return unit === 'F' ? (temperature - 32) * (5 / 9) : temperature;
}

export function registerHaccpTemperatureThresholdHandler(): () => void {
  return NexusEventBus.on(
    'haccp.temperature_logged',
    async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, sensorId, temperature, unit, timestamp } = payload;

      const logId = `temp_${sensorId}_${timestamp}`;
      const logPath = `tenants/${tenantId}/haccpTemperatureLogs/${logId}`;
      assertHandlerTenant('haccp-temp-threshold', tenantId, logPath);

      await Nexus.adapter.set(logPath, {
        id: logId,
        sensorId,
        temperature,
        unit,
        recordedAt: new Date(timestamp).toISOString(),
      });

      const tempC = toCelsius(temperature, unit);

      if (tempC <= COLD_THRESHOLD_WARN_C) return;

      const severity = tempC >= COLD_THRESHOLD_CRIT_C ? 'CRITICAL' : 'HIGH';
      const message =
        `Capteur ${sensorId} : ${temperature}°${unit} ` +
        `(${tempC.toFixed(1)}°C) — seuil légal ${COLD_THRESHOLD_WARN_C}°C dépassé.`;

      logger.error(`[HaccpTemp] ${message}`);

      await NexusEventBus.emitDurable('haccp.alert', {
        v: 1,
        tenantId,
        sensorId,
        readingId: logId,
        alertType: 'COLD_CHAIN_BREACH',
        severity,
        message,
      });

      empireAudit.log({
        module: 'compliance',
        action: 'HACCP_TEMP_THRESHOLD_EXCEEDED',
        userId: 'system',
        instanceId: tenantId,
        details: { sensorId, temperature, unit, tempC, severity },
        severity: severity === 'CRITICAL' ? 'critical' : 'high',
        timestamp: new Date(timestamp),
      });
    },
    { id: 'haccp-temperature-threshold', priority: 'HIGH' }
  );
}
