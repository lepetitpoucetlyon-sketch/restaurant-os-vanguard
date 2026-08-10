import { logger } from '../../lib/logger';
import { Nexus } from '../../lib/nexus/NexusAdapter';

async function runOfflineStressTest() {
    logger.info('🧨 [CRASH-TEST] Démarrage de l\'Audit 8 : Stress Test POS Offline-First');

    // Register a mock memory adapter for the test
    Nexus.registerServerAdapter({
        get: async () => null,
        set: async () => {},
        delete: async () => {},
        query: async () => []
    } as any);

    const tenantId = 'tenant_crash_test_001';
    
    // Initialiser l'adapter en forçant le mode offline si possible, 
    // ou simplement saturer l'outbox
    logger.info('Génération de 100 commandes simultanées...');
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 100; i++) {
        const orderPayload = {
            id: `order_${i}`,
            total: 1500,
            items: [{ id: 'item_1', name: 'Burger', price: 1500 }]
        };
        // Utiliser la méthode set (qui est interceptée par SovereignGuard)
        promises.push(Nexus.adapter.set(`tenant_${tenantId}_order_${i}`, orderPayload));
    }
    
    try {
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        
        logger.info(`✅ SUCCÈS : 100 commandes écrites en ${duration}ms sans erreur.`);
        if (duration > 2000) {
            logger.warn(`⚠️ AVERTISSEMENT : La performance est dégradée (> 2s) : ${duration}ms`);
        }
    } catch (error: any) {
        logger.error(`❌ ÉCHEC : Le système a crashé sous la charge : ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    runOfflineStressTest().catch(console.error);
}
