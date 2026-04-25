import { User, UserRole, UserStatus } from '@/shared/types/auth.types';
import { IntelligenceConfig } from './common.types';
import { TenantConfig, BusinessLaws, ExpertConfig, SovereignData } from '@/shared/nexus-contract';

import { GlobalSettings } from './settings';
import { RolePermissions, CategoryKey } from '@/domain/services/AccessPolicyManager';
import { Language } from '@/i18n/translations';
import { ThemeMode, AccentColor, UIDensity, BorderRadius } from '@/store/themeAtoms';
import { EmpireInstance, EmpireGlobalMetrics } from '@/domain/types/empire';
import { FleetInsight, ConsolidatedMetrics } from '@/shared/types/fleet.types';

/**
 * 🏛️ NEXUS CORE INTERFACES (GRADE X)
 */

export interface NexusAuthState {
    currentUser: User | null;
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    users: User[];
    login: (pin: string, userId: string) => Promise<boolean>;
    logout: () => Promise<void>;
    hasAccess: (category: CategoryKey) => boolean;
    canDo: (action: string) => boolean;
    updateRolePermissions: (role: UserRole, categories: CategoryKey[]) => Promise<void>;
    getAccessibleCategories: () => CategoryKey[];
    rolePermissions: RolePermissions;
    // Grade X Extensions (Suture)
    require2FAChallenge?: boolean;
    verifyTwoFactor?: (code: string) => Promise<boolean>;
    verifyPin?: (pin: string, userId?: string) => Promise<boolean>;
    switchProfile?: (userId: string) => void;
    canSwitchProfiles?: boolean;
    updateUser?: (userId: string, data: Partial<User>) => Promise<void>;
    updateUserStatus?: (userId: string, status: 'active' | 'suspended' | 'on_leave') => Promise<void>;
    addUser?: (user: Partial<User>) => Promise<void>;
    deleteUser?: (userId: string) => Promise<void>;
    logAction?: (action: string, metadata?: {
        moduleId?: string;
        previousValue?: string | number | boolean;
        newValue?: string | number | boolean;
        [key: string]: string | number | boolean | undefined;
    }) => void;
}

export interface NexusTenantState {
    activeTenantId: string | null;
    activeTenantConfig: TenantConfig | null;
    switchTenant: (tenantId: string) => void;
    isTenantLoading: boolean;
    tenantId?: string; // Legacy alias
}

export interface NexusUIState {
    isSidebarCollapsed: boolean;
    setSidebarCollapsed: (v: boolean) => void;
    toggleSidebar: () => void;
    isLaunchpadOpen: boolean;
    setIsLaunchpadOpen: (v: boolean) => void;
    toggleLaunchpad: () => void;
    isMap3DOpen: boolean;
    setIsMap3DOpen: (v: boolean) => void;
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;
    openMobileMenu: () => void;
    isCommandOpen: boolean;
    openCommandPalette: () => void;
    closeCommandPalette: () => void;
    isDocumentationOpen: boolean;
    documentationCategory?: string;
    openDocumentation: (category?: string) => void;
    closeDocumentation: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    unreadCount: number;
    sidebarOpen?: boolean; 
    settings?: GlobalSettings; // Precise type
}

export interface NexusSettingsState {
    settings: GlobalSettings;
    isLoading: boolean;
    isSaving: boolean;
    lastSaved: Date | null;
    updateSettings: (newSettings: GlobalSettings) => Promise<void>;
    updateConfig: (key: keyof GlobalSettings, data: any) => Promise<void>;
    updateList: (key: keyof GlobalSettings, data: any) => Promise<void>;
    updateIdentity?: (data: any) => Promise<void>;
    updateGoals?: (data: any) => Promise<void>;
    updateSchedule?: (data: any) => Promise<void>;
    updateService?: (data: any) => Promise<void>;
    addClosedPeriod?: (data: { start: string; end: string; reason: string }) => Promise<void>;
    deleteClosedPeriod?: (id: string) => Promise<void>;
    updateReservationConfig?: (data: any) => Promise<void>;
    updateReservationSlots?: (data: any) => Promise<void>;
    updateSLM?: (data: any) => Promise<void>;
}



export interface NexusLangState {
    t: (key: string) => string;
    currentLanguage: Language;
    language: Language; // Heritage alias
    setLanguage: (l: Language) => void;
    availableLanguages: string[];
}

export interface NexusNotifState {
    unreadCount: number;
    notifications: import('@/types').Notification[];
    addNotification: (notif: { 
        title: string; 
        message: string; 
        type: import('@/types').NotificationType;
        module?: string;
        action?: { label: string; href?: string };
    }) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

export interface NexusTheme {
    mode: ThemeMode | 'auto';
    setMode: (mode: ThemeMode | 'auto') => void;
    accentColor: AccentColor;
    setAccentColor: (color: AccentColor) => void;
    density: UIDensity;
    setDensity: (density: UIDensity) => void;
    borderRadius: BorderRadius;
    setBorderRadius: (radius: BorderRadius) => void;
    glassmorphism: number;
    setGlassmorphism: (val: number) => void;
    animations: boolean;
    setAnimations: (val: boolean) => void;
}

export interface NexusFleetState {
    instanceIds: string[];
    instances: EmpireInstance[];
    globalMetrics: EmpireGlobalMetrics | null;
    stats: {
        totalRevenue: number;
        averageHealth: number;
        consolidated?: {
            totalLaborCost?: number;
            averageFoodCost?: number;
        };
    };
    macroInsights: FleetInsight[];
    isLoading: boolean;
    isSyncing: boolean;
    isEmpireMode: boolean;
    selectedInstanceId: string | null;
    isUpdateAvailable: boolean;
    updateInfo: {
        version: string;
        url: string;
    } | null;
    priceMultiplier: number;
    refreshFleet: (isBackground?: boolean) => Promise<void>;
    syncFleet: () => Promise<void>;
    selectInstance: (id: string | null) => void;
    registerInstance: (instance: EmpireInstance) => Promise<void>;
    launchPreview: (key: string) => void;
    broadcastConfiguration: (config: {
        targetVersion?: string;
        maintenanceMode?: boolean;
    }) => Promise<void>;
    complianceService: SovereignData;
    haccpBridge: SovereignData;
    fleet: EmpireGlobalMetrics | null;
    customer: {
        customers: SovereignData[];
    };
    intelligence: IntelligenceConfig;
    isTrainingMode: boolean;
    toggleTrainingMode: () => void;
    triggerRebalancing?: () => Promise<void>;
    nodes?: SovereignData[];
    health?: string;
    tutorial?: SovereignData;
}


export interface NexusCoreState {
    auth: NexusAuthState;
    tenant: NexusTenantState;
    ui: NexusUIState;
    settings: NexusSettingsState;
    theme: NexusTheme; 
    lang: NexusLangState;
    notif: NexusNotifState;
    fleet: NexusFleetState;
    tenantConfig: TenantConfig | null; // Suture Grade X
}

export interface BrandInput {
    name: string;
    primaryColor?: string;
    logoUrl?: string;
    atmosphere?: 'luxury' | 'bistro' | 'fast-food' | 'zen' | 'modern';
}
