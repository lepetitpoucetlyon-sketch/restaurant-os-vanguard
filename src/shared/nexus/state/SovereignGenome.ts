import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { DEFAULT_TENANT_CONFIG } from '@shared/nexus-contract';
import type { 
  TenantConfig
} from '@shared/nexus-contract';
import { EmpireInstance } from '@domain/types/empire';
import { FleetBloomFilter } from '@/lib/bloom-filter';
import type { Notification as AppNotification, Floor, Zone, User } from '@nexus/contracts';

const notifications = atom<AppNotification[]>([]);

export interface MasterConfig {
    maintenanceMode?: boolean;
    targetVersion?: string;
    [key: string]: any;
}

export const globalPolicyAtom = atom<MasterConfig>({});
export const commanderSignatureAtom = atom<string | null>(null);

/**
 * 📈 FORECAST_GENOME - Predictive & Shared Metrics
 * Centralizes data that multiple domains need to share for forecasting.
 */
export const FORECAST_GENOME = {
    expectedCovers: atom<number>(20), // Default 20
};
export const expectedCoversAtom = FORECAST_GENOME.expectedCovers;

/**
 * 🏛️ UI_GENOME - Visual & Interactive Surface
 */
export const UI_GENOME = {
    isSidebarCollapsed: atomWithStorage('nexus_sidebar_collapsed', false),
    isLaunchpadOpen: atom(false),
    theme: atomWithStorage<'light' | 'dark'>('nexus_theme', 'dark'),
    isTrainingMode: atomWithStorage('nexus_training_mode', false),
    notifications: notifications,
    unreadCount: atom((get) => get(notifications).filter(n => !n.read).length || 0),
    isCommandOpen: atom(false),
    isMobileMenuOpen: atom(false),
    isDocsOpen: atom(false),
    isMap3DOpen: atom(false),
    performanceMode: atomWithStorage('nexus_performance_mode', false),
};

// 🏛️ TOAST SYSTEM (Sovereign Helper)
export const toastsAtom = atom<any[]>([]);
export const addToastAtom = atom(
    null,
    (get, set, toast: { title?: string, message?: string, type: string, duration: number }) => {
        const id = `toast_${Date.now()}`;
        set(toastsAtom, (prev) => [...prev, { ...toast, id }]);
        setTimeout(() => {
            set(toastsAtom, (prev) => prev.filter(t => t.id !== id));
        }, toast.duration || 3000);
    }
);

/**
 * 🧬 FLEET_GENOME - Multi-Tenancy & Topology
 */
const _tenantIdBase = atom<string>(
    typeof window !== 'undefined' ? (localStorage.getItem('nexus_tenant_id') || 'lepetitpoucet') : 'lepetitpoucet'
);

export const FLEET_GENOME = {
    tenantId: atom(
        (get) => get(_tenantIdBase),
        (get, set, next: string) => {
            if (typeof window !== 'undefined') localStorage.setItem('nexus_tenant_id', next);
            set(_tenantIdBase, next);
        }
    ),
    tenantConfig: atomWithStorage<TenantConfig>('nexus_tenant_config', {
        id: 'default_node',
        ...DEFAULT_TENANT_CONFIG
    }),
    snapshot: atom<EmpireInstance[]>([]),
    bloomFilter: atom(new FleetBloomFilter()),
    activeSlots: atom<Map<string, EmpireInstance>>(new Map()),
    activeFleetTenant: atom<string | null>(null),
    floors: atom<Floor[]>([]),
    zones: atom<Zone[]>([]),
    zonesLocked: atom(false),
    currentFloorId: atom<string>('rdc'),
};

/**
 * 🛡️ AUTH_GENOME - Security & Identity
 */
const _currentUserBase = atomWithStorage<User | null>('nexus_user_session', null);

