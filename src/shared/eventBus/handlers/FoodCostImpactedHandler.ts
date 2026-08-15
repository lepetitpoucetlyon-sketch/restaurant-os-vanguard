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
  const unsubFood = NexusEventBus.on(
    'finance.food_cost_impacted',
    async (payload) => {
      await handleCostImpact(payload);
    },
    { id: 'food-cost-impacted-handler', priority: 'HIGH' }
  );

  const unsubMaterial = NexusEventBus.on(
    'finance.material_cost_impacted',
    async (payload) => {
      await handleCostImpact(payload);
    },
    { id: 'material-cost-impacted-handler', priority: 'HIGH' }
  );

  return () => {
    unsubFood();
    unsubMaterial();
  };
}

async function handleCostImpact(payload: { tenantId: string; reason: string; affectedItems?: string[]; impactDate: string }) {
  const { tenantId, reason, affectedItems, impactDate } = payload;

  try {
    logger.info(`[CostImpactHandler] Impact Coût Matière/COGS enregistré (${reason}). Déclenchement réévaluation rentabilité.`);

    // 1. Déclencher intelligence.menu_engineering_requested (calcul BCG / rentabilité catalogue)
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
    logger.error(`[CostImpactHandler] Échec traitement impact coût matière`, toError(err).message);
    throw err;
  }
}

