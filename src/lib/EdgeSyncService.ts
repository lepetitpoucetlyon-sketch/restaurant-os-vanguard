import { ordersNodeAtom, updateNexusNode } from '@/store/pillars';
import type { SyncMessage } from '@nexus/contracts/domain.types';
import { Order } from '@nexus/contracts';
import { getDefaultStore } from 'jotai';
import { logger } from '@/lib/logger';

/**
 * ⚡ EdgeSyncService - Restaurant OS (Darwin V5.5 Master Code)
 * Ultra-Low-Latency-V5: Local Relay Protocol for < 10ms kitchen sync.
 */
export const EdgeSyncService = {
  
  localChannel: null as BroadcastChannel | null,

  /**
   * Initializes the local edge synchronization.
   * Uses BroadcastChannel for same-origin tab/window sync, simulating LAN P2P.
   */
  init() {
    if (typeof window === 'undefined') return;
    
    this.localChannel = new BroadcastChannel('nexus_edge_sync');
    
    this.localChannel.onmessage = (event: MessageEvent) => {
        this.handleLocalEvent(event.data);
    };

    logger.info("[EdgeSync] Local Relay fully established. Target Latency: < 10ms.");
  },

  /**
   * Broadcasts a high-priority event (like a new ticket) to all local devices.
   */
  broadcast<T>(type: string, payload: T) {
    if (!this.localChannel) return;

    this.localChannel.postMessage({
        type,
        payload,
        timestamp: performance.now(),
        nodeId: 'nexus-node-01'
    });
  },

  handleLocalEvent(data: SyncMessage) {
    const latency = performance.now() - data.timestamp;
    logger.debug(`[EdgeSync] Local Event Received. Type: ${data.type}. Latency: ${latency.toFixed(2)}ms`);
    
    // 🔥 SYNC INJECTION: Directly update local atoms before Cloud confirmation
    const store = getDefaultStore();
    if (data.type === 'order') {
        store.set(ordersNodeAtom, (prev: import('@/store/base').NexusNode<Order>) => updateNexusNode(prev, { data: [...prev.data, data.payload as Order] }));
    }
  }
};