export const AUTH_GENOME = {
    currentUser: atom(
        (get) => {
            const user = get(_currentUserBase);
            if (user && !user.tenantId) return { ...user, tenantId: 'evolution' };
            return user;
        },
        (get, set, next: User | null) => set(_currentUserBase, next)
    ),
    isAuthenticated: atom((get) => !!get(_currentUserBase)),
    rolePermissions: atomWithStorage<Record<string, string[]>>('nexus_role_permissions', {
        admin: ['*'],
        manager: ['*'], // Manager access all
        staff: ['orders.view', 'orders.edit', 'inventory.view'],
        kitchen_line: [
            'ops.view',        // KDS/Production
            'logistics.view',  // Kitchen/Stock
            'compliance.view', // HACCP
            'hr.view',         // Access to own records
            'hr.records'       // Permission for personal payroll/shifts
        ],
        client: []
    }),
};

/**
 * 🛰️ DERIVED_GENOME - Computed Sovereign States
 */
export const DERIVED_GENOME = {
    userRole: atom<string>((get) => get(AUTH_GENOME.currentUser)?.role || 'client'),
    userPermissions: atom<string[]>((get) => {
        const role = get(DERIVED_GENOME.userRole) as string;
        const perms = get(AUTH_GENOME.rolePermissions) as Record<string, string[]>;
        return perms[role] || [];
    }),
    canDo: atom((get) => (permission: string) => {
        const role = get(DERIVED_GENOME.userRole) as string;
        const permissions = get(DERIVED_GENOME.userPermissions) as string[];
        return role === 'admin' || permissions.includes('*') || permissions.includes(permission);
    }),
    focusedTenantDetails: atom((get) => {
        const tenantId = get(FLEET_GENOME.activeFleetTenant);
        const slots = get(FLEET_GENOME.activeSlots);
        if (!tenantId) return null;
        return slots.get(tenantId) || { id: tenantId, status: 'synced', isVirtual: true };
    })
};

/**
 * 🚨 EMERGENCY_GENOME - System Criticality
 */
export const EMERGENCY_GENOME = {
    lockout: atom<boolean>(false),
    maintenanceMode: atom((get) => get(FLEET_GENOME.tenantConfig).status?.maintenanceMode || false),
};

// --- 🏛️ SOVEREIGN EXPORTS (Grade X) ---

// UI
export const isSidebarCollapsedAtom = UI_GENOME.isSidebarCollapsed;
export const isLaunchpadOpenAtom = UI_GENOME.isLaunchpadOpen;
export const themeAtom = UI_GENOME.theme;
export const isTrainingModeAtom = UI_GENOME.isTrainingMode;
export const notificationsAtom = UI_GENOME.notifications;
export const unreadNotificationsCountAtom = UI_GENOME.unreadCount;
export const isCommandOpenAtom = UI_GENOME.isCommandOpen;
export const isMobileMenuOpenAtom = UI_GENOME.isMobileMenuOpen;
export const isDocsOpenAtom = UI_GENOME.isDocsOpen;
export const isMap3DOpenAtom = UI_GENOME.isMap3DOpen;
export const performanceModeAtom = UI_GENOME.performanceMode;

// Fleet
export const tenantIdAtom = FLEET_GENOME.tenantId;
export const tenantConfigAtom = FLEET_GENOME.tenantConfig;
export const fleetSnapshotAtom = FLEET_GENOME.snapshot;
export const activeFleetTenantAtom = FLEET_GENOME.activeFleetTenant;
export const activeTenantSlotsAtom = FLEET_GENOME.activeSlots;
export const focusedTenantDetailsAtom = DERIVED_GENOME.focusedTenantDetails;
export const floorsAtom = FLEET_GENOME.floors;
export const zonesAtom = FLEET_GENOME.zones;
export const zonesLockedAtom = FLEET_GENOME.zonesLocked;
export const currentFloorIdAtom = FLEET_GENOME.currentFloorId;

// Auth
export const currentUserAtom = AUTH_GENOME.currentUser;
export const isAuthenticatedAtom = AUTH_GENOME.isAuthenticated;
export const userRoleAtom = DERIVED_GENOME.userRole;
export const userPermissionsAtom = DERIVED_GENOME.userPermissions;
export const canDoAtom = DERIVED_GENOME.canDo;
export const rolePermissionsAtom = AUTH_GENOME.rolePermissions;

// Emergency
export const emergencyLockoutAtom = EMERGENCY_GENOME.lockout;
