"use client";

import { useNexusCore } from '@/engines/core/NexusCoreProvider';

const fallbackT = (key: string) => key;
const fallbackLang = {
  t: fallbackT,
  currentLanguage: 'fr',
  language: 'fr', // Heritage alias
  setLanguage: () => {},
  availableLanguages: ['fr']
};

/**
 * 🌍 useLanguage - Grade X
 * Direct bridge to the Nexus Core Language/i18n context.
 */
export function useLanguage() {
    const core = useNexusCore();
    return core?.lang || fallbackLang;
}
