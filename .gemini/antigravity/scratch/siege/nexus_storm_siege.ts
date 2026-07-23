import { getDefaultStore } from 'jotai';
import { ordersNodeAtom } from '@/store/pillars/ops';
import { updateNexusNode } from '@/store/nexusNodeFactory';
import { logger } from '@/lib/logger';

async function runSiege() {
    logger.info('🚀 [Siege] Vector 2: NexusBridge Storm - Initiating...');
    const store = getDefaultStore();
    const _tenantId = 'vanguard';

    // Simulation of 500 simultaneous events
    const stormEvents = Array.from({ length: 500 }).map((_, i) => {
        return {
            id: `order_${i}`,
            status: 'validated',
            totalInCents: 1500,
            updatedAt: new Date().toISOString()
        };
    });

    logger.info(`⛈️ [Siege] Unleashing 500 POS events...`);

    const start = Date.now();
    
    // Simulate what happens when onSnapshot receives a burst
    // In reality, Firestore might batch them, but here we simulate the worst case: 
    // Rapid fire updates to the same node.
    
    const promises = stormEvents.map(async (event) => {
        // Simulating the onSnapshot callback logic
        const currentData = store.get(ordersNodeAtom).data || [];
        const newData = [...currentData, event];
        
        store.set(ordersNodeAtom, (prev) => updateNexusNode(prev, {
            data: newData,
            loading: false
        }));
    });

    await Promise.all(promises);
    const end = Date.now();

    const finalCount = store.get(ordersNodeAtom).data?.length || 0;
    logger.info(`📊 [Siege] Results: Jotai Store contains ${finalCount} orders.`);
    logger.info(`⏱️ [Siege] Storm processed in ${end - start}ms.`);

    if (finalCount !== 500) {
        logger.error(`🚨 [Siege] RACE CONDITION DETECTED: Expected 500 orders, found ${finalCount}. Integrity Compromised.`);
    } else {
        logger.info('✅ [Siege] Vector 2 Withstood: Jotai Atomic Updates preserved state integrity.');
    }
}

runSiege().catch(console.error);
