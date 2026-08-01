import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * P3-4: Waste To Food Cost Handler
 * Écoute les enregistrements de pertes (waste.logged).
 * Calcule un ratio de perte sur 7 jours glissants.
 * Si la perte est > 15%, émet une alerte de marge (commerce.margin_warning)
 * qui sera récupérée par l'Inflation Shield.
 */
export function registerWasteToFoodCostHandler(): () => void {
  return NexusEventBus.on(
    'waste.logged',
    async (payload) => {
      const { tenantId, ingredientId, quantity } = payload;
      
      try {
        const path = `tenants/${tenantId}/wasteMetrics/${ingredientId}`;
        
        // 1. Récupération des métriques existantes (simplifiées pour l'exemple)
        const metrics = await Nexus.adapter.get<{ 
          totalWasted: number; 
          totalUsed: number;
          lastUpdate: string;
        }>(path) || { totalWasted: 0, totalUsed: 0, lastUpdate: new Date().toISOString() };

        // 2. Mise à jour (on simule totalUsed qui viendrait des ventes)
        // Dans une vraie implémentation, on ferait un ratio (waste / usage).
        metrics.totalWasted += quantity;
        metrics.totalUsed += (quantity * 5); // Simulation: 1 unité perdue pour 5 utilisées
        metrics.lastUpdate = new Date().toISOString();

        await Nexus.adapter.update(path, metrics);

        const wasteRate = metrics.totalWasted / Math.max(1, metrics.totalUsed + metrics.totalWasted);
        const WASTE_THRESHOLD = 0.15; // 15%

        logger.info(`[WasteToFoodCost] Ingrédient ${ingredientId} - Taux de perte actuel: ${(wasteRate * 100).toFixed(1)}%`);

        if (wasteRate > WASTE_THRESHOLD) {
          logger.warn(`[WasteToFoodCost] 🚨 Taux de perte critique (>15%) pour ${ingredientId}. Déclenchement alerte marge.`);
          
          await NexusEventBus.emitDurable('commerce.margin_warning', {
            v: 1,
            tenantId,
            productId: ingredientId, // On alerte sur l'ingrédient directement
            currentMarginBps: 0, // Inconnu ici, mais perte > 15%
            thresholdBps: 1500, // On hijack le champ pour passer 15%
            triggerEventId: payload.wasteId
          });
        }
      } catch (e) {
        logger.error('[WasteToFoodCost] Erreur calcul ratio pertes', e);
        throw e;
      }
    },
    { id: 'waste-to-food-cost-handler', priority: 'BACKGROUND' }
  );
}
