import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export interface KDSPacingStatus {
  tenantId: string;
  averageDelayMinutes: number;
  isThrottled: boolean;
  maxOrdersPerWindow: number;
  throttleDurationSeconds: number;
}

/**
 * ⏱️ KDSPacingEngine (Item 2.1)
 * Moteur de régulation du rythme de commande (Flow Rate Pacing).
 * Bride l'acceptation automatique des commandes en ligne / bornes si le retard moyen KDS dépasse 20 minutes.
 */
export class KDSPacingEngine {
  static evaluatePacing(
    tenantId: string,
    averageKDSDelayMinutes: number
  ): KDSPacingStatus {
    const isOverheated = averageKDSDelayMinutes > 20;

    if (isOverheated) {
      logger.warn(`[KDSPacingEngine] Surchauffe cuisine détectée pour tenant ${tenantId} (${averageKDSDelayMinutes}min retard). Activation du bridage.`);

      empireAudit.log({
        module: 'ops',
        action: 'KDS_PACING_THROTTLE_ACTIVATED',
        details: { tenantId, averageKDSDelayMinutes, maxOrdersPerWindow: 5 },
        severity: 'high',
        timestamp: new Date(),
      });

      return {
        tenantId,
        averageDelayMinutes: averageKDSDelayMinutes,
        isThrottled: true,
        maxOrdersPerWindow: 5, // 5 commandes par tranche de 5 min
        throttleDurationSeconds: 600, // 10 minutes de bridage
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
