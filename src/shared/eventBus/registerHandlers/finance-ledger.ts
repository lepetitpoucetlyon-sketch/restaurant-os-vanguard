import { registerPaymentLedgerHandler } from '../handlers/PaymentLedgerHandler';
import { registerCompMealHandler } from '../handlers/CompMealHandler';
import { registerCashCountReconciliationHandler } from '../handlers/CashCountReconciliationHandler';
import { registerFoodCostImpactedHandler } from '../handlers/FoodCostImpactedHandler';
import { registerDailyDigestHandler } from '../handlers/DailyDigestHandler';
import { registerDigitalReceiptHandler } from '../handlers/DigitalReceiptHandler';
import { registerSupplierInvoiceLedgerHandler } from '../handlers/SupplierInvoiceLedgerHandler';
import { registerQuoteFollowUpHandler } from '../handlers/QuoteFollowUpHandler';
import { registerOverdueInvoiceHandler } from '../handlers/OverdueInvoiceHandler';
import { PeriodLockGuardHandler } from '../handlers/PeriodLockGuardHandler';

export function registerFinanceLedgerHandlers(): Array<() => void> {
  return [
    registerPaymentLedgerHandler(),
    registerCompMealHandler(),
    registerCashCountReconciliationHandler(),
    registerFoodCostImpactedHandler(),
    registerDailyDigestHandler(),
    registerDigitalReceiptHandler(),
    registerSupplierInvoiceLedgerHandler(),
    registerQuoteFollowUpHandler(),
    registerOverdueInvoiceHandler(),
    PeriodLockGuardHandler.register(),
  ];
}
