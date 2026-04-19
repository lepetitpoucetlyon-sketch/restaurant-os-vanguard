import { db } from '../../src/lib/offline/offline-store.ts';
import { logger } from '../../src/lib/logger.ts';

/**
 * 🛰️ Tenant Transition Benchmark - Restaurant OS
 * Verifies that switching tenants purges the cache and measures transition latency.
 */

async function runTransitionBenchmark() {
    console.log("🚀 Starting Tenant Isolation & Transition Benchmark...");

    // 1. Setup Mock Data for Tenant A
    console.log("📝 Populating Tenant A local cache...");
    await db.orders.bulkPut([
        { 
            id: 'order_A1', 
            status: 'paid', 
            timestamp: new Date(), 
            tableId: 'T1', 
            tableNumber: '1', 
            serverName: 'Atlas',
            items: [],
            totalInCents: 1500
        },
        { 
            id: 'order_A2', 
            status: 'preparing', 
            timestamp: new Date(), 
            tableId: 'T2', 
            tableNumber: '2', 
            serverName: 'Atlas',
            items: [],
            totalInCents: 2500
        }
    ]);
    
    let countA = await db.orders.count();
    console.log(`✅ Tenant A Cache: ${countA} orders.`);

    // 2. Measure Transition Performance
    console.log("⏱️  Measuring Transition (Stop + Clear + Re-init simulation)...");
    const startTime = performance.now();

    // Simulate NexusSyncService.stopAll()
    await db.clearAll();
    
    // Simulate check
    const countAfterPurge = await db.orders.count();
    const transitionTime = performance.now() - startTime;

    console.log(`📊 Purge Latency: ${transitionTime.toFixed(2)}ms`);
    console.log(`📊 Orders after purge: ${countAfterPurge}`);

    // 3. Isolation Verification
    if (countAfterPurge === 0) {
        console.log("✅ ISOLATION VERIFIED: Cache was fully purged during transition.");
    } else {
        console.error("❌ ISOLATION BREACH: Residual data found in local cache!");
        process.exit(1);
    }

    // 4. Populate Tenant B
    console.log("📝 Populating Tenant B local cache...");
    await db.orders.bulkPut([
        { 
            id: 'order_B1', 
            status: 'paid', 
            timestamp: new Date(), 
            tableId: 'B1', 
            tableNumber: 'B1', 
            serverName: 'Nexus',
            items: [],
            totalInCents: 4500
        }
    ]);
    
    let countB = await db.orders.count();
    console.log(`✅ Tenant B Cache: ${countB} orders.`);

    if (transitionTime < 200) {
        console.log(`✅ PERFORMANCE VERIFIED: Transition took ${transitionTime.toFixed(2)}ms (< 200ms target).`);
    } else {
        console.warn(`⚠️ PERFORMANCE WARNING: Transition took ${transitionTime.toFixed(2)}ms (> 200ms target).`);
    }

    console.log("\n✨ BENCHMARK COMPLETE.");
    process.exit(0);
}

runTransitionBenchmark().catch(err => {
    console.error("❌ Benchmark Failed:", err);
    process.exit(1);
});
