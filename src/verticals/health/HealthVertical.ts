import React from 'react';
import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import { logger } from '@/lib/logger';

export class HealthVertical implements IVerticalPlugin {
    public readonly id = 'health';
    public readonly name = 'Health OS';
    public readonly version = '1.0.0';
    public readonly description = 'Patient Management, Care Planning & Medical Compliance';
    public readonly dependencies = ['finance', 'crm'];

    public async initialize(context: ICoreContext): Promise<void> {
        try {
            logger.info(`[${this.id}] Initialisation de la verticale santé/clinique...`);
            
            // Enregistrement des routes de la verticale dans le routeur dynamique du Core
            context.registerRoute('/clinic', React.lazy(() => import('./ops/components/ClinicDashboard').then(m => ({ default: (m as Record<string, React.ComponentType<unknown>>).ClinicDashboard as React.ComponentType<unknown> }))));

            logger.info(`[${this.id}] Verticale santé démarrée avec succès.`);
        } catch (error) {
            logger.error(`[${this.id}] Échec de l'initialisation`, error);
            throw error;
        }
    }

    public async destroy(): Promise<void> {
        logger.info(`[${this.id}] Arrêt de la verticale santé...`);
    }
}
