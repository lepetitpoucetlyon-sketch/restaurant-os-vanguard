/**
 * Restaurant OS - Centralized Language Configuration
 * 
 * Single source of truth for all supported languages in the application.
 * Import this constant instead of defining LANGUAGES in individual components.
 * 
 * @example
 * import { LANGUAGES, type LanguageCode } from '@/config/languages';
 */

export const LANGUAGES = [
    { code: 'fr', label: 'Français', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'ja', label: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'pt', label: 'Portuguese', nativeName: 'Português (BR)', flag: '🇧🇷' },
    { code: 'es', label: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
] as const;

/**
 * Type-safe language code derived from LANGUAGES constant
 */
export type LanguageCode = typeof LANGUAGES[number]['code'];

/**
 * Full language object type
 */
export type Language = typeof LANGUAGES[number];

/**
 * Get a language object by its code
 */
export function getLanguageByCode(code: LanguageCode): Language | undefined {
    return LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get the default language (first in the list)
 */
export function getDefaultLanguage(): Language {
    return LANGUAGES[0];
}

/**
 * Check if a string is a valid language code
 */
export function isValidLanguageCode(code: string): code is LanguageCode {
    return LANGUAGES.some(lang => lang.code === code);
}
