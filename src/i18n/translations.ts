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

export type Language = 'fr' | 'en' | 'ja' | 'pt' | 'es';

// Async lazy loading function
export async function loadTranslations(lang: Language): Promise<import("@/shared/nexus/contracts/sovereign.types").SovereignData> {
    try {
        const langModule = await import(`./locales/${lang}`);
        return langModule.default;
    } catch (error) {
        console.error(`Failed to load language: ${lang}`, error);
        // Fallback to fr if something goes wrong
        if (lang !== 'fr') {
            const fallback = await import('./locales/fr');
            return fallback.default;
        }
        return {};
    }
}

export type TranslationKey = string;
