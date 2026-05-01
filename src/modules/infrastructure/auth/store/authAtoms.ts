import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { User } from '@nexus/contracts';
import { TenantConfig } from '@shared/nexus-contract';

/**
 * 🔒 AUTH & IDENTITY ATOMS - Grade VI
 */

export const currentUserAtomBase = atomWithStorage<User | null>('nexus_user_session', null);
export const currentUserAtom = atom(
    (get) => {
        const user = get(currentUserAtomBase);
        if (user && !user.tenantId) {
            return { ...user, tenantId: 'evolution' }; // Default tenant for legacy sessions
        }
        return user;
    },
    (get, set, nextValue: User | null) => {
        set(currentUserAtomBase, nextValue);
    }
);
export const isAuthenticatedAtom = atom((get) => !!get(currentUserAtom));
export const userRoleAtom = atom((get) => get(currentUserAtom)?.role || 'client');


// Grade VI Permissions Strategy
export type Role = 'admin' | 'manager' | 'staff' | 'client';

// Persist role permissions locally (Grade VI Sovereignty)
export const rolePermissionsAtom = atomWithStorage<Record<string, string[]>>('nexus_role_permissions', {
    admin: ['*'],
    manager: ['orders.view', 'orders.edit', 'inventory.view', 'inventory.edit', 'staff.view'],
    staff: ['orders.view', 'orders.edit', 'inventory.view'],
    client: []
});

export const userPermissionsAtom = atom((get) => {
    const role = get(userRoleAtom);
    const rolePermissions = get(rolePermissionsAtom);
    return rolePermissions[role] || [];
});

// UI Permission helper selector
export const canDoAtom = atom((get) => (permission: string) => {
    const role = get(userRoleAtom);
    const permissions = get(userPermissionsAtom);
    
    if (role === 'admin') return true;
    if (permissions.includes('*')) return true;
    
    return permissions.includes(permission);
});

// Action to update permissions
export const updateRolePermissionsAtom = atom(
    null,
    (get, set, { role, permissions }: { role: string; permissions: string[] }) => {
        const current = get(rolePermissionsAtom);
        set(rolePermissionsAtom, {
            ...current,
            [role]: permissions
        });
    }
);
