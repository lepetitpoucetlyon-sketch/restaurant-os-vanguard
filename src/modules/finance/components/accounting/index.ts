// Barrel — manual (Grade X Smart Seal removed intentionally).
// Adding transplanted views + reconciliation from origin/main.

export * from './AccountingConfig';
export * from './ExpenseClaimDialog';
export * from './FiscalAuditView';
export * from './PlaceholderView';
export * from './TreasuryDashboard';

// Views (transplanted from origin/main — Phase 1)
export * from './views/BalanceSheetView';
export * from './views/GeneralLedgerView';
export * from './views/JournalEntriesView';
export * from './views/PlaceholderViews';
export * from './views/ProfitLossView';
export * from './views/SimpleDashboardView';

// Reconciliation (AggregationWidget + ReconciliationHub deferred — require
// PowensService/StatementIngestionService/AccountingMatchingService domain
// services that don't exist on this branch yet).
