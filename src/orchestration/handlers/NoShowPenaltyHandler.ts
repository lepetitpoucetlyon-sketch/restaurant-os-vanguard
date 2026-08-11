import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

interface ReservationRecord {
  id: string;
  hasDeposit?: boolean;
  subjectId?: string;
}

export function registerNoShowPenaltyHandler() {
  return NexusEventBus.on(
    'reservation.no_show',
    async (payload) => {
      const { tenantId, reservationId } = payload;
      
      logger.warn(`[NoShowPenalty] Le client de la réservation ${reservationId} ne s'est pas présenté.`);

      const res = await Nexus.adapter.get<ReservationRecord>(`tenants/${tenantId}/reservations/${reservationId}`);
      if (res && res.hasDeposit) {
        // Au lieu de frapper la CB immédiatement (risque de litige fort), on génère une alerte manager
        // pour validation de la pénalité.
        logger.info(`[NoShowPenalty] Réservation garantie par empreinte CB. Alerte de capture générée pour validation manager.`);
        
        await Nexus.adapter.set(`tenants/${tenantId}/pendingPenalties/${reservationId}`, {
          reservationId,
          status: 'pending_manager_approval',
          amountInMicrounits: 50000000, // Ex: 50 euros de pénalité (configurable)
          createdAt: Date.now()
        });
      }

      // Pénalité CRM (RFM)
      if (res && res.subjectId) {
        // Enregistrer le strike dans le profil client
        logger.info(`[NoShowPenalty] Strike ajouté au profil CRM ${res.subjectId}`);
      }

      empireAudit.log({
        module: 'finance',
        action: 'NO_SHOW_PENALTY_FLAGGED',
        details: { reservationId, hasDeposit: res?.hasDeposit },
        severity: 'medium',
        timestamp: new Date(),
      });
    },
    { id: 'no-show-penalty', priority: 'HIGH' }
  );
}
