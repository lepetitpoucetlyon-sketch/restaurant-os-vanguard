import { logger } from '@/lib/logger';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export interface TemperatureReading {
    sensorId: string;
    equipmentId: string;
    temperatureCelsius: number;
    timestamp: number;
}

/**
 * 🌡️ C5.5: Predictive Maintenance Alert
 * Analyse les dérives de température avant la panne d'un équipement frigorifique.
 */
export class PredictiveMaintenanceAlert {

    static async analyzeReading(tenantId: string, reading: TemperatureReading): Promise<void> {
        const key = `tenants/${tenantId}/iot/cache/${reading.equipmentId}`;
        
        const cached = await Nexus.adapter.get<{ readings: TemperatureReading[] }>(key);
        const readings = cached?.readings || [];

        // Ajouter la nouvelle lecture
        readings.push(reading);

        // Ne garder que les 10 dernières lectures
        if (readings.length > 10) {
            readings.shift();
        }

        // Heuristique simple: Si la température moyenne des 5 dernières lectures est supérieure 
        // à la moyenne des 5 premières lectures d'au moins 2 degrés, le frigo "fatigue".
        if (readings.length === 10) {
            const firstHalfAvg = readings.slice(0, 5).reduce((acc, r) => acc + r.temperatureCelsius, 0) / 5;
            const secondHalfAvg = readings.slice(5, 10).reduce((acc, r) => acc + r.temperatureCelsius, 0) / 5;

            if (secondHalfAvg - firstHalfAvg >= 2.0) {
                logger.warn(`[Maintenance] Dérive thermique détectée sur l'équipement ${reading.equipmentId} (Delta: +${(secondHalfAvg - firstHalfAvg).toFixed(2)}°C).`);
                
                // On émet une alerte de maintenance (via le bus pour notifier le support)
                await NexusEventBus.emitDurable('support.ticket_submitted', {
                    v: 1,
                    tenantId,
                    ticketId: `maint-${Date.now()}`,
                    description: `[MAINTENANCE] Dérive thermique anormale détectée sur l'équipement ${reading.equipmentId}. Risque de panne compresseur.`,
                    submittedBy: 'iot-sentinel',
                });

                // Vider le cache pour éviter le spam
                await Nexus.adapter.set(key, { readings: [] });
                return;
            }
        }
        
        // Sauvegarder l'état mis à jour
        await Nexus.adapter.set(key, { readings });
    }
}
