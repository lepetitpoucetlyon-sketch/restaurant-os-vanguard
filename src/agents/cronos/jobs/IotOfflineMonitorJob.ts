import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';

/**
 * 📡 IotOfflineMonitorJob - Grade X
 * Surveille les capteurs IoT pour détecter s'ils sont hors ligne.
 */
interface IotSensorRecord {
  id: string;
  timeoutMinutes?: number;
}
interface IotReadingRecord {
  timestamp: number;
}
export const IotOfflineMonitorJob = {
    name: 'IotOfflineMonitor',
    schedule: '*/15 * * * *', // Toutes les 15 minutes
    
    async execute(tenantIds: string[]) {
        try {
            let offlineCount = 0;
            const now = Date.now();

            for (const tenantId of tenantIds) {
                const sensors = await Nexus.adapter.query<IotSensorRecord>(`tenants/${tenantId}/iotSensors`, { limit: 1000 }) || [];
                
                for (const sensor of sensors) {
                    const lastReading = await Nexus.adapter.get<IotReadingRecord>(`tenants/${tenantId}/iotReadings/${sensor.id}`);
                    const timeoutMinutes = Number(sensor.timeoutMinutes) || 30;
                    const timeoutMs = timeoutMinutes * 60 * 1000;

                    if (lastReading) {
                        const timeSinceLastReading = now - lastReading.timestamp;
                        if (timeSinceLastReading > timeoutMs) {
                            NexusEventBus.emit('iot.offline', {
                                v: 1,
                                tenantId,
                                sensorId: sensor.id,
                                lastSeenAt: lastReading.timestamp
                            });
                            offlineCount++;
                        }
                    }
                }
            }
            
            logger.info(`[IotOfflineMonitorJob] Exécution terminée. ${offlineCount} capteurs hors-ligne détectés.`);
            return { success: true, offlineCount };
        } catch (error) {
            logger.error(`[IotOfflineMonitorJob] Erreur:`, String(error));
            throw error;
        }
    }
};
