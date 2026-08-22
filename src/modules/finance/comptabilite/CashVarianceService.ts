/**
 * L22 — Écriture d'écart de caisse au Z (compte 658 / 757).
 *
 * Quand le ticket Z est généré, l'écart entre le cash attendu (calculé par le
 * système) et le cash réellement compté doit générer automatiquement :
 *  - Écart négatif (manque) → compte 658 « Charges exceptionnelles diverses »
 *  - Écart positif (excédent) → compte 757 « Quote-part subventions »
 * Obligation comptable CGI Art. 54 + plan comptable PCG.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L22 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';
import { AuditLogger } from '@/modules/compliance';

export interface CashVarianceEntry {
  id: string;
  tenantId: string;
  dateIso: string;
  operatorId: string;
  expectedInMicrounits: number;
  actualInMicrounits: number;
  varianceInMicrounits: number;
  account: '658' | '757';
  accountLabel: string;
  recordedAt: number;
}

export class CashVarianceService {
  static computeVariance(expected: number, actual: number): {
    varianceInMicrounits: number;
    account: '658' | '757';
    accountLabel: string;
  } {
    const variance = actual - expected;
    const account = variance < 0 ? '658' : '757';
    const accountLabel = variance < 0
      ? 'Charges exceptionnelles diverses'
      : 'Quote-part subventions reçues';
    return { varianceInMicrounits: variance, account, accountLabel };
  }

  static async recordOnZClosure(input: {
    tenantId: string;
    dateIso: string;
    operatorId: string;
    expectedInMicrounits: number;
    actualInMicrounits: number;
    now?: number;
  }): Promise<CashVarianceEntry | null> {
    const now = input.now ?? Date.now();
    const { varianceInMicrounits, account, accountLabel } = this.computeVariance(
      input.expectedInMicrounits,
      input.actualInMicrounits,
    );

    if (varianceInMicrounits === 0) return null;

    const entry: CashVarianceEntry = {
      id: `cashvar_${input.dateIso}_${now}`,
      tenantId: input.tenantId,
      dateIso: input.dateIso,
      operatorId: input.operatorId,
      expectedInMicrounits: input.expectedInMicrounits,
      actualInMicrounits: input.actualInMicrounits,
      varianceInMicrounits,
      account,
      accountLabel,
      recordedAt: now,
    };

    await Nexus.adapter.set(`tenants/${input.tenantId}/cash_variances/${entry.id}`, entry);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/cash_variances`,
      targetId: entry.id,
      priority: OutboxPriority.FISCAL,
      payload: entry as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await AuditLogger.logAction(
      input.operatorId,
      'CASH_VARIANCE_RECORDED',
      entry.id,
      { varianceInMicrounits, account, dateIso: input.dateIso },
    ).catch(() => null);

    await NexusEventBus.emit('finance.cash_variance_recorded', {
      v: 1,
      tenantId: input.tenantId,
      dateIso: input.dateIso,
      expectedInMicrounits: input.expectedInMicrounits,
      actualInMicrounits: input.actualInMicrounits,
      varianceInMicrounits,
      account,
      recordedAt: now,
    });

    return entry;
  }
}
