import { IVerticalPlugin, ICoreContext } from '@/domain/plugins/IVerticalPlugin';
import { logger } from '@/lib/logger';
import React from 'react';

export class HotelVertical implements IVerticalPlugin {
    public readonly id = 'hotel';
    public readonly name = 'Hotel OS';
    public readonly version = '1.0.0';
    public readonly description = 'Property Management System, Housekeeping & Booking Engine';
    public readonly dependencies = ['finance', 'crm'];

    public async initialize(context: ICoreContext): Promise<void> {
        try {
            logger.info(`[${this.id}] Initialisation de la verticale hôtelière...`);
            
            // Enregistrement des routes de la verticale dans le routeur dynamique du Core
            context.registerRoute('/pms', React.lazy(() => import('./pms/components/PMSDashboard').then(m => ({ default: (m as Record<string, React.ComponentType<unknown>>).PMSDashboard as React.ComponentType<unknown> }))));

            logger.info(`[${this.id}] Verticale hôtelière démarrée avec succès.`);
        } catch (error) {
            logger.error(`[${this.id}] Échec de l'initialisation`, error);
            throw error;
        }
    }

    public async destroy(): Promise<void> {
        logger.info(`[${this.id}] Arrêt de la verticale hôtelière...`);
    }
}
