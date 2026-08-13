import { atom } from 'jotai';
import type { Consultation } from '../../domain/types/consultation';

export const consultationsAtom = atom<Consultation[]>([]);
export const consultationsLoadingAtom = atom<boolean>(false);
export const consultationSelectedDateAtom = atom<string>(new Date().toISOString().split('T')[0]);
export const selectedPractitionerIdAtom = atom<string | null>(null);

export const filteredConsultationsAtom = atom<Consultation[]>((get) => {
  const all = get(consultationsAtom);
  const date = get(consultationSelectedDateAtom);
  const practId = get(selectedPractitionerIdAtom);
  return all.filter(c => {
    if (!c.startAt.startsWith(date)) return false;
    if (practId && c.practitionerId !== practId) return false;
    return true;
  });
});
