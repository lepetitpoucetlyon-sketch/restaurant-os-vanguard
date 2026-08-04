"use client";
import { createContext, useContext } from 'react';
import type { NexusCoreState } from '@nexus/contracts/nexus.types';

export const NexusCoreContext = createContext<NexusCoreState | undefined>(undefined);

export const useNexusCore = () => {
    const ctx = useContext(NexusCoreContext);
    if (!ctx) throw new Error("useNexusCore must be used within NexusCoreProvider");
    return ctx;
};

export const useAuth = () => useNexusCore().auth;
export const useTenantCtx = () => useNexusCore().tenant;
export const useUI = () => useNexusCore().ui;
export const useSettings = () => useNexusCore().settings;
export const useLang = () => useNexusCore().lang;
export const useLanguage = () => useNexusCore().lang;
export const useNotif = () => useNexusCore().notif;
export const useNotifications = () => useNexusCore().notif;
export const useFleet = () => useNexusCore().fleet;
