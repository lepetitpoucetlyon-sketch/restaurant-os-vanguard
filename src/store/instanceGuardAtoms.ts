// @ts-nocheck
import { atom } from 'jotai';

/**
 * ⚛️ Instance Guard Atoms - Sovereignty Layer
 * Single source of truth for instance authorization status.
 */

export interface InstanceState {
    isAuthorized: boolean;
    tenantId: string | null;
    hostname: string | null;
    isDev: boolean;
}

import { atomWithStorage } from 'jotai/utils';

export const instanceStateAtom = atomWithStorage<InstanceState>('nexus_instance_state', {
    isAuthorized: false,
    tenantId: null,
    hostname: null,
    isDev: false
});

/**
 * Selector: Returns true ONLY if explicitly authorized.
 */
export const isAuthorizedAtom = atom((get) => get(instanceStateAtom).isAuthorized);

/**
 * Selector: Returns current tenantId.
 */
export const activeTenantAtom = atom((get) => get(instanceStateAtom).tenantId);
