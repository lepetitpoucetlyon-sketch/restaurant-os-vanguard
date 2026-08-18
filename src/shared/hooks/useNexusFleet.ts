"use client";

import { useNexusFleet as useNexusFleetFromProvider } from "@/shared/providers/fleet/NexusFleetProvider";

/**
 * 🛰️ useNexusFleet - Shared Hook Proxy
 * Redirige vers le contexte centralisé de la flotte.
 */
export function useNexusFleet() {
    return useNexusFleetFromProvider();
}
