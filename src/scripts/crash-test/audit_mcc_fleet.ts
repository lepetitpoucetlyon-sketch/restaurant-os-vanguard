import { logger } from '../../lib/logger';
import { NexusEventBus } from '@orchestration/NexusEventBus';

async function runMCCFleetAudit() {
    logger.info('🧨 [CRASH-TEST] Démarrage de l\'Audit 9 : MCC & Architecture Fleet (Fan-Out)');

    logger.info('Test : Déploiement simultané d\'une mise à jour OTA (Over-The-Air) sur 10 000 instances...');

    const TENANT_COUNT = 10000;
    
    // Simulate event handlers registration (we just need 1 global or a few)
    let processedCount = 0;
    NexusEventBus.on('system.alert', async (payload: { message: string }) => {
        if (payload.message === 'OTA_UPDATE') {
            processedCount++;
        }
    });

    const start = performance.now();
    
    // Fan-Out generation
    const promises = [];
    // To avoid call stack or memory limits in a simple Node script, we chunk them
    // But Promise.all on 10,000 lightweight promises is usually fine.
    for (let i = 0; i < TENANT_COUNT; i++) {
        promises.push(
            NexusEventBus.emit('system.alert', {
                tenantId: `tenant_${i}`,
                message: 'OTA_UPDATE',
                severity: 'INFO'
            }, { skipDLQWrite: true }) // avoid DB write spam in this raw test
        );
    }

    try {
        await Promise.all(promises);
        const end = performance.now();
        const durationMs = end - start;
        
        logger.info(`✅ SUCCÈS : ${processedCount} événements propagés en ${durationMs.toFixed(2)} ms.`);
        
        const eventsPerSecond = (TENANT_COUNT / (durationMs / 1000)).toFixed(0);
        logger.info(`⚡ Débit du NexusEventBus : ${eventsPerSecond} msg/sec`);

        if (durationMs > 5000) {
            logger.warn('⚠️ AVERTISSEMENT : La performance du Fan-Out est sous le seuil optimal.');
        } else {
            logger.info('✅ SUCCÈS : L\'Architecture Fleet encaisse la charge massive sans ralentissement.');
        }
    } catch (error: any) {
        logger.error(`❌ ÉCHEC CRITIQUE : Le Bus a crashé sous la charge de 10 000 tenants : ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    runMCCFleetAudit().catch(console.error);
}
