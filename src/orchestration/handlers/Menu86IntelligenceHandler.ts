/**
 * Menu86IntelligenceHandler — I4 : Stock → Intelligence
 *
 * Quand un article tombe à zéro (`stock.zero`), déclenche une mise à jour
 * du menu engineering (recalcul BCG sans l'article 86'd) et émet
 * `intelligence.menu_engineering_requested` pour que le moteur recalcule.
 *
 * "86" = terme de cuisine pour un plat épuisé (hors carte immédiatement).
 */
import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export function registerMenu86IntelligenceHandler(): () => void {
  return NexusEventBus.on(
    'stock.zero',
    async (payload) => {
      const { tenantId, itemId, itemName } = payload;

      try {
        // 1. Marquer l'article comme "86" dans le catalogue intelligence
        const eightySixId = `86_${itemId}_${Date.now()}`;
        await Nexus.adapter.set(
          `tenants/${tenantId}/eightySixLog/${eightySixId}`,
          {
            id: eightySixId,
            itemId,
            itemName,
            eightySixedAt: new Date().toISOString(),
            status: 'active',
          }
        );

        // 2. Déclencher le recalcul menu engineering sur 30 jours
        await NexusEventBus.emit('intelligence.menu_engineering_requested', {
          tenantId,
          periodDays: 30,
        });

        logger.info(
          `[Menu86] Item ${itemName} (${itemId}) 86'd — recalcul menu engineering déclenché`
        );

        empireAudit.log({
          module: 'ops',
          action: 'MENU_86_TRIGGERED',
          details: { itemId, itemName },
          severity: 'low',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error('[Menu86Intelligence] Erreur', err);
        throw err;
      }
    },
    { id: 'menu-86-intelligence', priority: 'BACKGROUND' }
  );
}
