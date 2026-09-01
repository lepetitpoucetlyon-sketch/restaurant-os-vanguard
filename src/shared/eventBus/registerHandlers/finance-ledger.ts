// AccountingSyncHandler N'EST PAS enregistre ici : il depend de credentialCipher,
// qui pose `import 'server-only'`. Ce groupe est monte par le bootstrap CLIENT
// comme par le serveur, donc l'y laisser fait remonter server-only dans le bundle
// navigateur et casse `next build`. Il vit dans finance-server.ts, monte par le
// seul registerServerNexusHandlers().
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
import { registerCriticalWasteFiscalHandler } from '../handlers/CriticalWasteFiscalHandler';

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
    registerCriticalWasteFiscalHandler(),
  ];
}

