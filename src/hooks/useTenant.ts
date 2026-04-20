// @ts-nocheck
"use client";

import { useTenant as useNexusTenant } from '@/engines/core/NexusCoreProvider';

/**
 * 🏢 useTenant - Grade VI
 * Bridge vers les données du restaurant (Tenant) via le Nexus Core.
 */
export function useTenant() {
    const tenant = useNexusTenant();

    if (!tenant) {
        throw new Error("useTenant must be used within a NexusCoreProvider");
    }

    return tenant;
}
