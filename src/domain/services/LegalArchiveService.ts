import { FiscalEngine } from './FiscalEngine';
import { NF525Service } from './NF525Service';
import { FiscalSeal } from '@/types';

/**
 * 🏛️ LegalArchiveService - Grade IX Sovereign Bridge
 * This service is an alias for the consolidated FiscalEngine.
 * Resolves legacy dependencies across the "Neural Shield" Fleet.
 */
export const LegalArchiveService = {
    ...FiscalEngine,
    ...NF525Service,
    
    // Grade IX Compatibility Wrappers
    runAudit: (seals: FiscalSeal[]) => FiscalEngine.runAudit(seals, 'master-instance'),
    sealEntry: FiscalEngine.sealEntry,
    sealPeriod: (start: Date, end: Date) => FiscalEngine.sealEntry('period-seal', { start, end }),
    verifyIntegrity: (seals: FiscalSeal[]) => FiscalEngine.verifyChain(seals),
    verifyVaultIntegrity: (seals: FiscalSeal[]) => FiscalEngine.verifyChain(seals)
};

export default LegalArchiveService;
