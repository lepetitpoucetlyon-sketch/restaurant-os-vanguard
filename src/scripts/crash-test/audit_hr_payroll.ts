import { logger } from '../../lib/logger';
import { ThemisHRAgent } from '../../modules/intelligence/agents/ThemisHRAgent';

async function runHRPayrollAudit() {
    logger.info('🧨 [CRASH-TEST] Démarrage de l\'Audit 6 : RH & Paie (Calculs Complexes)');

    // 1. Initialiser l'Agent Themis
    const fakeKnowledgeManager = {
        searchSimilar: async () => [{ 
            content: 'Règle légale: Une pause de 20 minutes consécutives est obligatoire dès 6 heures de travail.',
            tenantId: 'tenant_crash_test_001'
        }]
    } as any;
    
    const themis = new ThemisHRAgent(fakeKnowledgeManager);

    logger.info('Test : Injection d\'un Timeclock illégal (Shift de 7h avec seulement 10 min de pause)...');

    const illegalAction = {
        id: 'action_123',
        type: 'hr.approve_overtime', // Using existing type for evaluation
        sourceEventId: 'event_456',
        proposedPayload: {
            shiftDurationHours: 7,
            breakDurationMinutes: 10, // ILLÉGAL (devrait être 20)
            employeeId: 'emp_001'
        },
        status: 'PENDING'
    } as any;

    try {
        const evaluation = await themis.evaluate(illegalAction, { tenantId: 'tenant_crash_test_001', contextOverrides: {} });

        if (evaluation.confidence < 0.8 && evaluation.reason.includes('légal')) {
            logger.info(`✅ SUCCÈS : L'IA Themis a détecté la violation légale ! Raison: ${evaluation.reason}`);
        } else if (!evaluation.isApproved) {
            logger.info(`✅ SUCCÈS : Themis a rejeté l'action. Raison: ${evaluation.reason}`);
        } else {
            logger.error('❌ ÉCHEC CRITIQUE : Themis a validé un shift illégal !');
            process.exit(1);
        }
    } catch (error: any) {
        logger.error(`❌ ÉCHEC : Erreur lors de l'évaluation RH : ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    runHRPayrollAudit().catch(console.error);
}
