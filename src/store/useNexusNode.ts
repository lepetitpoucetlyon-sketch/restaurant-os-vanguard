// @ts-nocheck
// @ts-nocheck
"use client";

import { useEffect } from 'react';
import { useAtomValue, useStore } from 'jotai';
import { GlobalRegistryService } from '@/lib/services/GlobalRegistryService';
import type { NexusNode } from './nexusNodeFactory';

/**
 * useNexusNode (Grade VI - Lifecycle Managed)
 * Hook standard pour consommer un node tout en gérant son cycle de vie RAM.
 * Automatiquement enregistré dans le GlobalRegistryService.
 */
export function useNexusNode<T>(domain: { id: string, node: NexusNode<T> }) {
    const store = useStore();

    useEffect(() => {
        // MOUNT: Increment usage count
        GlobalRegistryService.touch(domain.id);
        
        return () => {
            // UNMOUNT: Decrement usage count & trigger GC if needed
            GlobalRegistryService.release(domain.id, store);
        };
    }, [domain.id, store]);

    return useAtomValue(domain.node) as NexusNode<T>;
}
