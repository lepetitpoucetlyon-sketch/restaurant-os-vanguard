import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface PlannedShift {
  shiftId: string;
  employeeId: string;
  startTs: number;
  endTs: number;
}

export type PlanningConflictType = 'overlap' | 'daily_amplitude_exceeded' | 'daily_rest_insufficient' | 'weekly_rest_insufficient';

export interface PlanningConflict {
  type: PlanningConflictType;
  message: string;
  severity: 'warning' | 'blocking_legal';
}

export interface ShiftValidationReport {
  isValid: boolean;
  conflicts: PlanningConflict[];
}

/**
 * ShiftPlanningConflictService — Angle mort G2.
 * Détecte les conflits de planning et infractions au Code du Travail / HCR :
 * - Chevauchement d'horaires
 * - Amplitude journalière max > 13h
 * - Repos quotidien minimal < 11h consécutives entre deux shifts
 */
export class ShiftPlanningConflictService {
  public static readonly MAX_DAILY_AMPLITUDE_MS = 13 * 3600 * 1000;
  public static readonly MIN_DAILY_REST_MS = 11 * 3600 * 1000;

  static validateShift(
    tenantId: string,
    proposedShift: PlannedShift,
    existingEmployeeShifts: PlannedShift[]
  ): ShiftValidationReport {
    const conflicts: PlanningConflict[] = [];

    for (const existing of existingEmployeeShifts) {
      // 1. Direct overlap
      if (
        (proposedShift.startTs >= existing.startTs && proposedShift.startTs < existing.endTs) ||
        (proposedShift.endTs > existing.startTs && proposedShift.endTs <= existing.endTs)
      ) {
        conflicts.push({
          type: 'overlap',
          message: `Chevauchement direct avec le shift ${existing.shiftId}`,
          severity: 'blocking_legal',
        });
      }

      // 2. Insufficient rest between shifts (< 11h)
      if (proposedShift.startTs >= existing.endTs) {
        const restDuration = proposedShift.startTs - existing.endTs;
        if (restDuration < this.MIN_DAILY_REST_MS) {
          const restHours = Math.round((restDuration / (3600 * 1000)) * 10) / 10;
          conflicts.push({
            type: 'daily_rest_insufficient',
            message: `Repos quotidien insuffisant (${restHours}h < 11h légal HCR)`,
            severity: 'blocking_legal',
          });
        }
      }

      // 3. Daily amplitude (> 13h on same calendar day)
      const sameDay = new Date(proposedShift.startTs).toDateString() === new Date(existing.startTs).toDateString();
      if (sameDay) {
        const dayStart = Math.min(proposedShift.startTs, existing.startTs);
        const dayEnd = Math.max(proposedShift.endTs, existing.endTs);
        const amplitude = dayEnd - dayStart;
        if (amplitude > this.MAX_DAILY_AMPLITUDE_MS) {
          const ampHours = Math.round((amplitude / (3600 * 1000)) * 10) / 10;
          conflicts.push({
            type: 'daily_amplitude_exceeded',
            message: `Amplitude journalière dépassée (${ampHours}h > 13h max HCR)`,
            severity: 'blocking_legal',
          });
        }
      }
    }

    if (conflicts.length > 0) {
      NexusEventBus.emit('hr.shift_planning_conflict_detected', {
        v: 1,
        tenantId,
        employeeId: proposedShift.employeeId,
        shiftId: proposedShift.shiftId,
        conflictType: conflicts[0].type,
        detectedAt: Date.now(),
      });
    }

    return {
      isValid: conflicts.length === 0,
      conflicts,
    };
  }
}
