"use client";

import { useNexusFleet as useNexusFleetContext } from "@/modules/intelligence/fleet/providers/NexusFleetProvider";

/**
 * 🛰️ useNexusFleet - Grade VI Atomic Bridge (Proxy)
 * Redirection vers le contexte centralisé pour assurer la souveraineté des types.
 */
export function useNexusFleet() {
    return useNexusFleetContext() as unknown;
}
