import { getDefaultStore } from 'jotai';
import { logger } from '@/lib/logger';
import { MasterBridge } from '@/lib/adapters/MasterBridge';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toError } from "@/lib/toError";
import type { JsonObject } from "@/shared/types/json";

type HealItem = { id?: string;[k: string]: unknown };

/** Un état de node « liste » : { data: [], loading, error, ... }. */
function isListNodeState(state: unknown): state is Record<string, unknown> {
    return !!state && typeof state === 'object' && 'data' in state && 'loading' in state;
}

/** Normalise un payload backend en liste plate d'items. */
function toFreshList(freshData: unknown): HealItem[] {
    if (Array.isArray(freshData)) return freshData as HealItem[];
    const nested = (freshData as { data?: unknown[] }).data;
    if (Array.isArray(nested)) return nested as HealItem[];
    return [freshData as HealItem];
}

/**
 * Merge granulaire Merkle : prend l'item frais si absent/différent localement,
 * conserve l'item local sinon, puis ré-ajoute les items locaux orphelins.
 * Retourne la liste fusionnée + le nombre d'items réellement soignés.
 */
function mergeHealedList(currentList: HealItem[], freshList: HealItem[]): { merged: HealItem[]; healedCount: number } {
    const currentMap = new Map<string, HealItem>();
    currentList.forEach((item) => {
        if (item && item.id) currentMap.set(item.id, item);
    });

    let healedCount = 0;
    const mergedList = freshList.map((freshItem) => {
        if (!freshItem || !freshItem.id) {
            healedCount++;
            return freshItem;
        }
        const currentItem = currentMap.get(freshItem.id);
        if (!currentItem || JSON.stringify(currentItem) !== JSON.stringify(freshItem)) {
            healedCount++;
            return freshItem;
        }
        return currentItem;
    });

    const freshIds = new Set(freshList.map((item) => item && item.id).filter(Boolean));
    const merged = [
        ...mergedList,
        ...currentList.filter((item) => item && item.id && !freshIds.has(item.id)),
    ];
    return { merged, healedCount };
}

/**
 * Un backend indisponible (offline) ou un refus de permission (claims pas encore
 * posés) n'est PAS une dérive à réparer : on ne spamme pas Sentry en boucle.
 */
function isHealSkippable(message: string): boolean {
    return /permission|insufficient|offline|unavailable|network/i.test(message);
}

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
    // as unknown as: T est un generic atom — calculateCRC attend SovereignData, frontière runtime légitime
    const currentHash = this.calculateCRC(currentState as unknown as import("@/shared/nexus/contracts").SovereignData);

    if (currentHash === expectedHash && expectedHash !== 'FORCE_SYNC') return;

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
    if (!persistencePath) return;

    try {
      const startTime = Date.now();
      // Firestore : un chemin à nombre de segments IMPAIR est une COLLECTION
      // (ex. tenants/{t}/orders → 3 segments), à nombre PAIR est un DOCUMENT.
      // get() n'accepte qu'un document → sur une collection il jetait
      // « Invalid document reference » à chaque cycle. On query() les
      // collections (le merge en aval attend déjà une liste).
      const isCollection = persistencePath.split('/').filter(Boolean).length % 2 !== 0;
      const freshData = isCollection
        ? await Nexus.adapter.query(persistencePath)
        : await Nexus.adapter.get(persistencePath);
      if (!freshData) return;

      const rawState = currentState as JsonObject;
      if (!isListNodeState(rawState)) {
        store.set(atom, freshData as T);
        logger.info(`[Self-Healing] Atomic Burst SUCCESSFUL: ${persistencePath} (${Date.now() - startTime}ms)`);
        return;
      }

      const currentList = Array.isArray(rawState.data) ? (rawState.data as HealItem[]) : [];
      const { merged, healedCount } = mergeHealedList(currentList, toFreshList(freshData));

      store.set(atom, { ...rawState, data: merged, loading: false, error: null } as T);
      logger.info(`[Self-Healing] Granular Merkle-Heal SUCCESSFUL: ${persistencePath} (Healed ${healedCount} items in ${Date.now() - startTime}ms)`);
    } catch (error) {
      // On loggue en warn avec la VRAIE cause (avant : « error » littéral, indiagnostiquable).
      const message = toError(error).message;
      if (isHealSkippable(message)) {
        logger.warn(`[Self-Healing] Heal skipped (backend indisponible) for ${persistencePath}: ${message}`);
      } else {
        logger.error(`[Self-Healing] Injection FAILED for ${persistencePath}: ${message}`);
      }
    }
  },
 
  /**
   * Polynomial CRC / Merkle Calculation for the state heap.
   */
  calculateCRC(data: import("@/shared/nexus/contracts").SovereignData | import("@/shared/nexus/contracts").SovereignValue): string {
    return this.calculateMerkleTree(data).root;
  },

  /**
   * Hierarchical Merkle Tree calculation.
   */
  calculateMerkleTree(data: unknown): { root: string; leaves: string[] } {
    let leaves: string[] = [];
    if (Array.isArray(data)) {
        leaves = data.map(item => this.hashString(JSON.stringify(item || {})));
    } else if (data && typeof data === 'object') {
        const obj = data as JsonObject;
        if (Array.isArray(obj.data)) {
            leaves = (obj.data as unknown[]).map((item: unknown) => this.hashString(JSON.stringify(item || {})));
        } else {
            const keys = Object.keys(obj).sort();
            leaves = keys.map(k => this.hashString(`${k}:${JSON.stringify(obj[k] || {})}`));
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
