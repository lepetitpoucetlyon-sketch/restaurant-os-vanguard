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
export { FiscalEngine, FISCAL_CONSTANTS } from './fiscalite/FiscalAdapter';
export { FiscalSealer } from './fiscalite/FiscalSealer';
export { FinancialNexusBridge } from './comptabilite/FinancialNexusBridge';
export { TaxCalculator } from './fiscalite/TaxCalculator';
export { SovereignLedger } from './services/SovereignLedger';
export { FiscalKeyService } from './services/FiscalKeyService';

export type { TreasuryEntryInput } from './services/TreasuryCalculator';
export { computeTreasury } from './services/TreasuryCalculator';
export type { IFinanceRepository } from './comptabilite/repositories/IFinanceRepository';
export { NexusFiscalProvider, useNexusFiscal, useCompliance } from './providers/NexusFiscalProvider';
export { StatementIngestionService } from './comptabilite/accounting/domain/StatementIngestionService';

// 🏛️ SUTURE NEXUS
export type { CRM_Record, Customer } from '@nexus/contracts/nexus-internal-mapper';
export * from './types';
export { FinanceDashboard } from './components/FinanceDashboard';

export { getAmountInMu } from './hooks/useAccounting';
export { buildEntryAmountInCents } from './hooks/useAccounting';
export { CollectionService } from './tresorerie/collection/CollectionService';
export { TreasuryEngine } from './services/TreasuryEngine';
export type { TreasuryReport } from './services/TreasuryEngine';
export { BillingService } from './services/BillingService';
export type { FleetTreasuryReport } from './services/BillingService';
export { useAnalyticsPage } from './comptabilite/analytics/hooks';
export { percentChange } from './comptabilite/analytics/hooks';
export type { MacroBrainAlert } from './comptabilite/analytics/hooks';
// UsageTracker est server-only — import direct depuis le chemin complet en contexte serveur uniquement.
export { resolveVatRate } from './fiscalite/tax/vatResolver';
export { inferCategory } from './fiscalite/tax/vatResolver';
export { FinanceSyncService } from './finance.sync';
export { AccountingReportService } from './services/AccountingReportService';
export { TreasuryDashboard } from './components/accounting';
export { FiscalAuditView } from './components/accounting';
export { FacturXDownloadButton } from './components/FacturXDownloadButton';
export { useBilling } from './comptabilite/billing/hooks';

export { PlaceholderView } from './components/accounting/PlaceholderView';
export { BankingNexusBridge } from './tresorerie/banking/BankingNexusBridge';
export { inferPCGAccount } from './tresorerie/banking/openBanking';
export type { JournalEntry } from './types';
export type { FiscalSeal } from './types';
export { FECGenerator } from './comptabilite/fec/FECGenerator';
export { UsageTracker } from './comptabilite/billing/UsageTracker';
export { OpenBankingProviderFactory } from './tresorerie/banking/openBanking/OpenBankingProviderFactory';
export { BankConnectionStore } from './tresorerie/banking/openBanking/BankConnectionStore';
export { signBankConnectState, verifyBankConnectState } from './tresorerie/banking/openBanking/tokenCipher';
export { GoCardlessProvider } from './tresorerie/banking/openBanking/GoCardlessProvider';

// 🏛️ Domaine Schemas
export * from './domain/schemas/finance';
export * from './domain/schemas/periodClosure';
