// 🛰️ SOVEREIGN PILLAR — Identity, Auth, Fleet & Config
// Source: @nexus/state/SovereignGenome

export {
    currentUserAtom,          // SOVEREIGN
    isAuthenticatedAtom,      // SOVEREIGN
    userRoleAtom,             // SOVEREIGN
    rolePermissionsAtom,      // SOVEREIGN
    userPermissionsAtom,      // SOVEREIGN
    canDoAtom,                // SOVEREIGN
    tenantIdAtom,             // SOVEREIGN
    tenantConfigAtom,         // SOVEREIGN
    tenantBrandTokensAtom,    // SOVEREIGN
    fleetSnapshotAtom,        // SOVEREIGN
} from '@nexus/state/SovereignGenome';

// UI Persistence (Commonly used by Fleet/Admin)
export {
    themeAtom,                // SOVEREIGN
    performanceModeAtom,      // SOVEREIGN
    isTrainingModeAtom,       // SOVEREIGN
    isSidebarCollapsedAtom,   // SOVEREIGN
    isLaunchpadOpenAtom,      // SOVEREIGN
    isCommandOpenAtom,        // SOVEREIGN
    isMobileMenuOpenAtom,     // SOVEREIGN
    isDocsOpenAtom,           // SOVEREIGN
    isMap3DOpenAtom,          // SOVEREIGN
    notificationsAtom,        // SOVEREIGN
    unreadNotificationsCountAtom, // SOVEREIGN
    addToastAtom,             // SOVEREIGN
} from '@nexus/state/SovereignGenome';


// Tenant identity — fusionné depuis store/tenantAtoms.ts
import { atom as _atom } from 'jotai';
import { atomWithStorage as _atomWithStorage } from 'jotai/utils';
import { tenantConfigAtom as _tenantConfigAtom } from '@nexus/state/SovereignGenome';
import type { PlatformVariant } from '@/modules/system';

export const activeTenantIdAtom = _atomWithStorage<string | null>('nexus_tenant_id', null);
export const isTenantLoadingAtom = _atom((get: (a: ReturnType<typeof _atomWithStorage>) => string | null) => !get(activeTenantIdAtom));

/** Variant du tenant courant — dérivé de tenantConfigAtom, jamais hardcodé. */
export const tenantVariantAtom = _atom<PlatformVariant>(
  (get) => (get(_tenantConfigAtom)?.variant ?? 'restaurant') as PlatformVariant
);
