import { getDefaultStore } from 'jotai';
import { ordersNodeAtom, stockItemsNodeAtom, updateNexusNode } from '@/store/operationalAtoms';
import { logger } from '@/lib/logger';
import { SelfHealingEngine } from '@/lib/SelfHealingEngine';
import { Nexus } from '@/lib/nexus/NexusAdapter';

/**
 * 🐵 ChaosMonkey - Restaurant OS (Darwin V5.5 Master Code)
 * Chaos-V5-Adversarial: Sandboxed stress agent for resilience training.
 */
export const ChaosMonkey = {
  
  activeInterval: null as any,

  /**
   * Starts the chaos agent within a specific sandbox.
   * ADVERSARIAL: Targets atoms with the highest update frequency.
   */
  start(intensity: number = 0.5) {
    if (this.activeInterval) return;
    
    logger.warn(`[Chaos-Monkey] Adversarial Agent Activated (Intensity: ${intensity})`);

    this.activeInterval = setInterval(() => {
        this.executeRandomDrift();
    }, 10000 / intensity);
  },

  stop() {
    clearInterval(this.activeInterval);
    this.activeInterval = null;
    logger.info("[Chaos-Monkey] Adversarial Agent Deactivated.");
  },

  /**
   * Inject a bit-flip or data-drift in the state heap.
   */
  executeRandomDrift() {
    const store = getDefaultStore();
    const targets: Array<{ atom: any; path: string }> = [
      { atom: ordersNodeAtom, path: 'operational/orders' },
      { atom: stockItemsNodeAtom, path: 'operational/stock' }
    ];
    
    const choice = targets[Math.floor(Math.random() * targets.length)];
    const node = store.get(choice.atom) as any;

    if (!node || !node.data || node.data.length === 0) return;

    // 🏆 PRE-CORRUPTION: Calculate valid hash for the audit
    const validHash = SelfHealingEngine.calculateCRC(node.data);

    // 💉 CORRUPTION: We slightly modify a value without triggering a standard sync
    const corruptedData = JSON.parse(JSON.stringify(node.data));
    const index = Math.floor(Math.random() * corruptedData.length);
    
    // Simulate a drift (Example: random currency modification)
    if (corruptedData[index].totalInCents !== undefined) {
        corruptedData[index].totalInCents += 1;
    } else {
        corruptedData[index].quantity = (corruptedData[index].quantity || 0) + 1;
    }

    logger.debug(`[Chaos-Monkey] DRIFT_INJECTED into ${choice.path}`);
    
    // Silent write (Bypass validation)
    store.set(choice.atom, (prev: any) => updateNexusNode(prev, { data: corruptedData }));

    // 🍵 VERIFICATION: Trigger self-healing audit
    const persistencePath = Nexus.getTenantPath(choice.path);
    setTimeout(() => {
        SelfHealingEngine.auditAndHeal(choice.atom, validHash, persistencePath);
    }, 1000);
  }
};
