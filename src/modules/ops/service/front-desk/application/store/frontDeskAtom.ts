import { atom } from 'jotai';
import type { GuestRecord } from '../../domain/types/front-desk';

export const guestRecordsAtom = atom<GuestRecord[]>([]);
export const frontDeskLoadingAtom = atom<boolean>(false);

export const activeGuestsAtom = atom<GuestRecord[]>((get) =>
  get(guestRecordsAtom).filter(g => g.status === 'checked_in')
);

export const expectedGuestsAtom = atom<GuestRecord[]>((get) =>
  get(guestRecordsAtom).filter(g => g.status === 'expected')
);
