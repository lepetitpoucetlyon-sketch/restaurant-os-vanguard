import { useAtomValue } from 'jotai';
import { nexusStatusAtom, type NexusStatusState } from '@/store/atoms/nexusStatus.atom';

export function useNexusStatus(): NexusStatusState {
    return useAtomValue(nexusStatusAtom);
}
