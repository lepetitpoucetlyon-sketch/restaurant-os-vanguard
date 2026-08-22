import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import { logger } from '@/lib/logger';
import {
  VeterinaryCommerceAdapter,
  VeterinaryMccAdapter,
} from './adapters';

export class VeterinaryVertical implements IVerticalPlugin {
  public readonly id = 'veterinary';
  public readonly name = 'Vet OS';
  public readonly version = '1.0.0';
  public readonly description = 'Dossiers animaux (ICAD/puce), ordonnances, vaccins, bloc chirurgie, caisse NF525';
  public readonly dependencies = ['finance', 'compliance', 'commerce'];

  public async initialize(context: ICoreContext): Promise<void> {
    logger.info(`[${this.id}] Initialisation de la verticale vétérinaire…`);

    // Ops — Consultation animal terminée
    context.registerEventHandler<{ tenantId: string; consultationId: string; animalId: string; vetId: string }>(
      'veterinary.pet_consultation_completed',
      ({ tenantId, consultationId, animalId, vetId }) => {
        logger.info(`[Vet] Consultation ${consultationId} terminée pour animal ${animalId} par Dr ${vetId}`);
        VeterinaryMccAdapter.emitHealthPing({ tenantId, status: 'healthy', activePatients: 1 });
      },
    );

    // Commerce — Rappel de vaccin envoyé
    context.registerEventHandler<{ tenantId: string; animalId: string; ownerId: string; vaccineName: string }>(
      'veterinary.vaccine_reminder_sent',
      ({ tenantId, animalId, ownerId, vaccineName }) => {
        logger.info(`[Vet] Rappel vaccin "${vaccineName}" envoyé au propriétaire ${ownerId} pour animal ${animalId}`);
        VeterinaryCommerceAdapter.emitRFMTrigger({ tenantId, customerId: ownerId });
      },
    );
  }
}
