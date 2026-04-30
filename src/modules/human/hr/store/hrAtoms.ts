import { atom } from 'jotai';
import { Shift } from '../types';

/**
 * 🛰️ HR & PLANNING ATOMS (GRADE VI)
 */
export const activeShiftsAtom = atom<Shift[]>([]);
export const hrLoadingAtom = atom<boolean>(false);
export const hrSelectedStaffIdAtom = atom<string | null>(null);
