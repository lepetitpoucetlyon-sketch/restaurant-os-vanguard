// @ts-nocheck
import { atom } from 'jotai';

/**
 * 🛰️ HR & PLANNING ATOMS (GRADE VI)
 */
export const hrShiftsAtom = atom<any[]>([]);
export const hrProcessingAtom = atom<boolean>(false);
export const hrSelectedStaffIdAtom = atom<string | null>(null);
