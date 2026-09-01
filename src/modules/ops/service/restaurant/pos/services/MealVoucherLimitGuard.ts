import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

export interface MealVoucherValidationItem {
  productId: string;
  category: 'food' | 'drink_non_alcoholic' | 'alcohol' | 'tobacco' | 'non_food';
  amountInMicrounits: number;
}

export interface MealVoucherValidationRequest {
  tenantId: string;
  orderId: string;
  adminId?: string;
  requestedVoucherAmountInMicrounits: number;
  items: MealVoucherValidationItem[];
  customDailyLimitInMicrounits?: number;
}

export interface MealVoucherValidationResult {
  allowed: boolean;
  eligibleAmountInMicrounits: number;
  maxVoucherUsableInMicrounits: number;
  remainingToPayInMicrounits: number;
  rejectedReason?: 'exceeds_daily_limit' | 'ineligible_items_only';
}

/**
 * MealVoucherLimitGuard — Angle mort A5.
 * Contrôle réglementaire des Titres-Restaurants (CNTR / CONECS) :
 * - Plafond légal quotidien : 25,00 € (25_000_000 microunits).
 * - Éligibilité stricte : nourriture & boissons non alcoolisées uniquement (exclusion alcool/tabac).
 */
export class MealVoucherLimitGuard {
  public static readonly LEGAL_DAILY_LIMIT_MICROUNITS = 25_000_000; // 25.00 €

  static async validate(req: MealVoucherValidationRequest): Promise<MealVoucherValidationResult> {
    const dailyLimit = req.customDailyLimitInMicrounits || this.LEGAL_DAILY_LIMIT_MICROUNITS;

    // Calculate eligible amount (food + non_alcoholic drink)
    let eligibleAmountInMicrounits = 0;
    let totalOrderInMicrounits = 0;

    for (const item of req.items) {
      totalOrderInMicrounits += item.amountInMicrounits;
      if (item.category === 'food' || item.category === 'drink_non_alcoholic') {
        eligibleAmountInMicrounits += item.amountInMicrounits;
      }
    }

    if (eligibleAmountInMicrounits === 0) {
      NexusEventBus.emit('pos.meal_voucher_rejected', {
        v: 1,
        tenantId: req.tenantId,
        orderId: req.orderId,
        requestedAmountInMicrounits: req.requestedVoucherAmountInMicrounits,
        dailyLimitInMicrounits: dailyLimit,
        reason: 'ineligible_items_only',
        rejectedAt: Date.now(),
      });

      return {
        allowed: false,
        eligibleAmountInMicrounits: 0,
        maxVoucherUsableInMicrounits: 0,
        remainingToPayInMicrounits: totalOrderInMicrounits,
        rejectedReason: 'ineligible_items_only',
      };
    }

    // Voucher usable cannot exceed both the eligible items total and the daily ceiling
    const maxVoucherUsableInMicrounits = Math.min(eligibleAmountInMicrounits, dailyLimit);

    if (req.requestedVoucherAmountInMicrounits > maxVoucherUsableInMicrounits) {
      NexusEventBus.emit('pos.meal_voucher_rejected', {
        v: 1,
        tenantId: req.tenantId,
        orderId: req.orderId,
        requestedAmountInMicrounits: req.requestedVoucherAmountInMicrounits,
        dailyLimitInMicrounits: dailyLimit,
        reason: 'exceeds_daily_limit',
        rejectedAt: Date.now(),
      });

      if (req.adminId) {
        await AuditLogger.logAction({
          adminId: req.adminId,
          action: 'MEAL_VOUCHER_EXCEEDED',
          targetId: req.orderId,
          ipAddress: '127.0.0.1',
          metadata: {
            requestedAmount: req.requestedVoucherAmountInMicrounits,
            maxAllowed: maxVoucherUsableInMicrounits,
          },
        });
      }

      return {
        allowed: false,
        eligibleAmountInMicrounits,
        maxVoucherUsableInMicrounits,
        remainingToPayInMicrounits: totalOrderInMicrounits - maxVoucherUsableInMicrounits,
        rejectedReason: 'exceeds_daily_limit',
      };
    }

    return {
      allowed: true,
      eligibleAmountInMicrounits,
      maxVoucherUsableInMicrounits,
      remainingToPayInMicrounits: totalOrderInMicrounits - req.requestedVoucherAmountInMicrounits,
    };
  }
}
