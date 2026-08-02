/**
 * IoTSensorService — hac-6
 * Couche d'abstraction pour les capteurs de température IoT physiques.
 *
 * Deux transports supportés :
 *  1. HTTP Gateway polling — capteurs WiFi (Rotronic Connect, Testo Cloud, générique REST)
 *     GET {HACCP_GATEWAY_URL}/sensors/{sensorId}/reading
 *     Auth : Bearer HACCP_GATEWAY_TOKEN
 *
 *  2. BLE Web Bluetooth API (navigateur HTTPS uniquement) — capteurs Bluetooth LE
 *     Nécessite un appel depuis un composant React via requestDevice()
 *     Profil GATT : Environmental Sensing Service (UUID 0x181A), Temperature (0x2A6E)
 *
 * Stockage Nexus :
 *   tenants/{tenantId}/iotSensors/{sensorId}        → config capteur
 *   tenants/{tenantId}/iotReadings/{sensorId}        → dernière lecture
 *   tenants/{tenantId}/iotHistory/{sensorId}/{ts}    → historique (via webhook push)
 */

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { HACCPLogService, type ConformityStatus } from '../HACCPLogService';

import { IoTSensor, SensorReading } from '@/domain/schemas/haccp';

const GATEWAY_URL = process.env.HACCP_GATEWAY_URL;
const GATEWAY_TOKEN = process.env.HACCP_GATEWAY_TOKEN;

// GATT UUIDs for Environmental Sensing
const BLE_ENV_SENSING_SERVICE = '0000181a-0000-1000-8000-00805f9b34fb';
const BLE_TEMPERATURE_CHAR    = '00002a6e-0000-1000-8000-00805f9b34fb';
const BLE_HUMIDITY_CHAR       = '00002a6f-0000-1000-8000-00805f9b34fb';

export const IoTSensorService = {
  // ─── HTTP Gateway polling ───────────────────────────────────────────────────

  async pollGatewaySensor(sensor: IoTSensor): Promise<SensorReading | null> {
    if (!GATEWAY_URL || !GATEWAY_TOKEN) {
      logger.warn(`[IoT] HACCP_GATEWAY_URL/TOKEN absent — pas de polling HTTP pour ${sensor.id}`);
      return null;
    }

    const deviceId = sensor.gatewayDeviceId ?? sensor.id;
    const url = `${GATEWAY_URL}/sensors/${encodeURIComponent(deviceId)}/reading`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${GATEWAY_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      logger.warn(`[IoT] Gateway error ${res.status} pour capteur ${sensor.id}`);
      return null;
    }

    const data = await res.json() as { temperature?: number; humidity?: number; battery?: number; timestamp?: number };

    if (data.temperature === undefined) return null;

    const reading: SensorReading = {
      sensorId: sensor.id,
      tenantId: sensor.tenantId,
      temperature: data.temperature,
      humidity: data.humidity,
      battery: data.battery,
      timestamp: data.timestamp ?? Date.now(),
      source: 'http_gateway',
    };

    await IoTSensorService.storeReading(reading);
    return reading;
  },

  // ─── BLE Web Bluetooth (client-side, navigateur uniquement) ──────────────────
  // Appelé depuis un composant React côté client (non disponible server-side).

  async connectBLESensor(sensor: IoTSensor): Promise<SensorReading | null> {
    const nav = navigator as unknown as { bluetooth?: { requestDevice: (...args: unknown[]) => Promise<unknown> } };
    if (typeof window === 'undefined' || !nav.bluetooth) {
      logger.warn('[IoT] Web Bluetooth API non disponible (HTTPS requis, Chrome/Edge)');
      return null;
    }

    const serviceUUID = sensor.bleServiceUUID ?? BLE_ENV_SENSING_SERVICE;

    const device = await nav.bluetooth.requestDevice({
      filters: [{ services: [serviceUUID] }],
      optionalServices: [serviceUUID],
    });

    const server = await device.gatt?.connect();
    if (!server) return null;

    const service = await server.getPrimaryService(serviceUUID);
    const tempChar = await service.getCharacteristic(BLE_TEMPERATURE_CHAR);
    const tempValue = await tempChar.readValue();

    // Température GATT : sint16 / 100 → °C
    const rawTemp = tempValue.getInt16(0, true);
    const temperature = rawTemp / 100;

    let humidity: number | undefined;
    try {
      const humChar = await service.getCharacteristic(BLE_HUMIDITY_CHAR);
      const humValue = await humChar.readValue();
      humidity = humValue.getUint16(0, true) / 100;
    } catch { /* capteur sans humidité */ }

    server.disconnect();

    return {
      sensorId: sensor.id,
      tenantId: sensor.tenantId,
      temperature,
      humidity,
      timestamp: Date.now(),
      source: 'ble',
    };
  },

  // ─── Stockage Nexus ──────────────────────────────────────────────────────────

  async storeReading(reading: SensorReading): Promise<void> {
    const { tenantId, sensorId } = reading;

    // Dernière lecture (affichage temps réel — volontairement écrasée).
    await Nexus.adapter.set(
      `tenants/${tenantId}/iotReadings/${sensorId}`,
      { ...reading, updatedAt: Date.now() },
    );

    // Seuils du capteur → détermination de la conformité.
    const sensor = await Nexus.adapter.get(`tenants/${tenantId}/iotSensors/${sensorId}`) as IoTSensor | null;
    const tooHot  = sensor?.alertMaxTemp !== undefined && reading.temperature > sensor.alertMaxTemp;
    const tooCold = sensor?.alertMinTemp !== undefined && reading.temperature < sensor.alertMinTemp;
    const status: ConformityStatus = (tooHot || tooCold) ? 'NON_CONFORM' : 'CONFORM';

    // Historique IMMUABLE (registre sanitaire append-only) — désormais persisté.
    await HACCPLogService.appendTemperatureHistory(reading, status);

    if (sensor && (tooHot || tooCold)) {
      logger.warn(`[IoT] ALERTE température ${reading.temperature}°C sur capteur ${sensorId} (tenant ${tenantId})`);

      // Alerte temps réel (dashboard).
      await Nexus.adapter.set(
        `tenants/${tenantId}/iotAlerts/${sensorId}_${reading.timestamp}`,
        { ...reading, alertType: tooHot ? 'TOO_HOT' : 'TOO_COLD', acknowledgedAt: null },
      );

      // Non-conformité : événement immuable (haccpLogs) + dossier d'action corrective
      // (visible/résoluble dans le registre manager NonConformityForm).
      await HACCPLogService.recordNonConformity({
        tenantId,
        ncType: 'température hors norme',
        severity: 'critical',
        description: `Température ${reading.temperature}°C hors seuil sur ${sensor.name ?? sensorId} `
          + `(seuils ${sensor.alertMinTemp ?? '—'}…${sensor.alertMaxTemp ?? '—'}°C)`,
        sensorId,
        temperature: reading.temperature,
        source: reading.source,
      });
    }
  },

  async listSensors(tenantId: string): Promise<IoTSensor[]> {
    return Nexus.adapter.query(`tenants/${tenantId}/iotSensors`, { limit: 100 }) as Promise<IoTSensor[]>;
  },

  async getLatestReading(tenantId: string, sensorId: string): Promise<SensorReading | null> {
    return Nexus.adapter.get(`tenants/${tenantId}/iotReadings/${sensorId}`) as Promise<SensorReading | null>;
  },

  async saveSensor(sensor: IoTSensor): Promise<void> {
    await Nexus.adapter.set(
      `tenants/${sensor.tenantId}/iotSensors/${sensor.id}`,
      sensor,
    );
  },
};
