import { z } from 'zod';

/**
 * TYPES DU REGISTRE NEXUS-SYNC
 */
export type SettingFieldType = 'string' | 'number' | 'boolean' | 'select' | 'color' | 'percentage' | 'list' | 'font' | 'textarea' | 'text';

export interface SettingField {
    key: string;
    type: SettingFieldType;
    label: string;
    required?: boolean;
    description?: string;
    options?: { label: string; value: any }[];
    subFields?: SettingField[];
    unit?: 'cents' | 'grams';
    validation?: z.ZodTypeAny;
}

export interface ModuleSchema {
    id: string;
    title: string;
    fields: SettingField[];
}

/**
 * SCHÉMAS DES MODULES
 */

export const IDENTITY_SCHEMA: ModuleSchema = {
    id: 'identity',
    title: 'Identité du Restaurant',
    fields: [
        { key: 'name', type: 'string', label: 'Nom du Restaurant', required: true, validation: z.string().min(2) },
        { key: 'slogan', type: 'string', label: 'Slogan', required: false },
        { key: 'cuisineType', type: 'string', label: 'Type de Cuisine' },
        { 
            key: 'category', 
            type: 'select', 
            label: 'Catégorie', 
            options: [
                { label: 'Bistrot', value: 'bistrot' },
                { label: 'Gastronomique', value: 'gastronomique' },
                { label: 'Brasserie', value: 'brasserie' },
                { label: 'Fast Casual', value: 'fast_casual' },
                { label: 'Café', value: 'cafe' },
                { label: 'Bar', value: 'bar' },
                { label: 'Autre', value: 'other' },
            ]
        },
        { key: 'shortDescription', type: 'textarea', label: 'Description Courte' },
        { key: 'logo', type: 'string', label: 'URL du Logo' },
    ]
};

export const CONTACT_SCHEMA: ModuleSchema = {
    id: 'contact',
    title: 'Contact & Localisation',
    fields: [
        { key: 'address', type: 'string', label: 'Adresse', required: true },
        { key: 'city', type: 'string', label: 'Ville', required: true },
        { key: 'postalCode', type: 'string', label: 'Code Postal', required: true },
        { key: 'phoneMain', type: 'string', label: 'Téléphone Principal', required: true },
        { key: 'emailGeneral', type: 'string', label: 'Email Général', required: true },
        { key: 'website', type: 'string', label: 'Site Web' },
    ]
};

export const SOCIAL_SCHEMA: ModuleSchema = {
    id: 'social',
    title: 'Réseaux Sociaux',
    fields: [
        { key: 'instagram', type: 'string', label: 'Instagram' },
        { key: 'facebook', type: 'string', label: 'Facebook' },
        { key: 'google', type: 'string', label: 'Google Business' },
        { key: 'tripadvisor', type: 'string', label: 'TripAdvisor' },
    ]
};

export const POS_SCHEMA: ModuleSchema = {
    id: 'pos',
    title: 'Configuration Caisse (POS)',
    fields: [
        { key: 'currency', type: 'select', label: 'Devise', options: [{label: 'Euro (€)', value: 'EUR'}, {label: 'Dollar ($)', value: 'USD'}], required: true },
        { key: 'priceFormat', type: 'select', label: 'Format de Prix', options: [{label: 'Avec centimes', value: 'with_cents'}, {label: 'Arrondi', value: 'rounded'}], required: true },
        { key: 'displayMode', type: 'select', label: 'Affichage Prix', options: [{label: 'HT', value: 'ht'}, {label: 'TTC', value: 'ttc'}], required: true },
        { key: 'isTrainingMode', type: 'boolean', label: 'Mode Entraînement active' },
        { key: 'autoPrintReceipt', type: 'boolean', label: 'Impression Auto Ticket' },
        { key: 'tipsEnabled', type: 'boolean', label: 'Activer les Pourboires' },
        { key: 'receiptCopies', type: 'number', label: 'Nombre de copies tickets', validation: z.number().min(0).max(5) },
    ]
};

export const ACCOUNTING_SCHEMA: ModuleSchema = {
    id: 'accounting',
    title: 'Comptabilité & Fiscalité',
    fields: [
        { key: 'fiscalYearStart', type: 'string', label: 'Début Exercice Fiscal' },
        { key: 'accountingMethod', type: 'select', label: 'Méthode', options: [{label: 'Engagement', value: 'accrual'}, {label: 'Trésorerie', value: 'cash'}] },
        { key: 'vatIdNumber', type: 'string', label: 'Numéro TVA Intracom.' },
    ]
};

export const HACCP_SCHEMA: ModuleSchema = {
    id: 'haccp',
    title: 'Hygiène & HACCP',
    fields: [
        { key: 'tempCheckFrequencyHours', type: 'number', label: 'Fréquence relevé T° (h)', required: true },
        { key: 'lotTrackingEnabled', type: 'boolean', label: 'Traçabilité des lots active' },
        { key: 'supplierTrackingEnabled', type: 'boolean', label: 'Suivi Fournisseurs auto' },
    ]
};

