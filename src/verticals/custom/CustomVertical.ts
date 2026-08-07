import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import { customDefaultTokens, customVerticalTokens } from '@/shared/nexus/tokens/verticals/custom';
import { logger } from '@/lib/logger';
import { CustomMccAdapter, CustomOpsAdapter } from './adapters';

export class CustomVertical implements IVerticalPlugin {
  public readonly id = 'custom';
  public readonly name = 'Custom OS';
  public readonly version = '1.0.0';
  public readonly description = 'Vertical générique configurable — POS + health ping sans logique sectorielle';
  public readonly dependencies = ['finance'];
  public readonly defaultTheme = customDefaultTokens;
  public readonly verticalTokens = customVerticalTokens;

  public async initialize(context: ICoreContext): Promise<void> {
    logger.info(`[${this.id}] Initialisation verticale custom…`);

    // Ops minimal — sceau fiscal sur toute vente
    context.registerEventHandler<{ tenantId: string; orderId: string; totalInMicrounits: number; operatorId: string }>(
      'finance.order_sealed',
      (payload) => CustomOpsAdapter.emitSaleSealed(payload),
    );

    // MCC — health ping
    context.registerEventHandler<{ tenantId: string }>(
      'tenant.ready',
      ({ tenantId }) => CustomMccAdapter.emitHealthPing({ tenantId, status: 'healthy' }),
    );

    logger.info(`[${this.id}] Verticale custom active`);
  }

  public async destroy(): Promise<void> {
    logger.info(`[${this.id}] Arrêt de la verticale custom.`);
  }
}
