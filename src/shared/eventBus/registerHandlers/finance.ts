import { registerTicketZHandler } from '../handlers/TicketZHandler';
import { registerPaymentLedgerHandler } from '../handlers/PaymentLedgerHandler';
import { registerSplitPaymentHandler } from '../handlers/SplitPaymentHandler';
import { registerCompEntryHandler } from '../handlers/CompEntryHandler';
import { registerRefundExtourneHandler } from '../handlers/RefundExtourneHandler';
import { registerRefundJournalHandler } from '../handlers/RefundJournalHandler';
import { registerCompJournalHandler } from '../handlers/CompJournalHandler';
import { registerSupplierInvoiceLedgerHandler } from '../handlers/SupplierInvoiceLedgerHandler';
import { registerSepaExportHandler } from '../handlers/SepaExportHandler';
import { registerBankSyncAuditHandler } from '../handlers/BankSyncAuditHandler';
import { registerReconciliationEngineHandler } from '../handlers/ReconciliationEngineHandler';
import { registerQuoteFollowUpHandler } from '../handlers/QuoteFollowUpHandler';
import { registerOverdueInvoiceHandler } from '../handlers/OverdueInvoiceHandler';
import { PeriodLockGuardHandler } from '../handlers/PeriodLockGuardHandler';
import { StripePaymentRetryHandler } from '../handlers/StripePaymentRetryHandler';
import { CashflowForecastHandler } from '../handlers/CashflowForecastHandler';
import { BankConnectionExpiredHandler } from '../handlers/BankConnectionExpiredHandler';

export function registerFinanceHandlers(): Array<() => void> {
  return [
    registerTicketZHandler(),
    registerPaymentLedgerHandler(),
    registerSplitPaymentHandler(),
    registerCompEntryHandler(),
    registerRefundExtourneHandler(),
    registerRefundJournalHandler(),
    registerCompJournalHandler(),
    registerSupplierInvoiceLedgerHandler(),
    registerSepaExportHandler(),
    registerBankSyncAuditHandler(),
    registerReconciliationEngineHandler(),
    registerQuoteFollowUpHandler(),
    registerOverdueInvoiceHandler(),
    PeriodLockGuardHandler.register(),
    StripePaymentRetryHandler.register(),
    CashflowForecastHandler.register(),
    BankConnectionExpiredHandler.register(),
  ];
}
