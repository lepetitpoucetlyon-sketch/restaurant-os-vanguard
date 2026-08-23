/**
 * 🏗️ Custom Fields Engine — Types & Schémas Zod.
 *
 * Moteur de champs métier dynamiques permettant aux opérateurs de créer
 * des champs personnalisés sur les entités métier (clients, réservations,
 * produits, commandes, employés, fournisseurs) sans toucher au code.
 *
 * Architecture EAV (Entity-Attribute-Value) typée par Zod :
 * - Les DÉFINITIONS sont stockées dans `tenants/{tenantId}/customFieldsDefs/`
 * - Les VALEURS sont stockées IN-SITU dans l'entité mère : `customer.customFields = { ... }`
 *
 * 🔒 Sécurité arithmétique (Charte §5) :
 * - Les champs `currency` sont stockés en centimes (entiers) pour éviter les erreurs
 *   de flottants JavaScript (0.1 + 0.2 ≠ 0.3).
 * - La conversion affichage ↔ stockage est gérée par le CustomFieldRenderer.
 *
 * Module FEUILLE : aucune dépendance interne au-delà de Zod.
 */

import { z } from 'zod';

// ── Types de champs supportés ────────────────────────────────────────────────

export const CustomFieldTypeSchema = z.enum([
    'text',
    'number',
    'currency',        // ⚠️ Stocké en centimes (entiers) — JAMAIS en flottants
    'date',
    'datetime',
    'boolean',
    'select',
    'multiselect',
    'url',
    'email',
    'phone',
    'color',
    'rating',          // 1-5 étoiles
]);

export type CustomFieldType = z.infer<typeof CustomFieldTypeSchema>;

// ── Entités supportées ───────────────────────────────────────────────────────

export const CustomFieldEntitySchema = z.enum([
    'customer',
    'reservation',
    'product',
    'order',
    'employee',
    'supplier',
]);

export type CustomFieldEntity = z.infer<typeof CustomFieldEntitySchema>;

// ── Contraintes de validation par type ───────────────────────────────────────

export const CustomFieldConstraintsSchema = z.object({
    min: z.number().optional(),                     // number, currency, rating
    max: z.number().optional(),
    pattern: z.string().optional(),                 // text : regex de validation
    options: z.array(z.string()).optional(),         // select, multiselect
    currency: z.enum(['EUR', 'USD', 'GBP']).optional(),
    maxLength: z.number().int().positive().optional(), // text
}).optional();

// ── Configuration d'affichage ────────────────────────────────────────────────

export const CustomFieldDisplaySchema = z.object({
    /** Position relative aux champs natifs. */
    position: z.enum(['before_default', 'after_default', 'sidebar']).default('after_default'),
    /** Groupement dans un accordéon nommé (optionnel). */
    section: z.string().optional(),
    /** Largeur dans la grille du formulaire. */
    width: z.enum(['full', 'half', 'third']).default('full'),
    /** Texte d'aide contextuel. */
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    /** Nom d'icône Lucide (ex: 'Car', 'Dog', 'Flower'). */
    icon: z.string().optional(),
}).optional();

// ── Définition complète d'un champ personnalisé ──────────────────────────────

