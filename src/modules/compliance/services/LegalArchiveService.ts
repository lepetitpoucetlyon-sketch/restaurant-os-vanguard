        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { FiscalEngine } from '@/modules/finance/services';
import { FiscalSeal } from '@nexus/contracts';

/**
 * 🏛️ LegalArchiveService - Grade IX Sovereign Bridge
 * This service is an alias for the consolidated FiscalEngine.
 * Resolves legacy dependencies across the "Neural Shield" Fleet.
 */
export const LegalArchiveService = {
    ...FiscalEngine,

    // Grade IX Compatibility Wrappers
    runAudit: (seals: FiscalSeal[]) => FiscalEngine.runAudit(seals, 'master-instance'),
    sealEntry: FiscalEngine.sealEntry,
    sealPeriod: (start: Date, end: Date) => FiscalEngine.sealEntry('period-seal', { start, end }),
    verifyIntegrity: (seals: FiscalSeal[]) => FiscalEngine.verifyChain(seals),
    verifyVaultIntegrity: (seals: FiscalSeal[]) => FiscalEngine.verifyChain(seals)
};

export default LegalArchiveService;
