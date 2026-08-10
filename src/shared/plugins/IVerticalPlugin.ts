import React from 'react';
import type { TenantRBACConfig } from '@nexus/contracts';
import type { BrandConfig } from '@/shared/nexus/tokens/brand';

export interface IVerticalPlugin {
    id: string;
    name: string;
    version: string;
    description: string;

    /**
     * Initialise la verticale (enregistrement des reducers, routes, hooks).
     * @param context Le contexte d'injection du Core.
     */
    initialize(context: ICoreContext): Promise<void>;

    /**
     * Nettoie les ressources lors du déchargement.
     */
    destroy?(): Promise<void>;

    // Optionnel: Déclarations des routes spécifiques à la verticale
    routes?: VerticalRoute[];

    // Optionnel: Déclarations des dépendances
    dependencies?: string[];

    /** Tokens de marque par défaut pour ce variant (mode "default" et base du mode "custom"). */
    defaultTheme?: Partial<BrandConfig>;

    /** CSS vars métier propres à ce vertical (tableAvailable, appointmentBooked…). Injectés sur :root en plus des tokens brand. */
    verticalTokens?: Record<string, string>;
}

import type { NexusEventName, NexusEventPayload } from '@/shared/eventBus/NexusEventBus';

export interface ICoreContext {
    // Services exposés par le Core pour que la verticale s'y greffe (ex: NexusEventBus, store global)
    registerRoute(path: string, component: React.ComponentType<unknown>): void;
    registerStoreAtom<T>(key: string, atom: T): void;
    registerEventHandler<E extends NexusEventName>(event: E, handler: (payload: NexusEventPayload<E>) => void | Promise<void>): void;
    registerEventHandler<T = unknown>(event: string, handler: (payload: T) => void | Promise<void>): void;
    registerRbacConfig(config: TenantRBACConfig): void;
    getRegisteredRoutes(): string[];
    getRegisteredAtoms(): string[];
}

export interface VerticalRoute {
    path: string;
    label: string;
    icon?: string;
    roles?: string[];
    componentLoader: () => Promise<{ default: React.ComponentType<unknown> }>;
}
