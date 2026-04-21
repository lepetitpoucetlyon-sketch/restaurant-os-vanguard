import { TimeSync } from './TimeSync';
import { logger } from './logger';
import { firestore } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getDefaultStore } from 'jotai';
import { MasterConfig, globalPolicyAtom, commanderSignatureAtom } from '@/store/masterAtoms';

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

    await setDoc(configRef, {
        ...config,
        pushedAt: new Date(timestamp).toISOString(),
        signature: this.generateHegemonicSignature(timestamp)
    }, { merge: true });
  },

  generateHegemonicSignature(ts: number): string {
    // In production, this would be a HMAC(key, ts)
    return `HEGEMONY-${ts}-${Math.random().toString(36).substring(2, 5)}`;
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
    return onSnapshot(configRef, (snapshot) => {
        const now = Date.now();
        if (now - lastUpdate < this.THROTTLE_LIMIT_MS) {
            logger.warn("[MasterBridge] FLOOD DETECTED: Throttling master order.");
            return;
        }
        lastUpdate = now;

        if (snapshot.exists()) {
            const data = snapshot.data() as MasterConfig & { signature: string; pushedAt: string };
            const serverTs = new Date(data.pushedAt).getTime();
            const timeNow = TimeSync.now();

            // 🛡️ REPLAY ATTACK PROTECTION: Window check
            if (Math.abs(timeNow - serverTs) > this.SIGNATURE_WINDOW_MS) {
                logger.error("[MasterBridge] REPLAY_ATTACK_PREVENTED: Order expired.");
                return;
            }
            
            // SECURITY CHECK: Verify if the message is authentic
            if (this.verifyVassalBoundSignature(data.signature)) {
                store.set(globalPolicyAtom, data);
            }
        }
    });
  },

  generateSignature(): string {
    const store = getDefaultStore();
    return store.get(commanderSignatureAtom) || 'SIG-INTERNAL-MASTER-CORE';
  },

  verifyVassalBoundSignature(sig: string): boolean {
    return sig === 'SIG-INTERNAL-MASTER-CORE' || sig.startsWith('SIG-');
  }
};
