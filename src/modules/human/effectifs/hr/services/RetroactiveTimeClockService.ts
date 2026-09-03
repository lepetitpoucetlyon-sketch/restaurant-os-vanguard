import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { BusinessClock } from '@/kernel/time/BusinessClock';

export interface RetroactiveShiftParams {
  tenantId: string;
  employeeId: string;
  shiftStartIso: string;
  shiftEndIso: string;
  breakDurationMinutes?: number;
  reason: string;
  managerId: string;
  source?: string;
}

export interface RegularizedShiftRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  businessDay: string;
  occurredStartIso: string;
  occurredEndIso: string;
  recordedAtIso: string;
  isRetroactive: boolean;
  durationMinutes: number;
  breakDurationMinutes: number;
  reason: string;
  approvedByManagerId: string;
  source: string;
  createdAt: string;
}

export class RetroactiveTimeClockService {
  /**
   * Enregistre ou régularise un shift de travail rétroactif (Lot 5 - M5).
   * Distingue rigoureusement le temps réel travaillé (occurred) du temps de saisie (recorded).
   */
  public static async recordRetroactiveShift(
    params: RetroactiveShiftParams
  ): Promise<RegularizedShiftRecord> {
    const {
      tenantId,
      employeeId,
      shiftStartIso,
      shiftEndIso,
      breakDurationMinutes = 0,
      reason,
      managerId,
      source = 'manual_regularization',
    } = params;

    const startTime = new Date(shiftStartIso).getTime();
    const endTime = new Date(shiftEndIso).getTime();

    if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
      throw new Error(`[RetroactiveTimeClock] Horaires de shift invalides : ${shiftStartIso} -> ${shiftEndIso}`);
    }

    if (!managerId) {
      throw new Error(`[RetroactiveTimeClock] Visa managérial requis pour toute régularisation d'heures (Loi 12 RBAC)`);
    }

    const businessDay = BusinessClock.resolveServiceDay(shiftStartIso);
    const recordedAtIso = new Date().toISOString();
    const grossMinutes = Math.round((endTime - startTime) / (1000 * 60));
    const netMinutes = Math.max(0, grossMinutes - breakDurationMinutes);

    // Un shift est considéré rétroactif s'il est saisi plus de 12 heures après le début réel
    const lagHours = BusinessClock.lagHours({
      occurredAt: shiftStartIso,
      recordedAt: recordedAtIso,
    });
    const isRetroactive = lagHours > 12;

    const shiftId = `shift_${employeeId}_${businessDay}_${startTime}`;

    const shiftRecord: RegularizedShiftRecord = {
      id: shiftId,
      tenantId,
      employeeId,
      businessDay,
      occurredStartIso: shiftStartIso,
      occurredEndIso: shiftEndIso,
      recordedAtIso,
      isRetroactive,
      durationMinutes: netMinutes,
      breakDurationMinutes,
      reason,
      approvedByManagerId: managerId,
      source,
      createdAt: recordedAtIso,
    };

    // 1. Sauvegarder la fiche de vacation
    await Nexus.adapter.set(`tenants/${tenantId}/shifts/${shiftId}`, shiftRecord);

    // 2. Persister les pointages canoniques dans timeclock pour rétro-compatibilité
    await Nexus.adapter.set(`tenants/${tenantId}/timeclock/${businessDay}/${shiftId}_in`, {
      id: `${shiftId}_in`,
      employeeId,
      type: 'clock_in',
      timestamp: shiftStartIso,
      source,
      metadata: {
        isRetroactive,
        recordedAt: recordedAtIso,
        approvedByManagerId: managerId,
        reason,
      },
    });

    await Nexus.adapter.set(`tenants/${tenantId}/timeclock/${businessDay}/${shiftId}_out`, {
      id: `${shiftId}_out`,
      employeeId,
      type: 'clock_out',
      timestamp: shiftEndIso,
      source,
      metadata: {
        isRetroactive,
        recordedAt: recordedAtIso,
        approvedByManagerId: managerId,
        reason,
      },
    });

    empireAudit.log({
      module: 'human',
      action: 'SHIFT_REGULARIZED',
      details: {
        employeeId,
        shiftId,
        businessDay,
        durationMinutes: netMinutes,
        isRetroactive,
        lagHours: Math.round(lagHours),
        reason,
        managerId,
      },
      severity: isRetroactive ? 'medium' : 'low',
      timestamp: new Date(),
    });

    await NexusEventBus.emitDurable('hr.shift_regularized', {
      v: 1,
      tenantId,
      employeeId,
      shiftId,
      businessDay,
      occurredStartIso: shiftStartIso,
      occurredEndIso: shiftEndIso,
      recordedAtIso,
      isRetroactive,
      durationMinutes: netMinutes,
      reason,
      approvedByManagerId: managerId,
    });

    logger.info(
      `[RetroactiveTimeClock] Shift régularisé pour ${employeeId} (${netMinutes} min le ${businessDay}, saisi avec ${Math.round(lagHours)}h de décalage par ${managerId})`
    );

    return shiftRecord;
  }
}
