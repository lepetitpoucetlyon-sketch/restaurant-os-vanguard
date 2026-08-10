/**
 * FireNextCourseHandler — KDS : cadençage multi-service
 *
 * Quand un chef relance le service suivant (`kds.fire_next_course`), persiste
 * l'instruction dans Nexus pour que le KDS rafraîchisse les écrans de chaque station.
 * Émet `kds.course_fired` pour compatibilité avec les handlers existants.
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export function registerFireNextCourseHandler(): () => void {
  return NexusEventBus.on(
    'kds.fire_next_course',
    async (payload) => {
      const { tenantId, orderId, course, stationId, firedBy, firedAt } = payload;

      try {
        // 1. Persister le fire dans l'ordre pour que KDS puisse afficher le bon cours
        const firePath = `tenants/${tenantId}/kdsFireLog/${orderId}_course${course}`;
        await Nexus.adapter.set(firePath, {
          orderId,
          course,
          stationId: stationId ?? null,
          firedBy,
          firedAt,
          processedAt: Date.now(),
        });

        // 2. Émettre kds.course_fired (event existant) pour compatibilité KDS existant
        await NexusEventBus.emit('kds.course_fired', {
          v: 1,
          tenantId,
          orderId,
          course,
        });

        logger.info(
          `[FireNextCourse] Commande ${orderId} — service ${course} lancé par ${firedBy}`
        );

        empireAudit.log({
          module: 'ops',
          action: 'KDS_COURSE_FIRED',
          details: { orderId, course, stationId, firedBy },
          severity: 'low',
          timestamp: new Date(firedAt),
        });
      } catch (err) {
        logger.error('[FireNextCourse] Erreur envoi cours suivant', err);
        throw err;
      }
    },
    { id: 'fire-next-course', priority: 'HIGH' }
  );
}
