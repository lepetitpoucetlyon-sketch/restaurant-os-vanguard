"use client";

import { useState, useEffect, useCallback } from 'react';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { firebaseApp, isMock } from '@/lib/firebase';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { IdentityManager, ROOT_ADMIN, FLEET_OPERATOR } from '@domain/services/IdentityManager';
import { isMCCMode } from '@/config/instance';
import { User } from '@nexus/contracts';
import { empireAudit } from '@/infrastructure/services/audit';
import { hashPin } from '@/lib/shared-kernel';
import { logger } from '@/lib/logger';

export function useAuthStaff(firebaseUserId: string | null, _sessionUserId: string | null) {
    const firebaseFunctions = getFunctions(firebaseApp);
    const listLoginProfilesCallable = httpsCallable<Record<string, never>, { users?: User[] }>(
        firebaseFunctions,
        'listLoginProfiles',
    );
    const [users, setUsers] = useState<User[]>([]);
    const [isUsersLoaded, setIsUsersLoaded] = useState(false);

    useEffect(() => {
        let isActive = true;
        const seedUser = isMCCMode() ? FLEET_OPERATOR : ROOT_ADMIN;

        const loadLoginProfiles = async () => {
            if (isMock || isMCCMode()) {
                logger.info(`[AuthStaff] Seed immédiat: ${seedUser.role} (${isMCCMode() ? 'MCC' : 'MOCK'})`);
                setUsers([IdentityManager.buildSessionUser(seedUser)]);
                setIsUsersLoaded(true);
                return;
            }

            try {
                // Pre-auth fallback
                const response = await listLoginProfilesCallable({});
                const remoteUsers = Array.isArray(response.data?.users)
                    ? response.data.users.map(IdentityManager.stripSensitiveFields)
                    : [];

                const rootAdmin = IdentityManager.buildSessionUser(ROOT_ADMIN);
                const combinedUsers = [rootAdmin, ...remoteUsers.filter(u => u.id !== rootAdmin.id)];

                if (isActive) {
                    setUsers(combinedUsers);
                    setIsUsersLoaded(true);
                }
            } catch (error) {
                // Network or CORS errors are common in dev/mock environments
                const isNetworkError = error instanceof Error &&
                    (error.message.includes('CORS') || error.message.includes('internal') || error.message.includes('network'));

                if (!isNetworkError) {
                    console.error('Unable to load login profiles', error);
                }

                if (isActive) {
                    setUsers([IdentityManager.buildSessionUser(seedUser)]);
                    setIsUsersLoaded(true);
                }
            }
        };

        if (!firebaseUserId) {
            void loadLoginProfiles();
            return () => { isActive = false; };
        }

        const usersPath = Nexus.getTenantPath('users');
        const unsubscribeUsers = Nexus.adapter.onSnapshot(
            usersPath,
            async (fetchedUsers: User[]) => {
                let currentUsers = fetchedUsers || [];

                if (currentUsers.length === 0) {
                    const defaultUser = isMCCMode()
                        ? await IdentityManager.createFleetAdminUser()
                        : await IdentityManager.createRootAdminUser();
                    await Nexus.adapter.set(`${usersPath}/${seedUser.id}`, defaultUser);
                    currentUsers = [defaultUser];
                }

                if (isActive) {
                    setUsers(currentUsers);
                    setIsUsersLoaded(true);
                }
            },
            {
                onError: (error: unknown) => {
                    console.error('Unable to subscribe to users', error);
                    if (isActive) setIsUsersLoaded(true);
                }
            }
        );

        return () => {
            isActive = false;
            unsubscribeUsers();
        };
    }, [firebaseUserId]);

    const addUser = useCallback(async (user: Omit<User, 'id'> & { pin: string }) => {
        const id = `user_${Date.now()}`;
        const pinHash = await hashPin(user.pin.trim(), id);
        const { pin: _p, pinHash: _ph, ...userData } = user;

        await Nexus.adapter.set(`${Nexus.getTenantPath('users')}/${id}`, {
            ...userData,
            id,
            pinHash,
        });

        empireAudit.log({
            module: 'staff',
            action: 'USER_ADDED',
            details: { userId: id, userName: user.name, role: user.role },
            timestamp: new Date(),
            severity: 'medium'
        });
    }, []);

    const deleteUser = useCallback(async (userId: string) => {
        await Nexus.adapter.delete(`${Nexus.getTenantPath('users')}/${userId}`);

        empireAudit.log({
            module: 'staff',
            action: 'USER_DELETED',
            details: { userId },
            timestamp: new Date(),
            severity: 'medium'
        });
    }, []);

    const updateUserStatus = useCallback(async (userId: string, data: Partial<User>) => {
        const patch: import('@/shared/nexus-contract').SovereignData = {};

        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) patch[key] = value as import('@/shared/nexus-contract').SovereignField;
        }

        if (typeof data.pin === 'string' && data.pin.trim()) {
            patch.pinHash = await hashPin(data.pin.trim(), userId);
        }

        await Nexus.adapter.update(`${Nexus.getTenantPath('users')}/${userId}`, patch);

        empireAudit.log({
            module: 'staff',
            action: 'USER_STATUS_UPDATED',
            details: { userId, updatedFields: Object.keys(data) },
            timestamp: new Date()
        });
    }, []);

    return {
        users,
        isUsersLoaded,
        addUser,
        deleteUser,
        updateUserStatus
    };
}
