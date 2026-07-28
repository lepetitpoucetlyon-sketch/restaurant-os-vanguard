import type { IIoTProvider, SensorReading, Sensor } from '../types';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * Webhook générique HTTPS — couvre Lacroix Sensing, Monnit, et tout capteur
 * capable d'envoyer un POST JSON vers /api/connectors/iot/webhook/webhook.
 *
 * Format attendu (normalisé) :
 * { sensorId, value, unit, timestamp?, zoneId?, zoneName? }
 */
export class WebhookIoTProvider implements IIoTProvider {
    readonly id = 'webhook';

    subscribe(_tenantId: string, _onReading: (r: SensorReading) => void): () => void {
        // Webhook passif — les lectures arrivent via POST /api/connectors/iot/webhook/webhook.
        // Pas d'abonnement actif nécessaire.
        return () => { /* noop */ };
    }

    async fetchHistory(sensorId: string, from: Date, to: Date): Promise<SensorReading[]> {
        try {
            const raw = await Nexus.adapter.get(`iotHistory/${sensorId}`) as Record<string, SensorReading> | null;
            if (!raw) return [];
            return Object.values(raw).filter(r => {
                const ts = new Date(r.timestamp);
                return ts >= from && ts <= to;
            });
        } catch (err) {
            logger.error('[WebhookIoTProvider] fetchHistory error', String(err));
            return [];
        }
    }

    async listSensors(tenantId: string): Promise<Sensor[]> {
        try {
            const raw = await Nexus.adapter.get(`tenants/${tenantId}/sensors`) as Record<string, Sensor> | null;
            if (!raw) return [];
            return Object.values(raw);
        } catch (err) {
            logger.error('[WebhookIoTProvider] listSensors error', String(err));
            return [];
        }
    }
}
