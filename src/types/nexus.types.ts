import { User, UserRole, UserStatus } from './auth.types';
import { TenantConfig } from '@/shared/nexus-contract';
import { GlobalSettings } from './settings';
import { RolePermissions, CategoryKey } from '@/domain/services/AccessPolicyManager';
import { Language } from '@/i18n/translations';
import { ThemeMode, AccentColor, UIDensity, BorderRadius } from '@/store/themeAtoms';
import { EmpireInstance } from '@/domain/types/empire';

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
    verifyPin?: (pin: string) => Promise<boolean>;
    switchProfile?: (userId: string) => void;
    canSwitchProfiles?: boolean;
    updateUserStatus?: (userId: string, status: string) => Promise<void>;
    addUser?: (user: Partial<User>) => Promise<void>;
    deleteUser?: (userId: string) => Promise<void>;
    logAction?: (action: string, metadata?: Record<string, unknown>) => void;
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
    settings?: Record<string, unknown>; // Shortcut to settings module if needed
}

export interface NexusSettingsState {
    settings: GlobalSettings;
    isLoading: boolean;
    isSaving: boolean;
    lastSaved: Date | null;
    updateSettings: (newSettings: GlobalSettings) => Promise<void>;
    updateConfig?: (key: string, data: Record<string, unknown>) => Promise<void>;
    updateIdentity?: (data: Record<string, unknown>) => Promise<void>;
    updateGoals?: (data: Record<string, unknown>) => Promise<void>;
    updateSchedule?: (data: Record<string, unknown>) => Promise<void>;
    updateService?: (data: Record<string, unknown>) => Promise<void>;
    addClosedPeriod?: (data: Record<string, unknown>) => Promise<void>;
    deleteClosedPeriod?: (id: string) => Promise<void>;
    updateReservationConfig?: (data: Record<string, unknown>) => Promise<void>;
    updateReservationSlots?: (data: Record<string, unknown>) => Promise<void>;
    updateSLM?: (data: Record<string, unknown>) => Promise<void>;
    updateList?: (data: Record<string, unknown>) => Promise<void>;
}
export interface NexusFleetState {
    nodes: Record<string, unknown>[];
    health: string;
    triggerRebalancing?: () => Promise<void>;
}

export interface NexusLangState {
    t: (key: string) => string;
    currentLanguage: Language;
    setLanguage: (l: Language) => void;
    availableLanguages: string[];
    language?: Language; // Legacy alias
}

export interface NexusNotifState {
    unreadCount: number;
    addNotification: (notif: { title: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    notifications: Record<string, unknown>[];
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
    globalMetrics: Record<string, unknown> | null;
    stats: {
        totalRevenue: number;
        averageHealth: number;
        consolidated?: {
            totalLaborCost?: number;
            averageFoodCost?: number;
        };
    };
    macroInsights: Record<string, unknown>[];
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
    registerInstance: (instance: Record<string, unknown>) => Promise<void>;
    launchPreview: (key: string) => void;
    broadcastConfiguration: (config: Record<string, unknown>) => Promise<void>;
    complianceService: any;
    haccpBridge: any;
    fleet: Record<string, unknown> | null;
    crm: Record<string, unknown>;
    intelligence: Record<string, unknown>;
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
}
