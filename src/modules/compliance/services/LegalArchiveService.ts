// eslint-disable-next-line no-restricted-imports -- deep import volontaire : évite cycle finance ↔ compliance. Cible α-5 : extraire FiscalEngine vers kernel/.
import { FiscalEngine } from '@/modules/finance/services/FiscalEngine';
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
