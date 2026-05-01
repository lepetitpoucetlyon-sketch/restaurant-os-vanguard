import { atom } from 'jotai';

/**
 * 🛰️ HR & PLANNING ATOMS (GRADE VI)
 */
export const hrLoadingAtom = atom<boolean>(false);
export const hrSelectedStaffIdAtom = atom<string | null>(null);
