import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';

export interface SpoutTelemetryEvent {
  tenantId: string;
  spoutId: string;
  productId: string;
  productName: string;
  dispensedCl: number;
  billedCl: number;
  tolerancePct?: number; // Tolérance acceptable (défaut 5%)
}

export interface SpoutVarianceResult {
  spoutId: string;
  productId: string;
  dispensedCl: number;
  billedCl: number;
  varianceCl: number;
  variancePct: number;
  isOverPouring: boolean;
  isFreePourSuspected: boolean; // Doses coulées sans commande caisse
  recordedAt: number;
}

/**
 * SmartSpoutTelemetryService — Angle mort L18.
 * Rapprochement télémétrique en direct entre doses mesurées par les becs verseurs connectés et tickets caisse.
 */
export class SmartSpoutTelemetryService {
  static async analyzeSpoutActivity(event: SpoutTelemetryEvent): Promise<SpoutVarianceResult> {
    const tolerance = event.tolerancePct ?? 5.0;
    const varianceCl = Math.round((event.dispensedCl - event.billedCl) * 10) / 10;
    const variancePct = event.billedCl > 0 ? Math.round((varianceCl / event.billedCl) * 1000) / 10 : 100;

    const isOverPouring = variancePct > tolerance;
    const isFreePourSuspected = event.billedCl === 0 && event.dispensedCl > 0;

    if (isOverPouring || isFreePourSuspected) {
      NexusEventBus.emit('bar.spout_variance_detected', {
        v: 1,
        tenantId: event.tenantId,
        spoutId: event.spoutId,
        productId: event.productId,
        dispensedCl: event.dispensedCl,
        billedCl: event.billedCl,
        varianceCl,
        detectedAt: Date.now(),
      });

      if (varianceCl >= 10) { // > 10cl d'écart
        await AuditLogger.logAction({
          adminId: 'SYSTEM_SPOUT',
          action: 'BAR_SPOUT_DISCREPANCY',
          targetId: event.spoutId,
          ipAddress: '127.0.0.1',
          metadata: {
            productId: event.productId,
            dispensedCl: event.dispensedCl,
            billedCl: event.billedCl,
            varianceCl,
            isFreePourSuspected,
          },
        });
      }
    }

    return {
      spoutId: event.spoutId,
      productId: event.productId,
      dispensedCl: event.dispensedCl,
      billedCl: event.billedCl,
      varianceCl,
      variancePct,
      isOverPouring,
      isFreePourSuspected,
      recordedAt: Date.now(),
    };
  }
}
