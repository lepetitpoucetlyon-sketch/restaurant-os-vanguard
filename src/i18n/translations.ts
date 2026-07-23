/**
 * translations.ts — Assembleur de Traductions par Domaine
 *
 * STATUT : DORMANT — 0 composant UI n'utilise t() en dehors de NexusCoreProvider.
 * Marché cible France → monolingue assumé. Ne pas câbler sans décision explicite.
 *
 * Architecture décomposée :
 *   domains/common.ts     → nav, header, sidebar, settings, common, allergens
 *   domains/dashboard.ts  → dashboard (KPIs, chart, intelligence, CTA)
 *   domains/operations.ts → pos, planning, inventory, reservations, customer, recruitment
 *
 * Chaque domaine exporte ses traductions pour toutes les langues (fr, en, ja, pt, es).
 * Ce fichier les fusionne en un objet unique consommé par LanguageContext.
 */

import { commonTranslations } from './domains/common';
import { dashboardTranslations } from './domains/dashboard';
import { operationsTranslations } from './domains/operations';

// Deep merge utility — fusionner les objets de traduction par langue
function deepMerge(...objects: import('@/shared/nexus-contract').SovereignData[]): import('@/shared/nexus-contract').SovereignData {
    const result: import('@/shared/nexus-contract').SovereignData = {};

    for (const obj of objects) {
        if (!obj) continue;
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                result[key] = deepMerge(result[key] as import('@/shared/nexus-contract').SovereignData || {}, obj[key] as import('@/shared/nexus-contract').SovereignData);
            } else {

                result[key] = obj[key];
            }
        }
    }
    return result;
}

export type Language = 'fr' | 'en' | 'ja' | 'pt' | 'es';

// Assemble all domain translations with strict SovereignData typing
export const translations: Record<Language, import('@/shared/nexus-contract').SovereignData> = {
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

export type TranslationKey = string; // Simplified for now, could be improved with template literal types
