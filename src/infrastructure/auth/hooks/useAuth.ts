"use client";

import { useAuth as useNexusAuth } from '@/shared/hooks';

/**
 * 🔒 useAuth - Grade VI
 * Bridge souverain vers la session active et les permissions du Nexus Core.
 */
export function useAuth() {
    const auth = useNexusAuth();
    
    // Si le hook est utilisé hors du provider, on pourrait renvoyer un état vide ou lever une erreur.
    // Mais ici on fait confiance à l'architecture Grade VI.
    if (!auth) {
        throw new Error("useAuth must be used within a NexusCoreProvider");
    }

    return auth;
}
