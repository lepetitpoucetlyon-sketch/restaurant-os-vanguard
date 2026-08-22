/**
 * L37 — Redistribution pourboires CB défiscalisés (compte 426).
 *
 * Loi du 7 novembre 2022 (dite "loi pourboires") :
 * - Les pourboires versés par CB sont exonérés de cotisations sociales et d'IR
 *   pour les salariés au SMIC ou jusqu'à 1,6 SMIC.
 * - L'employeur doit redistribuer intégralement les pourboires CB collectés
 *   aux salariés en contact avec la clientèle.
 * - Compte comptable : 426 (Personnel — Dépôts reçus) pour la collecte,
 *   puis 421 (Personnel — Rémunérations dues) lors de la redistribution.
 * - Sans traçabilité : risque de redressement URSSAF (perte de l'exonération).
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L37.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

export interface TipPoolEntry {
  id: string;
  tenantId: string;
  periodLabel: string;
  totalCollectedInMicrounits: number;
  collectedAt: number;
  account: '426';
}

export interface TipDistributionLine {
  employeeId: string;
  shareInMicrounits: number;
  periodLabel: string;
  account: '421';
}

export interface TipRedistributionResult {
  poolId: string;
  periodLabel: string;
  totalInMicrounits: number;
  lines: TipDistributionLine[];
  distributedAt: number;
  legalRef: 'Loi 2022-1158 art. 1';
}

export class TipRedistributionService {
  static computeShares(
    totalInMicrounits: number,
    employees: Array<{ employeeId: string; weight: number }>,
  ): TipDistributionLine[] {
    const totalWeight = employees.reduce((s, e) => s + e.weight, 0);
    if (totalWeight === 0) return [];
    let remaining = totalInMicrounits;
    return employees.map((e, i) => {
      const share = i < employees.length - 1
        ? Math.floor((e.weight / totalWeight) * totalInMicrounits)
        : remaining;
      remaining -= share;
      return { employeeId: e.employeeId, shareInMicrounits: share, periodLabel: '', account: '421' as const };
    });
  }

  static async addToPool(input: {
    tenantId: string;
    periodLabel: string;
    amountInMicrounits: number;
    now?: number;
  }): Promise<void> {
    const now = input.now ?? Date.now();
    const key = `tenants/${input.tenantId}/tip_pool/${input.periodLabel}`;
    const existing = await Nexus.adapter.get<{ total: number }>( key);
    const total = (existing?.total ?? 0) + input.amountInMicrounits;
    await Nexus.adapter.set(key, { total, periodLabel: input.periodLabel, updatedAt: now });
  }

  static async distribute(input: {
    tenantId: string;
    periodLabel: string;
    employees: Array<{ employeeId: string; weight: number }>;
    authorizedBy: string;
    now?: number;
  }): Promise<TipRedistributionResult> {
    const now = input.now ?? Date.now();
    const key = `tenants/${input.tenantId}/tip_pool/${input.periodLabel}`;
    const pool = await Nexus.adapter.get<{ total: number }>(key);
    const total = pool?.total ?? 0;

    const rawLines = this.computeShares(total, input.employees);
    const lines: TipDistributionLine[] = rawLines.map(l => ({ ...l, periodLabel: input.periodLabel }));
    const poolId = `tip_dist_${input.periodLabel}_${now}`;

    const result: TipRedistributionResult = {
      poolId,
      periodLabel: input.periodLabel,
      totalInMicrounits: total,
      lines,
      distributedAt: now,
      legalRef: 'Loi 2022-1158 art. 1',
    };

    await Nexus.adapter.set(
      `tenants/${input.tenantId}/tip_distributions/${poolId}`,
      result,
    );
    await Nexus.adapter.set(key, { total: 0, periodLabel: input.periodLabel, updatedAt: now });

    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/tip_distributions`,
      targetId: poolId,
      priority: OutboxPriority.FISCAL,
      payload: result as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await AuditLogger.logAction(
      input.authorizedBy,
      'TIP_REDISTRIBUTED',
      poolId,
      { periodLabel: input.periodLabel, total, employeeCount: lines.length },
    ).catch(() => null);

    await NexusEventBus.emit('hr.tip_redistribution_processed', {
      v: 1,
      tenantId: input.tenantId,
      poolId,
      periodLabel: input.periodLabel,
      totalInMicrounits: total,
      employeeCount: lines.length,
      processedAt: now,
    }).catch(() => null);

    return result;
  }
}
