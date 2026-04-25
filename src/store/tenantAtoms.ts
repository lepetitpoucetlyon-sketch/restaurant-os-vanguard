import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

/**
 * ⚛️ TENANT ATOMS - Grade VI
 * Authority over the "Digital Twin" context.
 */

import { TenantConfig } from '@/shared/nexus-contract';

// Persisted active tenant ID
export const activeTenantIdAtom = atomWithStorage<string | null>('nexus_tenant_id', null);


// Loading state
export const isTenantLoadingAtom = atom((get) => !get(activeTenantIdAtom));
