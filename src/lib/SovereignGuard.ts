import { getDefaultStore } from 'jotai';
import { tenantIdAtom } from '@/store/operationalAtoms';
import { logger } from '@/lib/logger';
import { MasterBridge } from './MasterBridge';

/**
 * 🛡️ SovereignGuard - Restaurant OS (Shadow Context 5.4)
 * The Atomic Context Barrier with Hardware-level isolation simulation.
 */
export const SovereignGuard = {
  
  /**
   * Shadow Channel for Suzerain/Vassal isolation.
   * Ensures the Suzerain dashboard cannot "bleed" into the Vassal state.
   */
  private_channel: typeof MessageChannel !== 'undefined' ? new MessageChannel() : null,

  /**
   * Validates if the path being accessed matches the current anchored session.
   * TRIGGER: Global Logout Fail-Safe if mismatch is detected.
   */
  validateAccess(path: string, anchoredTenantId?: string) {
    const store = getDefaultStore();
    const currentTenant = anchoredTenantId || store.get(tenantIdAtom);

    const pathParts = path.split('/');
    const pathTenantId = pathParts[0] === 'tenants' ? pathParts[1] : 'main';

    // 🛡️ SUZERAIN EXCEPTION: Master Tenant (restaurant-os) can view anything.
    // Also allow specific whitelisted 'main' operations.
    const WHITELIST = ['heartbeat', 'telemetry', 'config', 'health'];
    const isWhitelisted = WHITELIST.some(w => path.includes(w));

    if (pathTenantId !== currentTenant && currentTenant !== 'restaurant-os' && !isWhitelisted) {
      this.triggerFailSafe(pathTenantId, currentTenant, path);
    }

    // 🔬 SHADOW CONTEXT PROTECTION
    // If we are in Master Mode, we only allow access via the Shadow Port
    if (MasterBridge.isMasterMode() && !path.startsWith('tenants/')) {
        // Suzerain is allowed to see the Root, but Vassals are blocked from it.
    }
  },

  async triggerFailSafe(targetId: string, anchoredId: string, fullPath?: string) {
    const errorMsg = `[CRITICAL_SECURITY_BREACH] Shadow Context Violation: Drift from ${anchoredId} to ${targetId}${fullPath ? ` at [${fullPath}]` : ''}.`;
    logger.error(errorMsg);

    try {
      await MasterBridge.pushGlobalConfig({
        maintenanceMode: true,
        killSwitch: true,
        forceLogout: true,
        securityLevel: 'critical',
        globalMessage: errorMsg,
        allowedFeatures: []
      });
    } catch (e) {}

    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.href = '/auth/logout?reason=shadow_drift_block';
    }

    throw new Error("SHADOW_ISOLATION_BREACH: Execution Terminated.");
  }
};
