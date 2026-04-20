// @ts-nocheck
import { atom } from 'jotai';
import { Candidate, RecruitmentLog } from '@/types/recruitment';

/**
 * 🛰️ RECRUITMENT ATOMS (GRADE VI)
 */
export const candidatesAtom = atom<Candidate[]>([]);
export const recruitmentLogsAtom = atom<RecruitmentLog[]>([]);
export const recruitmentLoadingAtom = atom<boolean>(false);
export const recruitmentErrorAtom = atom<string | null>(null);
