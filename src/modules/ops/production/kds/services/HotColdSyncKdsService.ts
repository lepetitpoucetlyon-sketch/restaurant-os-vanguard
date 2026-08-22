import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface CoursePreparationSpec {
  itemId: string;
  name: string;
  type: 'hot' | 'cold';
  prepTimeSeconds: number; // ex: Chaud 720s (12 min), Froid 180s (3 min)
}

export interface TableCourseSyncPlan {
  orderId: string;
  targetServingTimestamp: number;
  hotStartTimeOffsetSeconds: number; // T0 + 0s
  coldStartTimeOffsetSeconds: number; // T0 + 540s (9 min delay before starting salad)
  totalCourseDurationSeconds: number;
}

/**
 * HotColdSyncKdsService — Angle mort T17.
 * Synchronise les préparations entrées/plats Chaud et Froid au KDS pour éviter qu'une salade froide attende 10 minutes sous les lampes chauffantes.
 */
export class HotColdSyncKdsService {
  static planCourseSync(
    tenantId: string,
    orderId: string,
    items: CoursePreparationSpec[]
  ): TableCourseSyncPlan {
    const hotItems = items.filter(i => i.type === 'hot');
    const coldItems = items.filter(i => i.type === 'cold');

    const maxHotPrepSeconds = hotItems.length > 0 ? Math.max(...hotItems.map(i => i.prepTimeSeconds)) : 0;
    const maxColdPrepSeconds = coldItems.length > 0 ? Math.max(...coldItems.map(i => i.prepTimeSeconds)) : 0;

    const totalCourseDurationSeconds = Math.max(maxHotPrepSeconds, maxColdPrepSeconds);
    const coldDelaySeconds = Math.max(0, maxHotPrepSeconds - maxColdPrepSeconds);

    const targetServingTimestamp = Date.now() + (totalCourseDurationSeconds * 1000);

    NexusEventBus.emit('kds.hot_cold_sync_aligned', {
      v: 1,
      tenantId,
      orderId,
      coldPrepDelayedSeconds: coldDelaySeconds,
      targetServingTs: targetServingTimestamp,
      alignedAt: Date.now(),
    });

    return {
      orderId,
      targetServingTimestamp,
      hotStartTimeOffsetSeconds: 0,
      coldStartTimeOffsetSeconds: coldDelaySeconds,
      totalCourseDurationSeconds,
    };
  }
}
