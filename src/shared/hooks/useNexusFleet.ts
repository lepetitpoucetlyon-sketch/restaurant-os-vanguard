"use client";

// FIXME (FIX-04): shared/hooks proxy — déplacer useNexusFleet vers shared/nexus/fleet ou NexusEventBus.
// eslint-disable-next-line vanguard/no-inter-module-imports
import { useNexusFleet as useNexusFleetContext } from "@/modules/intelligence";

/**
 * 🛰️ useNexusFleet - Grade VI Atomic Bridge (Proxy)
 * Redirection vers le contexte centralisé pour assurer la souveraineté des types.
 */
export function useNexusFleet() {
    return useNexusFleetContext() as unknown;
}
