import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

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
      
      // Suspendre les commandes externes
      await NexusEventBus.emit('store.rush_mode_toggled', {
        v: 1,
        tenantId,
        isPaused: true,
        requestedBy: 'system',
      });
      
      // Envoi alerte résumé de fin de service aux managers (P1-4.5)
      await NexusEventBus.emitDurable('notification.urgent', {
        v: 1,
        tenantId,
        message: `Fin de service (Shift ${shiftId}) : Bilan disponible. Penser à valider les pertes et le comptage de caisse.`,
        roles: ['manager', 'directeur'],
        priority: 'HIGH',
        metadata: { shiftId, endTime },
      });
    },
    { id: 'end-of-service-action-handler', priority: 'BACKGROUND' }
  );
}
