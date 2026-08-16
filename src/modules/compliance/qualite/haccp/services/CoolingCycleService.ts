/**
 * CoolingCycleService.ts
 * 
 * Moteur de suivi et de certification du Refroidissement Rapide (HACCP / PMS).
 * Invariant légal DDPP : Tout plat préparé à chaud doit descendre de +63°C à +10°C en moins de 120 minutes (2h).
 */

export interface CoolingReading {
  timestampUtc: number;
  tempCelsius: number;
  operatorId: string;
}

export interface CoolingCycleInput {
  cycleId: string;
  tenantId: string;
  dishName: string;
  batchNumber: string;
  quantityKg: number;
  cellId: string; // Identifiant de la cellule de refroidissement
  startReading: CoolingReading; // Doit être >= 63°C
  intermediateReadings?: CoolingReading[];
  finalReading?: CoolingReading;
  correctiveAction?: string;
}

export interface CoolingCycleReport {
  cycleId: string;
  tenantId: string;
  dishName: string;
  batchNumber: string;
  quantityKg: number;
  cellId: string;
  durationMinutes: number;
  startTempC: number;
  finalTempC?: number;
  coolingRateCPerMin?: number;
  status: 'IN_PROGRESS' | 'COMPLIANT' | 'NON_COMPLIANT';
  isCompliant: boolean;
  correctiveActionRequired: boolean;
  correctiveActionApplied?: string;
  auditTrail: string;
}

export class CoolingCycleService {
  public static readonly MAX_ALLOWED_DURATION_MINUTES = 120; // 2 heures max
  public static readonly MIN_START_TEMP_C = 63.0; // Seuil chaud
  public static readonly MAX_TARGET_TEMP_C = 10.0; // Seuil froid légal

  /**
   * Évalue l'état d'un cycle de refroidissement.
   */
  public static evaluateCycle(cycle: CoolingCycleInput): CoolingCycleReport {
    const start = cycle.startReading;
    const final = cycle.finalReading;

    if (!final) {
      const now = Date.now();
      const currentDurationMin = Math.round((now - start.timestampUtc) / (60 * 1000));
      const isOverdue = currentDurationMin > this.MAX_ALLOWED_DURATION_MINUTES;

      return {
        cycleId: cycle.cycleId,
        tenantId: cycle.tenantId,
        dishName: cycle.dishName,
        batchNumber: cycle.batchNumber,
        quantityKg: cycle.quantityKg,
        cellId: cycle.cellId,
        durationMinutes: currentDurationMin,
        startTempC: start.tempCelsius,
        status: isOverdue ? 'NON_COMPLIANT' : 'IN_PROGRESS',
        isCompliant: !isOverdue,
        correctiveActionRequired: isOverdue,
        auditTrail: `COOLING_CYCLE|${cycle.cycleId}|STATUS=IN_PROGRESS|start=${start.tempCelsius}°C|elapsed=${currentDurationMin}min`,
      };
    }

    const durationMinutes = Math.round((final.timestampUtc - start.timestampUtc) / (60 * 1000));
    const tempDrop = start.tempCelsius - final.tempCelsius;
    const coolingRateCPerMin = durationMinutes > 0 ? Number((tempDrop / durationMinutes).toFixed(2)) : 0;

    const isDurationOk = durationMinutes <= this.MAX_ALLOWED_DURATION_MINUTES;
    const isTargetTempReached = final.tempCelsius <= this.MAX_TARGET_TEMP_C;
    const isCompliant = isDurationOk && isTargetTempReached;

    const status: CoolingCycleReport['status'] = isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT';
    const correctiveActionRequired = !isCompliant;

    const auditTrail = `COOLING_CYCLE|${cycle.cycleId}|tenant=${cycle.tenantId}|dish=${cycle.dishName}|batch=${cycle.batchNumber}|t0=${start.tempCelsius}°C|tFinal=${final.tempCelsius}°C|duration=${durationMinutes}min|compliant=${isCompliant}`;

    return {
      cycleId: cycle.cycleId,
      tenantId: cycle.tenantId,
      dishName: cycle.dishName,
      batchNumber: cycle.batchNumber,
      quantityKg: cycle.quantityKg,
      cellId: cycle.cellId,
      durationMinutes,
      startTempC: start.tempCelsius,
      finalTempC: final.tempCelsius,
      coolingRateCPerMin,
      status,
      isCompliant,
      correctiveActionRequired,
      correctiveActionApplied: cycle.correctiveAction,
      auditTrail,
    };
  }
}
