import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import React from 'react';
import { logger } from '@/lib/logger';
import { RestaurantMccAdapter } from './adapters';

export class RestaurantVertical implements IVerticalPlugin {
  public readonly id = 'restaurant';
  public readonly name = 'Restaurant OS';
  public readonly version = '1.0.0';
  public readonly description = 'NF525, Menu Engineering, Tip Pooling, Perishables, Table Service';
  public readonly dependencies = ['finance', 'compliance', 'logistics'];

  private tenantId = '';

  public async initialize(context: ICoreContext): Promise<void> {
    try {
      logger.info(`[${this.id}] Initialisation de la verticale restaurant...`);

      context.registerRoute(
        '/menu-engineering',
        React.lazy(() =>
          import('./presentation/MenuEngineeringDashboard').then(m => ({
            default: m.MenuEngineeringDashboard,
          })),
        ),
      );

      context.registerEventHandler<{ tenantId: string }>('tenant.ready', ({ tenantId }) => {
        this.tenantId = tenantId;
        RestaurantMccAdapter.emitHealthPing({
          tenantId,
          status: 'healthy',
          posOnline: true,
          kdsOnline: true,
          printerOnline: true,
        });
      });

      logger.info(`[${this.id}] Verticale restaurant démarrée.`);
    } catch (error) {
      logger.error(`[${this.id}] Échec de l'initialisation`, error);
      throw error;
    }
  }

  public async destroy(): Promise<void> {
    logger.info(`[${this.id}] Arrêt de la verticale restaurant.`);
  }
}
