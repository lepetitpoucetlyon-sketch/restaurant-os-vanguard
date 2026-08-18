import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import { logger } from '@/lib/logger';
import {
  GymOpsAdapter,
  GymCommerceAdapter,
  GymFinanceAdapter,
  GymFacilityAdapter,
  GymHumanAdapter,
  GymIntelligenceAdapter,
  GymLogisticsAdapter,
  GymComplianceAdapter,
  GymMccAdapter,
} from './adapters';

export class GymVertical implements IVerticalPlugin {
  public readonly id = 'gym';
  public readonly name = 'Fitness OS';
  public readonly version = '1.0.0';
  public readonly description = 'Membres, abonnements SEPA, tourniquets RFID, cours collectifs, caisse NF525';
  public readonly dependencies = ['finance', 'commerce', 'human', 'facility'];

  public async initialize(context: ICoreContext): Promise<void> {
    logger.info(`[${this.id}] Initialisation de la verticale salle de sport…`);

    // Ops — Scan de tourniquet
    context.registerEventHandler<{ tenantId: string; memberId: string; accessGranted: boolean; turnstileId: string }>(
      'gym.turnstile_scanned',
      ({ tenantId, memberId, accessGranted, turnstileId }) => {
        logger.info(`[Gym] Accès tourniquet ${turnstileId} : ${accessGranted ? 'AUTORISÉ' : 'REFUSÉ'} pour membre ${memberId}`);
        GymMccAdapter.emitHealthPing({ tenantId, status: 'healthy', turnstileEntries: 1 });
      },
    );

    // Commerce — Réservation de cours collectif
    context.registerEventHandler<{ tenantId: string; classId: string; memberId: string; slot: string }>(
      'gym.class_booked',
      ({ tenantId, classId, memberId, slot }) => {
        logger.info(`[Gym] Cours ${classId} réservé par membre ${memberId} sur le créneau ${slot}`);
        GymCommerceAdapter.emitRFMTrigger({ tenantId, customerId: memberId });
      },
    );
  }
}
