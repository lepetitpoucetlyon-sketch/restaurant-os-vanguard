import { getDefaultStore } from 'jotai';
import { logger } from '@/lib/logger';
import { MasterBridge } from '@/lib/MasterBridge';
import { Nexus } from '@/lib/nexus/NexusAdapter';

/**
 * 🍵 SelfHealingEngine - Restaurant OS (Singularity 5.4)
 * Implements CRC Auditing and Silent Healing to maintain negative entropy.
 */
export const SelfHealingEngine = {
  
  /**
   * Performs a silent audit of the current state vs a distributed root.
   */
  async auditAndHeal<T>(atom: import('jotai').PrimitiveAtom<T>, expectedHash: string, persistencePath?: string) {


    const store = getDefaultStore();
    const currentState = store.get(atom);
    
    // 🧬 CRC CALCULATION
    const currentHash = this.calculateCRC(currentState);

    if (currentHash !== expectedHash || expectedHash === 'FORCE_SYNC') {
      logger.warn(`[Self-Healing] State Drift Detected (CRC Mismatch or FORCE_SYNC). Path: ${persistencePath}`);
      
      // 🛰️ Report Silent Healing to MCC
      MasterBridge.pushGlobalConfig({
        maintenanceMode: false,
        killSwitch: false,
        forceLogout: false,
        securityLevel: 'medium',
        globalMessage: `ATOMIC_BURST: Corrected drift for atom at ${persistencePath || 'internal_node'}`,
        allowedFeatures: []
      }).catch(() => {});

      // 💉 INJECTION (Silent Restore - High Speed)
      if (persistencePath) {
        try {
          const startTime = Date.now();
          const freshData = await Nexus.adapter.get(persistencePath);
          if (freshData) {
            store.set(atom, freshData as T);
            const duration = Date.now() - startTime;
            logger.info(`[Self-Healing] Atomic Burst SUCCESSFUL: ${persistencePath} (${duration}ms)`);
          }
        } catch (error) {
          logger.error(`[Self-Healing] Injection FAILED: ${error}`);
        }
      }
    }
  },

  /**
   * Polynomial CRC Calculation for the state heap.
   */
  calculateCRC(data: import('@shared/nexus-contract').SovereignData | import('@shared/nexus-contract').SovereignValue): string {

    const str = JSON.stringify(data || {});
    if (!str) return '0';
    let hash = 0;
    try {
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
    } catch (e) {
        return '0';
    }
    return Math.abs(hash).toString(16);
  }
};
