/**
 * L36 / T64 — Blocage planning si repos 11h bafoué (Art. L. 3131-1 CT).
 *
 * Code du Travail Art. L. 3131-1 : tout salarié a droit à un repos quotidien
 * d'une durée minimale de 11 heures consécutives. En HCR (Hotels-Cafés-Restaurants),
 * l'amplitude maximum est de 13h (T64). Toute violation engage la responsabilité
 * pénale de l'employeur ("faute inexcusable" + pénalités URSSAF).
 *
 * Ce guard vérifie avant insertion d'un shift dans le planning.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L36 + T64 (HAUT).
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

const MIN_REST_MINUTES = 11 * 60;
const MAX_AMPLITUDE_MINUTES = 13 * 60;

export interface ShiftProposal {
  tenantId: string;
  employeeId: string;
  shiftStartIso: string;
  shiftEndIso: string;
  previousShiftEndIso?: string;
  createdByManagerId: string;
}

export interface RestPeriodResult {
  allowed: boolean;
  violations: Array<{
    type: 'insufficient_rest' | 'max_amplitude_exceeded';
    gapMinutes?: number;
    amplitudeMinutes?: number;
  }>;
}

export class RestPeriodGuard {
  static check(proposal: ShiftProposal): RestPeriodResult {
    const violations: RestPeriodResult['violations'] = [];

    const shiftStart = new Date(proposal.shiftStartIso).getTime();
    const shiftEnd = new Date(proposal.shiftEndIso).getTime();
    const amplitudeMinutes = (shiftEnd - shiftStart) / 60_000;

    if (amplitudeMinutes > MAX_AMPLITUDE_MINUTES) {
      violations.push({ type: 'max_amplitude_exceeded', amplitudeMinutes });
    }

    if (proposal.previousShiftEndIso) {
      const prevEnd = new Date(proposal.previousShiftEndIso).getTime();
      const gapMinutes = (shiftStart - prevEnd) / 60_000;
      if (gapMinutes < MIN_REST_MINUTES) {
        violations.push({ type: 'insufficient_rest', gapMinutes });
      }
    }

    return { allowed: violations.length === 0, violations };
  }

  static async assertOrBlock(proposal: ShiftProposal): Promise<RestPeriodResult> {
    const result = this.check(proposal);

    if (!result.allowed) {
      for (const v of result.violations) {
        if (v.type === 'insufficient_rest') {
          await NexusEventBus.emit('hr.rest_period_violation', {
            v: 1,
            tenantId: proposal.tenantId,
            employeeId: proposal.employeeId,
            shiftStartIso: proposal.shiftStartIso,
            previousShiftEndIso: proposal.previousShiftEndIso!,
            gapMinutes: v.gapMinutes!,
            requiredMinutes: MIN_REST_MINUTES,
            violatedAt: Date.now(),
          });
        }
      }

      await AuditLogger.logAction(
        proposal.createdByManagerId,
        'REST_PERIOD_VIOLATION',
        proposal.employeeId,
        { violations: result.violations, shiftStartIso: proposal.shiftStartIso },
      ).catch(() => null);

      const msgs = result.violations.map(v =>
        v.type === 'insufficient_rest'
          ? `Repos insuffisant : ${Math.round(v.gapMinutes!)}min < 660min requis`
          : `Amplitude excessive : ${Math.round(v.amplitudeMinutes!)}min > 780min max HCR`,
      );
      throw new Error(`REST_PERIOD_VIOLATION: ${msgs.join('; ')}`);
    }

    return result;
  }
}
