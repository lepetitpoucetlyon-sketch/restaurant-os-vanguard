import React from 'react';

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
}

export interface ICoreContext {
    // Services exposés par le Core pour que la verticale s'y greffe (ex: NexusEventBus, store global)
    registerRoute(path: string, component: React.ComponentType<unknown>): void;
    registerStoreAtom<T>(key: string, atom: T): void;
    registerEventHandler<T = unknown>(event: string, handler: (payload: T) => void): void;
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
