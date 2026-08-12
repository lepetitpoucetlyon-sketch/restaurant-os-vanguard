import { atom } from 'jotai';

export interface NexusStatusState {
    isActive: boolean;
    isProcessing: boolean;
}

export const nexusStatusAtom = atom<NexusStatusState>({
    isActive: false,
    isProcessing: false,
});
