import { logger } from '../../lib/logger';
import { HermesKnowledgeManager } from '../../modules/intelligence/knowledge/rag/HermesKnowledgeManager';

async function runRAGSecurityAudit() {
    logger.info('🧨 [CRASH-TEST] Démarrage de l\'Audit 1 : Sécurité IA & RAG Souverain');

    const tenantA = 'tenant_A';
    const tenantB = 'tenant_B';

    // 1. Initialiser le RAG pour le Tenant A
    const hermesA = new HermesKnowledgeManager(tenantA);

    try {
        logger.info(`Test 1 : Le Tenant A tente d'injecter des données dans le RAG de ${tenantB}...`);
        
        // Simuler une attaque de Prompt Injection / IDOR
        // En essayant de stocker un pulse avec un mauvais tenantId
        await hermesA.ingestPulse({
            id: 'pulse_malicieux',
            category: 'LABOR_PATTERN',
            timestamp: Date.now(),
            tenantId: tenantB, // 🚨 Injection !
            payload: { notes: 'Secret Data' }
        } as any);

        logger.error('❌ ÉCHEC CRITIQUE : Hermes a permis à Tenant A d\'ingérer des données pour Tenant B !');
        process.exit(1);
    } catch (error: any) {
        if (error.message.includes('SovereignGuard') || error.message.includes('tenant') || error.name === 'NexusError') {
            logger.info('✅ SUCCÈS : Le SovereignGuard a bloqué l\'ingestion cross-tenant.');
        } else {
            logger.warn(`⚠️ Comportement inattendu, mais bloqué : ${error.message}`);
        }
    }

    try {
        logger.info(`Test 2 : Le Tenant A tente de lire les données du Tenant B...`);
        // Simuler une requête de similarité en forçant le tenantId du mauvais côté
        const results = await hermesA.searchSimilar({
            category: 'LABOR_PATTERN',
            tenantId: tenantB // 🚨 Injection !
        } as any);

        if (results.some((r: any) => r.tenantId === tenantB)) {
            logger.error('❌ ÉCHEC CRITIQUE : Hermes a fui des données du Tenant B vers le Tenant A !');
            process.exit(1);
        } else {
            logger.info('✅ SUCCÈS : La lecture cross-tenant est bloquée.');
        }
    } catch (error: any) {
        logger.info('✅ SUCCÈS : La lecture cross-tenant a été rejetée avec erreur.');
    }
}

if (require.main === module) {
    runRAGSecurityAudit().catch(console.error);
}
