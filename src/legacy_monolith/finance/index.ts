// Infrastructure pilier (components, hooks, services, store, providers, connectors, domain, migration)
export * from './components';
export { formatMu, computeTVABreakdown } from './components/financeUtils';
export * from './store/accountingAtoms';
export { useAccounting } from './hooks/useAccounting';
export { useFinance } from './hooks/useFinance';
export { useFinanceReflex } from './hooks/useFinanceReflex';
export { FiscalHACCPMapper } from './services/FiscalHACCPMapper';
export { FinanceCore } from './services/FinanceCore';
export { TransactionService } from './services/TransactionService';
export { FiscalEngine, FISCAL_CONSTANTS } from './services/FiscalEngine';
export { SovereignLedger } from './services/SovereignLedger';
export { FiscalKeyService } from './services/FiscalKeyService';

export type { TreasuryEntryInput } from './services/TreasuryCalculator';
export { computeTreasury } from './services/TreasuryCalculator';
export { NexusFiscalProvider, useNexusFiscal, useCompliance } from './providers/NexusFiscalProvider';

// 🏛️ SUTURE NEXUS
export type { CRM_Record, Customer } from '@nexus/contracts/nexus-internal-mapper';
export * from './types';
export { FinanceDashboard } from './components/FinanceDashboard';

export { getAmountInMu } from './hooks/useAccounting';
export { buildEntryAmountInCents } from './hooks/useAccounting';
export { FinanceSyncService } from './finance.sync';
export { AccountingReportService } from './services/AccountingReportService';
export { TreasuryDashboard } from './components/accounting';
export { FiscalAuditView } from './components/accounting';
export { FacturXDownloadButton } from './components/FacturXDownloadButton';

export { PlaceholderView } from './components/accounting/PlaceholderView';
export type { JournalEntry } from './types';
export type { FiscalSeal } from './types';
