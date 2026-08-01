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
import { registerFinanceNf525Handlers } from './finance-nf525';
import { registerPaymentLedgerHandler } from '../handlers/PaymentLedgerHandler';
import { registerCompMealHandler } from '../handlers/CompMealHandler';

export function registerFinanceHandlers(): Array<() => void> {
  return [
    ...registerFinanceNf525Handlers(),
    registerPaymentLedgerHandler(),
    registerCompMealHandler(),
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
