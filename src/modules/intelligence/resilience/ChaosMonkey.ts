import { ResilienceSlayer } from './ResilienceSlayer';
import { CycleGuard } from '@/shared/nexus/guards/CycleGuard';
import { SovereignMath } from '@/shared/services/SovereignMath';
import { getDefaultStore } from 'jotai';
import { 
    ordersNodeAtom, 
    stockItemsNodeAtom, 
    journalEntriesNodeAtom,
    updateNexusNode 
} from '@/store/pillars';
import { qualityActiveControlAtom } from '@modules/compliance';
import { logger } from '@/lib/logger';
import { SelfHealingEngine } from '@/infrastructure/services/SelfHealingEngine';
import { Nexus } from '@/lib/nexus/NexusAdapter';

import { WritableAtom } from 'jotai';
import { NexusNode } from '@/store/base';

/**
 * 🐵 ChaosMonkey - Restaurant OS (Darwin V5.5 Master Code)
 * Chaos-V5-Adversarial: Sandboxed stress agent for resilience training.
 * Enforces Grade X Sovereignty by attacking it.
 */
export const ChaosMonkey = {
  
  activeInterval: null as ReturnType<typeof setInterval> | null,

  /**
   * Starts the chaos agent within a specific sandbox.
   */
  start(intensity: number = 0.5) {
    if (this.activeInterval) return;
    
    logger.warn(`[Chaos-Monkey] Adversarial Agent Activated (Intensity: ${intensity})`);

    this.activeInterval = setInterval(() => {
        this.executeRandomDrift();
    }, 10000 / intensity);
  },

  stop() {
    if (this.activeInterval) clearInterval(this.activeInterval);
    this.activeInterval = null;
    logger.info("[Chaos-Monkey] Adversarial Agent Deactivated.");
  },

  /**
   * 🐒 NETWORK CHAOS: Simulates latency and drops on Nexus persistence.
   */
  async simulateNetworkInstability() {
    const originalQuery = Nexus.adapter.query;
    logger.warn("[Chaos-Monkey] Injecting NETWORK_INSTABILITY (Latency: 500-3000ms)");
    
    Nexus.adapter.query = async (...args) => {
        const delay = Math.floor(Math.random() * 2500) + 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // 5% chance of absolute drop
        if (Math.random() < 0.05) {
            throw new Error("NETWORK_DROP: Connection timed out in mid-seal.");
        }
        
        return originalQuery.apply(Nexus.adapter, args);
    };
  },

  /**
   * 💉 TOXICITY INJECTION: Mathematical Corruptions
   */
  injectMathematicalToxicity() {
    logger.warn("[Chaos-Monkey] Injecting MATHEMATICAL_TOXICITY (Float Regression & DAG Cycles)");
    
    // 1. Attempt Float Injection via Mock PhysicalNode
    try {
        const corruptedValue = 10.5523; // Floats are prohibited
        
        SovereignMath.toMicrounits(corruptedValue); 
    } catch (_e) {
        logger.info("[Chaos-Monkey] Float Injection BLOCKED by SovereignMath.");
    }

    // 2. Attempt DAG Cycle Injection
    try {
        
        CycleGuard.validateRecipe("CHAOS_RECIPE", ["CHAOS_RECIPE"]); // Self-referencing cycle
    } catch (_e) {
        logger.info("[Chaos-Monkey] DAG Cycle Injection BLOCKED by CycleGuard.");
    }
  },

  /**
   * 🧟 ZOMBIE RUSH: Concurrency Stress
   */
  async simulateZombieRush() {
    logger.warn("[Chaos-Monkey] Starting ZOMBIE_RUSH (50 simultaneous sales on stock: 10)");
    const store = getDefaultStore();
    
    const attempts = Array.from({ length: 50 });
    const results = await Promise.allSettled(attempts.map(async (_, i) => {
        // Simulate a stock decrement attempt
        const currentStock = store.get(stockItemsNodeAtom).data?.[0]?.quantity || 0;
        if (currentStock <= 0) throw new Error("OUT_OF_STOCK");
        
        // Optimistic decrement
        store.set(stockItemsNodeAtom, (prev) => ({
            ...prev,
            data: (prev?.data || []).map((item: import('@nexus/contracts').StockItem, idx: number) => {
                if (idx === 0) {
                    return { ...item, quantity: (item.quantity || 0) - 1 };
                }
                return item;
            })
        }));

        // Simulate DB Latency and potential reject
        if (i >= 10) {
            throw new Error("DB_REJECT: Negative stock constraint violated.");
        }
    }));

    const rejects = results.filter(r => r.status === 'rejected').length;
    logger.info(`[Chaos-Monkey] Rush Completed. Rejects: ${rejects}/50. Triggering Slayer Recovery.`);
    
    // Trigger Slayer explicitly for the crash test
    
    ResilienceSlayer.handleTransactionFailure('operational/stock', new Error("CONCURRENCY_VIOLATION"));
  },

  /**
   * Inject a bit-flip or data-drift in the state heap.
   */
  executeRandomDrift() {
    const store = getDefaultStore();
    const targets = [
      { atom: ordersNodeAtom, path: 'operational/orders', type: 'node' },
      { atom: stockItemsNodeAtom, path: 'operational/stock', type: 'node' },
      { atom: journalEntriesNodeAtom, path: 'finance/ledger', type: 'node' },
      { atom: qualityActiveControlAtom, path: 'haccp/active_session', type: 'direct' }
    ] as const;
    
    const choice = targets[Math.floor(Math.random() * targets.length)];
    
    if (choice.type === 'node') {
        const node = store.get(choice.atom as unknown as WritableAtom<unknown, unknown[], unknown>) as NexusNode<unknown>;
        const nodeData = node.data || [];
        if (nodeData.length === 0) return;

        const validHash = SelfHealingEngine.calculateCRC(nodeData);
        const corruptedData = JSON.parse(JSON.stringify(nodeData));
        const index = Math.floor(Math.random() * corruptedData.length);
        const targetItem = corruptedData[index];

        // 💉 DRIFT INJECTION
        if ('totalInCents' in targetItem) {
            targetItem.totalInCents += 100; // Drift on price
        } else if ('quantity' in targetItem) {
            targetItem.quantity = (targetItem.quantity || 0) + 1;
        } else if ('amountInCents' in targetItem) {
            targetItem.amountInCents -= 50; // Drift on ledger
        }

        logger.debug(`[Chaos-Monkey] NODE_DRIFT_INJECTED: ${choice.path}`);
        
        // Use functional update to bypass read-only issues
        store.set(choice.atom as unknown as WritableAtom<unknown, unknown[], unknown>, (prev: unknown) => updateNexusNode(prev as Parameters<typeof updateNexusNode>[0], { data: corruptedData }));

        // 🛡️ RECOVERY TRIGGER
        const persistencePath = Nexus.getTenantPath(choice.path);
        setTimeout(() => {
             // - SelfHealingEngine needs a generic WritableAtom which matches the signature
            SelfHealingEngine.auditAndHeal(choice.atom as unknown as WritableAtom<unknown, unknown[], unknown>, validHash, persistencePath);
        }, 1500);

    } else if (choice.type === 'direct' && choice.path === 'haccp/active_session') {
        const session = store.get(qualityActiveControlAtom);
        if (!session) return;

        logger.debug(`[Chaos-Monkey] SESSION_NULL_FLIP: ${choice.path}`);
        // Simulate a crash/wipe of active session
        store.set(qualityActiveControlAtom, null);
    }
  }
};
