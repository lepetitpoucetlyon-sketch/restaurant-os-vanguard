        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { FiscalEngine } from '@/modules/finance';
import type { FiscalSeal } from '@nexus/contracts';

/**
 * 🏛️ LegalArchiveService - Grade IX Sovereign Bridge
 * Lazy wrappers around FiscalEngine — all methods call FiscalEngine at call-time
 * (not at module init time) to avoid circular-dependency issues.
 */
export const LegalArchiveService = {
    // Grade IX Compatibility Wrappers — lazy: FiscalEngine is read at call time
    runAudit: (seals: FiscalSeal[]) => FiscalEngine.runAudit(seals, 'master-instance'),
    sealEntry: (...args: Parameters<typeof FiscalEngine.sealEntry>) => FiscalEngine.sealEntry(...args),
    sealPeriod: (start: Date, end: Date) => FiscalEngine.sealEntry('period-seal', { start: start.toISOString(), end: end.toISOString() }),
    verifyChain: (seals: FiscalSeal[]) => FiscalEngine.verifyChain(seals),
    verifyIntegrity: (seals: FiscalSeal[]) => FiscalEngine.verifyChain(seals),
    verifyVaultIntegrity: (seals: FiscalSeal[]) => FiscalEngine.verifyChain(seals),
};

export default LegalArchiveService;
