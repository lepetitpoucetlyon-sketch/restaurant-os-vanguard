import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

/**
 * P2-3: Inflation Shield - MarginWarningHandler
 * Intercepte les alertes de marge et persiste dans Nexus
 * pour affichage dans le MarginAlertPanel du MCC.
 */
export function registerMarginWarningHandler(): () => void {
  return NexusEventBus.on(
    'commerce.margin_warning',
    async (payload) => {
      const { tenantId, productId, currentMarginBps, thresholdBps, triggerEventId } = payload;
      
      try {
        const id = crypto.randomUUID();
        const now = Date.now();
        
        await Nexus.adapter.set(`tenants/${tenantId}/marginAlerts/${id}`, {
          id,
          productId,
          currentMarginBps,
          thresholdBps,
          triggerEventId,
          status: 'open',
          createdAt: new Date(now).toISOString()
        });

        logger.warn(`[MarginWarning] Alerte enregistrée pour ${productId} (Marge: ${currentMarginBps} bps)`);

        empireAudit.log({
          module: 'finance',
          action: 'MARGIN_ALERT_TRIGGERED',
          details: { productId, currentMarginBps, thresholdBps, triggerEventId },
          severity: 'high',
          timestamp: new Date(now),
        });

        // Notification WebPush optionnelle pour les admins finance
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('⚠️ ALERTE INFLATION SHIELD', {
                body: `Marge dégradée détectée (${(currentMarginBps/100).toFixed(2)}%) suite à la dernière facture.`,
              });
            }
        }
      } catch (e) {
          logger.error('[MarginWarning] Erreur de persistance alerte', e);
          throw e; // Reprise par la DLQ
      }
    },
    { id: 'margin-warning-handler', priority: 'HIGH' }
  );
}
