"use client";

import { useNexusCore } from '@/shared/providers/NexusCoreProvider';

/**
 * 🎨 useUI - Grade X
 * Direct bridge to the Nexus Core UI state.
 */
export function useUI() {
    const core = useNexusCore();
    return core.ui;
}
