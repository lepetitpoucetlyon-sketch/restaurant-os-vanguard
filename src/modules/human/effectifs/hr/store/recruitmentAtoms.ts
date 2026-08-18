import { atom } from 'jotai';
import type { Candidate, RecruitmentLog } from '@nexus/contracts';

/**
 * 🛰️ RECRUITMENT ATOMS (GRADE VI)
 */
export const candidatesAtom = atom<Candidate[]>([]);
export const recruitmentLogsAtom = atom<RecruitmentLog[]>([]);
export const recruitmentLoadingAtom = atom<boolean>(false);
export const recruitmentErrorAtom = atom<string | null>(null);
