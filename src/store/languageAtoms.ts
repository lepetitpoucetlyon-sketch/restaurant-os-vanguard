// @ts-nocheck
import { atomWithStorage } from 'jotai/utils';

/**
 * 🌍 LANGUAGE ATOMS - Grade VI
 */

export type Language = 'fr' | 'en';

export const currentLanguageAtom = atomWithStorage<Language>('nexus_language', 'fr');
