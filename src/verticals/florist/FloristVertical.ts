import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import { logger } from '@/lib/logger';
import {
  FloristOpsAdapter,
  FloristCommerceAdapter,
  FloristFinanceAdapter,
  FloristFacilityAdapter,
  FloristHumanAdapter,
  FloristIntelligenceAdapter,
  FloristLogisticsAdapter,
  FloristComplianceAdapter,
  FloristMccAdapter,
} from './adapters';

export class FloristVertical implements IVerticalPlugin {
  public readonly id = 'florist';
  public readonly name = 'Florist OS';
  public readonly version = '1.0.0';
  public readonly description = 'Compositions florales, arrivages périssables, abonnements, tournées livraisons, caisse NF525';
  public readonly dependencies = ['finance', 'commerce', 'logistics'];

  public async initialize(context: ICoreContext): Promise<void> {
    logger.info(`[${this.id}] Initialisation de la verticale fleuriste…`);

    // Ops — Composition florale créée
    context.registerEventHandler<{ tenantId: string; arrangementId: string; recipeId: string; floristId: string }>(
      'florist.arrangement_created',
      ({ tenantId, arrangementId, recipeId, floristId }) => {
        logger.info(`[Florist] Composition ${arrangementId} (recette ${recipeId}) assemblée par ${floristId}`);
        FloristMccAdapter.emitHealthPing({ tenantId, status: 'healthy', freshStemsInStock: 50 });
      },
    );

    // Logistics — Livraison tournée expédiée
    context.registerEventHandler<{ tenantId: string; deliveryId: string; recipientAddress: string }>(
      'florist.delivery_dispatched',
      ({ tenantId, deliveryId, recipientAddress }) => {
        logger.info(`[Florist] Livraison ${deliveryId} expédiée vers ${recipientAddress}`);
        FloristMccAdapter.emitHealthPing({ tenantId, status: 'healthy', deliveriesToday: 1 });
      },
    );
  }
}
