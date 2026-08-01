import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerEndOfServiceActionHandler() {
  return NexusEventBus.on(
    'store.shift_ended',
    async (payload) => {
      const { tenantId, shiftId, endTime } = payload;
      
      logger.info(`[EndOfService] Fin de service détectée pour le shift ${shiftId} à ${endTime}`);
      
      empireAudit.log({
        module: 'ops',
        action: 'SHIFT_ENDED',
        details: { shiftId, endTime },
        severity: 'low',
        timestamp: new Date(),
      });
      
      // Suspendre les commandes externes si ce n'est pas déjà fait
      await NexusEventBus.emit('store.rush_mode_toggled', {
        v: 1,
        tenantId,
        isPaused: true,
        requestedBy: 'system',
      });
      
      // Générer le rapport de pertes (Waste) du service
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId,
        id: `waste-report-${shiftId}`,
        type: 'info',
        title: 'Action requise : Validation des pertes',
        message: 'Le service est terminé. Veuillez valider le pré-rapport des pertes.',
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString(),
      });
    },
    { id: 'end-of-service-action-handler', priority: 'BACKGROUND' }
  );
}
