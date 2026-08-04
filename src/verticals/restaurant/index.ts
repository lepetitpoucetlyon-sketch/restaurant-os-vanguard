import React from 'react';
import type { IVerticalPlugin, ICoreContext } from '@/domain/plugins/IVerticalPlugin';

/**
 * Point d'entrée de la verticale Restaurant.
 * Cette classe implémente le contrat attendu par le VerticalRegistry du Core.
 */
export class RestaurantVertical implements IVerticalPlugin {
    public readonly id = 'vertical.restaurant';
    public readonly name = 'Restaurant OS';
    public readonly version = '1.0.0';
    public readonly description = 'Verticale principale pour la restauration (HACCP, POS, KDS, Stock, etc.)';

    public async initialize(context: ICoreContext): Promise<void> {
        // Enregistrement des routes de la verticale dans le routeur dynamique du Core
        context.registerRoute('/haccp', React.lazy(() => import('./compliance/haccp/components').then(m => ({ default: (m as Record<string, React.ComponentType<unknown>>).HACCPDashboard as React.ComponentType<unknown> }))));
        context.registerRoute('/kitchen', React.lazy(() => import('./ops/kitchen/components/KitchenDashboard').then(m => ({ default: (m as Record<string, React.ComponentType<unknown>>).KitchenDashboard as React.ComponentType<unknown> }))));
        context.registerRoute('/kds', React.lazy(() => import('./ops/kds/components/KDSDashboard').then(m => ({ default: (m as Record<string, React.ComponentType<unknown>>).KDSDashboard as React.ComponentType<unknown> }))));
        
        // Câblage des événements métiers
        context.registerEventHandler('TABLE_CLICKED', (payload: unknown) => {
            // Afficher le PaymentDialog de la verticale Restaurant quand une table est cliquée dans le FloorPlanEditor
            // La logique complète sera implémentée lors du découplage final.
            console.log('[RestaurantVertical] Event TABLE_CLICKED intercepté pour la table:', (payload as { tableId: string })?.tableId);
        });

        // Enregistrement de l'état (Atoms Jotai) dans le contexte global
        // context.registerStoreAtom('haccpLogs', ...);
    }
}

// Export par défaut pour l'import dynamique
// eslint-disable-next-line import/no-anonymous-default-export
export default new RestaurantVertical();
