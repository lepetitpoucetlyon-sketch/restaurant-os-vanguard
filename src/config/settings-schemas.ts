import { z } from 'zod';
import { SovereignValue } from '@nexus/contracts/nexus-contract';
import { GlobalSettings } from '@nexus/contracts/settings';


/**
 * TYPES DU REGISTRE NEXUS-SYNC
 */
export type SettingFieldType = 'string' | 'number' | 'boolean' | 'select' | 'color' | 'percentage' | 'list' | 'textarea' | 'text';

export interface SettingField {
    id: string;
    key: string;
    type: SettingFieldType;
    label: string;
    required?: boolean;
    description?: string;
    options?: { label: string; value: SovereignValue }[];

    subFields?: SettingField[];
    unit?: 'cents' | 'grams';
    validation?: z.ZodTypeAny;
}

export interface ModuleSchema {
    id: keyof GlobalSettings;
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
        { id: 'name', key: 'name', type: 'string', label: 'Nom du Restaurant', required: true, validation: z.string().min(2) },
        { id: 'slogan', key: 'slogan', type: 'string', label: 'Slogan', required: false },
        { id: 'businessType', key: 'businessType', type: 'string', label: 'Type d\'activité' },
        { id: 'category', key: 'category', type: 'string', label: 'Catégorie' },
        { id: 'shortDescription', key: 'shortDescription', type: 'textarea', label: 'Description Courte' },
        { id: 'logo', key: 'logo', type: 'string', label: 'URL du Logo' },
    ]
};

export const CONTACT_SCHEMA: ModuleSchema = {
    id: 'contact',
    title: 'Contact & Localisation',
    fields: [
        { id: 'address', key: 'address', type: 'string', label: 'Adresse', required: true },
        { id: 'city', key: 'city', type: 'string', label: 'Ville', required: true },
        { id: 'postalCode', key: 'postalCode', type: 'string', label: 'Code Postal', required: true },
        { id: 'phoneMain', key: 'phoneMain', type: 'string', label: 'Téléphone Principal', required: true },
        { id: 'emailGeneral', key: 'emailGeneral', type: 'string', label: 'Email Général', required: true },
        { id: 'website', key: 'website', type: 'string', label: 'Site Web' },
    ]
};

export const SOCIAL_SCHEMA: ModuleSchema = {
    id: 'social',
    title: 'Réseaux Sociaux',
    fields: [
        { id: 'instagram', key: 'instagram', type: 'string', label: 'Instagram' },
        { id: 'facebook', key: 'facebook', type: 'string', label: 'Facebook' },
        { id: 'google', key: 'google', type: 'string', label: 'Google Business' },
        { id: 'tripadvisor', key: 'tripadvisor', type: 'string', label: 'TripAdvisor' },
    ]
};

export const POS_SCHEMA: ModuleSchema = {
    id: 'pos',
    title: 'Configuration Caisse (POS)',
    fields: [
        { id: 'currency', key: 'currency', type: 'select', label: 'Devise', options: [{label: 'Euro (€)', value: 'EUR'}, {label: 'Dollar ($)', value: 'USD'}], required: true },
        { id: 'priceFormat', key: 'priceFormat', type: 'select', label: 'Format de Prix', options: [{label: 'Avec centimes', value: 'with_cents'}, {label: 'Arrondi', value: 'rounded'}], required: true },
        { id: 'displayMode', key: 'displayMode', type: 'select', label: 'Affichage Prix', options: [{label: 'HT', value: 'ht'}, {label: 'TTC', value: 'ttc'}], required: true },
        { id: 'isTrainingMode', key: 'isTrainingMode', type: 'boolean', label: 'Mode Entraînement active' },
        { id: 'autoPrintReceipt', key: 'autoPrintReceipt', type: 'boolean', label: 'Impression Auto Ticket' },
        { id: 'tipsEnabled', key: 'tipsEnabled', type: 'boolean', label: 'Activer les Pourboires' },
        { id: 'receiptCopies', key: 'receiptCopies', type: 'number', label: 'Nombre de copies tickets', validation: z.number().min(0).max(5) },
    ]
};

export const ACCOUNTING_SCHEMA: ModuleSchema = {
    id: 'accounting',
    title: 'Comptabilité & Fiscalité',
    fields: [
        { id: 'fiscalYearStart', key: 'fiscalYearStart', type: 'string', label: 'Début Exercice Fiscal' },
        { id: 'accountingMethod', key: 'accountingMethod', type: 'select', label: 'Méthode', options: [{label: 'Engagement', value: 'accrual'}, {label: 'Trésorerie', value: 'cash'}] },
        { id: 'vatIdNumber', key: 'vatIdNumber', type: 'string', label: 'Numéro TVA Intracom.' },
    ]
};

export const HACCP_SCHEMA: ModuleSchema = {
    id: 'haccp',
    title: 'Hygiène & HACCP',
    fields: [
        { id: 'tempCheckFrequencyHours', key: 'tempCheckFrequencyHours', type: 'number', label: 'Fréquence relevé T° (h)', required: true },
        { id: 'lotTrackingEnabled', key: 'lotTrackingEnabled', type: 'boolean', label: 'Traçabilité des lots active' },
        { id: 'supplierTrackingEnabled', key: 'supplierTrackingEnabled', type: 'boolean', label: 'Suivi Fournisseurs auto' },
    ]
};

