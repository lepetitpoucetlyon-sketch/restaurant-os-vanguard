import type { ImportCategory, ParsedFile } from '../types';

export type ConnectorId =
    | 'zenchef'
    | 'thefork'
    | 'zelty'
    | 'laddition'
    | 'lightspeed'
    | 'tiller'
    | 'pennylane'
    | 'sage'
    | 'cashpad'
    | 'popina';

import type { ConnectorCredentials } from '@nexus/contracts';
export type { ConnectorCredentials } from '@nexus/contracts';

export interface ConnectorTestResult {
    ok: boolean;
    providerName?: string;
    error?: string;
    accountInfo?: Record<string, unknown>;
}

export interface ConnectorMeta {
    id: ConnectorId;
    displayName: string;
    logo: string;           // emoji ou URL
    authMethod: 'api_key' | 'oauth2' | 'basic';
    oauthUrl?: string;
    availableCategories: ImportCategory[];
    guideUrl?: string;      // Guide d'export manuel si pas d'API
    exportGuide?: string;   // Texte court pour l'UI
}

export interface ISourceConnector {
    readonly meta: ConnectorMeta;

    /** Vérifie que les credentials sont valides */
    testConnection(credentials: ConnectorCredentials): Promise<ConnectorTestResult>;

    /** Pull les données pour une catégorie. Retourne un ParsedFile compatible avec le pipeline d'import. */
    pull(
        category: ImportCategory,
        credentials: ConnectorCredentials,
    ): Promise<ParsedFile>;

    /** Catégories disponibles pour ce connecteur */
    availableCategories(): ImportCategory[];
}
