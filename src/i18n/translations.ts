// @ts-nocheck
// @ts-nocheck
/**
 * translations.ts — Assembleur de Traductions par Domaine
 *
 * Architecture décomposée :
 *   domains/common.ts     → nav, header, sidebar, settings, common, allergens
 *   domains/dashboard.ts  → dashboard (KPIs, chart, intelligence, CTA)
 *   domains/operations.ts → pos, planning, inventory, reservations, crm, recruitment
 *
 * Chaque domaine exporte ses traductions pour toutes les langues (fr, en, ja, pt, es).
 * Ce fichier les fusionne en un objet unique consommé par LanguageContext.
 */

import { commonTranslations } from './domains/common';
import { dashboardTranslations } from './domains/dashboard';
import { operationsTranslations } from './domains/operations';

// Deep merge utility — fusionner les objets de traduction par langue
function deepMerge(...objects: Record<string, unknown>[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const obj of objects) {
        if (!obj) continue;
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                result[key] = deepMerge(result[key] || {}, obj[key]);
            } else {
                result[key] = obj[key];
            }
        }
    }
    return result;
}

// Assemble all domain translations
export const translations = {
    fr: deepMerge(
        commonTranslations.fr,
        dashboardTranslations.fr,
        operationsTranslations.fr
    ),
    en: deepMerge(
        commonTranslations.en,
        dashboardTranslations.en,
        operationsTranslations.en
    ),
    ja: deepMerge(
        commonTranslations.ja,
        dashboardTranslations.ja,
        operationsTranslations.ja
    ),
    pt: deepMerge(
        commonTranslations.pt,
        dashboardTranslations.pt,
        operationsTranslations.pt
    ),
    es: deepMerge(
        commonTranslations.es,
        dashboardTranslations.es,
        operationsTranslations.es
    )
};

export type Language = keyof typeof translations;
export type TranslationKey = string; // Simplified for now, could be improved with template literal types