export const THEME_SCHEMA: ModuleSchema = {
    id: 'theme',
    title: 'Personnalisation UI',
    fields: [
        { id: 'primaryColor', key: 'primaryColor', type: 'color', label: 'Couleur Primaire' },
        { id: 'secondaryColor', key: 'secondaryColor', type: 'color', label: 'Couleur Secondaire' },
        { id: 'mode', key: 'mode', type: 'select', label: 'Mode d\'Apparence', options: [{label: 'Clair', value: 'light'}, {label: 'Sombre', value: 'dark'}] },
        { id: 'animationsEnabled', key: 'animationsEnabled', type: 'boolean', label: 'Animations Fluides' },
    ]
};

export const NOTIFICATIONS_SCHEMA: ModuleSchema = {
    id: 'notifications',
    title: 'Alertes & Notifications',
    fields: [
        { id: 'globalSound', key: 'globalSound', type: 'boolean', label: 'Alertes Sonores' },
        { id: 'doNotDisturb', key: 'doNotDisturb', type: 'boolean', label: 'Mode Silencieux' },
    ]
};

export const SECURITY_SCHEMA: ModuleSchema = {
    id: 'security',
    title: 'Sécurité Nexus',
    fields: [
        { id: 'require2FA', key: 'require2FA', type: 'boolean', label: 'Exiger la Double Auth' },
        { id: 'sessionTimeout', key: 'sessionTimeout', type: 'number', label: 'Timeout Session (min)' },
    ]
};

export const DELIVERY_SCHEMA: ModuleSchema = {
    id: 'clickCollect',
    title: 'Livraison & Click & Collect',
    fields: [
        { id: 'enabled', key: 'enabled', type: 'boolean', label: 'Activer le C&C' },
        { id: 'minPrepTime', key: 'minPrepTime', type: 'number', label: 'Temps Prep. Min (min)' },
    ]
};

export const Customer_SCHEMA: ModuleSchema = {
    id: 'customer',
    title: 'Fidélisation Clients',
    fields: [
        { id: 'loyaltyEnabled', key: 'loyaltyEnabled', type: 'boolean', label: 'Programme Fidélité' },
        { id: 'pointsPerEuro', key: 'pointsPerEuro', type: 'number', label: 'Points par €' },
    ]
};

export const LEGAL_SCHEMA: ModuleSchema = {
    id: 'legal',
    title: 'Informations Légales',
    fields: [
        { id: 'legalEntityName', key: 'legalEntityName', type: 'string', label: 'Raison Sociale' },
        { id: 'siret', key: 'siret', type: 'string', label: 'Numéro SIRET' },
        { id: 'registrationCity', key: 'registrationCity', type: 'string', label: 'Ville de Greffe' },
    ]
};

export const STAFF_CONFIG_SCHEMA: ModuleSchema = {
    id: 'staffConfig',
    title: 'Configuration RH',
    fields: [
        { id: 'maxHoursPerWeek', key: 'maxHoursPerWeek', type: 'number', label: 'Heures Max / Semaine' },
        { id: 'autoScheduling', key: 'autoScheduling', type: 'boolean', label: 'Planning Auto (IA)' },
    ]
};

export const RESERVATIONS_CONFIG_SCHEMA: ModuleSchema = {
    id: 'reservationSettings',
    title: 'Moteur de Réservations',
    fields: [
        { id: 'minAdvanceHours', key: 'minAdvanceHours', type: 'number', label: 'Avance Min. (h)' },
        { id: 'autoConfirm', key: 'autoConfirm', type: 'boolean', label: 'Confirmation Auto' },
    ]
};

export const INVENTORY_SCHEMA: ModuleSchema = {
    id: 'inventory',
    title: 'Inventaire & Stocks',
    fields: [
        { id: 'lowStockThreshold', key: 'lowStockThreshold', type: 'number', label: 'Seuil Alerte Stock Bas', unit: 'grams' },
        { id: 'autoReorder', key: 'autoReorder', type: 'boolean', label: 'Réapprovisionnement Auto' },
        { 
            id: 'locations',
            key: 'locations', 
            label: 'Zones de Stockage', 
            type: 'list', 
            subFields: [
                { id: 'name', key: 'name', type: 'string', label: 'Nom de la zone' },
                { id: 'type', key: 'type', type: 'select', label: 'Type', options: [{label: 'Froid', value: 'cold'}, {label: 'Sec', value: 'dry'}, {label: 'Liquide', value: 'liquid'}] }
            ]
        }
    ]
};

export const SERVICE_SCHEMA: ModuleSchema = {
    id: 'service',
    title: 'Paramètres du Service',
    fields: [
        { id: 'allowOverbooking', key: 'allowOverbooking', type: 'boolean', label: 'Autoriser Sur-réservation' },
        { id: 'autoAssignTables', key: 'autoAssignTables', type: 'boolean', label: 'Assignation Automatique' },
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
    Customer_SCHEMA,
    LEGAL_SCHEMA,
    STAFF_CONFIG_SCHEMA,
    RESERVATIONS_CONFIG_SCHEMA,
    INVENTORY_SCHEMA,
    SERVICE_SCHEMA
];

