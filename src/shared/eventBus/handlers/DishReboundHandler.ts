/**
 * DishReboundHandler — KDS : enregistrement retour de plat
 *
 * Quand un plat est refusé/retourné (`kds.dish_rebound`), enregistre la perte
 * cuisine dans le registre de gaspillage HACCP et crée un audit trace.
 * Alerte le manager si le motif est allergen.
 */
import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export function registerDishReboundHandler(): () => void {
  return NexusEventBus.on(
    'kds.dish_rebound',
    async (payload) => {
      const { tenantId, orderId, itemId, productName, reason, operatorId, reboundAt } = payload;

      try {
        const reboundId = `rebound_${itemId}_${reboundAt}`;

        // 1. Enregistrer le retour dans le registre de gaspillage
        await Nexus.adapter.set(
          `tenants/${tenantId}/dishReboundLog/${reboundId}`,
          {
            id: reboundId,
            orderId,
            itemId,
            productName,
            reason,
            operatorId,
            reboundAt,
            processedAt: Date.now(),
          }
        );

        // 2. Si motif allergen — alerte critique immédiate
        if (reason === 'allergen') {
          await NexusEventBus.emit('notification.urgent', {
            v: 1,
            tenantId,
            message: `🚨 Retour allergène — ${productName} (commande ${orderId}) — vérification table requise`,
            roles: ['chef_rang', 'manager', 'chef_cuisinier'],
            priority: 'CRITICAL',
          });

          logger.error(
            `[DishRebound] ALLERGEN REBOUND — ${productName} / commande ${orderId} / opérateur ${operatorId}`
          );

          empireAudit.log({
            module: 'compliance',
            action: 'DISH_REBOUND_ALLERGEN',
            details: { orderId, itemId, productName, reason, operatorId },
            severity: 'critical',
            timestamp: reboundAt ? new Date(reboundAt) : new Date(),
          });
        } else {
          // Retour standard — gaspillage cuisine
          // Émettre waste.logged pour déduction food cost
          await NexusEventBus.emitDurable('waste.logged', {
            v: 1,
            tenantId,
            wasteId: reboundId,
            ingredientId: itemId,
            ingredientName: productName,
            quantity: 1,
            unit: 'portion',
            reason: `Retour plat KDS: ${reason}`,
          });

          logger.info(
            `[DishRebound] Retour enregistré — ${productName} (${reason}) par ${operatorId}`
          );

          empireAudit.log({
            module: 'ops',
            action: 'DISH_REBOUND',
            details: { orderId, itemId, productName, reason, operatorId },
            severity: 'medium',
            timestamp: reboundAt ? new Date(reboundAt) : new Date(),
          });
        }
      } catch (err) {
        logger.error('[DishRebound] Erreur enregistrement retour plat', err);
        throw err;
      }
    },
    { id: 'dish-rebound', priority: 'HIGH' }
  );
}
