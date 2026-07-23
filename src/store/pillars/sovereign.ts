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

