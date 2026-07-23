import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { SovereignLedger } from '@/infrastructure/adapters/SovereignLedgerAdapter';

async function runSiege() {
    logger.info('🚀 [Siege] Vector 4: Compliance Blackout - Initiating...');

    const targetPath = Nexus.getTenantPath('ledger/entries/CRITICAL_ENTRY');
    
    logger.info(`👻 [Siege] Ghost Script attempting to DELETE from Fiscal Ledger at [${targetPath}]...`);

    try {
        // Attack 1: Direct Delete on Adapter
        await Nexus.adapter.delete(targetPath);
        logger.error('🚨 [Siege] VULNERABILITY: Ghost Script successfully deleted a Fiscal Entry!');
    } catch (error) {
        logger.info(`✅ [Siege] Attack 1 Blocked: Adapter/Guard rejected delete operation. Error: ${error.message}`);
    }

    logger.info('⚖️ [Siege] Attempting to record Asymmetric Transaction (Sabotage)...');

    try {
        // Attack 2: Asymmetric Transaction (Monkey Patch simulation)
        await SovereignLedger.recordTransfer({
            debitAccount: 'CASH',
            creditAccount: 'SALES',
            amountInCents: 1000,
            referenceId: 'SABOTAGE_01',
            description: 'Sabotage Attempt',
            _monkeyPatch: { forceAsymmetry: true }
        });
    } catch (_error) {
        logger.info(`✅ [Siege] Attack 2 Blocked: SovereignLedger detected sabotage. System Status: ${SovereignLedger.currentMode}`);
        if (SovereignLedger.currentMode === 'LOCAL_LOCK') {
            logger.info('🏆 [Siege] SYSTEM LOCKDOWN ACHIEVED. Legal Stop successful.');
        }
    }
}

runSiege().catch(console.error);
