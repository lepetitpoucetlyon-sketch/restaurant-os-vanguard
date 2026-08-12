"use client";

import { useNexusCore } from '@/kernel/providers/NexusCoreContext';

/**
 * 🏢 useTenant - Grade VI
 * Bridge vers les données du restaurant (Tenant) via le Nexus Core.
 */
export function useTenant() {
    const tenant = useNexusCore().tenant;

    if (!tenant) {
        throw new Error("useTenant must be used within a NexusCoreProvider");
    }

    return tenant;
}
