"use client";

import { useUI as useNexusUI } from '@/engines/core/NexusCoreProvider';

/**
 * 🎨 useUI - Grade VI
 * Pilotage de l'interface via le Nexus Core (Context Central).
 */
export function useUI() {
    const ui = useNexusUI();

    if (!ui) {
        throw new Error("useUI must be used within a NexusCoreProvider");
    }

    return ui;
}
