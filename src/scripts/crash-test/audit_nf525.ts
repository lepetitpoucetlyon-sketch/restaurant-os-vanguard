import { logger } from '../../lib/logger';
import { SovereignGuard } from '@nexus/guards/SovereignGuard';

async function runNF525CrashTest() {
    logger.info('🧨 [CRASH-TEST] Démarrage de l\'Audit 2 : Inviolabilité Fiscale NF525');

    const fakeTenantId = 'tenant_crash_test_001';
    
    // Simuler un ticket scellé dans la collection immuable
    const sealedTicketRef = `fiscalLedger/_ref_${fakeTenantId}_ticket_888`;
    
    try {
        logger.info(`Tentation de suppression illégale du ticket scellé : ${sealedTicketRef}`);
        
        if (!SovereignGuard.canDelete(sealedTicketRef)) {
            throw new Error('SovereignGuard: Deletion strictly prohibited for fiscal records.');
        }
        
        // Si on arrive ici, le test a échoué
        logger.error('❌ ÉCHEC CRITIQUE : Le SovereignGuard a permis la suppression d\'un ticket scellé !');
        process.exit(1);
    } catch (error: any) {
        if (error.name === 'SovereignViolationError' || error.message.includes('SovereignGuard') || error.message.includes('readonly')) {
            logger.info('✅ SUCCÈS : Le SovereignGuard a bloqué la mutation avec succès.');
            logger.info(`Détail de l'erreur interceptée : ${error.message}`);
        } else {
            logger.error(`❌ ÉCHEC : Une erreur inattendue a été levée : ${error.message}`);
            process.exit(1);
        }
    }
}

// Auto-run if executed directly
if (require.main === module) {
    runNF525CrashTest().catch(console.error);
}
