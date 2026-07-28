/**
 * POST /api/haccp/iot-push
 * Webhook pour capteurs IoT WiFi (push mode).
 * Les gateways (Rotronic, Testo, gateways maison) envoient leurs lectures ici.
 *
 * Body : {
 *   tenantId: string,
 *   sensorId: string,
 *   temperature: number,    // °C
 *   humidity?: number,      // %
 *   battery?: number,       // %
 *   timestamp?: number,     // ms epoch (optionnel, défaut = now)
 * }
 *
 * Auth : Bearer HACCP_GATEWAY_TOKEN
 * Pas d'auth Firebase — destiné aux capteurs matériels sans navigateur.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { IoTSensorService } from '@/modules/compliance/haccp/iot';
import { logger } from '@/lib/logger';

const GATEWAY_TOKEN = process.env.HACCP_GATEWAY_TOKEN;

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Fail-Closed : Si le serveur n'est pas configuré avec une clé de sécurité, on bloque TOUT.
  if (!GATEWAY_TOKEN) {
    logger.error('[IoT Push] HACCP_GATEWAY_TOKEN is missing in environment variables. Denying all requests for security.');
    return NextResponse.json({ error: 'Server misconfigured. Access denied.' }, { status: 500 });
  }

  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${GATEWAY_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    tenantId?: string;
    sensorId?: string;
    temperature?: number;
    humidity?: number;
    battery?: number;
    timestamp?: number;
  };

  const { tenantId, sensorId, temperature, humidity, battery, timestamp } = body;

  if (!tenantId || !sensorId || temperature === undefined) {
    return NextResponse.json({ error: 'tenantId, sensorId, temperature requis' }, { status: 400 });
  }

  await IoTSensorService.storeReading({
    sensorId,
    tenantId,
    temperature,
    humidity,
    battery,
    timestamp: timestamp ?? Date.now(),
    source: 'push',
  });

  logger.info(`[IoT Push] ${sensorId}@${tenantId} : ${temperature}°C`);
  return NextResponse.json({ ok: true, stored: true });
}
