// @ts-nocheck
import { useAtom } from 'jotai';
import { currentLanguageAtom, Language } from '@/store/languageAtoms';
import { translations } from '@/i18n/translations';

/**
 * 🌍 useLanguage - Grade VI
 * Pilotage de la localisation atomique.
 */
export function useLanguage() {
    const [language, setLanguage] = useAtom(currentLanguageAtom);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'fr' ? 'en' : 'fr');
    };

    const isRTL = false; // Not needed for FR/EN but ready for extension

    const t = (key: string) => {
        const keys = key.split('.');
        let value: any = translations[language as keyof typeof translations];
        
        for (const k of keys) {
            value = value?.[k];
        }

        return typeof value === 'string' ? value : key;
    };

    return {
        language,
        setLanguage,
        toggleLanguage,
        isRTL,
        t
    };
}
