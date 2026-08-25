import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { getSetting } from '@/lib/settings/SettingsReader';

export interface KDSPacingStatus {
  tenantId: string;
  averageDelayMinutes: number;
  isThrottled: boolean;
  maxOrdersPerWindow: number;
  throttleDurationSeconds: number;
}

/**
 * ⏱️ KDSPacingEngine (Item 2.1 — DF-B1 / DF-B2)
 * Moteur de régulation du rythme de commande (Flow Rate Pacing).
 * Bride l'acceptation automatique des commandes en ligne / bornes si le retard moyen KDS dépasse le seuil configuré.
 */
export class KDSPacingEngine {
  static evaluatePacing(
    tenantId: string,
    averageKDSDelayMinutes: number
  ): KDSPacingStatus {
    const throttleEnabled = getSetting<boolean>('kds', 'throttle_enabled', true);
    const overheatThresholdMin = getSetting<number>('kds', 'overheat_threshold_min', 20);
    const maxOrders = getSetting<number>('kds', 'throttle_max_orders', 5);
    const durationSec = getSetting<number>('kds', 'throttle_duration_sec', 600);

    const isOverheated = throttleEnabled && averageKDSDelayMinutes > overheatThresholdMin;

    if (isOverheated) {
      logger.warn(`[KDSPacingEngine] Surchauffe cuisine détectée pour tenant ${tenantId} (${averageKDSDelayMinutes}min retard vs seuil ${overheatThresholdMin}min). Activation du bridage.`);

      empireAudit.log({
        module: 'ops',
        action: 'KDS_PACING_THROTTLE_ACTIVATED',
        details: { tenantId, averageKDSDelayMinutes, maxOrdersPerWindow: maxOrders },
        severity: 'high',
        timestamp: new Date(),
      });

      return {
        tenantId,
        averageDelayMinutes: averageKDSDelayMinutes,
        isThrottled: true,
        maxOrdersPerWindow: maxOrders,
        throttleDurationSeconds: durationSec,
      };
    }

    return {
      tenantId,
      averageDelayMinutes: averageKDSDelayMinutes,
      isThrottled: false,
      maxOrdersPerWindow: 50,
      throttleDurationSeconds: 0,
    };
  }
}
