/**
 * PROVIDER_CATALOG — source de vérité client/server pour l'UI plug-and-play.
 * Aucun import serveur : ce fichier est safe dans le bundle client.
 *
 * Pour ajouter un prestataire :
 *   1. Ajouter une entrée ici avec ses champs (ou type 'oauth')
 *   2. Créer le ConnectorProvider correspondant
 *   3. L'enregistrer dans PayrollConnectorFactory.PROVIDER_REGISTRY
 */

export interface ProviderFieldDef {
    key: string;
    label: string;
    type: 'text' | 'password';
    placeholder?: string;
    optional?: boolean;
}

export interface ProviderCatalogEntry {
    label: string;
    description: string;
    badge?: string;
    authType: 'fields' | 'oauth';
    /** Pour authType='fields' : liste des champs à afficher */
    fields?: ProviderFieldDef[];
    /** Pour authType='oauth' : route de génération du link_token */
    oauthLinkRoute?: string;
    /** Pour authType='oauth' : route d'échange du public_token */
    oauthExchangeRoute?: string;
}

export const PROVIDER_CATALOG: Record<string, ProviderCatalogEntry> = {
    silae: {
        label: 'Silae',
        description: 'API directe — IDCC 1997 HCR inclus. ~3–15€/bulletin/mois.',
        badge: 'API directe',
        authType: 'fields',
        fields: [
            { key: 'silaeApiKey',    label: 'Clé API',     type: 'password', placeholder: 'sk-silae-...' },
            { key: 'silaeDossierId', label: 'N° Dossier',  type: 'text',     placeholder: '12345' },
            { key: 'silaeBaseUrl',   label: 'URL base',    type: 'text',     placeholder: 'https://api.silae.fr (défaut)', optional: true },
        ],
    },
    merge: {
        label: 'Merge.dev',
        description: 'PayFit, BambooHR, ADP, Personio, Factorial, Lucca… via un seul connecteur.',
        badge: 'Multi-prestataire',
        authType: 'oauth',
        oauthLinkRoute:     '/api/admin/hr/payroll/merge/link-token',
        oauthExchangeRoute: '/api/admin/hr/payroll/merge/exchange',
    },
    // payfit: {
    //     label: 'PayFit',
    //     description: 'Connexion directe PayFit API v2.',
    //     badge: 'API directe',
    //     authType: 'fields',
    //     fields: [
    //         { key: 'payfitApiKey', label: 'Clé API', type: 'password', placeholder: 'pf_live_...' },
    //         { key: 'payfitCompanyId', label: 'Company ID', type: 'text', placeholder: 'comp_...' },
    //     ],
    // },
};
