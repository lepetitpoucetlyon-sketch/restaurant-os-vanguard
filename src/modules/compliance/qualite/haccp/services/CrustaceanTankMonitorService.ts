import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface CrustaceanTankReading {
  tankId: string;
  tankName: string;
  tempCelsius: number; // 10.0 - 13.0 °C
  oxygenLevelMgL: number; // Min 6.0 mg/L
  salinityPpt: number; // 30 - 35 ppt (densité 1022 - 1026)
  lastCleanedAtTs: number;
}

export interface CrustaceanHealthEvaluation {
  tankId: string;
  isSafe: boolean;
  isOxygenCritical: boolean;
  isTempOutOfRange: boolean;
  isSalinityOutOfRange: boolean;
  warningAlerts: string[];
}

/**
 * CrustaceanTankMonitorService — Angle mort L35.
 * Surveille les paramètres vitaux des viviers à crustacés (homards, langoustes, tourteaux) pour prévenir la mortalité massive nocturne.
 */
export class CrustaceanTankMonitorService {
  public static readonly MIN_OXYGEN_MGL = 6.0;
  public static readonly MIN_TEMP_CELSIUS = 8.0;
  public static readonly MAX_TEMP_CELSIUS = 14.0;
  public static readonly MIN_SALINITY_PPT = 30.0;
  public static readonly MAX_SALINITY_PPT = 36.0;

  static evaluateTank(tenantId: string, reading: CrustaceanTankReading): CrustaceanHealthEvaluation {
    const isOxygenCritical = reading.oxygenLevelMgL < this.MIN_OXYGEN_MGL;
    const isTempOutOfRange = reading.tempCelsius < this.MIN_TEMP_CELSIUS || reading.tempCelsius > this.MAX_TEMP_CELSIUS;
    const isSalinityOutOfRange = reading.salinityPpt < this.MIN_SALINITY_PPT || reading.salinityPpt > this.MAX_SALINITY_PPT;

    const warnings: string[] = [];
    if (isOxygenCritical) warnings.push(`Oxygène dissous critique (${reading.oxygenLevelMgL} mg/L < ${this.MIN_OXYGEN_MGL} mg/L) — Risque asphyxie homards`);
    if (isTempOutOfRange) warnings.push(`Température vivier hors plage (${reading.tempCelsius}°C)`);
    if (isSalinityOutOfRange) warnings.push(`Salinité anormale (${reading.salinityPpt} ppt)`);

    const isSafe = warnings.length === 0;

    if (!isSafe) {
      NexusEventBus.emit('compliance.crustacean_tank_alert', {
        v: 1,
        tenantId,
        tankId: reading.tankId,
        oxygenLevelMgL: reading.oxygenLevelMgL,
        tempCelsius: reading.tempCelsius,
        salinityPpt: reading.salinityPpt,
        isCritical: isOxygenCritical,
        detectedAt: Date.now(),
      });
    }

    return {
      tankId: reading.tankId,
      isSafe,
      isOxygenCritical,
      isTempOutOfRange,
      isSalinityOutOfRange,
      warningAlerts: warnings,
    };
  }
}
