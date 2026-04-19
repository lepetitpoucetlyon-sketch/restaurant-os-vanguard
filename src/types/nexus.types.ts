import { User, UserRole } from './auth.types';
import { TenantConfig } from '@/shared/nexus-contract';
import { GlobalSettings } from './settings';
import { RolePermissions, CategoryKey } from '@/domain/services/AccessPolicyManager';
import { Language } from '@/i18n/translations';

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
    updateUserStatus?: (userId: string, status: any) => Promise<void>;
    addUser?: (user: Partial<User>) => Promise<void>;
    deleteUser?: (userId: string) => Promise<void>;
    logAction?: (action: string, metadata?: any) => void;
    [key: string]: any;
}

export interface NexusTenantState {
    activeTenantId: string | null;
    activeTenantConfig: TenantConfig | null;
    switchTenant: (tenantId: string) => void;
    isTenantLoading: boolean;
    tenantId?: string; // Legacy alias
    [key: string]: any;
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
    settings?: any; // Shortcut to settings module if needed
    [key: string]: any;
}

export interface NexusSettingsState {
    settings: GlobalSettings;
    isLoading: boolean;
    isSaving: boolean;
    lastSaved: Date | null;
    updateSettings: (newSettings: GlobalSettings) => Promise<void>;
    updateConfig?: (key: string, data: any) => Promise<void>;
    updateIdentity?: (data: any) => Promise<void>;
    updateGoals?: (data: any) => Promise<void>;
    updateSchedule?: (data: any) => Promise<void>;
    updateService?: (data: any) => Promise<void>;
    addClosedPeriod?: (data: any) => Promise<void>;
    deleteClosedPeriod?: (id: string) => Promise<void>;
    updateReservationConfig?: (data: any) => Promise<void>;
    updateReservationSlots?: (data: any) => Promise<void>;
    updateSLM?: (data: any) => Promise<void>;
    updateList?: (data: any) => Promise<void>;
    [key: string]: any;
}

export interface NexusFleetState {
    fleet: any[];
    isTrainingMode: boolean;
    toggleTrainingMode: () => void;
    triggerRebalancing?: () => Promise<void>;
    setInstances?: (instances: any[]) => void;
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
    notifications: any[];
    [key: string]: any;
}

export interface NexusCoreState {
    auth: NexusAuthState;
    tenant: NexusTenantState;
    ui: NexusUIState;
    settings: NexusSettingsState;
    theme: any; 
    lang: NexusLangState;
    notif: NexusNotifState;
    fleet?: NexusFleetState;
}
