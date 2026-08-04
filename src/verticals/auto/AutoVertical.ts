import React from 'react';
import { IVerticalPlugin, ICoreContext } from '@/domain/plugins/IVerticalPlugin';
import { logger } from '@/lib/logger';

export class AutoVertical implements IVerticalPlugin {
    public readonly id = 'auto';
    public readonly name = 'Auto OS';
    public readonly version = '1.0.0';
    public readonly description = 'Workshop Management, Vehicle Sales & Lead Management';
    public readonly dependencies = ['finance', 'inventory'];

    public async initialize(context: ICoreContext): Promise<void> {
        try {
            logger.info(`[${this.id}] Initialisation de la verticale automobile...`);
            
            // Enregistrement des routes de la verticale dans le routeur dynamique du Core
            context.registerRoute('/garage', React.lazy(() => import('./ops/components/GarageDashboard').then(m => ({ default: (m as Record<string, React.ComponentType<unknown>>).GarageDashboard as React.ComponentType<unknown> }))));

            logger.info(`[${this.id}] Verticale automobile démarrée avec succès.`);
        } catch (error) {
            logger.error(`[${this.id}] Échec de l'initialisation`, error);
            throw error;
        }
    }

    public async destroy(): Promise<void> {
        logger.info(`[${this.id}] Arrêt de la verticale automobile...`);
    }
}
