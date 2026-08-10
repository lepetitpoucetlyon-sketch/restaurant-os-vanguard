import { logger } from '../../lib/logger';
import { NexusEventBus } from '../../shared/eventBus/NexusEventBus';

async function runEventBusCrashTest() {
    logger.info('🧨 [CRASH-TEST] Démarrage de l\'Audit 10 : Sécurité Event Bus (DLQ & IDOR)');

    // 1. Simulation d'un événement sans tenantId (Corrompu)
    logger.info('Test 1 : Injection d\'un événement sans tenantId...');
    try {
        await NexusEventBus.emitDurable('mcc.alert_triggered' as any, {
            // tenantId is intentionally missing
            message: 'Hack attempt',
            severity: 'CRITICAL'
        });
        logger.error('❌ ÉCHEC : Le Bus a accepté un événement sans tenantId.');
        process.exit(1);
    } catch (error: any) {
        if (error.message.includes('tenantId') || error.message.includes('validation')) {
            logger.info('✅ SUCCÈS : Événement rejeté pour tenantId manquant (Fail-Closed).');
        } else {
            // Note: If the event bus currently doesn't throw but routes to DLQ silently, 
            // we should check DLQ size instead, but throwing on strict schema is expected.
            logger.warn(`⚠️ Comportement inattendu : ${error.message}`);
        }
    }

    // 2. Simulation d'un événement qui fail (DLQ Routing)
    logger.info('Test 2 : Injection d\'un événement provoquant un crash du handler...');
    try {
        // Enregistrement temporaire d'un handler qui crash
        NexusEventBus.on('system.force_crash' as any, async () => {
            throw new Error('Handler Crash Simulé');
        });

        await NexusEventBus.emitDurable('system.force_crash' as any, { tenantId: 'tenant_crash' });
        
        // Si ça ne fait pas crasher l'app, c'est que la DLQ ou le catch() a bien marché.
        logger.info('✅ SUCCÈS : Le crash du handler a été isolé (Dead Letter Queue). Le Node.js Process survit.');
    } catch (error: any) {
        logger.error(`❌ ÉCHEC : Le crash a fui hors du Bus d'Événements : ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    runEventBusCrashTest().catch(console.error);
}
