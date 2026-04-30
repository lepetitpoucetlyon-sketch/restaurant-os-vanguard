import { atom } from 'jotai';
import { EmpireInstance } from '@domain/types/empire';
import { FleetBloomFilter } from '@/lib/bloom-filter';
import { Floor, Zone } from '@nexus/contracts';

// 🔐 SINGLE SOURCE OF TRUTH: Re-export from masterAtoms to prevent split-brain
export { tenantConfigAtom } from '@/store/masterAtoms';

// --- 🛰️ FLEET & MULTI-TENANCY DOMAIN ---


export const tenantIdAtom = atom<string>(
    typeof window !== 'undefined' ? (localStorage.getItem('nexus_tenant_id') || 'lepetitpoucet') : 'lepetitpoucet'
);

export const fleetSnapshotAtom = atom<EmpireInstance[]>([]);

// --- 🛰️ SHARDED FLEET ARCHITECTURE (SLOTTED ATOMS) ---
export const fleetBloomFilterAtom = atom(new FleetBloomFilter());

/**
 * 🎰 activeTenantSlotsAtom (Grade VI)
 * A Map of active tenant IDs to their cached states.
 * Replaces linear O(n) atomFamily with managed slots.
 */
export const activeTenantSlotsAtom = atom<Map<string, EmpireInstance>>(new Map());

export const activeFleetTenantAtom = atom<string | null>(null);

/**
 * focusedTenantDetailsAtom
 * Dynamically resolves the details for the currently active slot.
 */
export const focusedTenantDetailsAtom = atom<EmpireInstance | { id: string, status: string, isVirtual: boolean } | null>((get) => {
    const tenantId = get(activeFleetTenantAtom);
    const slots = get(activeTenantSlotsAtom);
    
    if (!tenantId) return null;
    
    // Check if tenant is currently in a slot
    if (slots.has(tenantId)) {
        return slots.get(tenantId)!;
    }

    return { id: tenantId, status: 'synced', isVirtual: true };
});


// --- 🏗️ FLOOR PLAN ---
export const floorsAtom = atom<Floor[]>([]);
export const zonesAtom = atom<Zone[]>([]);
export const zonesLockedAtom = atom(false);
export const currentFloorIdAtom = atom<string>('rdc');
