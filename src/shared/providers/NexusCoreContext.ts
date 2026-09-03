"use client";
import { createContext, useContext } from 'react';
import type { NexusCoreState } from '@nexus/contracts/nexus.types';

export const NexusCoreContext = createContext<NexusCoreState | undefined>(undefined);

export const useNexusCore = () => {
    const ctx = useContext(NexusCoreContext);
    if (!ctx) throw new Error("useNexusCore must be used within NexusCoreProvider");
    return ctx;
};

const DEFAULT_LANG_CTX = {
    language: 'fr' as const,
    setLanguage: () => {},
    t: (key: string) => key,
    dir: 'ltr' as const,
};

export const useAuth = () => useNexusCore().auth;
export const useTenantCtx = () => useNexusCore().tenant;
export const useUI = () => useNexusCore().ui;
export const useSettings = () => useNexusCore().settings;
export const useLanguage = () => {
    const ctx = useContext(NexusCoreContext);
    return ctx?.lang ?? DEFAULT_LANG_CTX;
};
export const useLang = useLanguage;
export const useNotif = () => useNexusCore().notif;
export const useNotifications = () => useNexusCore().notif;
export const useFleet = () => useNexusCore().fleet;
