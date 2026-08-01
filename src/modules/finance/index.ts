// Domaine : comptabilite (accounting, billing, FEC, documents, analytics, repositories)
export * from './comptabilite/accounting';
export * from './comptabilite/billing';
export * from './comptabilite/fec';
export { BlockchainLedgerService } from './comptabilite/accounting/domain/BlockchainLedgerService';
export { PayrollAccountingMapper } from './comptabilite/accounting/domain/PayrollAccountingMapper';
export { FECExporter } from './comptabilite/accounting/domain/FECExporter';

// Domaine : tresorerie (banking, payout, collection, AP)
export * from './tresorerie/banking/openBanking';
export type { InvoiceTarget, CommunicationPulse } from './tresorerie/collection/types';

// Domaine : fiscalite (tax)

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
export { BillingService } from './services/BillingService';
export type { TreasuryEntryInput } from './services/TreasuryCalculator';
export { computeTreasury } from './services/TreasuryCalculator';
export type { IFinanceRepository } from './comptabilite/repositories/IFinanceRepository';
export { NexusFiscalProvider, useNexusFiscal, useCompliance } from './providers/NexusFiscalProvider';
export { StatementIngestionService } from './comptabilite/accounting/domain/StatementIngestionService';

// 🏛️ SUTURE NEXUS
export type { CRM_Record, Customer } from '@nexus/contracts/nexus-internal-mapper';
export * from './types';
export { FinanceDashboard } from './components/FinanceDashboard';
