import { atomWithStorage } from 'jotai/utils';
import type { LanguageCode } from '@/config/languages';

/**
 * 🌍 LANGUAGE ATOMS - Grade VI
 */

export type Language = LanguageCode;

export const currentLanguageAtom = atomWithStorage<Language>('nexus_language', 'fr');
