// Domaine : comptabilite (accounting, billing, FEC, documents, analytics, repositories)
export * from './comptabilite/accounting';
export * from './comptabilite/billing';
export * from './comptabilite/fec';
export { BlockchainLedgerService } from './comptabilite/accounting/domain/BlockchainLedgerService';
export { PayrollAccountingMapper } from './comptabilite/accounting/domain/PayrollAccountingMapper';

// Domaine : tresorerie (banking, payout, collection, AP)
export * from './tresorerie/banking/openBanking';

// Domaine : fiscalite (tax)

// Infrastructure pilier (components, hooks, services, store, providers, connectors, domain, migration)
export * from './components';
export * from './store/accountingAtoms';
export { useAccounting } from './hooks/useAccounting';
export { useFinance } from './hooks/useFinance';
export { useFinanceReflex } from './hooks/useFinanceReflex';
export { FiscalHACCPMapper } from './services/FiscalHACCPMapper';
export { FinanceCore } from './services/FinanceCore';
export { TransactionService } from './services/TransactionService';

// 🏛️ SUTURE NEXUS
export type { CRM_Record, Customer } from '@nexus/contracts/nexus-internal-mapper';
export * from './types';
export { FinanceDashboard } from './components/FinanceDashboard';
