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

export const useLanguage = () => useNexusCore()?.lang || fallbackLang;
export const LanguageProvider = ({ children }: { children: any }) => <>{children}</>;
