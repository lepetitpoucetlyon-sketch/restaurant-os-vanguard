"use client";
import { NexusSutures } from '@/store/nexusSutures';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode, useRef } from 'react';
import { getTenantConfig } from '@/instances';
import { logger } from '@/lib/axiom';
import { useSearchParams } from 'next/navigation';
import { translations, Language } from '@/i18n/translations';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FirestoreAdapter } from '@/infrastructure/adapters/FirestoreAdapter';
import { NexusTelemetryEngine } from '@shared/nexus/engines/NexusTelemetryEngine';
import { useSetAtom, useAtomValue } from 'jotai';
import { tenantConfigAtom } from '@/store/pillars/sovereign';
import { TenantConfig, SovereignData, SovereignValue } from '@/shared/nexus-contract';
import { unreadNotificationsCountAtom } from '@nexus/state/SovereignGenome';
import {
    NexusCoreState, 
    NexusTenantState, 
    NexusLangState,
} from '@nexus/contracts/nexus.types';

import { UIThemeProvider, UIThemeContext } from './providers/UIThemeProvider';
import { NotificationProvider, NotificationContext } from './providers/NotificationProvider';
import { useNexusAuthLogic } from './hooks/useNexusAuthLogic';
import { useNexusFleetLogic } from './hooks/useNexusFleetLogic';

const NexusCoreContext = createContext<NexusCoreState | undefined>(undefined);

const NexusCoreLogic: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 1. TENANT MODULE
    const searchParams = useSearchParams();
    const hasInitialized = useRef(false);
    const setGlobalTenantConfig = useSetAtom(tenantConfigAtom);
    
    const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
    const [activeTenantConfig, setActiveTenantConfig] = useState<TenantConfig | null>(null);

    useEffect(() => {
        try { Nexus.adapter = new FirestoreAdapter(); } catch { }
    }, []);

    useEffect(() => {
        NexusTelemetryEngine.mountChaosMonkeys();
        NexusSutures.init();
        return () => {
            NexusTelemetryEngine.unmountChaosMonkeys();
            NexusSutures.stop();
        };
    }, []);

    const switchTenant = useCallback((tenantIdRaw: string) => {
        const tenantId = tenantIdRaw.replace(/['"]+/g, '');
        logger.info('NexusCore: Switching Digital Twin context', { tenantId });
        const config = getTenantConfig(tenantId);
        if (!config) return;
        
        setActiveTenantId(tenantId);
        setActiveTenantConfig(config);
        setGlobalTenantConfig(config);
        Nexus.tenantOverride = tenantId;
        NexusTelemetryEngine.initSession(tenantId);
    }, [setGlobalTenantConfig]);

    useEffect(() => {
        if (!activeTenantId && !hasInitialized.current) {
            const targetTenant = searchParams.get('tenant') || 'lepetitpoucet';
            hasInitialized.current = true;
            switchTenant(targetTenant);
        }
    }, [activeTenantId, searchParams, switchTenant]);

    // 2. AUTH MODULE
    const authValue = useNexusAuthLogic(activeTenantId);

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

    const tenantValue: NexusTenantState = useMemo(() => ({
        activeTenantId, activeTenantConfig, switchTenant,
        isTenantLoading: !activeTenantId, tenantId: activeTenantId || undefined
    }), [activeTenantId, activeTenantConfig, switchTenant]);

    const fleetValue = useNexusFleetLogic();

    const contextValue: NexusCoreState = useMemo(() => ({
        auth: authValue, tenant: tenantValue, ui: uiThemeContext.ui, settings: uiThemeContext.settings,
        theme: uiThemeContext.theme, lang: langValue, notif: notifContext, fleet: fleetValue,
        tenantConfig: activeTenantConfig
    }), [tenantValue, authValue, uiThemeContext, langValue, notifContext, fleetValue, activeTenantConfig]);

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
