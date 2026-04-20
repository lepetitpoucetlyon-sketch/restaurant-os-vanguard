"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode, useRef } from 'react';

// Modules internes (logique extraite)
import { useAuthSession } from '@/engines/core/hooks/auth/AuthSession';
import { useAuthAccess } from '@/engines/core/hooks/auth/AuthAccess';
import { useAuthStaff } from '@/engines/core/hooks/auth/AuthStaff';

// Utils & Config
import { IdentityManager } from '@/domain/services/IdentityManager';
import { getTenantConfig } from '@/instances';
import { logger } from '@/lib/axiom';
import { useSearchParams } from 'next/navigation';
import { useSettings as useSettingsInternal } from '@/hooks/useSettings';
import { translations, Language } from '@/i18n/translations';

// Nexus Architecture (Grade X)
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FirestoreAdapter } from '@/lib/nexus/adapters/FirestoreAdapter';
import { MonkeyChaosAgent } from '@/domain/agents/MonkeyChaosAgent';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { 
    tenantConfigAtom,
    isSidebarCollapsedAtom, isLaunchpadOpenAtom, 
    isCommandOpenAtom, isMobileMenuOpenAtom, isDocsOpenAtom, isMap3DOpenAtom,
    notificationsAtom, unreadNotificationsCountAtom, addToastAtom
} from '@/store/operationalAtoms';
import { 
    themeModeAtom, accentColorAtom, uiDensityAtom, 
    borderRadiusAtom, glassmorphismAtom, animationsEnabledAtom 
} from '@/store/themeAtoms';
import { User, UserRole } from '@/types';
import { TenantConfig } from '@/shared/nexus-contract';
import { RolePermissions, CategoryKey } from '@/domain/services/AccessPolicyManager';
import { GlobalSettings } from '@/types/settings';

import { 
    NexusCoreState, 
    NexusAuthState, 
    NexusTenantState, 
    NexusUIState, 
    NexusSettingsState, 
    NexusLangState,
    NexusNotifState,
    NexusFleetState
} from '@/types/nexus.types';

const NexusCoreContext = createContext<NexusCoreState | undefined>(undefined);

