/**
 * ResaAllergenCheckHandler — I3 : Résa → KDS
 *
 * Quand un client arrive et est accueilli (`reservation.matched`), transmet
 * ses allergènes déclarés vers le KDS de sa table et enregistre un flag CRM.
 * Garantit que la cuisine est informée AVANT que la commande soit passée.
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export function registerResaAllergenCheckHandler(): () => void {
  return NexusEventBus.on(
    'reservation.matched',
    async (payload) => {
      const { tenantId, reservationId, customerId, tableId, allergens, covers, matchedAt } = payload;

      try {
        if (!allergens || allergens.length === 0) {
          // Pas d'allergènes déclarés — log informatif uniquement
          logger.info(`[ResaAllergenCheck] Résa ${reservationId} sans allergènes — skip.`);
          return;
        }

        // 1. Persister le badge allergen sur la table (KDS le lira)
        await Nexus.adapter.set(
          `tenants/${tenantId}/tableAllergenBadges/${tableId}`,
          {
            tableId,
            reservationId,
            customerId: customerId ?? null,
            allergens,
            covers,
            activeFrom: matchedAt,
            clearedAt: null,
          }
        );

        // 2. Émettre crm.allergen_flagged si client connu (pour mise à jour CRM)
        if (customerId) {
          await NexusEventBus.emit('crm.allergen_flagged', {
            v: 1,
            tenantId,
            customerId,
            reservationId,
            allergens,
            tableId,
            flaggedAt: matchedAt,
          });
        }

        // 3. Notifier la cuisine via notification urgente
        await NexusEventBus.emit('notification.urgent', {
          v: 1,
          tenantId,
          message: `🚨 Table ${tableId} — Allergènes déclarés : ${allergens.join(', ')} (${covers} pers.)`,
          roles: ['chef_cuisinier', 'cuisinier', 'chef_rang'],
          priority: 'CRITICAL',
        });

        logger.warn(
          `[ResaAllergenCheck] Allergènes transmis KDS — table ${tableId}, résa ${reservationId}: ${allergens.join(', ')}`
        );

        empireAudit.log({
          module: 'compliance',
          action: 'ALLERGEN_TRANSMITTED_TO_KDS',
          details: { reservationId, tableId, allergens, customerId },
          severity: 'high',
          timestamp: matchedAt ? new Date(matchedAt) : new Date(),
        });
      } catch (err) {
        logger.error('[ResaAllergenCheck] Erreur transmission allergènes KDS', err);
        throw err;
      }
    },
    { id: 'resa-allergen-check', priority: 'CRITICAL' }
  );
}
