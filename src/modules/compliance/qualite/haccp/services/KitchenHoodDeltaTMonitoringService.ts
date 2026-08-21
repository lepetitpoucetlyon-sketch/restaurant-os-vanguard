import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface HoodTemperatureTelemetry {
  hoodId: string;
  station: string;
  currentTempCelsius: number;
  previousTempCelsius: number;
  timeDeltaSeconds: number;
}

export interface HoodFireSafetyAssessment {
  hoodId: string;
  deltaTCelsiusPerMinute: number;
  isRateOfRiseCritical: boolean; // ΔT/Δt > 25°C / min
  isAbsoluteTempCritical: boolean; // T > 120°C
  gasCutoffTriggered: boolean;
  ansulPreAlarmActive: boolean;
  recommendation: string;
}

/**
 * KitchenHoodDeltaTMonitoringService — Angle mort L66.
 * Surveille le taux d'élévation thermique (ΔT/Δt) sous hotte pour déclencher la coupure électrovanne gaz préventive AVANT le déclenchement de la poudre corrosive Ansul (15 000 € de perte).
 */
export class KitchenHoodDeltaTMonitoringService {
  public static readonly CRITICAL_RATE_OF_RISE_PER_MIN = 25.0; // °C / min
  public static readonly ABSOLUTE_MAX_HOOD_TEMP_CELSIUS = 120.0;

  static evaluateHoodThermalDynamics(
    tenantId: string,
    adminId: string,
    data: HoodTemperatureTelemetry
  ): HoodFireSafetyAssessment {
    const deltaT = data.currentTempCelsius - data.previousTempCelsius;
    const minutes = Math.max(0.1, data.timeDeltaSeconds / 60);
    const rateOfRise = Math.round((deltaT / minutes) * 10) / 10;

    const isRateOfRiseCritical = rateOfRise >= this.CRITICAL_RATE_OF_RISE_PER_MIN;
    const isAbsoluteTempCritical = data.currentTempCelsius >= this.ABSOLUTE_MAX_HOOD_TEMP_CELSIUS;
    const gasCutoffTriggered = isRateOfRiseCritical || isAbsoluteTempCritical;

    if (gasCutoffTriggered) {
      NexusEventBus.emit('compliance.hood_delta_t_critical', {
        v: 1,
        tenantId,
        hoodId: data.hoodId,
        deltaTCelsius: rateOfRise,
        gasCutoffTriggered: true,
        detectedAt: Date.now(),
      });

      AuditLogger.logAction({
        adminId,
        action: 'KITCHEN_HOOD_FIRE_CUTOFF',
        targetId: data.hoodId,
        ipAddress: '127.0.0.1',
        metadata: {
          currentTempCelsius: data.currentTempCelsius,
          rateOfRise,
        },
      });
    }

    return {
      hoodId: data.hoodId,
      deltaTCelsiusPerMinute: rateOfRise,
      isRateOfRiseCritical,
      isAbsoluteTempCritical,
      gasCutoffTriggered,
      ansulPreAlarmActive: gasCutoffTriggered,
      recommendation: gasCutoffTriggered
        ? '🚨 COUPURE GAZ URGENCE ACTIVÉE : Élévation anormale sous hotte. Éteindre friteuse/feux.'
        : 'Dynamique thermique hotte nominale.',
    };
  }
}