export const THEME_SCHEMA: ModuleSchema = {
    id: 'theme',
    title: 'Personnalisation UI',
    fields: [
        { key: 'primaryColor', type: 'color', label: 'Couleur Primaire' },
        { key: 'secondaryColor', type: 'color', label: 'Couleur Secondaire' },
        { key: 'mode', type: 'select', label: 'Mode d\'Apparence', options: [{label: 'Clair', value: 'light'}, {label: 'Sombre', value: 'dark'}] },
        { key: 'animationsEnabled', type: 'boolean', label: 'Animations Fluides' },
    ]
};

export const NOTIFICATIONS_SCHEMA: ModuleSchema = {
    id: 'notifications',
    title: 'Alertes & Notifications',
    fields: [
        { key: 'globalSound', type: 'boolean', label: 'Alertes Sonores' },
        { key: 'doNotDisturb', type: 'boolean', label: 'Mode Silencieux' },
    ]
};

export const SECURITY_SCHEMA: ModuleSchema = {
    id: 'security',
    title: 'Sécurité Nexus',
    fields: [
        { key: 'require2FA', type: 'boolean', label: 'Exiger la Double Auth' },
        { key: 'sessionTimeout', type: 'number', label: 'Timeout Session (min)' },
    ]
};

export const DELIVERY_SCHEMA: ModuleSchema = {
    id: 'clickCollect',
    title: 'Livraison & Click & Collect',
    fields: [
        { key: 'enabled', type: 'boolean', label: 'Activer le C&C' },
        { key: 'minPrepTime', type: 'number', label: 'Temps Prep. Min (min)' },
    ]
};

export const CRM_SCHEMA: ModuleSchema = {
    id: 'crm',
    title: 'Fidélisation Clients',
    fields: [
        { key: 'loyaltyEnabled', type: 'boolean', label: 'Programme Fidélité' },
        { key: 'pointsPerEuro', type: 'number', label: 'Points par €' },
    ]
};

export const LEGAL_SCHEMA: ModuleSchema = {
    id: 'legal',
    title: 'Informations Légales',
    fields: [
        { key: 'legalEntityName', type: 'string', label: 'Raison Sociale' },
        { key: 'siret', type: 'string', label: 'Numéro SIRET' },
        { key: 'registrationCity', type: 'string', label: 'Ville de Greffe' },
    ]
};

export const STAFF_CONFIG_SCHEMA: ModuleSchema = {
    id: 'staffConfig',
    title: 'Configuration RH',
    fields: [
        { key: 'maxHoursPerWeek', type: 'number', label: 'Heures Max / Semaine' },
        { key: 'autoScheduling', type: 'boolean', label: 'Planning Auto (IA)' },
    ]
};

export const RESERVATIONS_CONFIG_SCHEMA: ModuleSchema = {
    id: 'reservationSettings',
    title: 'Moteur de Réservations',
    fields: [
        { key: 'minAdvanceHours', type: 'number', label: 'Avance Min. (h)' },
        { key: 'autoConfirm', type: 'boolean', label: 'Confirmation Auto' },
    ]
};

export const INVENTORY_SCHEMA: ModuleSchema = {
    id: 'inventory',
    title: 'Inventaire & Stocks',
    fields: [
        { key: 'lowStockThreshold', type: 'number', label: 'Seuil Alerte Stock Bas', unit: 'grams' },
        { key: 'autoReorder', type: 'boolean', label: 'Réapprovisionnement Auto' },
        { 
            key: 'locations', 
            label: 'Zones de Stockage', 
            type: 'list', 
            subFields: [
                { key: 'name', type: 'string', label: 'Nom de la zone' },
                { key: 'type', type: 'select', label: 'Type', options: [{label: 'Froid', value: 'cold'}, {label: 'Sec', value: 'dry'}, {label: 'Liquide', value: 'liquid'}] }
            ]
        }
    ]
};

export const SETTINGS_REGISTRY: ModuleSchema[] = [
    IDENTITY_SCHEMA,
    CONTACT_SCHEMA,
    SOCIAL_SCHEMA,
    POS_SCHEMA,
    ACCOUNTING_SCHEMA,
    HACCP_SCHEMA,
    THEME_SCHEMA,
    NOTIFICATIONS_SCHEMA,
    SECURITY_SCHEMA,
    DELIVERY_SCHEMA,
    CRM_SCHEMA,
    LEGAL_SCHEMA,
    STAFF_CONFIG_SCHEMA,
    RESERVATIONS_CONFIG_SCHEMA,
    INVENTORY_SCHEMA
];