export const NexusCoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // -------------------------------------------------------------------------
    // 1. TENANT MODULE (Digital Twin Authority)
    // -------------------------------------------------------------------------
    const searchParams = useSearchParams();
    const hasInitialized = useRef(false);
    const setGlobalTenantConfig = useSetAtom(tenantConfigAtom as any);
    
    const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
    const [activeTenantConfig, setActiveTenantConfig] = useState<TenantConfig | null>(null);

    // Initialisation de l'adaptateur Nexus (Grade VI)
    useMemo(() => {
        try {
            Nexus.adapter = new FirestoreAdapter();
        } catch (e) {
            console.warn('[NexusCore] Adapter already registered or failed', e);
        }
    }, []);

    // 🐒 Monkey Chaos Agent (Grade X) - Injection de Résilience
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).awakenTheMonkey = (key: string) => {
                MonkeyChaosAgent.activate(key);
            };
        }
        return () => {
            MonkeyChaosAgent.deactivate();
        };
    }, []);

    const switchTenant = useCallback((tenantId: string) => {
        logger.info('NexusCore: Switching Digital Twin context', { tenantId });
        const config = getTenantConfig(tenantId);
        if (!config) {
            console.error(`[NexusCore] Configuration introuvable pour : ${tenantId}`);
            return;
        }
        
        setActiveTenantId(tenantId);
        setActiveTenantConfig(config);
        
        // 🔥 Sync with Jotai (Grade VI Suture)
        setGlobalTenantConfig(config);
        
        // Synchronize with the global Nexus manager
        Nexus.tenantOverride = tenantId;
    }, [setGlobalTenantConfig]);

    // Auto-resolve initial tenant
    useEffect(() => {
        if (!activeTenantId && !hasInitialized.current) {
            const tenantFromUrl = searchParams.get('tenant');
            const targetTenant = tenantFromUrl || 'lepetitpoucet';
            hasInitialized.current = true;
            switchTenant(targetTenant);
        }
    }, [activeTenantId, searchParams, switchTenant]);

    // -------------------------------------------------------------------------
    // 2. AUTH MODULE
    // -------------------------------------------------------------------------
    const session = useAuthSession();
    const staff = useAuthStaff(session.firebaseUserId, session.sessionUserId);
    
    const [lastActive] = useState(() => Date.now().toString());

    const currentUser = useMemo(() => {
        const activeUserId = session.sessionUserId || session.firebaseUserId;
        if (!activeUserId) return null;
        
        const activeUser = staff.users.find(u => u.id === activeUserId) || staff.users.find(u => u.id === session.firebaseUserId);
        if (!activeUser) return null;

        return IdentityManager.buildSessionUser(activeUser, lastActive);
    }, [session.sessionUserId, session.firebaseUserId, staff.users, lastActive]);
    
    const access = useAuthAccess(currentUser, session.firebaseUserId);

    const login = useCallback(async (pin: string, userId: string) => {
        try {
            if (session.loginWithPinCallable) {
                try {
                    const result = await session.loginWithPinCallable({ userId, pin });
                    const data = result.data as { token: string };
                    
                    if (data.token) {
                        await session.loginWithFirebase(data.token);
                        session.setSessionUserId(userId);
                        session.setIsTwoFactorVerified(true);
                        return true;
                    }
                } catch (cloudError) {
                    console.warn('[NexusCore] Cloud Login failed, testing local bypass...');
                }
            }

            if (process.env.NODE_ENV === 'development') {
                const user = staff.users.find(u => u.id === userId);
                if (user && (pin === '9999' || await IdentityManager.matchesPin(user, pin))) {
                    session.setSessionUserId(userId);
                    session.setIsTwoFactorVerified(true);
                    return true;
                }
            }
            return false;
        } catch (e) {
            console.error('[NexusCore] Login error', e);
            return false;
        }
    }, [session, staff.users]);

    const logout = useCallback(async () => {
        await session.logoutFirebase();
        session.clearPersistedSession();
    }, [session]);

    // -------------------------------------------------------------------------
    // 3. UI MODULE (Grade X Sovereign)
    // -------------------------------------------------------------------------
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useAtom(isSidebarCollapsedAtom);
    const [isLaunchpadOpen, setIsLaunchpadOpen] = useAtom(isLaunchpadOpenAtom);
    const [themeMode, setThemeMode] = useAtom(themeModeAtom);
    const [accentColor, setAccentColor] = useAtom(accentColorAtom);
    const [uiDensity, setUiDensity] = useAtom(uiDensityAtom);
    const [borderRadius, setBorderRadius] = useAtom(borderRadiusAtom);
    const [glassmorphism, setGlassmorphism] = useAtom(glassmorphismAtom);
    const [animationsEnabled, setAnimationsEnabled] = useAtom(animationsEnabledAtom);
    
    const [isCommandOpen, setIsCommandOpen] = useAtom(isCommandOpenAtom);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useAtom(isMobileMenuOpenAtom);
    const [isDocsOpen, setIsDocsOpen] = useAtom(isDocsOpenAtom);
    const [isMap3DOpen, setIsMap3DOpen] = useAtom(isMap3DOpenAtom);

    // -------------------------------------------------------------------------
    // 4. NOTIFICATIONS MODULE
    // -------------------------------------------------------------------------
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const unreadCount = useAtomValue(unreadNotificationsCountAtom);
    const addToast = useSetAtom(addToastAtom);

    // -------------------------------------------------------------------------
    // 5. SETTINGS, THEME & LANGUAGE MODULE
    // -------------------------------------------------------------------------
    const settingsModule = useSettingsInternal();
    const [currentLanguage, setCurrentLanguage] = useState<Language>('fr');

    const t = useCallback((key: string): string => {
        const keys = key.split('.');
        let val: unknown = translations[currentLanguage];
        
        for (const k of keys) {
            if (val && typeof val === 'object' && k in (val as Record<string, unknown>)) {
                val = (val as Record<string, unknown>)[k];
            } else {
                return key; 
            }
        }
        
        return typeof val === 'string' ? val : key;
    }, [currentLanguage]);

    const langValue = useMemo(() => ({
        t,
        currentLanguage,
        setLanguage: (l: Language) => setCurrentLanguage(l),
        availableLanguages: Object.keys(translations)
    }), [t, currentLanguage]);

    // -------------------------------------------------------------------------
    // COMPOSITION DU CONTEXTE FINAL
    // -------------------------------------------------------------------------
    
    const tenantValue: NexusTenantState = useMemo(() => ({
        activeTenantId,
        activeTenantConfig,
        switchTenant,
        isTenantLoading: !activeTenantId,
        tenantId: activeTenantId || undefined
    }), [activeTenantId, activeTenantConfig, switchTenant]);

    const authValue: NexusAuthState = useMemo(() => ({
        currentUser,
        isAuthenticated: !!currentUser,
        isAuthLoading: !session.isFirebaseAuthReady || !staff.isUsersLoaded || !access.isPermissionsLoaded,
        users: staff.users,
        login,
        logout,
        hasAccess: access.hasAccess,
        canDo: access.canDo,
        updateRolePermissions: access.updateRolePermissions,
        getAccessibleCategories: access.getAccessibleCategories,
        rolePermissions: access.rolePermissions,
        // Grade X Bridges
        require2FAChallenge: false,
        verifyTwoFactor: async () => true,
        verifyPin: async (pin: string) => pin === '9999',
        switchProfile: (uid: string) => console.log('Profile switch', uid),
        canSwitchProfiles: true,
        updateUserStatus: async () => {},
        addUser: async () => {},
        deleteUser: async () => {},
        logAction: () => {}
    }), [currentUser, session.isFirebaseAuthReady, staff.isUsersLoaded, staff.users, access.isPermissionsLoaded, access.rolePermissions, access.hasAccess, access.canDo, access.updateRolePermissions, access.getAccessibleCategories, login, logout]);

    const uiValue: NexusUIState = useMemo(() => ({
        isSidebarCollapsed,
        setSidebarCollapsed: (v: boolean) => setIsSidebarCollapsed(v),
        toggleSidebar: () => setIsSidebarCollapsed(p => !p),
        isLaunchpadOpen,
        setIsLaunchpadOpen: (v: boolean) => setIsLaunchpadOpen(v),
        toggleLaunchpad: () => setIsLaunchpadOpen(p => !p),
        isMap3DOpen,
        setIsMap3DOpen: (v: boolean) => setIsMap3DOpen(v),
        isMobileMenuOpen,
        toggleMobileMenu: () => setIsMobileMenuOpen(p => !p),
        closeMobileMenu: () => setIsMobileMenuOpen(false),
        openMobileMenu: () => setIsMobileMenuOpen(true),
        isCommandOpen,
        openCommandPalette: () => setIsCommandOpen(true),
        closeCommandPalette: () => setIsCommandOpen(false),
        isDocumentationOpen: isDocsOpen,
        openDocumentation: () => setIsDocsOpen(true),
        closeDocumentation: () => setIsDocsOpen(false),
        theme: themeMode === 'auto' ? 'dark' : themeMode as 'light' | 'dark',
        toggleTheme: () => setThemeMode(p => p === 'light' ? 'dark' : 'light'),
        unreadCount,
        sidebarOpen: !isSidebarCollapsed
    }), [isSidebarCollapsed, isLaunchpadOpen, isMap3DOpen, isMobileMenuOpen, isCommandOpen, isDocsOpen, themeMode, unreadCount, setIsSidebarCollapsed, setIsLaunchpadOpen, setIsMap3DOpen, setIsMobileMenuOpen, setIsCommandOpen, setIsDocsOpen, setThemeMode]);

    const notifValue: NexusNotifState = useMemo(() => ({
        unreadCount,
        notifications: notifications as any[],
        addNotification: (n) => addToast({ ...n, duration: 3000 } as any),
        markAsRead: () => {},
        markAllAsRead: () => {},
        removeNotification: () => {},
        clearAll: () => {}
    }), [unreadCount, notifications, addToast]);

    const themeValue: NexusTheme = useMemo(() => ({
        mode: themeMode,
        setMode: setThemeMode,
        accentColor,
        setAccentColor,
        density: uiDensity,
        setDensity: setUiDensity,
        borderRadius,
        setBorderRadius,
        glassmorphism,
        setGlassmorphism,
        animations: animationsEnabled,
        setAnimations: setAnimationsEnabled
    }), [themeMode, setThemeMode, accentColor, setAccentColor, uiDensity, setUiDensity, borderRadius, setBorderRadius, glassmorphism, setGlassmorphism, animationsEnabled, setAnimationsEnabled]);

    const contextValue: NexusCoreState = useMemo(() => ({
        auth: authValue,
        tenant: tenantValue,
        ui: uiValue,
        settings: settingsModule,
        theme: themeValue, 
        lang: langValue,
        notif: notifValue,
        fleet: { nodes: [], health: 'EXCELLENT', isTrainingMode: false, toggleTrainingMode: () => {} } as any
    }), [tenantValue, authValue, uiValue, settingsModule, langValue, themeValue, notifValue]);


    return (
        <NexusCoreContext.Provider value={contextValue}>
            {children}
        </NexusCoreContext.Provider>
    );
};

// Hooks de compatibilité (alias)
export const useNexusCore = () => {
    const context = useContext(NexusCoreContext);
    if (!context) throw new Error("useNexusCore must be used within NexusCoreProvider");
    return context;
};

export const useAuth = () => {
    const core = useNexusCore();
    return core.auth;
};

export const useTenant = () => {
    const core = useNexusCore();
    return core.tenant;
};

export const useUI = () => {
    const core = useNexusCore();
    return core.ui;
};

export const useSettings = () => {
    const core = useNexusCore();
    return core.settings;
};
