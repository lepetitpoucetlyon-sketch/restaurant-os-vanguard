import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { User } from '@/types';

/**
 * 🔒 AUTH & IDENTITY ATOMS - Grade VI
 */

export const currentUserAtom = atomWithStorage<User | null>('nexus_user_session', null);
export const isAuthenticatedAtom = atom((get) => !!get(currentUserAtom));
export const userRoleAtom = atom((get) => get(currentUserAtom)?.role || 'guest');

// Multi-tenant isolation atom
export const tenantConfigAtom = atom<any>(null);

// Grade VI Permissions Strategy
export type Role = 'admin' | 'manager' | 'staff' | 'guest';

// Persist role permissions locally (Grade VI Sovereignty)
export const rolePermissionsAtom = atomWithStorage<Record<string, string[]>>('nexus_role_permissions', {
    admin: ['*'],
    manager: ['orders.view', 'orders.edit', 'inventory.view', 'inventory.edit', 'staff.view'],
    staff: ['orders.view', 'orders.edit', 'inventory.view'],
    guest: []
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
