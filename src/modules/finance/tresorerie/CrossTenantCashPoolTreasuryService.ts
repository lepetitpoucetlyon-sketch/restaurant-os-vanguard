import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface TenantCashBalance {
  tenantId: string;
  tradeName: string;
  currentCashInMicrounits: number;
  targetWorkingCapitalInMicrounits: number; // Besoin en fonds de roulement cible
}

export interface CashPoolRebalanceOrder {
  fromTenantId: string;
  toTenantId: string;
  transferAmountInMicrounits: number;
  purpose: 'cash_sweep_concentration' | 'liquidity_support';
}

export interface CashPoolOptimizationPlan {
  groupTenantId: string;
  totalGroupCashInMicrounits: number;
  rebalanceOrders: CashPoolRebalanceOrder[];
  balancedAt: number;
}

/**
 * CrossTenantCashPoolTreasuryService — Angle mort MCC-C3.
 * Cash-pooling centralisé pour groupes de restauration multi-établissements :
 * Nivellement automatique des comptes bancaires, rapatriement des excédents de trésorerie et comblement des découverts.
 */
export class CrossTenantCashPoolTreasuryService {
  static computeRebalancing(
    groupTenantId: string,
    balances: TenantCashBalance[]
  ): CashPoolOptimizationPlan {
    let totalGroupCashInMicrounits = 0;
    const surplusTenants: { tenantId: string; surplus: number }[] = [];
    const deficitTenants: { tenantId: string; deficit: number }[] = [];

    for (const b of balances) {
      totalGroupCashInMicrounits += b.currentCashInMicrounits;
      const variance = b.currentCashInMicrounits - b.targetWorkingCapitalInMicrounits;

      if (variance > 0) {
        surplusTenants.push({ tenantId: b.tenantId, surplus: variance });
      } else if (variance < 0) {
        deficitTenants.push({ tenantId: b.tenantId, deficit: Math.abs(variance) });
      }
    }

    const rebalanceOrders: CashPoolRebalanceOrder[] = [];

    for (const def of deficitTenants) {
      let needed = def.deficit;
      for (const sur of surplusTenants) {
        if (sur.surplus <= 0 || needed <= 0) continue;
        const transfer = Math.min(sur.surplus, needed);
        sur.surplus -= transfer;
        needed -= transfer;

        rebalanceOrders.push({
          fromTenantId: sur.tenantId,
          toTenantId: def.tenantId,
          transferAmountInMicrounits: transfer,
          purpose: 'liquidity_support',
        });

        NexusEventBus.emit('finance.cash_pool_balanced', {
          v: 1,
          groupTenantId,
          fromTenantId: sur.tenantId,
          toTenantId: def.tenantId,
          transferAmountInMicrounits: transfer,
          balancedAt: Date.now(),
        });
      }
    }

    return {
      groupTenantId,
      totalGroupCashInMicrounits,
      rebalanceOrders,
      balancedAt: Date.now(),
    };
  }
}
