import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import React from 'react';
import { logger } from '@/lib/logger';

export class RestaurantVertical implements IVerticalPlugin {
  public readonly id = 'restaurant';
  public readonly name = 'Restaurant OS';
  public readonly version = '1.0.0';
  public readonly description = 'NF525, Menu Engineering, Tip Pooling, Perishables, Table Service';
  public readonly dependencies = ['finance', 'compliance', 'logistics'];

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
