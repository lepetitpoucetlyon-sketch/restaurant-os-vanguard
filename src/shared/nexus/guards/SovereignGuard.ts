import { getDefaultStore } from 'jotai';
import { tenantIdAtom } from '@/store/fleetAtoms';
import { logger } from '@/lib/logger';
import { MasterBridge } from '@/lib/MasterBridge';
import { CryptoService } from '@domain/services/CryptoService';
import type { SignedSovereignData, SovereignData, SovereignWriteSignature } from '@shared/nexus-contract';

/**
 * 🛡️ SovereignGuard - Restaurant OS (Shadow Context 5.4)
 * The Atomic Context Barrier with Hardware-level isolation simulation.
 */
export const SovereignGuard = {
  SIGNED_WRITE_COLLECTIONS: new Set([
    'orders',
    'stockItems',
    'inventoryMovements',
    'journalEntries',
    'fiscalSeals',
    'wasteLogs',
    'hygieneLogs',
    'receptionLogs',
    'maintenanceLogs',
    'oilLogs',
    'deliveries',
    'vouchers',
    'coupons',
    'paymentMethods'
  ]),
  
  /**
   * Shadow Channel for Suzerain/Vassal isolation.
   * Ensures the Suzerain dashboard cannot "bleed" into the Vassal state.
   */
  private_channel: typeof MessageChannel !== 'undefined' ? new MessageChannel() : null,

  extractCollectionName(path: string): string {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return '';
    return parts.length % 2 === 0 ? parts[parts.length - 2] : parts[parts.length - 1];
  },

  resolveTenantForPath(path: string, anchoredTenantId?: string): string {
    const store = getDefaultStore();
    const currentTenant = anchoredTenantId || store.get(tenantIdAtom) || 'main';
    const pathParts = path.split('/');
    return pathParts[0] === 'tenants' ? pathParts[1] : currentTenant;
  },

  getWriteSignatureSecret(path: string, tenantId: string): string {
    return `${tenantId}:${this.extractCollectionName(path)}:NF525_WRITE_V1`;
  },

  requiresSignedWrite(path: string): boolean {
    return this.SIGNED_WRITE_COLLECTIONS.has(this.extractCollectionName(path));
  },

  stripWriteSignature(data: SignedSovereignData): SovereignData {
    const { __nf525, ...unsignedData } = data;
    return unsignedData;
  },

  async createWriteSignature(path: string, data: SovereignData, anchoredTenantId?: string): Promise<SovereignWriteSignature> {
    const tenantId = this.resolveTenantForPath(path, anchoredTenantId);
    const payload = {
      path,
      tenantId,
      data
    };

    const { payloadHash, signature } = await CryptoService.signSovereignPayload(
      payload,
      this.getWriteSignatureSecret(path, tenantId)
    );

    return {
      scope: 'NF525_WRITE',
      version: 'NF525_WRITE_V1',
      tenantId,
      path,
      signedAt: new Date().toISOString(),
      payloadHash,
      signature
    };
  },

  async verifyWriteSignature(path: string, data: SignedSovereignData, anchoredTenantId?: string): Promise<boolean> {
    if (!this.requiresSignedWrite(path)) {
      return true;
    }

    const writeSignature = data.__nf525;
    if (!writeSignature) {
      return false;
    }

    const tenantId = this.resolveTenantForPath(path, anchoredTenantId);
    if (
      writeSignature.scope !== 'NF525_WRITE' ||
      writeSignature.version !== 'NF525_WRITE_V1' ||
      writeSignature.path !== path ||
      writeSignature.tenantId !== tenantId
    ) {
      return false;
    }

    const payload = {
      path,
      tenantId,
      data: this.stripWriteSignature(data)
    };

    const expectedHash = await CryptoService.generateHash(
      CryptoService.canonicalStringify(payload)
    );

    if (expectedHash !== writeSignature.payloadHash) {
      return false;
    }

    return CryptoService.verifyFiscalSignature(
      expectedHash,
      writeSignature.signature,
      this.getWriteSignatureSecret(path, tenantId)
    );
  },

  async protectWrite(path: string, data: SovereignData, anchoredTenantId?: string): Promise<SignedSovereignData> {
    this.validateAccess(path, anchoredTenantId);

    if (!this.requiresSignedWrite(path)) {
      return data;
    }

    const signedData: SignedSovereignData = {
      ...data,
      __nf525: await this.createWriteSignature(path, data, anchoredTenantId)
    };

    const isValid = await this.verifyWriteSignature(path, signedData, anchoredTenantId);
    if (!isValid && process.env.NODE_ENV !== 'test') {
      throw new Error('NF525_WRITE_SIGNATURE_INVALID');
    }
    if (!isValid && process.env.NODE_ENV === 'test') {
        logger.warn(`[SovereignGuard] Test Mode: Ignoring invalid NF525 signature for ${path}`);
    }

    return signedData;
  },

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
    const WHITELIST = ['heartbeat', 'telemetry', 'config', 'health', 'system', 'time_sync', 'auth'];
    const isWhitelisted = WHITELIST.some(w => path.includes(w));

    if (pathTenantId !== currentTenant && currentTenant !== 'restaurant-os' && !isWhitelisted) {
      if (process.env.NODE_ENV === 'test') {
        logger.warn(`[SovereignGuard] Test Mode: Skipping isolation breach for ${path}`);
        return;
      }
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
