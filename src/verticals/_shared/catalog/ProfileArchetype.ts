/**
 * 🧭 ProfileArchetype — Les 8 profils métiers archétypaux (taxonomie Vertical Forge)
 *
 * Chaque nouvelle verticale appartient à UN profil archétypal qui détermine :
 *  - le gating culinaire (usesCulinaryStock → HACCP / KDS / cuisine),
 *  - un socle de capabilities par défaut (piochées dans le CapabilityCatalog),
 *  - les spécificités réglementaires et matérielles majeures.
 *
 * Un VerticalBlueprint référence un `ProfileId`, hérite de son socle, puis applique
 * ses propres deltas. Module FEUILLE (n'importe que le catalogue).
 */

import {
    type CapabilityKey,
    resolveCapabilityDependencies,
} from './CapabilityCatalog';

export type ProfileId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export interface ProfileArchetype {
    readonly id: ProfileId;
    /** Slug lisible du profil. */
    readonly code: string;
    readonly label: string;
    /** Exemples de métiers rattachés. */
    readonly examples: readonly string[];
    /** Gating culinaire — pilote HACCP/KDS/cuisine/DLC. */
    readonly usesCulinaryStock: boolean;
    /** Capabilities ajoutées au socle universel pour ce profil. */
    readonly capabilities: readonly CapabilityKey[];
    /** Spécificités & handlers majeurs (documentaire, guide l'étude de secteur). */
    readonly specifics: readonly string[];
    /** Indices d'addenda légaux (alignés LegalContractGenerator.VerticalType). */
    readonly legalAddenda?: readonly string[];
}

/**
 * Socle UNIVERSEL présent dans toute verticale commerciale :
 * caisse NF525, clients, finance, RGPD, RH de base, analytics, branding, onboarding.
 */
export const UNIVERSAL_BASELINE: readonly CapabilityKey[] = [
    'mod_dashboard',
    'mod_settings',
    'mod_access_management',
    'mod_brand_basic',
    'mod_pos',
    'mod_customer',
    'mod_treasury',
    'mod_accounting_management',
    'mod_rgpd',
    'mod_analytics',
    'mod_hr',
    'mod_planning',
    'mod_onboarding',
];

