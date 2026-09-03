/**
 * translations.ts — Chargement paresseux des dictionnaires de langue.
 *
 * Chaque locale (`src/i18n/locales/<code>.ts`) est un chunk séparé, téléchargé
 * uniquement quand l'utilisateur choisit cette langue (cf. `NexusCoreProvider`).
 * Le français reste toujours chargé comme filet de secours pour `t()`.
 *
 * Persistance du choix : atome Jotai `currentLanguageAtom`
 * (`src/shared/store/languageAtoms.ts`, clé localStorage `nexus_language`).
 * Bascule : `useLanguage().setLanguage(code)` — sélecteurs dans `Header` et
 * `LaunchpadStatusHub`.
 */

import type { LanguageCode } from '@/config/languages';
import type { SovereignData } from '@/shared/nexus/contracts/sovereign.types';

export type Language = LanguageCode;
export type TranslationKey = string;

// Import statique par langue → chunks séparés, analysables par le bundler
// (un `import(`./locales/${lang}`)` dynamique n'est PAS code-splittable par Next).
const LOADERS: Record<LanguageCode, () => Promise<{ default: SovereignData }>> = {
  fr: () => import('./locales/fr'),
  en: () => import('./locales/en'),
  es: () => import('./locales/es'),
  ja: () => import('./locales/ja'),
  pt: () => import('./locales/pt'),
};

/** Charge (et télécharge à la demande) le dictionnaire d'une langue. */
export async function loadTranslations(lang: Language): Promise<SovereignData> {
  const loader = LOADERS[lang] ?? LOADERS.fr;
  try {
    return (await loader()).default;
  } catch (error) {
    console.error(`[i18n] échec de chargement de la langue « ${lang} »`, error);
    if (lang !== 'fr') {
      try {
        return (await LOADERS.fr()).default;
      } catch {
        return {} as SovereignData;
      }
    }
    return {} as SovereignData;
  }
}
