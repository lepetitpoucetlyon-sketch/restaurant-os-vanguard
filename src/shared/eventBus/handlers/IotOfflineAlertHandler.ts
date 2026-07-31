import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerIotOfflineAlertHandler() {
  return NexusEventBus.on(
    'iot.offline',
    async (payload) => {
      const { tenantId, sensorId, lastSeenAt } = payload;
      
      const missingMinutes = Math.round((Date.now() - lastSeenAt) / 60000);
      
      logger.error(`[IoT Alert] Capteur ${sensorId} hors-ligne depuis ${missingMinutes} minutes (Tenant: ${tenantId})`);

      // Dans un système complet, on enverrait une notification Push ou Email au manager ici.
      // Pour l'instant on trace l'alerte critique dans l'audit.

      empireAudit.log({
        module: 'compliance',
        action: 'IOT_SENSOR_OFFLINE',
        details: { sensorId, lastSeenAt, missingMinutes },
        severity: 'critical',
        timestamp: new Date(),
      });
    },
    { id: 'iot-offline-alert-handler', priority: 'CRITICAL' }
  );
}
