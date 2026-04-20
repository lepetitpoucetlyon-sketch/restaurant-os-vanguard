import { FiscalEngine } from './FiscalEngine';
import { NF525Service } from './NF525Service';

/**
 * 🏛️ LegalArchiveService - Grade IX Sovereign Bridge
 * This service is an alias for the consolidated FiscalEngine.
 * Resolves legacy dependencies across the "Neural Shield" Fleet.
 */
export const LegalArchiveService = {
    ...FiscalEngine,
    ...NF525Service,
    
    // Grade IX Compatibility Wrappers
    runAudit: (seals: string[]) => FiscalEngine.runAudit(seals, 'master-instance'),
    sealEntry: NF525Service.sealEntry,
    sealPeriod: (start: Date, end: Date) => NF525Service.sealEntry('period-seal', { start, end }),
    verifyIntegrity: NF525Service.verifyIntegrity,
    verifyVaultIntegrity: NF525Service.verifyIntegrity
};

export default LegalArchiveService;