export const PROFILE_ARCHETYPES: Record<ProfileId, ProfileArchetype> = {
    A: {
        id: 'A',
        code: 'food_perishable',
        label: 'Food & Périssable',
        examples: ['Restaurant', 'Boulangerie', 'Pâtisserie', 'Traiteur', 'Boucherie', 'Brasserie'],
        usesCulinaryStock: true,
        capabilities: ['mod_kds', 'mod_kitchen_management', 'mod_haccp', 'mod_hygiene', 'mod_quality_control', 'mod_inventory', 'mod_storage_map', 'mod_floor_plan', 'mod_reservations', 'mod_marketing'],
        specifics: ['Relevés HACCP & DLC/DLUO', 'Allergènes INCO', 'KDS cuisine', 'Fiches techniques'],
        legalAddenda: ['BAKERY', 'RESTAURANT'],
    },
    B: {
        id: 'B',
        code: 'appointment_space',
        label: 'Rendez-vous & Espace',
        examples: ['Coiffure', 'Institut de beauté', 'Spa', 'Barbier', 'Tatoueur'],
        usesCulinaryStock: false,
        capabilities: ['mod_reservations', 'mod_crm', 'mod_quotes', 'mod_inventory', 'mod_storage_map', 'mod_marketing', 'mod_social_marketing', 'mod_leaves'],
        specifics: ['Agenda collaborateur/fauteuil', 'Temps de pose', 'Stock revente vs cabine', 'RGPD Art. 9 (données santé/peau)'],
        legalAddenda: ['SALON'],
    },
    C: {
        id: 'C',
        code: 'workshop_technical',
        label: 'Atelier & Technique',
        examples: ['Garage', 'Carrosserie', 'Cycles', 'Réparation smartphone'],
        usesCulinaryStock: false,
        capabilities: ['mod_reservations', 'mod_quotes', 'mod_inventory', 'mod_storage_map', 'mod_crm', 'mod_registre'],
        specifics: ['SIV / IMEI', 'Ordre de Réparation (OR)', 'Pièces TecDoc / PIEC', 'BSDD'],
        legalAddenda: ['GARAGE'],
    },
    D: {
        id: 'D',
        code: 'retail_variants',
        label: 'Retail & Variantes',
        examples: ['Prêt-à-porter', 'Épicerie fine', 'Fleuriste', 'Animalerie'],
        usesCulinaryStock: false,
        capabilities: ['mod_inventory', 'mod_storage_map', 'mod_omnichannel', 'mod_crm', 'mod_marketing', 'mod_social_marketing', 'mod_seo', 'mod_kiosk'],
        specifics: ['Variantes (taille/couleur)', 'Scan douchette 2D', 'Sync e-commerce 2-ways', 'Garanties légales'],
        legalAddenda: ['RETAIL', 'FLORIST'],
    },
    E: {
        id: 'E',
        code: 'hospitality_pms',
        label: 'Hébergement (PMS)',
        examples: ['Hôtel', 'Camping', 'Résidence hôtelière', 'Gîtes'],
        usesCulinaryStock: false,
        capabilities: ['mod_pms', 'mod_reservations', 'mod_groups', 'mod_floor_plan', 'mod_crm', 'mod_marketing', 'mod_inventory'],
        specifics: ['Planning chambres', 'Channel Manager (Booking/Expedia)', 'Caution & taxe de séjour', 'Fiche de police CESEDA'],
        legalAddenda: ['HOTEL'],
    },
    F: {
        id: 'F',
        code: 'health_care',
        label: 'Santé & Soins',
        examples: ['Cabinet médical', 'Dentiste', 'Vétérinaire', 'Opticien'],
        usesCulinaryStock: false,
        capabilities: ['mod_reservations', 'mod_crm', 'mod_quotes', 'mod_inventory'],
        specifics: ['Dossier patient chiffré AES-256-GCM', 'Actes CCAM', 'Tiers-Payant / SESAM-Vitale', 'Périmètre pré-agrément HDS'],
        legalAddenda: ['CLINIC'],
    },
    G: {
        id: 'G',
        code: 'access_subscription',
        label: 'Accès & Abonnements',
        examples: ['Salle de sport', 'Coworking', 'Parc de loisirs'],
        usesCulinaryStock: false,
        capabilities: ['mod_reservations', 'mod_crm', 'mod_inventory', 'mod_marketing', 'mod_social_marketing'],
        specifics: ['Prélèvements SEPA récurrents', 'Contrôle d\'accès (tourniquets/badges RFID)', 'Jauge temps réel'],
        legalAddenda: ['FITNESS', 'COWORKING'],
    },
    H: {
        id: 'H',
        code: 'hybrid_concept',
        label: 'Concept Store Hybride',
        examples: ['Café-Boutique', 'Salon de thé-Librairie'],
        usesCulinaryStock: true,
        capabilities: ['mod_kds', 'mod_kitchen_management', 'mod_haccp', 'mod_inventory', 'mod_storage_map', 'mod_omnichannel', 'mod_crm', 'mod_reservations', 'mod_marketing'],
        specifics: ['Combinaison modulaire via Switchboard MCC', 'Double flux caisse (food + retail)'],
        legalAddenda: ['GENERIC'],
    },
};

/** Tous les profils, dans l'ordre A→H. */
export const PROFILE_IDS = Object.keys(PROFILE_ARCHETYPES) as ProfileId[];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getProfile(id: ProfileId): ProfileArchetype {
    return PROFILE_ARCHETYPES[id];
}

/**
 * Capabilities effectives d'un profil = socle universel + additions du profil,
 * étendues par leurs dépendances transitives (dédupliquées).
 */
export function profileCapabilities(id: ProfileId): CapabilityKey[] {
    const profile = getProfile(id);
    return resolveCapabilityDependencies([...UNIVERSAL_BASELINE, ...profile.capabilities]);
}
