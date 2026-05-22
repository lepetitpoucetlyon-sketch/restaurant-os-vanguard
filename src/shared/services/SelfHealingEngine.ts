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
    const currentHash = this.calculateCRC(currentState as any);

    if (currentHash !== expectedHash || expectedHash === 'FORCE_SYNC') {
      logger.warn(`[Self-Healing] State Drift Detected (Merkle Mismatch or FORCE_SYNC). Path: ${persistencePath}`);
      
      // 🛰️ Report Silent Healing to MCC
      MasterBridge.pushGlobalConfig({
        maintenanceMode: false,
        killSwitch: false,
        forceLogout: false,
        securityLevel: 'medium',
        globalMessage: `ATOMIC_BURST: Corrected drift for atom at ${persistencePath || 'internal_node'}`,
        allowedFeatures: []
      }).catch(() => {});
 
      // 💉 INJECTION (Silent Restore - High Speed / Granular Merkle-Heal)
      if (persistencePath) {
        try {
          const startTime = Date.now();
          const freshData = await Nexus.adapter.get(persistencePath);
          if (freshData) {
            const rawState = currentState as any;
            
            if (rawState && typeof rawState === 'object' && 'data' in rawState && 'loading' in rawState) {
              const currentList = Array.isArray(rawState.data) ? rawState.data : [];
              const freshList = Array.isArray(freshData) ? freshData : (Array.isArray((freshData as any).data) ? (freshData as any).data : [freshData]);
              
              const currentMap = new Map<string, any>();
              currentList.forEach((item: any) => {
                if (item && item.id) currentMap.set(item.id, item);
              });

              let healedCount = 0;
              const mergedList = freshList.map((freshItem: any) => {
                if (freshItem && freshItem.id) {
                  const currentItem = currentMap.get(freshItem.id);
                  if (!currentItem || JSON.stringify(currentItem) !== JSON.stringify(freshItem)) {
                    healedCount++;
                    return freshItem;
                  }
                  return currentItem;
                }
                healedCount++;
                return freshItem;
              });

              const freshIds = new Set(freshList.map((item: any) => item && item.id).filter(Boolean));
              const finalMergedList = [
                ...mergedList,
                ...currentList.filter((item: any) => item && item.id && !freshIds.has(item.id))
              ];

              store.set(atom, {
                ...rawState,
                data: finalMergedList,
                loading: false,
                error: null
              } as T);

              const duration = Date.now() - startTime;
              logger.info(`[Self-Healing] Granular Merkle-Heal SUCCESSFUL: ${persistencePath} (Healed ${healedCount} items in ${duration}ms)`);
            } else {
              store.set(atom, freshData as T);
              const duration = Date.now() - startTime;
              logger.info(`[Self-Healing] Atomic Burst SUCCESSFUL: ${persistencePath} (${duration}ms)`);
            }
          }
        } catch (error) {
          logger.error(`[Self-Healing] Injection FAILED: error`);
        }
      }
    }
  },
 
  /**
   * Polynomial CRC / Merkle Calculation for the state heap.
   */
  calculateCRC(data: import('@/shared/nexus-contract').SovereignData | import('@/shared/nexus-contract').SovereignValue): string {
    return this.calculateMerkleTree(data).root;
  },

  /**
   * Hierarchical Merkle Tree calculation.
   */
  calculateMerkleTree(data: any): { root: string; leaves: string[] } {
    let leaves: string[] = [];
    if (Array.isArray(data)) {
        leaves = data.map(item => this.hashString(JSON.stringify(item || {})));
    } else if (data && typeof data === 'object') {
        if ('data' in data && Array.isArray(data.data)) {
            leaves = data.data.map((item: any) => this.hashString(JSON.stringify(item || {})));
        } else {
            const keys = Object.keys(data).sort();
            leaves = keys.map(k => this.hashString(`${k}:${JSON.stringify(data[k] || {})}`));
        }
    } else {
        leaves = [this.hashString(JSON.stringify(data || {}))];
    }

    if (leaves.length === 0) {
        return { root: '0', leaves: [] };
    }

    let currentLevel = [...leaves];
    while (currentLevel.length > 1) {
        const nextLevel: string[] = [];
        for (let i = 0; i < currentLevel.length; i += 2) {
            const left = currentLevel[i];
            const right = (i + 1 < currentLevel.length) ? currentLevel[i + 1] : left;
            nextLevel.push(this.hashString(left + right));
        }
        currentLevel = nextLevel;
    }

    return { root: currentLevel[0], leaves };
  },

  /**
   * Fast hash utility for string payloads.
   */
  hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
};
