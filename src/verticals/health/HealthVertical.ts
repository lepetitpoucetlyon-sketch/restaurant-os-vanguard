import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import React from 'react';
import { logger } from '@/lib/logger';
import { HealthMccAdapter } from './adapters';

export class HealthVertical implements IVerticalPlugin {
  public readonly id = 'health';
  public readonly name = 'Health OS';
  public readonly version = '1.0.0';
  public readonly description = 'Patient Flow, Bed Management, HDS Compliance, Insurance Billing';
  public readonly dependencies = ['finance', 'compliance', 'human', 'facility'];

  public async initialize(context: ICoreContext): Promise<void> {
    try {
      logger.info(`[${this.id}] Initialisation de la verticale health...`);

      context.registerRoute(
        '/clinic',
        React.lazy(() =>
          import('./ops/components/ClinicDashboard').then(m => ({ default: m.ClinicDashboard })),
        ),
      );

      context.registerEventHandler<{ tenantId: string }>('tenant.ready', ({ tenantId }) => {
        HealthMccAdapter.emitHealthPing({ tenantId, status: 'healthy', hdsCompliant: true, bedsAvailable: 0 });
      });

      logger.info(`[${this.id}] Verticale health démarrée.`);
    } catch (error) {
      logger.error(`[${this.id}] Échec de l'initialisation`, error);
      throw error;
    }
  }

  public async destroy(): Promise<void> {
    logger.info(`[${this.id}] Arrêt de la verticale health.`);
  }
}
