import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface MeatAgingChamberTelemetry {
  chamberId: string;
  tempCelsius: number; // 0.5 - 2.0 °C
  relativeHumidityPct: number; // 75% - 85% optimal
  airVelocityMeterPerSec?: number; // 0.5 - 1.5 m/s
  stockValueInMicrounits: number;
}

export interface MeatAgingStatus {
  chamberId: string;
  isHumidityOptimal: boolean;
  isMoldCounteringHazard: boolean; // RH > 88%
  isDesiccationHazard: boolean; // RH < 70%
  alertMessage?: string;
}

/**
 * MeatAgingHumidityMonitoringService — Angle mort T96.
 * Surveille l'hygrométrie (75-85% RH) et la ventilation des caves de maturation de viande pour éviter la moisissure noire toxique ou le dessèchement excessif du stock noble.
 */
export class MeatAgingHumidityMonitoringService {
  public static readonly MIN_SAFE_RH_PCT = 72.0;
  public static readonly MAX_SAFE_RH_PCT = 86.0;

  static evaluateChamber(tenantId: string, data: MeatAgingChamberTelemetry): MeatAgingStatus {
    const isMoldCounteringHazard = data.relativeHumidityPct > this.MAX_SAFE_RH_PCT;
    const isDesiccationHazard = data.relativeHumidityPct < this.MIN_SAFE_RH_PCT;
    const isHumidityOptimal = !isMoldCounteringHazard && !isDesiccationHazard;

    let alertMessage: string | undefined;
    if (isMoldCounteringHazard) {
      alertMessage = `🚨 HYGROMÉTRIE ÉLEVÉE (${data.relativeHumidityPct}% RH) : Risque de développement fongique sur pièces de bœuf maturées.`;
    } else if (isDesiccationHazard) {
      alertMessage = `⚠️ HYGROMÉTRIE BASSE (${data.relativeHumidityPct}% RH) : Dessèchement prématuré et perte de poids anormale de la viande.`;
    }

    if (!isHumidityOptimal) {
      NexusEventBus.emit('compliance.meat_aging_humidity_alert', {
        v: 1,
        tenantId,
        chamberId: data.chamberId,
        relativeHumidityPct: data.relativeHumidityPct,
        minAllowedPct: this.MIN_SAFE_RH_PCT,
        maxAllowedPct: this.MAX_SAFE_RH_PCT,
        detectedAt: Date.now(),
      });
    }

    return {
      chamberId: data.chamberId,
      isHumidityOptimal,
      isMoldCounteringHazard,
      isDesiccationHazard,
      alertMessage,
    };
  }
}
