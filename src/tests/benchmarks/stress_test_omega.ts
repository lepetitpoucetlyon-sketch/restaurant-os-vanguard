import { Slayer, LegacyOrder } from '@/domain/services/Slayer';
import { logger } from '@/lib/logger';

async function runStressTest() {
    const VOLUME = 10000;
    logger.info(`🏛️ INITIATING GRADE VI STRESS TEST: ${VOLUME} ENTRIES`);
    
    // 🧪 Génération de données factices massives
    const fakeStream: LegacyOrder[] = Array.from({ length: VOLUME }).map((_, i) => ({
        id: `LG-${100000 + i}`,
        total: Math.floor(Math.random() * 5000) + 1000,
        timestamp: new Date().toISOString(),
        items: [
            { id: 'prod_1', title: 'Pizza Royale', price: 1200, quantity: 1 },
            { id: 'prod_2', title: 'Vin Rouge', price: 2500, quantity: 1 }
        ]
    }));

    const start = Date.now();
    
    const results = await Slayer.ingestMassive(fakeStream, 'lepetitpoucet', (processed) => {
        if (processed % 1000 === 0) {
            const elapsed = (Date.now() - start) / 1000;
            logger.info(`[StressTest] Progress: ${processed}/${VOLUME} (Elapsed: ${elapsed.toFixed(1)}s)`);
        }
    });


    const totalTime = (Date.now() - start) / 1000;
    
    logger.info(`🏁 STRESS TEST COMPLETED`);
    logger.info(`- Ingested: ${results.ingested}`);
    logger.info(`- Errors: ${results.errors}`);
    logger.info(`- Total Time: ${totalTime.toFixed(2)}s`);
    logger.info(`- Average Speed: ${(results.ingested / totalTime).toFixed(2)} items/s`);
    
    if (results.errors === 0 && results.ingested === VOLUME) {
        logger.info(`✅ GRADE VI VALIDATED: 100% SUCCESS RATE`);
    } else {
        logger.error(`❌ GRADE VI FAILURE: Data integrity or performance issues detected.`);
    }
}

runStressTest().catch(console.error);
