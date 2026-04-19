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
}

export interface NexusTenantState {
    activeTenantId: string | null;
    activeTenantConfig: TenantConfig | null;
    switchTenant: (tenantId: string) => void;
    isTenantLoading: boolean;
}

export interface NexusUIState {
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    isLaunchpadOpen: boolean;
    toggleLaunchpad: () => void;
}

export interface NexusSettingsState {
    settings: GlobalSettings;
    isLoading: boolean;
    isSaving: boolean;
    lastSaved: Date | null;
    updateSettings: (newSettings: GlobalSettings) => Promise<void>;
}

export interface NexusLangState {
    t: (key: string) => string;
    currentLanguage: Language;
    setLanguage: (l: Language) => void;
    availableLanguages: string[];
}

export interface NexusNotifState {
    addNotification: (notif: { title: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }) => void;
    notifications: any[];
}

export interface NexusCoreState {
    auth: NexusAuthState;
    tenant: NexusTenantState;
    ui: NexusUIState;
    settings: NexusSettingsState;
    theme: Record<string, unknown>; // Reserved for Grade X Theme Engine
    lang: NexusLangState;
    notif: NexusNotifState;
}
