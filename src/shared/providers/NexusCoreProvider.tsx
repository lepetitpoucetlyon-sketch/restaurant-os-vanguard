"use client";
import React, { useState, useEffect, useMemo, useCallback, useContext, ReactNode } from 'react';
import { NexusCoreContext, useNexusCore } from './NexusCoreContext';
import { loadTranslations, Language } from '@/i18n/translations';
import { LANGUAGES } from '@/config/languages';
import { useAtomValue } from 'jotai';
import { SovereignData, SovereignValue } from "@/shared/nexus/contracts";
import { unreadNotificationsCountAtom } from '@nexus/state/SovereignGenome';
import type {
    NexusCoreState,
    NexusLangState,
} from '@nexus/contracts/nexus.types';

import { UIThemeProvider, UIThemeContext } from './UIThemeProvider';
import { NotificationProvider, NotificationContext } from './NotificationProvider';
import { useNexusTenantLogic } from './hooks/useNexusTenantLogic';
import { useNexusAuthLogic } from './hooks/useNexusAuthLogic';
import { useNexusFleetLogic } from './hooks/useNexusFleetLogic';


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
    const [activeDictionary, setActiveDictionary] = useState<SovereignData | null>(null);
    const [frDictionary, setFrDictionary] = useState<SovereignData | null>(null);

    useEffect(() => {
        loadTranslations('fr').then(dict => setFrDictionary(dict)).catch((e) => console.error('[NexusCore] i18n fr', e));
    }, []);

    useEffect(() => {
        let isMounted = true;
        loadTranslations(currentLanguage).then(dict => {
            if (isMounted) setActiveDictionary(dict);
        });
        return () => { isMounted = false; };
    }, [currentLanguage]);

    const t = useCallback((key: string, fallback?: string): string => {
        const getFromDict = (dict: SovereignData | null): string | null => {
            if (!dict) return null;
            const keys = key.split('.');
            let val: SovereignValue | SovereignData = dict;
            for (const k of keys) {
                if (val && typeof val === 'object' && val !== null && k in val) {
                    val = (val as Record<string, SovereignValue | SovereignData>)[k];
                } else return null;
            }
            return typeof val === 'string' ? val : null;
        };

        const currentVal = getFromDict(activeDictionary);
        if (currentVal !== null) return currentVal;

        const frVal = getFromDict(frDictionary);
        if (frVal !== null) return frVal;

        return fallback ?? key;
    }, [activeDictionary, frDictionary]);



    const langValue: NexusLangState = useMemo(() => ({
        t, currentLanguage, language: currentLanguage,
        setLanguage: (l: Language) => setCurrentLanguage(l),
        availableLanguages: LANGUAGES.map(l => l.code)
    }), [t, currentLanguage]);

    const fleetValue = useNexusFleetLogic();

    const contextValue: NexusCoreState = useMemo(() => ({
        auth: authValue as unknown as NexusCoreState['auth'], tenant: tenantValue, ui: uiThemeContext.ui, settings: uiThemeContext.settings,
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

export { useNexusCore };

export const useAuth = () => useNexusCore().auth;
export const useTenant = () => useNexusCore().tenant;
export const useUI = () => useNexusCore().ui;
export const useSettings = () => useNexusCore().settings;
export const useLang = () => useNexusCore().lang;
export const useLanguage = () => useNexusCore().lang;
export const useNotif = () => useNexusCore().notif;
export const useNotifications = () => useNexusCore().notif;
export const useFleet = () => useNexusCore().fleet;
