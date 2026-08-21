import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export type SensorVendor = 'testo' | 'endress_hauser' | 'sauermann' | 'nexus_zigbee';

export interface RawIoTSensorTelemetry {
  sensorId: string;
  vendor: SensorVendor;
  equipmentId: string;
  tempCelsius: number;
  batteryPct?: number;
  rssiSignalDbm?: number;
  lastCommunicationTs: number;
}

export interface SensorDiagnosis {
  sensorId: string;
  equipmentId: string;
  isOnline: boolean;
  isRadioLoss: boolean;
  isTrueTemperatureBreach: boolean;
  tempCelsius: number;
  status: 'normal' | 'radio_fault' | 'critical_temperature_breach';
  recommendation: string;
}

/**
 * IoTSensorBridgeService — Angles morts E2 & L34.
 * Bridge pour sondes IoT frigorifiques : distingue une panne de liaison radio (capteur éteint/portée) d'une vraie rupture de la chaîne du froid (>4°C).
 */
export class IoTSensorBridgeService {
  public static readonly MAX_SAFE_TEMP_COLD_ROOM_CELSIUS = 4.0;
  public static readonly RADIO_TIMEOUT_MS = 15 * 60 * 1000; // 15 min sans signal

  static processTelemetry(tenantId: string, data: RawIoTSensorTelemetry): SensorDiagnosis {
    const isRadioLoss = (Date.now() - data.lastCommunicationTs) > this.RADIO_TIMEOUT_MS || (data.rssiSignalDbm !== undefined && data.rssiSignalDbm < -100);
    const isTrueTemperatureBreach = !isRadioLoss && data.tempCelsius > this.MAX_SAFE_TEMP_COLD_ROOM_CELSIUS;

    let status: SensorDiagnosis['status'] = 'normal';
    let recommendation = 'Paramètres frigorifiques nominaux.';

    if (isTrueTemperatureBreach) {
      status = 'critical_temperature_breach';
      recommendation = `🚨 RUPTURE DU FROID CONFIRMÉE : T° mesurée à ${data.tempCelsius}°C (> ${this.MAX_SAFE_TEMP_COLD_ROOM_CELSIUS}°C). Ne pas ouvrir la porte, vérifier compresseur.`;

      NexusEventBus.emit('compliance.iot_sensor_fault', {
        v: 1,
        tenantId,
        sensorId: data.sensorId,
        equipmentId: data.equipmentId,
        faultType: 'true_temperature_breach',
        tempCelsius: data.tempCelsius,
        detectedAt: Date.now(),
      });
    } else if (isRadioLoss) {
      status = 'radio_fault';
      recommendation = '⚠️ Liaison radio perdue avec la sonde Testo/Endress. Contrôler la pile et le relais Zigbee.';

      NexusEventBus.emit('compliance.iot_sensor_fault', {
        v: 1,
        tenantId,
        sensorId: data.sensorId,
        equipmentId: data.equipmentId,
        faultType: 'radio_lost',
        detectedAt: Date.now(),
      });
    }

    return {
      sensorId: data.sensorId,
      equipmentId: data.equipmentId,
      isOnline: !isRadioLoss,
      isRadioLoss,
      isTrueTemperatureBreach,
      tempCelsius: data.tempCelsius,
      status,
      recommendation,
    };
  }
}
