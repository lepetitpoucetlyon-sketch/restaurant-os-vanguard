import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

export function registerKdsCoursePassedHandler(): () => void {
  return NexusEventBus.on(
    'kds.course_passed',
    async ({ tenantId, orderId, courseId }) => {
      try {
        await Nexus.adapter.update(
          `tenants/${tenantId}/orders/${orderId}/courses/${courseId}`,
          { passedAt: new Date().toISOString(), status: 'passed' },
        );
        logger.info(`[KdsCoursePassedHandler] Cours ${courseId} passé pour commande ${orderId}`);
      } catch (err) {
        logger.error(`[KdsCoursePassedHandler] Échec mise à jour cours: ${toError(err).message}`);
        throw err;
      }
    },
    { id: 'kds-course-passed', priority: 'HIGH' },
  );
}
