import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface StorePauseRequest {
  tenantId: string;
  adminId: string;
  platform: 'uber_eats' | 'deliveroo' | 'just_eat' | 'all';
  reason: 'kitchen_rush' | 'understaffed' | 'manual';
  pauseDurationMinutes: number; // ex: 30 min
}

export interface StorePauseStatus {
  isPaused: boolean;
  platform: string;
  pausedAt: number;
  autoResumeAt: number;
  reason: string;
}

/**
 * DeliveryStorePauseService — Angle mort F3.
 * Mise en pause d'urgence (1-clic ou automatique en cas de surcharge cuisine > 25 tickets en attente) des stores de livraison pour préserver le service sur place.
 */
export class DeliveryStorePauseService {
  static async pauseStore(req: StorePauseRequest): Promise<StorePauseStatus> {
    const pausedAt = Date.now();
    const autoResumeAt = pausedAt + (req.pauseDurationMinutes * 60 * 1000);

    NexusEventBus.emit('delivery.store_paused', {
      v: 1,
      tenantId: req.tenantId,
      platform: req.platform,
      reason: req.reason,
      autoResumeAt,
      pausedAt,
    });

    await AuditLogger.logAction({
      adminId: req.adminId,
      action: 'DELIVERY_STORE_PAUSED',
      targetId: `STORE-PAUSE-${req.tenantId}-${req.platform}`,
      ipAddress: '127.0.0.1',
      metadata: {
        platform: req.platform,
        reason: req.reason,
        pauseDurationMinutes: req.pauseDurationMinutes,
      },
    });

    return {
      isPaused: true,
      platform: req.platform,
      pausedAt,
      autoResumeAt,
      reason: req.reason,
    };
  }
}
