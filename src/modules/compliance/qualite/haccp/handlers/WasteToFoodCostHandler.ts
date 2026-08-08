import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * P3-4: Waste To Food Cost Handler
 * Écoute les enregistrements de pertes (waste.logged et inventory.waste_logged).
 * Calcule un ratio de perte sur 7 jours glissants.
 * Si la perte est > 15%, émet une alerte de marge (commerce.margin_warning)
 * qui sera récupérée par l'Inflation Shield.
 */
export function registerWasteToFoodCostHandler(): () => void {
  const unsubWasteLogged = NexusEventBus.on(
    'waste.logged',
    async (payload) => {
      const { tenantId, ingredientId, quantity } = payload;
      
      try {
        const path = `tenants/${tenantId}/wasteMetrics/${ingredientId}`;
        
        // 1. Récupération des métriques existantes
        const metrics = await Nexus.adapter.get<{ 
          totalWasted: number; 
          totalUsed: number;
          lastUpdate: string;
        }>(path) || { totalWasted: 0, totalUsed: 0, lastUpdate: new Date().toISOString() };

        // 2. Mise à jour
        metrics.totalWasted += quantity;
        metrics.lastUpdate = new Date().toISOString();
        
        await Nexus.adapter.set(path, metrics);

        // 3. Calcul du taux de perte fictif pour détection de seuil
        const wasteRate = metrics.totalWasted / Math.max(1, metrics.totalUsed + metrics.totalWasted);
        const WASTE_THRESHOLD = 0.15; // 15%

        logger.info(`[WasteToFoodCost] Ingrédient ${ingredientId} - Taux de perte actuel: ${(wasteRate * 100).toFixed(1)}%`);

        if (wasteRate > WASTE_THRESHOLD) {
          logger.warn(`[WasteToFoodCost] ALERTE: Dépassement du seuil de perte sur l'ingrédient ${ingredientId}`);
          
          await NexusEventBus.emitDurable('commerce.margin_warning', {
            v: 1 as const,
            tenantId,
            productId: ingredientId,
            currentMarginBps: Math.round((1 - wasteRate) * 10000),
            thresholdBps: Math.round((1 - WASTE_THRESHOLD) * 10000),
            triggerEventId: payload.wasteId ?? `w_${Date.now()}`
          });
        }
      } catch (err) {
        logger.error(`[WasteToFoodCost] Échec du traitement de la perte pour l'ingrédient ${ingredientId}`, err);
      }
    },
    { id: 'waste-to-food-cost-handler', priority: 'BACKGROUND' }
  );

  const unsubInventoryWasteLogged = NexusEventBus.on(
    'inventory.waste_logged',
    async (payload) => {
      const { tenantId, wasteId, items } = payload;
      logger.info(`[WasteToFoodCost] Réconciliation stock pour perte wasteId=${wasteId} (${items?.length ?? 0} articles)`);
      for (const item of items ?? []) {
        const ingredientId = item.productId;
        const quantity = item.quantity;
        if (ingredientId && quantity) {
          try {
            const path = `tenants/${tenantId}/wasteMetrics/${ingredientId}`;
            const metrics = await Nexus.adapter.get<{ totalWasted: number; totalUsed: number; lastUpdate: string }>(path) || { totalWasted: 0, totalUsed: 0, lastUpdate: new Date().toISOString() };
            metrics.totalWasted += quantity;
            metrics.lastUpdate = new Date().toISOString();
            await Nexus.adapter.set(path, metrics);
          } catch (err) {
            logger.error(`[WasteToFoodCost] Échec réconciliation perte article ${ingredientId}`, err);
          }
        }
      }
    }
  );

  return () => {
    unsubWasteLogged();
    unsubInventoryWasteLogged();
  };
}
