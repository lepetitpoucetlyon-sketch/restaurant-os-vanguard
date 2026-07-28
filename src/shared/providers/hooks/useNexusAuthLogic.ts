"use client";
import { useState, useMemo, useCallback } from 'react';
import { IdentityManager } from '@domain/services/IdentityManager';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { User } from '@nexus/contracts';
import type { SovereignData } from '@/shared/nexus-contract';

import { useAuthSession } from '@/shared/providers/hooks/auth/AuthSession';
import { useAuthAccess } from '@/shared/providers/hooks/auth/AuthAccess';
import { useAuthStaff } from '@/shared/providers/hooks/auth/AuthStaff';
import { logger } from '@/lib/logger';

/**
 * Pure resolver (no hooks): finds the active staff user for the current session
 * and hydrates it into a session user. Kept module-scoped so it stays out of the
 * hook body and does not affect Rules of Hooks.
 */
function resolveActiveUser(
    users: User[],
    sessionUserId: string | null,
    firebaseUserId: string | null,
    lastActive: number
) {
    const activeUserId = sessionUserId || firebaseUserId;
    if (!activeUserId) return null;
    const activeUser = users.find(u => u.id === activeUserId) || users.find(u => u.id === firebaseUserId);
    if (!activeUser) return null;
    return IdentityManager.buildSessionUser(activeUser, lastActive);
}

/**
 * Pure dev-mode fallback (no hooks): validates a PIN locally in development.
 * Returns true and commits the session when the PIN matches, otherwise false.
 */
async function attemptDevLogin(
    users: User[],
    userId: string,
    pin: string,
    commitSession: () => void
): Promise<boolean> {
    if (process.env.NODE_ENV !== 'development') return false;
    const user = users.find((u: User) => u.id === userId);
    if (user && (pin === '9999' || await IdentityManager.matchesPin(user, pin))) {
        commitSession();
        return true;
    }
    return false;
}

export function useNexusAuthLogic(
    activeTenantId: string | null
) {
    const session = useAuthSession();
    const staff = useAuthStaff(session.firebaseUserId, session.sessionUserId);
    const [lastActive] = useState(() => Date.now());

    const currentUser = useMemo(
        () => resolveActiveUser(staff.users, session.sessionUserId, session.firebaseUserId, lastActive),
        [session.sessionUserId, session.firebaseUserId, staff.users, lastActive]
    );

    const access = useAuthAccess(currentUser, session.firebaseUserId);

    const login = useCallback(async (pin: string, userId: string) => {
        const commitSession = () => {
            session.setSessionUserId(userId);
            session.setIsTwoFactorVerified(true);
        };
        try {
            if (session.loginWithPinCallable) {
                try {
                    const result = await session.loginWithPinCallable({ userId, pin });
                    const data = result.data as { token: string };
                    if (data.token) {
                        await session.loginWithFirebase(data.token);
                        commitSession();
                        return true;
                    }
                } catch {}
            }
            return await attemptDevLogin(staff.users, userId, pin, commitSession);
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
        customRoles: access.customRoles,
        createCustomRole: access.createCustomRole,
        deleteCustomRole: access.deleteCustomRole,
        require2FAChallenge: false, 
        verifyTwoFactor: async () => true,
        // Confirmation d'action privilégiée (remise, annulation, clôture) : on
        // vérifie le VRAI PIN de l'opérateur courant. Plus de PIN universel « 9999 »
        // (qui, en prod, était à la fois un bypass et un bug : les vrais PIN étaient refusés).
        verifyPin: async (pin: string) => {
            if (!currentUser) return false;
            return IdentityManager.matchesPin(currentUser, pin);
        },
        switchProfile: (uid: string) => logger.debug('Profile switch', uid),
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
    }), [currentUser, session.isFirebaseAuthReady, staff.isUsersLoaded, staff.users, access.isPermissionsLoaded, access.rolePermissions, access.customRoles, access.hasAccess, access.canDo, access.updateRolePermissions, access.createCustomRole, access.deleteCustomRole, access.getAccessibleCategories, login, logout, activeTenantId]);
}
