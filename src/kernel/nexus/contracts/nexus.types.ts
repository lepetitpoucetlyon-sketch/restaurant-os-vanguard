import { User, UserRole, CategoryKey, RolePermissions } from './auth.types';
import { IntelligenceConfig } from './common.types';
import { TenantConfig, SovereignData, SovereignNode } from '@nexus/contracts/nexus-contract';

import { GlobalSettings, PerformanceGoals } from './settings';
import { Language } from '@/i18n/translations';
import { ThemeMode, AccentColor, UIDensity, BorderRadius } from './theme.types';
import { EmpireInstance, EmpireGlobalMetrics, FleetInsight } from './fleet.types';

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
    customRoles: Record<string, unknown>[];
    createCustomRole: (label: string) => Promise<string>;
    deleteCustomRole: (roleId: string) => Promise<void>;
    assignRoleToUser: (userId: string, role: string) => Promise<void>;
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
    updateSettings: (data: GlobalSettings) => Promise<void>;
    updateSchedule: (data: import('./settings').DaySchedule[]) => Promise<void>;
    updateService: (data: import('./settings').ServiceSettings) => Promise<void>;
    addClosedPeriod: (period: import('./settings').ClosedPeriod) => Promise<void>;
    deleteClosedPeriod: (id: string) => Promise<void>;
    updateIdentity: (data: import('./settings/identity').RestaurantIdentity) => Promise<void>;
    updateReservationConfig?: (data: SovereignData) => Promise<void>;
    updateReservationSlots?: (data: SovereignData) => Promise<void>;
    updateSLM?: (data: SovereignData) => Promise<void>;
    updateConfig: <K extends keyof GlobalSettings>(key: K, data: GlobalSettings[K]) => Promise<void>;
    updateList: <K extends keyof GlobalSettings>(key: K, data: GlobalSettings[K]) => Promise<void>;
    updateGoals: (data: PerformanceGoals) => Promise<void>;
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
    notifications: import('./common.types').Notification[];
    addNotification: (notif: { 
        type: import('./common.types').NotificationType; 
        title: string; 
        message: string; 
        module?: string;
        action?: { label: string; href: string };
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

export interface NexusTutorialStep {
    id: string;
    label: string;
    description: string;
    selector: string;
    path?: string;
    action?: () => void;
}

export interface NexusTutorialSection {
    id: string;
    title?: string;
    points: NexusTutorialStep[];
}

export interface NexusTutorialState {
    isActive: boolean;
    step: number;
    start: () => void;
    stop: () => void;
    startTutorial: (section?: NexusTutorialSection) => void;
    stopTutorial: () => void;
    nextStep: () => void;
    prevStep: () => void;
    currentSection: NexusTutorialSection | null;
    currentPointIndex: number;
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
        priceMultiplier?: number;
        targetVersion?: string;
        maintenanceMode?: boolean;
        licenceStatus?: 'ACTIVE' | 'LOCKED';
    }) => Promise<void>;
    // 🛡️ SUTURE GRADE X: Pure Contract Resolution
    complianceService: {
        isNF525Valid: boolean;
        lastSealHash: string;
        verifySiteIntegrity: (tenantId: string) => Promise<SovereignNode>;
        issueGlobalCertificate: (commanderId: string) => Promise<SovereignNode>;
    };
    haccpBridge: {
        reportHygieneHealth: (tenantId: string) => Promise<number>;
    };
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
    tutorial?: NexusTutorialState;
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
