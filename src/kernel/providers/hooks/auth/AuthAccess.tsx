"use client";

import { useState, useEffect, useCallback } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { authedFetch } from '@/lib/client/authedFetch';
import { AccessPolicyManager, DEFAULT_ROLE_PERMISSIONS, type CategoryKey, type RolePermissions } from '@/lib/AccessPolicyManager';
import { ROOT_ADMIN } from '@/lib/IdentityManager';
import { User, UserRole } from '@nexus/contracts';

const ROLE_PERMISSIONS_COLLECTION = 'systemConfig';
const ROLE_PERMISSIONS_DOC_ID = 'role_permissions';

export interface CustomRole {
    id: string;
    label: string;
}

export function useAuthAccess(currentUser: User | null, firebaseUserId: string | null) {
    const [rolePermissions, setRolePermissions] = useState<RolePermissions>(DEFAULT_ROLE_PERMISSIONS);
    const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
    // ✅ Grade VI: Pre-loaded as true when no firebaseUser (no Firestore sub needed)
    const [isPermissionsLoaded, setIsPermissionsLoaded] = useState<boolean>(() => !firebaseUserId);

    useEffect(() => {
        if (!firebaseUserId) {
            // No user — permissions already initialized to defaults + loaded=true via lazy init
            return;
        }

        let isActive = true;
        const tenantId = currentUser?.tenantId || 'default';
        const permissionsPath = `tenants/${tenantId}/${ROLE_PERMISSIONS_COLLECTION}/${ROLE_PERMISSIONS_DOC_ID}`;

        const unsubscribePermissions = Nexus.adapter.onSnapshot(
            permissionsPath,
            async (data) => {
                if (data) {
                    setRolePermissions(AccessPolicyManager.sanitizeRolePermissions((data.permissions ?? data) as import("@nexus/contracts/nexus-contract").SovereignData, DEFAULT_ROLE_PERMISSIONS));
                    if (data.customRoles) {
                        setCustomRoles(data.customRoles as CustomRole[]);
                    } else {
                        setCustomRoles([]);
                    }
                } else {
                    const seededPermissions = AccessPolicyManager.sanitizeRolePermissions(DEFAULT_ROLE_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS);
                    setRolePermissions(seededPermissions);
                    setCustomRoles([]);
                }
                if (isActive) setIsPermissionsLoaded(true);
            },
            {
                onError: (error: unknown) => {
                    console.error('Unable to subscribe to role permissions', error);
                    if (isActive) {
                        setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
                        setCustomRoles([]);
                        setIsPermissionsLoaded(true);
                    }
                }
            }
        );

        return () => {
            isActive = false;
            unsubscribePermissions();
        };
    }, [firebaseUserId, currentUser?.tenantId]);

    const updateRolePermissions = useCallback(async (role: UserRole, categories: CategoryKey[]) => {
        const nextPermissions = AccessPolicyManager.sanitizeRolePermissions({
            ...rolePermissions,
            [role]: categories,
        }, DEFAULT_ROLE_PERMISSIONS);

        const tenantId = currentUser?.tenantId || 'default';
        const permissionsPath = `tenants/${tenantId}/${ROLE_PERMISSIONS_COLLECTION}/${ROLE_PERMISSIONS_DOC_ID}`;

        setRolePermissions(nextPermissions);
        await Nexus.adapter.set(permissionsPath, {
            permissions: nextPermissions,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.id ?? ROOT_ADMIN.id,
        }, { merge: true });
    }, [currentUser?.id, currentUser?.tenantId, rolePermissions]);

    const createCustomRole = useCallback(async (label: string) => {
        const tenantId = currentUser?.tenantId || 'default';
        const permissionsPath = `tenants/${tenantId}/${ROLE_PERMISSIONS_COLLECTION}/${ROLE_PERMISSIONS_DOC_ID}`;
        
        const newRoleId = `custom_${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
        const newRole: CustomRole = { id: newRoleId, label };
        const nextCustomRoles = [...customRoles, newRole];
        
        setCustomRoles(nextCustomRoles);
        await Nexus.adapter.set(permissionsPath, {
            customRoles: nextCustomRoles,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.id ?? ROOT_ADMIN.id,
        }, { merge: true });
        
        return newRoleId;
    }, [currentUser?.id, currentUser?.tenantId, customRoles]);

    const deleteCustomRole = useCallback(async (roleId: string) => {
        const tenantId = currentUser?.tenantId || 'default';
        const permissionsPath = `tenants/${tenantId}/${ROLE_PERMISSIONS_COLLECTION}/${ROLE_PERMISSIONS_DOC_ID}`;
        
        const nextCustomRoles = customRoles.filter(r => r.id !== roleId);
        const nextPermissions = { ...rolePermissions };
        delete nextPermissions[roleId];
        
        setCustomRoles(nextCustomRoles);
        setRolePermissions(nextPermissions);
        
        await Nexus.adapter.set(permissionsPath, {
            customRoles: nextCustomRoles,
            permissions: nextPermissions,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.id ?? ROOT_ADMIN.id,
        }, { merge: true });
    }, [currentUser?.id, currentUser?.tenantId, customRoles, rolePermissions]);

    /**
     * Assigne un rôle (standard ou custom) à un utilisateur du tenant.
     * Appelle /api/admin/users/assign-role qui met à jour Nexus + Firebase claims.
     * DB-agnostique : la route côté serveur gère la couche de persistance.
     */
    const assignRoleToUser = useCallback(async (userId: string, role: string): Promise<void> => {
        const response = await authedFetch('/api/admin/users/assign-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, role }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
            throw new Error((err as { error?: string }).error ?? `HTTP ${response.status}`);
        }
    }, []);

    const hasAccess = useCallback((category: CategoryKey) => {
        return AccessPolicyManager.hasAccess(currentUser, rolePermissions, category);
    }, [currentUser, rolePermissions]);

    const canDo = useCallback((action: string) => {
        return AccessPolicyManager.canDo(currentUser, action, {});
    }, [currentUser]);

    const getAccessibleCategories = useCallback(() => {
        return AccessPolicyManager.getAccessibleCategories(currentUser, rolePermissions);
    }, [currentUser, rolePermissions]);

    return {
        rolePermissions,
        customRoles,
        isPermissionsLoaded,
        updateRolePermissions,
        createCustomRole,
        deleteCustomRole,
        assignRoleToUser,
        hasAccess,
        canDo,
        getAccessibleCategories
    };
}
