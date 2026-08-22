import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface LoyaltyTransactionInput {
  tenantId: string; // Le restaurant où l'achat est effectué
  customerId: string;
  spendInMicrounits: number;
  currentPointsBalance: number;
}

export interface LoyaltyPointsResult {
  customerId: string;
  pointsEarned: number;
  newBalance: number;
  availableCashbackInMicrounits: number; // 100 pts = 5.00 €
}

/**
 * CrossLocationLoyaltyService — Angle mort L78.
 * Programme fidélité multi-établissements unifié :
 * Cumul et utilisation des points fidélité et cashback valables dans l'ensemble des établissements du groupe.
 */
export class CrossLocationLoyaltyService {
  public static readonly POINTS_PER_EURO = 1; // 1€ dépensé = 1 point

  static awardPoints(input: LoyaltyTransactionInput): LoyaltyPointsResult {
    const eurosSpent = Math.floor(input.spendInMicrounits / 1_000_000);
    const pointsEarned = eurosSpent * this.POINTS_PER_EURO;
    const newBalance = input.currentPointsBalance + pointsEarned;
    const availableCashbackInMicrounits = Math.floor(newBalance / 100) * 5_000_000; // 5€ par tranche de 100 pts

    NexusEventBus.emit('crm.cross_loyalty_points_transacted', {
      v: 1,
      tenantId: input.tenantId,
      customerId: input.customerId,
      pointsDelta: pointsEarned,
      newBalance,
      transactedAt: Date.now(),
    });

    return {
      customerId: input.customerId,
      pointsEarned,
      newBalance,
      availableCashbackInMicrounits,
    };
  }
}
