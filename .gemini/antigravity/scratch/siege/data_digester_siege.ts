import { DataDigester } from '@/domain/services/DataDigester';
import { logger } from '@/lib/logger';

async function runSiege() {
    logger.info('🚀 [Siege] Vector 1: DataDigester Siege - Initiating...');

    const toxicData = Array.from({ length: 10000 }).map((_, i) => ({
        id: `toxic_${i}`,
        source: 'ZELTY_SIEGE',
        customer: {
            firstName: i % 100 === 0 ? '<script>alert("Hacked")</script>' : 'John',
            lastName: 'Doe',
            email: i % 50 === 0 ? 'not-an-email' : 'john@doe.com'
        },
        items: [
            {
                productId: 'prod_1',
                name: 'Toxic Burger',
                quantity: i % 10 === 0 ? -1 : 1, // Negative quantity
                price: i % 20 === 0 ? -10.5 : 12.5, // Negative price
            }
        ],
        total: -5, // Negative total
        status: 'PAID',
        createdAt: i % 30 === 0 ? '1900-01-01T00:00:00Z' : new Date().toISOString(),
        tenantId: 'vanguard'
    }));

    const start = Date.now();
    const results = await DataDigester.digestBatch(toxicData);
    const end = Date.now();

    const successCount = results.length;
    const failureCount = toxicData.length - successCount;

    logger.info(`📊 [Siege] Results: ${successCount} passed, ${failureCount} rejected.`);
    logger.info(`⏱️ [Siege] Processed 10,000 items in ${end - start}ms.`);

    if (successCount > 0) {
        logger.error(`🚨 [Siege] VULNERABILITY: ${successCount} toxic items were ingested!`);
        results.slice(0, 5).forEach(r => console.log(JSON.stringify(r, null, 2)));
    } else {
        logger.info('✅ [Siege] Vector 1 Blocked: All toxic data rejected by Zod Barrier.');
    }
}

runSiege().catch(console.error);
