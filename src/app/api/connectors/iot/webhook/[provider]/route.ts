import { NextRequest, NextResponse } from 'next/server';
import { IoTProviderFactory } from '@/modules/compliance/connectors/iot/IoTProviderFactory';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * POST /api/connectors/iot/webhook/{provider}
 * Reçoit les relevés capteurs HACCP depuis les providers IoT (Lacroix, Monnit, webhook générique).
 * Body : { sensorId, tenantId, value, unit?, timestamp?, zoneId?, zoneName? }
 *
 * Si hors norme → HACCPLogService.recordNonConformity() automatique.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { provider: string } }
) {
    const providerId = params.provider;
    let payload: unknown;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const body = payload as Record<string, unknown>;
    const tenantId = body['tenantId'] ? String(body['tenantId']) : undefined;
    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId requis dans le payload' }, { status: 422 });
    }

    try {
        // Normalisation via le provider
        const _ = IoTProviderFactory.get(providerId);

        const reading = {
            sensorId:  String(body['sensorId'] ?? ''),
            tenantId,
            value:     Number(body['value'] ?? 0),
            unit:      String(body['unit'] ?? 'celsius') as 'celsius' | 'fahrenheit' | 'humidity_pct' | 'co2_ppm' | 'custom',
            timestamp: String(body['timestamp'] ?? new Date().toISOString()),
            zoneId:    body['zoneId'] ? String(body['zoneId']) : undefined,
            zoneName:  body['zoneName'] ? String(body['zoneName']) : undefined,
        };

        // Écrire dans iotHistory (immuable, collection NF525-like)
        const histKey = `iotHistory/${reading.sensorId}/${Date.now()}`;
        await Nexus.adapter.set(histKey, reading);

        // Vérifier les seuils HACCP
        const sensor = await Nexus.adapter.get(
            `tenants/${tenantId}/sensors/${reading.sensorId}`
        ) as { minThreshold?: number; maxThreshold?: number; zoneName?: string } | null;

        if (sensor) {
            const outOfRange =
                (sensor.minThreshold !== undefined && reading.value < sensor.minThreshold) ||
                (sensor.maxThreshold !== undefined && reading.value > sensor.maxThreshold);

            if (outOfRange) {
                const { HACCPLogService } = await import('@/modules/compliance/haccp/HACCPLogService');
                await HACCPLogService.recordNonConformity({
                    tenantId,
                    sensorId:    reading.sensorId,
                    temperature: reading.value,
                    ncType:      'temperature',
                    severity:    'critical',
                    description: `Seuil dépassé sur capteur ${reading.sensorId} : ${reading.value}${reading.unit} (min=${sensor.minThreshold ?? '-'}, max=${sensor.maxThreshold ?? '-'})`,
                    source:      'iot_webhook',
                });
                logger.warn(`[iot/webhook] NON-CONFORMITÉ tenant=${tenantId} sensor=${reading.sensorId} value=${reading.value}`);
            }
        }

        logger.info(`[iot/webhook] provider=${providerId} sensor=${reading.sensorId} value=${reading.value}${reading.unit}`);
        return NextResponse.json({ received: true, sensorId: reading.sensorId });
    } catch (err) {
        logger.error(`[iot/webhook] provider=${providerId}`, String(err));
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
