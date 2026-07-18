"use client";
import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { translations, Language } from '@/i18n/translations';
import { useAtomValue } from 'jotai';
import { SovereignData, SovereignValue } from '@/shared/nexus-contract';
import { unreadNotificationsCountAtom } from '@nexus/state/SovereignGenome';
import {
    NexusCoreState,
    NexusLangState,
} from '@nexus/contracts/nexus.types';

import { UIThemeProvider, UIThemeContext } from './providers/UIThemeProvider';
import { NotificationProvider, NotificationContext } from './providers/NotificationProvider';
import { useNexusTenantLogic } from './hooks/useNexusTenantLogic';
import { useNexusAuthLogic } from './hooks/useNexusAuthLogic';
import { useNexusFleetLogic } from './hooks/useNexusFleetLogic';

const NexusCoreContext = createContext<NexusCoreState | undefined>(undefined);

const NexusCoreLogic: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 1. TENANT MODULE
    const tenantValue = useNexusTenantLogic();

    // 2. AUTH MODULE
    const authValue = useNexusAuthLogic(tenantValue.activeTenantId);

    // 3. UI, NOTIF & THEME
    const uiThemeContext = useContext(UIThemeContext);
    const notifContext = useContext(NotificationContext);
    if (!uiThemeContext || !notifContext) throw new Error("Missing providers");

    // 4. LANGUAGE MODULE
    const [currentLanguage, setCurrentLanguage] = useState<Language>('fr');
    const t = useCallback((key: string): string => {
        const keys = key.split('.');
        let val: SovereignValue | SovereignData = translations[currentLanguage as keyof typeof translations];
        for (const k of keys) {
            if (val && typeof val === 'object' && val !== null && k in val) {
                val = (val as Record<string, SovereignValue | SovereignData>)[k];
            } else return key; 
        }
        return typeof val === 'string' ? val : key;
    }, [currentLanguage]);

    const langValue: NexusLangState = useMemo(() => ({
        t, currentLanguage, language: currentLanguage,
        setLanguage: (l: Language) => setCurrentLanguage(l),
        availableLanguages: Object.keys(translations)
    }), [t, currentLanguage]);

    const fleetValue = useNexusFleetLogic();

    const contextValue: NexusCoreState = useMemo(() => ({
        auth: authValue, tenant: tenantValue, ui: uiThemeContext.ui, settings: uiThemeContext.settings,
        theme: uiThemeContext.theme, lang: langValue, notif: notifContext, fleet: fleetValue,
        tenantConfig: tenantValue.activeTenantConfig
    }), [tenantValue, authValue, uiThemeContext, langValue, notifContext, fleetValue]);

    return (
        <NexusCoreContext.Provider value={contextValue}>
            {children}
        </NexusCoreContext.Provider>
    );
};

export const NexusCoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const unreadCount = useAtomValue(unreadNotificationsCountAtom);
    return (
        <NotificationProvider>
            <UIThemeProvider unreadCount={unreadCount}>
                <NexusCoreLogic>{children}</NexusCoreLogic>
            </UIThemeProvider>
        </NotificationProvider>
    );
};

export const useNexusCore = () => {
    const context = useContext(NexusCoreContext);
    if (!context) throw new Error("useNexusCore must be used within NexusCoreProvider");
    return context;
};

export const useAuth = () => useNexusCore().auth;
export const useTenant = () => useNexusCore().tenant;
export const useUI = () => useNexusCore().ui;
export const useSettings = () => useNexusCore().settings;
export const useLang = () => useNexusCore().lang;
export const useLanguage = () => useNexusCore().lang;
export const useNotif = () => useNexusCore().notif;
export const useNotifications = () => useNexusCore().notif;
export const useFleet = () => useNexusCore().fleet;
