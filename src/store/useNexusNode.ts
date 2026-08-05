"use client";

import { useEffect } from 'react';
import { useAtomValue, useStore } from 'jotai';
import type { PrimitiveAtom } from 'jotai';
import { GlobalRegistryService } from '@/lib/GlobalRegistryService';
import type { NexusNode } from './base';

/**
 * useNexusNode (Grade VI - Lifecycle Managed)
 * Hook standard pour consommer un node tout en gérant son cycle de vie RAM.
 * Automatiquement enregistré dans le GlobalRegistryService.
 */
export function useNexusNode<T>(domain: { id: string, node: PrimitiveAtom<NexusNode<T>> }) {
    const store = useStore();

    useEffect(() => {
        // MOUNT: Increment usage count
        GlobalRegistryService.touch(domain.id);
        
        return () => {
            // UNMOUNT: Decrement usage count & trigger GC if needed
            GlobalRegistryService.release(domain.id, store);
        };
    }, [domain.id, store]);

    return useAtomValue(domain.node);
}
