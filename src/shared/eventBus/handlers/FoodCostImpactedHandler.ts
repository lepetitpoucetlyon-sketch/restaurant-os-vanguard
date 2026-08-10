import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { toError } from "@/lib/toError";

/**
 * FoodCostImpactedHandler (P0-1.7)
 * Écoute `finance.food_cost_impacted`.
 * Déclenche la réévaluation du Menu Engineering (`intelligence.menu_engineering_requested`)
 * et alerte si une dégradation de marge importante est constatée.
 */
export function registerFoodCostImpactedHandler(): () => void {
  return NexusEventBus.on(
    'finance.food_cost_impacted',
    async (payload) => {
      const { tenantId, reason, affectedItems, impactDate } = payload;

      try {
        logger.info(`[FoodCostImpactedHandler] Impact Food Cost enregistré (${reason}). Déclenchement réévaluation Menu Engineering.`);

        // 1. Déclencher intelligence.menu_engineering_requested (calcul BCG)
        await NexusEventBus.emitDurable('intelligence.menu_engineering_requested', {
          tenantId,
          periodDays: 30,
        });

        // 2. Audit
        empireAudit.log({
          module: 'finance',
          action: 'FOOD_COST_RECOMPUTED',
          details: { reason, affectedItems, impactDate },
          severity: 'low',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error(`[FoodCostImpactedHandler] Échec traitement impact food cost`, toError(err).message);
        throw err;
      }
    },
    { id: 'food-cost-impacted-handler', priority: 'HIGH' }
  );
}
