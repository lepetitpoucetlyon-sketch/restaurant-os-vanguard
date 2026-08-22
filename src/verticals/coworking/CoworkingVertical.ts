import React from 'react';
import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import { logger } from '@/lib/logger';
import {
  CoworkingCommerceAdapter,
  CoworkingMccAdapter,
} from './adapters';

export class CoworkingVertical implements IVerticalPlugin {
  public readonly id = 'coworking';
  public readonly name = 'Coworking OS';
  public readonly version = '1.0.0';
  public readonly description = 'Bureaux flexibles, salles de réunion, forfaits heures, contrôle IoT, facturation récurrente';
  public readonly dependencies = ['finance', 'commerce', 'facility'];

  public async initialize(context: ICoreContext): Promise<void> {
    logger.info(`[${this.id}] Initialisation de la verticale coworking…`);

    context.registerRoute('/desks', React.lazy(() =>
      import('./facility/DeskMapPage').then(m => ({ default: m.DeskMapPage }))));
    context.registerRoute('/plans', React.lazy(() =>
      import('./commerce/PassPlansPage').then(m => ({ default: m.PassPlansPage }))));

    // Ops — Check-in de bureau
    context.registerEventHandler<{ tenantId: string; deskId: string; memberId: string; checkedInAt: string }>(
      'coworking.desk_checked_in',
      ({ tenantId, deskId, memberId, checkedInAt }) => {
        logger.info(`[Coworking] Check-in bureau ${deskId} par ${memberId} à ${checkedInAt}`);
        CoworkingMccAdapter.emitHealthPing({ tenantId, status: 'healthy', occupiedDesks: 1 });
      },
    );

    // Commerce — Réservation de salle de réunion
    context.registerEventHandler<{ tenantId: string; roomId: string; companyId: string; hours: number }>(
      'coworking.meeting_room_booked',
      ({ tenantId, roomId, companyId, hours }) => {
        logger.info(`[Coworking] Salle ${roomId} réservée par ${companyId} pour ${hours}h`);
        CoworkingCommerceAdapter.emitRFMTrigger({ tenantId, customerId: companyId });
      },
    );
  }
}
