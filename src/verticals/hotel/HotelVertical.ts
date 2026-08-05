import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import React from 'react';
import { logger } from '@/lib/logger';
import { HotelMccAdapter } from './adapters';

export class HotelVertical implements IVerticalPlugin {
  public readonly id = 'hotel';
  public readonly name = 'Hotel OS';
  public readonly version = '1.0.0';
  public readonly description = 'PMS, Housekeeping, Yield Management, City Ledger, Channel Manager';
  public readonly dependencies = ['finance', 'commerce', 'human', 'facility'];

  public async initialize(context: ICoreContext): Promise<void> {
    try {
      logger.info(`[${this.id}] Initialisation de la verticale hotel...`);

      context.registerRoute(
        '/pms',
        React.lazy(() =>
          import('./pms/components/PMSDashboard').then(m => ({ default: m.PMSDashboard })),
        ),
      );

      context.registerEventHandler<{ tenantId: string }>('tenant.ready', ({ tenantId }) => {
        HotelMccAdapter.emitHealthPing({ tenantId, status: 'healthy', pmsOnline: true, occupancy: 0 });
      });

      logger.info(`[${this.id}] Verticale hotel démarrée.`);
    } catch (error) {
      logger.error(`[${this.id}] Échec de l'initialisation`, error);
      throw error;
    }
  }

  public async destroy(): Promise<void> {
    logger.info(`[${this.id}] Arrêt de la verticale hotel.`);
  }
}
