import { TimeSync } from './TimeSync';
import { logger } from './logger';
import { firestore } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getDefaultStore } from 'jotai';
import { MasterConfig, globalPolicyAtom } from '@/store/masterAtoms';
import { CryptoService } from '@/domain/services/CryptoService';
import type { SovereignData } from '@/shared/nexus-contract';

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
  SIGNATURE_WINDOW_MS: 500, // Ephemeral validity

  /**
   * Pushes a global configuration from MCC with TIME-SYNCED SIGNATURE.
   */
  async pushGlobalConfig(config: MasterConfig) {
    if (!this.isMasterMode()) {
        throw new Error("[MasterBridge] ACCESS DENIED");
    }

    const timestamp = TimeSync.now();
    const configRef = doc(firestore, this.CONFIG_PATH);
    const pushedAt = new Date(timestamp).toISOString();
    const signedPayload = await this.sealMasterConfig(config, pushedAt);

    await setDoc(configRef, signedPayload, { merge: true });
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
      const { getDefaultStore } = require('jotai');
      const { tenantIdAtom } = require('@/store/operationalAtoms');
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

    const configRef = doc(firestore, this.CONFIG_PATH);
    return onSnapshot(configRef, async (snapshot) => {
        const now = Date.now();
        if (now - lastUpdate < this.THROTTLE_LIMIT_MS) {
            logger.warn("[MasterBridge] FLOOD DETECTED: Throttling master order.");
            return;
        }
        lastUpdate = now;

        if (snapshot.exists()) {
            const data = snapshot.data() as SignedMasterConfig;
            const serverTs = new Date(data.pushedAt).getTime();
            const timeNow = TimeSync.now();

            // 🛡️ REPLAY ATTACK PROTECTION: Window check
            if (Math.abs(timeNow - serverTs) > this.SIGNATURE_WINDOW_MS) {
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
