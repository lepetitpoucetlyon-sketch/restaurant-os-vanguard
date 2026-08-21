/**
 * MCC-D4 — Commission revendeur (apporteur d'affaires).
 *
 * Les revendeurs (apporteurs d'affaires) perçoivent une commission mensuelle
 * sur le MRR (Monthly Recurring Revenue) des tenants qu'ils ont apportés.
 * Sans traçabilité automatique : erreurs de calcul, contentieux commercial,
 * et risque fiscal (TVA sur commissions).
 *
 * Modèle : commission = MRR_tenant * pct_revendeur
 * Les commissions > 0 génèrent une écriture comptable en compte 622
 * (honoraires et commissions).
 *
 * Cf. docs/anglemort-restaurant-mcc.md § MCC-D4.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

export interface ResellerConfig {
  resellerId: string;
  commissionPct: number;
  activeSince: string;
  tenantIds: string[];
}

export interface CommissionStatement {
  id: string;
  resellerId: string;
  periodLabel: string;
  tenantBreakdown: Array<{
    tenantId: string;
    mrrInMicrounits: number;
    commissionInMicrounits: number;
  }>;
  totalCommissionInMicrounits: number;
  account: '622';
  generatedAt: number;
}

export class ResellerCommissionService {
  private static resellerPath(resellerId: string): string {
    return `mcc/resellers/${resellerId}`;
  }

  static computeCommission(mrrInMicrounits: number, commissionPct: number): number {
    return Math.round(mrrInMicrounits * (commissionPct / 100));
  }

  static async getConfig(resellerId: string): Promise<ResellerConfig | null> {
    return Nexus.adapter.get<ResellerConfig>(this.resellerPath(resellerId));
  }

  static async generateMonthlyStatement(input: {
    resellerId: string;
    periodLabel: string;
    tenantMrrs: Array<{ tenantId: string; mrrInMicrounits: number }>;
    requestedBy: string;
    now?: number;
  }): Promise<CommissionStatement> {
    const now = input.now ?? Date.now();
    const config = await this.getConfig(input.resellerId);
    if (!config) throw new Error(`RESELLER_NOT_FOUND:${input.resellerId}`);

    const tenantBreakdown = input.tenantMrrs
      .filter(t => config.tenantIds.includes(t.tenantId))
      .map(t => ({
        tenantId: t.tenantId,
        mrrInMicrounits: t.mrrInMicrounits,
        commissionInMicrounits: this.computeCommission(t.mrrInMicrounits, config.commissionPct),
      }));

    const total = tenantBreakdown.reduce((s, t) => s + t.commissionInMicrounits, 0);
    const id = `comm_${input.resellerId}_${input.periodLabel}`;

    const statement: CommissionStatement = {
      id,
      resellerId: input.resellerId,
      periodLabel: input.periodLabel,
      tenantBreakdown,
      totalCommissionInMicrounits: total,
      account: '622',
      generatedAt: now,
    };

    await Nexus.adapter.set(`mcc/commission_statements/${id}`, statement);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: 'mcc/commission_statements',
      targetId: id,
      priority: OutboxPriority.FISCAL,
      payload: statement as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await NexusEventBus.emit('finance.reseller_commission_generated', {
      v: 1,
      resellerId: input.resellerId,
      periodLabel: input.periodLabel,
      totalCommissionInMicrounits: total,
      tenantCount: tenantBreakdown.length,
      generatedAt: now,
    }).catch(() => null);

    return statement;
  }
}