export const CustomFieldDefSchema = z.object({
    /** Identifiant unique du champ. */
    id: z.string().min(1),
    /** Clé technique (snake_case, unique par entité). */
    key: z.string().regex(/^[a-z][a-z0-9_]{1,49}$/, 'Clé invalide : snake_case, 2-50 caractères, commence par une lettre'),
    /** Libellé affiché à l'utilisateur. */
    label: z.string().min(1).max(100),
    /** Type du champ. */
    type: CustomFieldTypeSchema,
    /** Obligatoire ? */
    required: z.boolean().default(false),
    /** Entité métier porteuse. */
    entity: CustomFieldEntitySchema,

    /** Contraintes de validation. */
    constraints: CustomFieldConstraintsSchema,

    /** Configuration d'affichage. */
    display: CustomFieldDisplaySchema,

    /** Apparaît dans la recherche globale. */
    searchable: z.boolean().default(false),
    /** Colonne triable dans les vues liste. */
    sortable: z.boolean().default(false),
    /** Filtre disponible dans les vues liste. */
    filterable: z.boolean().default(false),

    /** Timestamps. */
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type CustomFieldDef = z.infer<typeof CustomFieldDefSchema>;

// ── Valeur typée d'un champ personnalisé ─────────────────────────────────────

export type CustomFieldValue =
    | string
    | number
    | boolean
    | string[]      // multiselect
    | null;

/**
 * Conteneur de valeurs de champs personnalisés stocké IN-SITU dans l'entité.
 * Ex: `customer.customFields = { immatriculation: 'AB-123-CD', espece_animale: 'Chien' }`
 */
export type CustomFieldsRecord = Record<string, CustomFieldValue>;

// ── Helpers de conversion (sécurité arithmétique) ────────────────────────────

/**
 * Convertit un montant affiché (euros) en centimes entiers pour stockage.
 * Règle du reliquat de split (Charte §5) : arrondi au centime le plus proche.
 *
 * @example currencyToMicrounits(12.50) → 1250
 * @example currencyToMicrounits(0.1 + 0.2) → 30 (pas 30.000000000000004)
 */
export function currencyToMicrounits(displayValue: number): number {
    return Math.round(displayValue * 100);
}

/**
 * Convertit des centimes stockés en montant affiché (euros).
 *
 * @example microunitsToCurrency(1250) → 12.50
 */
export function microunitsToCurrency(microunits: number): number {
    return microunits / 100;
}

/**
 * Valide une valeur de champ personnalisé contre sa définition.
 * Retourne `true` si la valeur est valide, une chaîne d'erreur sinon.
 */
export function validateCustomFieldValue(
    def: CustomFieldDef,
    value: CustomFieldValue,
): true | string {
    if (value === null || value === undefined || value === '') {
        return def.required ? `Le champ "${def.label}" est obligatoire` : true;
    }

    switch (def.type) {
        case 'text':
        case 'url':
        case 'email':
        case 'phone':
        case 'color':
            if (typeof value !== 'string') return `"${def.label}" doit être du texte`;
            if (def.constraints?.maxLength && value.length > def.constraints.maxLength) {
                return `"${def.label}" ne doit pas dépasser ${def.constraints.maxLength} caractères`;
            }
            if (def.constraints?.pattern) {
                const regex = new RegExp(def.constraints.pattern);
                if (!regex.test(value)) return `"${def.label}" ne correspond pas au format attendu`;
            }
            return true;

        case 'number':
        case 'currency':
        case 'rating':
            if (typeof value !== 'number') return `"${def.label}" doit être un nombre`;
            if (def.type === 'currency' && !Number.isInteger(value)) {
                return `"${def.label}" doit être un entier (centimes)`;
            }
            if (def.constraints?.min !== undefined && value < def.constraints.min) {
                return `"${def.label}" doit être ≥ ${def.constraints.min}`;
            }
            if (def.constraints?.max !== undefined && value > def.constraints.max) {
                return `"${def.label}" doit être ≤ ${def.constraints.max}`;
            }
            if (def.type === 'rating' && (value < 1 || value > 5 || !Number.isInteger(value))) {
                return `"${def.label}" doit être entre 1 et 5 étoiles`;
            }
            return true;

        case 'boolean':
            if (typeof value !== 'boolean') return `"${def.label}" doit être vrai/faux`;
            return true;

        case 'date':
        case 'datetime':
            if (typeof value !== 'string') return `"${def.label}" doit être une date`;
            if (isNaN(Date.parse(value))) return `"${def.label}" : date invalide`;
            return true;

        case 'select':
            if (typeof value !== 'string') return `"${def.label}" doit être une option`;
            if (def.constraints?.options && !def.constraints.options.includes(value)) {
                return `"${def.label}" : option invalide`;
            }
            return true;

        case 'multiselect':
            if (!Array.isArray(value)) return `"${def.label}" doit être un tableau d'options`;
            if (def.constraints?.options) {
                const invalid = value.filter(v => !def.constraints!.options!.includes(v));
                if (invalid.length > 0) return `"${def.label}" : options invalides : ${invalid.join(', ')}`;
            }
            return true;

        default:
            return true;
    }
}
