import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface RoomAirQualityTelemetry {
  roomZone: 'salle_principale' | 'mezzanine' | 'salon_prive' | 'terrasse_couverte';
  co2Ppm: number;
  tempCelsius: number;
  occupancyCount: number;
}

export interface AirQualityAssessment {
  roomZone: string;
  co2Ppm: number;
  airQualityStatus: 'excellent' | 'moderate' | 'poor_air_stale';
  vmcBoostActivated: boolean;
  recommendation: string;
}

/**
 * DiningRoomAirQualityCO2MonitorService — Angle mort T98.
 * Surveille le CO₂ en salle client (>1800 ppm = somnolence, baisse du panier moyen desserts) et commande le boost de ventilation VMC.
 */
export class DiningRoomAirQualityCO2MonitorService {
  public static readonly WARNING_CO2_PPM = 1200;
  public static readonly CRITICAL_CO2_PPM = 1800;

  static checkAirQuality(tenantId: string, data: RoomAirQualityTelemetry): AirQualityAssessment {
    const isCritical = data.co2Ppm >= this.CRITICAL_CO2_PPM;
    const isModerate = data.co2Ppm >= this.WARNING_CO2_PPM;

    let airQualityStatus: AirQualityAssessment['airQualityStatus'] = 'excellent';
    let vmcBoostActivated = false;
    let recommendation = 'Qualité de l\'air excellente en salle.';

    if (isCritical) {
      airQualityStatus = 'poor_air_stale';
      vmcBoostActivated = true;
      recommendation = `🚨 AIR SATURÉ EN SALLE (${data.co2Ppm} ppm CO₂) : Somnolence clients. Boost VMC automatique 100% activé.`;

      NexusEventBus.emit('compliance.dining_room_co2_warning', {
        v: 1,
        tenantId,
        roomZone: data.roomZone,
        co2Ppm: data.co2Ppm,
        vmcBoostActivated: true,
        alertedAt: Date.now(),
      });
    } else if (isModerate) {
      airQualityStatus = 'moderate';
      recommendation = `Qualité de l'air moyenne (${data.co2Ppm} ppm). Ventilation standard maintenue.`;
    }

    return {
      roomZone: data.roomZone,
      co2Ppm: data.co2Ppm,
      airQualityStatus,
      vmcBoostActivated,
      recommendation,
    };
  }
}
