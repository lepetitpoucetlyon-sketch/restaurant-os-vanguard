import type { IIoTProvider, SensorReading, Sensor } from '../types';
import { logger } from '@/lib/logger';

/**
 * MQTT générique — couvre Dragino LoRaWAN et tous les capteurs MQTT.
 * Variables requises : MQTT_BROKER_URL, MQTT_USERNAME?, MQTT_PASSWORD?
 *
 * MQTT s'exécute dans un contexte long-running (Firebase Function ou sidecar).
 * Dans Next.js, utiliser uniquement fetchHistory et listSensors.
 * subscribe() est destiné au sidecar ou à une Cloud Function.
 *
 * Pour activer : npm i mqtt
 */
export class MqttProvider implements IIoTProvider {
    readonly id = 'mqtt';

    subscribe(tenantId: string, onReading: (r: SensorReading) => void): () => void {
        const brokerUrl = process.env.MQTT_BROKER_URL;
        if (!brokerUrl) {
            logger.error('[MqttProvider] MQTT_BROKER_URL manquant');
            return () => { /* noop */ };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let client: any = null;
        import('mqtt').then((mod) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mqtt = mod as any;
            client = mqtt.connect(brokerUrl, {
                username: process.env.MQTT_USERNAME,
                password: process.env.MQTT_PASSWORD,
            });
            client.subscribe(`sensors/${tenantId}/#`, (err: Error | null) => {
                if (err) logger.error('[MqttProvider] subscribe error', String(err));
            });
            client.on('message', (_topic: string, message: { toString(): string }) => {
                try {
                    const payload = JSON.parse(message.toString()) as Partial<SensorReading>;
                    if (payload.sensorId && payload.value !== undefined) {
                        onReading({
                            sensorId:  payload.sensorId,
                            tenantId,
                            value:     payload.value,
                            unit:      payload.unit ?? 'celsius',
                            timestamp: payload.timestamp ?? new Date().toISOString(),
                            zoneId:    payload.zoneId,
                            zoneName:  payload.zoneName,
                        });
                    }
                } catch (e) {
                    logger.warn('[MqttProvider] message parse error', String(e));
                }
            });
        }).catch(err => logger.error('[MqttProvider] mqtt import error — npm i mqtt requis', String(err)));

        return () => {
            if (client) client.end();
        };
    }

    async fetchHistory(sensorId: string, from: Date, to: Date): Promise<SensorReading[]> {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        const raw = await Nexus.adapter.get(`iotHistory/${sensorId}`) as Record<string, SensorReading> | null;
        if (!raw) return [];
        return Object.values(raw).filter(r => {
            const ts = new Date(r.timestamp);
            return ts >= from && ts <= to;
        });
    }

    async listSensors(tenantId: string): Promise<Sensor[]> {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        const raw = await Nexus.adapter.get(`tenants/${tenantId}/sensors`) as Record<string, Sensor> | null;
        return raw ? Object.values(raw) : [];
    }
}
