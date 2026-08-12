"use client";

import { useNexusCore } from '@/kernel/providers/NexusCoreContext';

/**
 * 🔒 useAuth - Grade VI
 * Bridge souverain vers la session active et les permissions du Nexus Core.
 */
export function useAuth() {
    return useNexusCore().auth;
}
