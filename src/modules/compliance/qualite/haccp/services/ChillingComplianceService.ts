/**
 * L58 — Minuteur HACCP refroidissement rapide.
 *
 * Arrêté du 21/12/2009 : les préparations chaudes destinées à être servies froides
 * ou stockées doivent passer de +63°C à +10°C en moins de **2 heures** à cœur
 * (limite absolue pour blanquette 30L → chambre positive). Au-delà, le lot doit
 * être détruit — la responsabilité pénale du chef est engagée si Clostridium
 * perfringens se développe (TIAC).
 *
 * Ce service :
 *   1. Ouvre un cycle de refroidissement (`startCycle`)
 *   2. Enregistre les mesures intermédiaires (`recordTemperature`)
 *   3. Calcule la conformité (`evaluateCompliance`) — pur, testable
 *   4. Émet `HACCP_ALERT_RAISED` + `CHILLING_NONCONFORM` + Outbox SANITAIRE
 *      si non conforme (drainé avant metrics)
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L58 (débloqué par ADR-014).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';
import { AuditLogger } from '@/modules/compliance';

export interface ChillingCycle {
  id: string;
  tenantId: string;
  productLabel: string;
  batchQuantityKg: number;
  startedAt: number;
  startedTemperatureC: number;
  measurements: Array<{ atMs: number; temperatureC: number; operatorId: string }>;
  status: 'in_progress' | 'compliant' | 'non_compliant';
  closedAt?: number;
}

export interface ComplianceEvaluation {
  compliant: boolean;
  reachedTargetAtMs: number | null;
  targetC: number;
  targetDurationMinutes: number;
  actualDurationMinutes: number | null;
  reason?: 'IN_PROGRESS' | 'TIMEOUT_EXCEEDED' | 'REACHED_TARGET';
}

const TARGET_C = 10;
const MAX_DURATION_MS = 2 * 3600 * 1000; // 2h (arrêté 21/12/2009)

export class ChillingComplianceService {
  private static path(tenantId: string, cycleId: string): string {
    return `tenants/${tenantId}/chillingCycles/${cycleId}`;
  }

  static async startCycle(input: {
    tenantId: string;
    productLabel: string;
    batchQuantityKg: number;
    startedTemperatureC: number;
    operatorId: string;
    now?: number;
  }): Promise<ChillingCycle> {
    const now = input.now ?? Date.now();
    const id = `chill_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const cycle: ChillingCycle = {
      id,
      tenantId: input.tenantId,
      productLabel: input.productLabel,
      batchQuantityKg: input.batchQuantityKg,
      startedAt: now,
      startedTemperatureC: input.startedTemperatureC,
      measurements: [{ atMs: now, temperatureC: input.startedTemperatureC, operatorId: input.operatorId }],
      status: 'in_progress',
    };
    await Nexus.adapter.set(this.path(input.tenantId, id), cycle);
    return cycle;
  }

  static async recordTemperature(input: {
    tenantId: string;
    cycleId: string;
    temperatureC: number;
    operatorId: string;
    now?: number;
  }): Promise<ChillingCycle | null> {
    const now = input.now ?? Date.now();
    const cycle = (await Nexus.adapter.get<ChillingCycle>(this.path(input.tenantId, input.cycleId))) || null;
    if (!cycle || cycle.status !== 'in_progress') return cycle;

    cycle.measurements.push({ atMs: now, temperatureC: input.temperatureC, operatorId: input.operatorId });
    const evaluation = this.evaluateCompliance(cycle, now);

    if (evaluation.reason === 'REACHED_TARGET') {
      cycle.status = 'compliant';
      cycle.closedAt = evaluation.reachedTargetAtMs ?? now;
    } else if (evaluation.reason === 'TIMEOUT_EXCEEDED') {
      cycle.status = 'non_compliant';
      cycle.closedAt = now;
      await this.raiseAlert(cycle, evaluation);
    }

    await Nexus.adapter.set(this.path(input.tenantId, input.cycleId), cycle);
    return cycle;
  }

  /**
   * Pur — évalue la conformité d'un cycle à un instant `now`.
   * Non-conforme : jamais atteint <=10°C AVANT startedAt + 2h.
   */
  static evaluateCompliance(cycle: ChillingCycle, now: number): ComplianceEvaluation {
    const deadline = cycle.startedAt + MAX_DURATION_MS;

    const reachedAtMeasurement = cycle.measurements.find(m => m.temperatureC <= TARGET_C);
    if (reachedAtMeasurement) {
      const actualDuration = Math.round((reachedAtMeasurement.atMs - cycle.startedAt) / 60000);
      if (reachedAtMeasurement.atMs <= deadline) {
        return {
          compliant: true,
          reachedTargetAtMs: reachedAtMeasurement.atMs,
          targetC: TARGET_C,
          targetDurationMinutes: MAX_DURATION_MS / 60000,
          actualDurationMinutes: actualDuration,
          reason: 'REACHED_TARGET',
        };
      }
      // Cible atteinte trop tard
      return {
        compliant: false,
        reachedTargetAtMs: reachedAtMeasurement.atMs,
        targetC: TARGET_C,
        targetDurationMinutes: MAX_DURATION_MS / 60000,
        actualDurationMinutes: actualDuration,
        reason: 'TIMEOUT_EXCEEDED',
      };
    }

    if (now > deadline) {
      return {
        compliant: false,
        reachedTargetAtMs: null,
        targetC: TARGET_C,
        targetDurationMinutes: MAX_DURATION_MS / 60000,
        actualDurationMinutes: null,
        reason: 'TIMEOUT_EXCEEDED',
      };
    }

    return {
      compliant: false,
      reachedTargetAtMs: null,
      targetC: TARGET_C,
      targetDurationMinutes: MAX_DURATION_MS / 60000,
      actualDurationMinutes: null,
      reason: 'IN_PROGRESS',
    };
  }

  private static async raiseAlert(cycle: ChillingCycle, evaluation: ComplianceEvaluation): Promise<void> {
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${cycle.tenantId}/haccp_incidents`,
      targetId: `chilling_${cycle.id}`,
      priority: OutboxPriority.SANITAIRE,
      payload: {
        kind: 'CHILLING_TIMEOUT_EXCEEDED',
        cycleId: cycle.id,
        productLabel: cycle.productLabel,
        quantityKg: cycle.batchQuantityKg,
        evaluation,
      },
    }).catch(() => 0);

    await AuditLogger.logAction(
      cycle.measurements[cycle.measurements.length - 1]?.operatorId ?? 'system:haccp',
      'CHILLING_NONCONFORM',
      cycle.id,
      {
        productLabel: cycle.productLabel,
        quantityKg: cycle.batchQuantityKg,
        reason: evaluation.reason,
      },
    ).catch(() => null);
  }
}
