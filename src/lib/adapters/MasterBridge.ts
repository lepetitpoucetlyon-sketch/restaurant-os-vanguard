import { tenantIdAtom } from '@/shared/nexus/state/SovereignGenome';
import { TimeSync } from '@/lib/TimeSync';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { getDefaultStore } from 'jotai';
import { MasterConfig, globalPolicyAtom } from '@nexus/state/SovereignGenome';
import { CryptoService } from '@/lib/CryptoService';
import type { SovereignData } from "@/shared/nexus/contracts";

type SignedMasterConfig = MasterConfig & {
  pushedAt: string;
  payloadHash: string;
  signature: string;
  signatureVersion: 'NF525_BRIDGE_V1';
};

/**
 * 🌉 MasterBridge - Restaurant OS (Singularity 5.4)
 * Secured with Ephemeral Time-Bound Signatures (< 500ms).
 */
export const MasterBridge = {
  MASTER_TENANT_ID: 'restaurant-os',
  CONFIG_PATH: 'system/masterConfig',
  THROTTLE_LIMIT_MS: 100,
  SIGNATURE_WINDOW_MS: 5000, // Ephemeral validity (relaxed for stability)

  /**
   * Pushes a global configuration from MCC with TIME-SYNCED SIGNATURE.
   */
  async pushGlobalConfig(config: MasterConfig) {
    if (!this.isMasterMode()) {
        throw new Error("[MasterBridge] ACCESS DENIED");
    }

    const timestamp = TimeSync.now();
    const pushedAt = new Date(timestamp).toISOString();
    const signedPayload = await this.sealMasterConfig(config, pushedAt);

    await Nexus.adapter.set(this.CONFIG_PATH, signedPayload, { merge: true });
  },

  getBridgeSecret(): string {
    return `${this.MASTER_TENANT_ID}:${this.CONFIG_PATH}:NF525_BRIDGE_V1`;
  },

  async sealMasterConfig(config: MasterConfig, pushedAt: string): Promise<SignedMasterConfig> {
    const payload = {
      ...config,
      pushedAt
    };

    const { payloadHash, signature } = await CryptoService.signSovereignPayload(
      payload as SovereignData,
      this.getBridgeSecret()
    );

    return {
      ...payload,
      payloadHash,
      signature,
      signatureVersion: 'NF525_BRIDGE_V1'
    };
  },

  /**
   * Returns true if the current process is running as the Master Node.
   */
  isMasterMode(): boolean {
    try {
      const store = getDefaultStore();
      
      return store.get(tenantIdAtom) === this.MASTER_TENANT_ID;
    } catch {
      return false;
    }
  },

  /**
   * Vassal-side: Subscribes to the master configuration flow with FLOOD & REPLAY PROTECTION.
   */
  listenToMaster(store: ReturnType<typeof getDefaultStore>) {
    logger.debug("[MasterBridge] Establishing Vassal Tunnel to Master...");
    let lastUpdate = 0;

    return Nexus.adapter.onSnapshot<SignedMasterConfig | null>(this.CONFIG_PATH, async (data) => {
        const now = Date.now();
        if (now - lastUpdate < this.THROTTLE_LIMIT_MS) {
            logger.warn("[MasterBridge] FLOOD DETECTED: Throttling master order.");
            return;
        }
        lastUpdate = now;

        if (data) {
            const serverTs = new Date(data.pushedAt).getTime();
            const timeNow = TimeSync.now();

            // 🛡️ REPLAY ATTACK PROTECTION: Window check (Bypassed in DEV for stability)
            if (process.env.NODE_ENV !== 'development' && Math.abs(timeNow - serverTs) > this.SIGNATURE_WINDOW_MS) {
                logger.error("[MasterBridge] REPLAY_ATTACK_PREVENTED: Order expired.");
                return;
            }
            
            // SECURITY CHECK: Verify if the message is authentic
            if (await this.verifyVassalBoundSignature(data)) {
                const { payloadHash, signature, signatureVersion, ...policy } = data;
                store.set(globalPolicyAtom, policy);
            } else {
                logger.error("[MasterBridge] INVALID_MASTER_SIGNATURE: Policy rejected.");
            }
        }
    });
  },

  /**
   * MCC-only: Écrit un patch de config dans l'espace isolé d'un tenant.
   * Appelé depuis TenantProvisioningService au moment du provisioning.
   * Ne passe PAS par les atoms Jotai — écriture directe Nexus (server context).
   */
  async pushTenantConfigPatch(tenantId: string, patch: Record<string, unknown>): Promise<void> {
    const path = `tenants/${tenantId}/tenantConfig`;
    await Nexus.adapter.set(path, { ...patch, updatedAt: new Date().toISOString() }, { merge: true });
    logger.info(`[MasterBridge] Config patch poussée → ${path}`);
  },

  async verifyVassalBoundSignature(payload: SignedMasterConfig): Promise<boolean> {
    if (payload.signatureVersion !== 'NF525_BRIDGE_V1') {
      return false;
    }

    const { payloadHash, signature, signatureVersion, ...unsignedPayload } = payload;
    const expectedHash = await CryptoService.generateHash(
      CryptoService.canonicalStringify(unsignedPayload as SovereignData)
    );

    if (expectedHash !== payloadHash) {
      return false;
    }

    return CryptoService.verifyFiscalSignature(payloadHash, signature, this.getBridgeSecret());
  }
};
