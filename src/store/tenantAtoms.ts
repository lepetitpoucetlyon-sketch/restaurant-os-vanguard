import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

/**
 * ⚛️ TENANT ATOMS - Grade VI
 * Authority over the "Digital Twin" context.
 */

export interface TenantConfig {
    id: string;
    name: string;
    instance: string;
    [key: string]: any;
}

// Persisted active tenant ID
export const activeTenantIdAtom = atomWithStorage<string | null>('nexus_tenant_id', null);

// In-memory tenant config (resolved from ID)
export const activeTenantConfigAtom = atom<TenantConfig | null>(null);

// Loading state
export const isTenantLoadingAtom = atom((get) => !get(activeTenantIdAtom));
