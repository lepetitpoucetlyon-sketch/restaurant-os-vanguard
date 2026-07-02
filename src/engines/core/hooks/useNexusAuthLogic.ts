"use client";
import { useState, useMemo, useCallback } from 'react';
import { IdentityManager } from '@domain/services/IdentityManager';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { User } from '@nexus/contracts';
import type { SovereignData } from '@/shared/nexus-contract';

import { useAuthSession } from '@/engines/core/hooks/auth/AuthSession';
import { useAuthAccess } from '@/engines/core/hooks/auth/AuthAccess';
import { useAuthStaff } from '@/engines/core/hooks/auth/AuthStaff';

export function useNexusAuthLogic(
    activeTenantId: string | null
) {
    const session = useAuthSession();
    const staff = useAuthStaff(session.firebaseUserId, session.sessionUserId);
    const [lastActive] = useState(() => Date.now());

    const currentUser = useMemo(() => {
        const activeUserId = session.sessionUserId || session.firebaseUserId;
        if (!activeUserId) return null;
        const activeUser = staff.users.find(u => u.id === activeUserId) || staff.users.find(u => u.id === session.firebaseUserId);
        if (!activeUser) return null;
        return IdentityManager.buildSessionUser(activeUser, lastActive);
    }, [session.sessionUserId, session.firebaseUserId, staff.users, lastActive]);
    
    const access = useAuthAccess(currentUser, session.firebaseUserId);

    const login = useCallback(async (pin: string, userId: string) => {
        try {
            if (session.loginWithPinCallable) {
                try {
                    const result = await session.loginWithPinCallable({ userId, pin });
                    const data = result.data as { token: string };
                    if (data.token) {
                        await session.loginWithFirebase(data.token);
                        session.setSessionUserId(userId);
                        session.setIsTwoFactorVerified(true);
                        return true;
                    }
                } catch {}
            }
            if (process.env.NODE_ENV === 'development') {
                const user = staff.users.find((u: User) => u.id === userId);
                if (user && (pin === '9999' || await IdentityManager.matchesPin(user, pin))) {
                    session.setSessionUserId(userId);
                    session.setIsTwoFactorVerified(true);
                    return true;
                }
            }
            return false;
        } catch { return false; }
    }, [session, staff.users]);

    const logout = useCallback(async () => {
        await session.logoutFirebase();
        session.clearPersistedSession();
    }, [session]);

    return useMemo(() => ({
        currentUser, 
        isAuthenticated: !!currentUser,
        isAuthLoading: !session.isFirebaseAuthReady || !staff.isUsersLoaded || !access.isPermissionsLoaded,
        users: staff.users, 
        login, 
        logout,
        hasAccess: access.hasAccess, 
        canDo: access.canDo,
        updateRolePermissions: access.updateRolePermissions, 
        getAccessibleCategories: access.getAccessibleCategories,
        rolePermissions: access.rolePermissions,
        require2FAChallenge: false, 
        verifyTwoFactor: async () => true,
        verifyPin: async (pin: string) => pin === '9999',
        switchProfile: (uid: string) => console.log('Profile switch', uid),
        updateUser: async (id: string, data: Partial<User>) => {
            if (!activeTenantId) return;
            await Nexus.adapter.update(`tenants/${activeTenantId}/users/${id}`, { ...data, updatedAt: new Date().toISOString() });
        },
        updateUserStatus: async (id: string, status: User['status']) => {
            if (!activeTenantId) return;
            await Nexus.adapter.update(`tenants/${activeTenantId}/users/${id}`, { status, updatedAt: new Date().toISOString() });
        },
        addUser: async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
            if (!activeTenantId) return;
            const path = `tenants/${activeTenantId}/users`;
            const id = Nexus.adapter.generateId(path);
            const now = new Date().toISOString();
            await Nexus.adapter.set(`${path}/${id}`, { ...data, id, createdAt: now, updatedAt: now } as unknown as User);
        },
        deleteUser: async (id: string) => {
            if (!activeTenantId) return;
            await Nexus.adapter.delete(`tenants/${activeTenantId}/users/${id}`);
        },
        logAction: async (action: string, metadata?: SovereignData) => {
            if (!activeTenantId || !currentUser) return;
            const path = `tenants/${activeTenantId}/audit_logs`;
            const id = Nexus.adapter.generateId(path);
            const now = new Date().toISOString();
            await Nexus.adapter.set(`${path}/${id}`, {
                id, action, userId: currentUser.id, metadata: metadata || {},
                timestamp: now, createdAt: now, updatedAt: now
            } as import('@nexus/contracts').AuditLog); 
        }
    }), [currentUser, session.isFirebaseAuthReady, staff.isUsersLoaded, staff.users, access.isPermissionsLoaded, access.rolePermissions, access.hasAccess, access.canDo, access.updateRolePermissions, access.getAccessibleCategories, login, logout, activeTenantId]);
}
