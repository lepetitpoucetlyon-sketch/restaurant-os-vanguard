"use client";

import { useState, useEffect, useCallback } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { AccessPolicyManager, DEFAULT_ROLE_PERMISSIONS, type CategoryKey, type RolePermissions } from '@/domain/services/AccessPolicyManager';
import { ROOT_ADMIN } from '@/domain/services/IdentityManager';
import { User, UserRole } from '@/types';

const ROLE_PERMISSIONS_COLLECTION = 'systemConfig';
const ROLE_PERMISSIONS_DOC_ID = 'role_permissions';

export function useAuthAccess(currentUser: User | null, firebaseUserId: string | null) {
    const [rolePermissions, setRolePermissions] = useState<RolePermissions>(DEFAULT_ROLE_PERMISSIONS);
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
                    setRolePermissions(AccessPolicyManager.sanitizeRolePermissions(data.permissions ?? data, DEFAULT_ROLE_PERMISSIONS));
                } else {
                    const seededPermissions = AccessPolicyManager.sanitizeRolePermissions(DEFAULT_ROLE_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS);
                    setRolePermissions(seededPermissions);
                }
                if (isActive) setIsPermissionsLoaded(true);
            },
            {
                onError: (error) => {
                    console.error('Unable to subscribe to role permissions', error);
                    if (isActive) {
                        setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
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
        isPermissionsLoaded,
        updateRolePermissions,
        hasAccess,
        canDo,
        getAccessibleCategories
    };
}
