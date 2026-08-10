import { NextRequest, NextResponse } from 'next/server';
import { IoTProviderFactory } from '@/modules/compliance';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { checkFallbackWebhookSecret } from '@/lib/server/webhookVerify';

function isOutOfRange(sensor: { minThreshold?: number; maxThreshold?: number }, value: number): boolean {
    return (sensor.minThreshold !== undefined && value < sensor.minThreshold) ||
           (sensor.maxThreshold !== undefined && value > sensor.maxThreshold);
}

/**
 * POST /api/connectors/iot/webhook/{provider}
 * Reçoit les relevés capteurs HACCP depuis les providers IoT (Lacroix, Monnit, webhook générique).
 * Body : { sensorId, tenantId, value, unit?, timestamp?, zoneId?, zoneName? }
 *
 * Sécurité : provider.verifySignature() si disponible, sinon fallback CONNECTORS_WEBHOOK_SECRET.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider: providerId } = await params;

    const rawBody = await req.text();
    let payload: unknown;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    let p: ReturnType<typeof IoTProviderFactory.get>;
    try {
        p = IoTProviderFactory.get(providerId);
    } catch {
        return NextResponse.json({ error: `Provider inconnu : ${providerId}` }, { status: 404 });
    }

    const verified = p.verifySignature
        ? p.verifySignature(rawBody, req.headers)
        : checkFallbackWebhookSecret(req.headers, providerId);

    if (!verified) {
        logger.warn(`[iot/webhook] Signature invalide — provider=${providerId}`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!p.verifySignature && !process.env.CONNECTORS_WEBHOOK_SECRET) {
        logger.warn(`[iot/webhook] provider=${providerId} sans HMAC et sans CONNECTORS_WEBHOOK_SECRET — webhook non sécurisé`);
    }

    const body     = payload as Record<string, unknown>;
    const tenantId = body['tenantId'] ? String(body['tenantId']) : undefined;
    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId requis dans le payload' }, { status: 422 });
    }

    try {
        const reading = {
            sensorId:  String(body['sensorId'] ?? ''),
            tenantId,
            value:     Number(body['value'] ?? 0),
            unit:      String(body['unit'] ?? 'celsius') as 'celsius' | 'fahrenheit' | 'humidity_pct' | 'co2_ppm' | 'custom',
            timestamp: String(body['timestamp'] ?? new Date().toISOString()),
            zoneId:    body['zoneId'] ? String(body['zoneId']) : undefined,
            zoneName:  body['zoneName'] ? String(body['zoneName']) : undefined,
        };

        // Clé stable = sensorId + timestamp payload → idempotent sur retry
        const tsKey   = reading.timestamp.replace(/[:.]/g, '-');
        const histKey = `iotHistory/${reading.sensorId}/${tsKey}`;

        // Vérifier l'existence AVANT set() — set() est un upsert donc on perd
        // l'information "déjà traité" après l'écriture.
        const alreadyProcessed = await Nexus.adapter.get(histKey);
        await Nexus.adapter.set(histKey, reading);

        if (alreadyProcessed) {
            logger.info(`[iot/webhook] Doublon ignoré — sensor=${reading.sensorId} ts=${tsKey}`);
            return NextResponse.json({ received: true, sensorId: reading.sensorId, duplicate: true });
        }

        const sensor = await Nexus.adapter.get(
            `tenants/${tenantId}/sensors/${reading.sensorId}`
        ) as { minThreshold?: number; maxThreshold?: number; zoneName?: string } | null;

        if (sensor) {
            if (isOutOfRange(sensor, reading.value)) {
                const { HACCPLogService } = await import('@/modules/compliance/qualite/haccp/HACCPLogService');
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
        logger.error(`[iot/webhook] provider=${providerId}`, err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
