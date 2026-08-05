import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

/**
 * P3-2: Rain Staffing Handler
 * Intercepte les hr.transfer_offer émis par l'IA Météo ou LiquidStaffingEngine
 * et notifie les employés disponibles en urgence.
 */
export function registerRainStaffingHandler(): () => void {
  return NexusEventBus.on(
    'hr.transfer_offer',
    async (payload) => {
      const { fromTenantId, toTenantId, headcount, bonusInMicrounits, ownerId } = payload;
      
      try {
        logger.info(`[RainStaffingHandler] Appel RH d'urgence reçu : Besoin de ${headcount} personnes à ${toTenantId} (Prime: ${bonusInMicrounits/1000000}€)`);

        empireAudit.log({
          module: 'human',
          action: 'EMERGENCY_STAFFING_CALL',
          details: { fromTenantId, toTenantId, headcount, bonusInMicrounits },
          severity: 'high',
          timestamp: new Date(),
        });

        // 2. Notification WebPush aux candidats
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('🚨 STAFFING D\'URGENCE', {
              body: `Renfort demandé (${headcount} pers.) ! Prime de ${bonusInMicrounits/1000000}€ proposée.`,
              requireInteraction: true,
              actions: [
                { action: 'accept', title: 'Accepter le shift' },
                { action: 'decline', title: 'Ignorer' }
              ]
            } as never);
          }
        }
      } catch (e) {
        logger.error('[RainStaffingHandler] Échec du traitement RH', e);
        throw e;
      }
    },
    { id: 'rain-staffing-handler', priority: 'HIGH' }
  );
}
