import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import React from 'react';
import { logger } from '@/lib/logger';
import { AutoMccAdapter } from './adapters';

export class AutoVertical implements IVerticalPlugin {
  public readonly id = 'auto';
  public readonly name = 'Auto OS';
  public readonly version = '1.0.0';
  public readonly description = 'Diagnostic Intake, Workshop Scheduling, Parts Inventory, Warranty Claims';
  public readonly dependencies = ['finance', 'logistics', 'commerce'];

  public async initialize(context: ICoreContext): Promise<void> {
    try {
      logger.info(`[${this.id}] Initialisation de la verticale auto...`);

      context.registerRoute(
        '/garage',
        React.lazy(() =>
          import('./ops/components/GarageDashboard').then(m => ({ default: m.GarageDashboard })),
        ),
      );

      context.registerEventHandler<{ tenantId: string }>('tenant.ready', ({ tenantId }) => {
        AutoMccAdapter.emitHealthPing({ tenantId, status: 'healthy', liftsOperational: 0, activeWorkOrders: 0 });
      });

      logger.info(`[${this.id}] Verticale auto démarrée.`);
    } catch (error) {
      logger.error(`[${this.id}] Échec de l'initialisation`, error);
      throw error;
    }
  }

  public async destroy(): Promise<void> {
    logger.info(`[${this.id}] Arrêt de la verticale auto.`);
  }
}
