import { atom } from 'jotai';
import { Shift } from '../types';

/**
 * 🛰️ HR & PLANNING ATOMS (GRADE VI)
 */
export const hrShiftsAtom = atom<Shift[]>([]);
export const hrProcessingAtom = atom<boolean>(false);
export const hrSelectedStaffIdAtom = atom<string | null>(null);
