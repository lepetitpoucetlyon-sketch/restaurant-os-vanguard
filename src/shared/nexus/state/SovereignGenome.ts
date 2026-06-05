import { atom } from 'jotai';
import { DEFAULT_TENANT_CONFIG } from '@/shared/nexus-contract';
import { TenantConfigSchema, type TenantConfig } from '@/domain/schemas/tenant';
import { UserSchema, type User } from '@/domain/schemas/users';
import { EmpireInstance } from '@domain/types/empire';
import { FleetBloomFilter } from '@/lib/bloom-filter';
import type { Notification as AppNotification, Floor, Zone } from '@nexus/contracts';
import { SovereignStorage } from '@/shared/services/SovereignStorage';
import { z } from 'zod';

const notifications = atom<AppNotification[]>([]);

export interface Toast {
    id: string;
    title?: string;
    message?: string;
    type: string;
    duration: number;
}

export interface MasterConfig {
    maintenanceMode?: boolean;
    targetVersion?: string;
    [key: string]: unknown;
}

export const globalPolicyAtom = atom<MasterConfig>({ maintenanceMode: undefined });
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
const ThemeSchema = z.enum(['light', 'dark']).default('dark');
const BooleanSchema = z.boolean();

export const UI_GENOME = {
    isSidebarCollapsed: SovereignStorage.atomWithSovereignStorage('nexus_sidebar_collapsed', BooleanSchema, false),
    isLaunchpadOpen: atom(false),
    theme: SovereignStorage.atomWithSovereignStorage<'light' | 'dark'>('nexus_theme', ThemeSchema, 'dark'),
    isTrainingMode: SovereignStorage.atomWithSovereignStorage('nexus_training_mode', BooleanSchema, false),
    notifications: notifications,
    unreadCount: atom((get) => get(notifications).filter(n => !n.read).length || 0),
    isCommandOpen: atom(false),
    isMobileMenuOpen: atom(false),
    isDocsOpen: atom(false),
    isMap3DOpen: atom(false),
    performanceMode: SovereignStorage.atomWithSovereignStorage('nexus_performance_mode', BooleanSchema, false),
};

// 🏛️ TOAST SYSTEM (Sovereign Helper)
export const toastsAtom = atom<Toast[]>([]);
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
// Storage import moved to top

const TenantIdSchema = z.string().min(1).default('lepetitpoucet');

const _tenantIdBase = atom(SovereignStorage.get('nexus_tenant_id', TenantIdSchema, 'lepetitpoucet').data);

export const tenantConfigAtom = SovereignStorage.atomWithSovereignStorage<TenantConfig>('nexus_tenant_config', TenantConfigSchema, {
    id: 'default_node',
    ...DEFAULT_TENANT_CONFIG
} as TenantConfig);

export const FLEET_GENOME = {
    tenantId: atom(
        (get) => get(_tenantIdBase),
        (get, set, next: string) => {
            SovereignStorage.set('nexus_tenant_id', next, TenantIdSchema);
            set(_tenantIdBase, next);
        }
    ),
    tenantConfig: tenantConfigAtom,
    snapshot: atom<EmpireInstance[]>([]),
    bloomFilter: atom(new FleetBloomFilter()),
    activeSlots: atom<Map<string, EmpireInstance>>(new Map()),
    activeFleetTenant: atom<string | null>(null),
    floors: atom<Floor[]>([]),
    zones: atom<Zone[]>([]),
    zonesLocked: atom(false),
    currentFloorId: atom<string>('rdc'),
    brandTokens: atom(
        (get) => {
            const config = get(tenantConfigAtom);
            // On fallback sur un objet minimal si branding n'existe pas
            return (config.branding || {}) as unknown as import('../tokens/brand').BrandConfig;
        },
        (get, set, next: import('../tokens/brand').BrandConfig) => {
            const config = get(tenantConfigAtom);
            set(tenantConfigAtom, {
                ...config,
                branding: next as unknown as typeof config.branding // On cast ici car branding dans TenantConfig attend un TenantTheme strict, mais on veut stocker le BrandConfig complet
            });
        }
    ),
};

/**
 * 🛡️ AUTH_GENOME - Security & Identity
 */
const _currentUserBase = SovereignStorage.atomWithSovereignStorage<User | null>('nexus_user_session', UserSchema.nullable(), null);

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
    rolePermissions: SovereignStorage.atomWithSovereignStorage<Record<string, string[]>>('nexus_role_permissions', z.record(z.string(), z.array(z.string())), {
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
export const userRoleAtom = atom<string>((get) => get(AUTH_GENOME.currentUser)?.role || 'client');

export const userPermissionsAtom = atom<string[]>((get) => {
    const role = get(userRoleAtom);
    const perms = get(AUTH_GENOME.rolePermissions);
    return (perms && perms[role]) || [];
});

export const canDoAtom = atom<(permission: string) => boolean>((get) => (permission: string): boolean => {
    const role = get(userRoleAtom);
    const permissions = get(userPermissionsAtom);
    return role === 'admin' || permissions.includes('*') || permissions.includes(permission);
});

export const focusedTenantDetailsAtom = atom((get) => {
    const tenantId = get(FLEET_GENOME.activeFleetTenant);
    const slots = get(FLEET_GENOME.activeSlots);
    if (!tenantId) return null;
    return slots.get(tenantId) || { id: tenantId, status: 'synced', isVirtual: true };
});

/**
 * 🚨 EMERGENCY_GENOME - System Criticality
 */
export const emergencyLockoutAtom = atom<boolean>(false);
export const maintenanceModeAtom = atom((get) => { 
    const config = get(tenantConfigAtom); 
    return config?.status?.maintenanceMode || false; 
});

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
export const fleetSnapshotAtom = FLEET_GENOME.snapshot;
export const activeFleetTenantAtom = FLEET_GENOME.activeFleetTenant;
export const activeTenantSlotsAtom = FLEET_GENOME.activeSlots;
// Fleet
export const floorsAtom = FLEET_GENOME.floors;
export const zonesAtom = FLEET_GENOME.zones;
export const zonesLockedAtom = FLEET_GENOME.zonesLocked;
export const currentFloorIdAtom = FLEET_GENOME.currentFloorId;
export const tenantBrandTokensAtom = FLEET_GENOME.brandTokens;

// Auth
export const currentUserAtom = AUTH_GENOME.currentUser;
export const isAuthenticatedAtom = AUTH_GENOME.isAuthenticated;
export const rolePermissionsAtom = AUTH_GENOME.rolePermissions;
