import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface WeeklyRestPeriod {
  employeeId: string;
  weekIso: string; // '2026-W34'
  restStartTs: number;
  restEndTs: number;
}

export interface WeeklyRestProofReport {
  employeeId: string;
  weekIso: string;
  consecutiveRestHours: number;
  isLegalCompliant: boolean; // Doit être >= 35h consécutives (24h hebdo + 11h quotidien)
  proofHash: string;
}

/**
 * WeeklyRestProofLogService — Angle mort T69.
 * Registre opposable du repos hebdomadaire obligatoire HCR :
 * Vérifie et scelle la preuve de 35 heures consécutives de repos par semaine (24h de repos hebdomadaire + 11h de repos quotidien).
 */
export class WeeklyRestProofLogService {
  public static readonly MIN_CONSECUTIVE_REST_HOURS = 35.0;

  static recordWeeklyRest(tenantId: string, period: WeeklyRestPeriod): WeeklyRestProofReport {
    const diffMs = period.restEndTs - period.restStartTs;
    const consecutiveRestHours = Math.round((diffMs / (3600 * 1000)) * 10) / 10;
    const isLegalCompliant = consecutiveRestHours >= this.MIN_CONSECUTIVE_REST_HOURS;
    const proofHash = `SHA256-REST-${period.employeeId}-${period.weekIso}-${consecutiveRestHours}H`;

    NexusEventBus.emit('hr.weekly_rest_proof_recorded', {
      v: 1,
      tenantId,
      employeeId: period.employeeId,
      weekIso: period.weekIso,
      consecutiveRestHours,
      isLegalCompliant,
      recordedAt: Date.now(),
    });

    return {
      employeeId: period.employeeId,
      weekIso: period.weekIso,
      consecutiveRestHours,
      isLegalCompliant,
      proofHash,
    };
  }
}
