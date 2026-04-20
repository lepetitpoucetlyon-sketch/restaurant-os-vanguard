import { getDefaultStore } from 'jotai';
import { logger } from './logger';
import { MasterBridge } from './MasterBridge';
import { Nexus } from './nexus/NexusAdapter';

/**
 * 🍵 SelfHealingEngine - Restaurant OS (Singularity 5.4)
 * Implements CRC Auditing and Silent Healing to maintain negative entropy.
 */
export const SelfHealingEngine = {
  
  /**
   * Performs a silent audit of the current state vs a distributed root.
   */
  async auditAndHeal(atom: any, expectedHash: string, persistencePath?: string) {
    const store = getDefaultStore();
    const currentState = store.get(atom);
    
    // 🧬 CRC CALCULATION
    const currentHash = this.calculateCRC(currentState);

    if (currentHash !== expectedHash) {
      logger.warn(`[Self-Healing] State Drift Detected (CRC Mismatch). Path: ${persistencePath}`);
      
      // 🛰️ Report Silent Healing to MCC
      MasterBridge.pushGlobalConfig({
        maintenanceMode: false,
        forceLogout: false,
        securityLevel: 'medium',
        globalMessage: `SILENT_HEALING: Corrected drift for atom at ${persistencePath || 'internal_node'}`,
        allowedFeatures: []
      } as any).catch(() => {});

      // 💉 INJECTION (Silent Restore)
      if (persistencePath) {
        try {
          const freshData = await Nexus.adapter.get(persistencePath);
          if (freshData) {
            store.set(atom, freshData);
            logger.info(`[Self-Healing] Atomic injection SUCCESSFUL: ${persistencePath}`);
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
  calculateCRC(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
};
