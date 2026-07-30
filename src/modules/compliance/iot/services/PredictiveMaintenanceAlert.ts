import { logger } from '@/lib/logger';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

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
    
    // Fenêtre glissante conservée en mémoire (ou Redis dans le vrai système)
    private static readingsCache: Record<string, TemperatureReading[]> = {};

    /**
     * Reçoit une lecture IoT et détecte les tendances anormales (dégradation du compresseur).
     */
    static async analyzeReading(tenantId: string, reading: TemperatureReading): Promise<void> {
        const key = `${tenantId}_${reading.equipmentId}`;
        
        if (!this.readingsCache[key]) {
            this.readingsCache[key] = [];
        }

        // Ajouter la nouvelle lecture
        this.readingsCache[key].push(reading);

        // Ne garder que les 10 dernières lectures
        if (this.readingsCache[key].length > 10) {
            this.readingsCache[key].shift();
        }

        const readings = this.readingsCache[key];

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
                this.readingsCache[key] = [];
            }
        }
    }
}
