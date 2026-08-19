import { registerSepaExportHandler } from '../handlers/SepaExportHandler';
import { registerBankSyncAuditHandler } from '../handlers/BankSyncAuditHandler';
import { registerReconciliationEngineHandler } from '../handlers/ReconciliationEngineHandler';
import { BankConnectionExpiredHandler } from '../handlers/BankConnectionExpiredHandler';
import { CashflowForecastHandler } from '../handlers/CashflowForecastHandler';
import { StripePaymentRetryHandler } from '../handlers/StripePaymentRetryHandler';

export function registerFinanceBankingHandlers(): Array<() => void> {
  return [
    registerSepaExportHandler(),
    registerBankSyncAuditHandler(),
    registerReconciliationEngineHandler(),
    StripePaymentRetryHandler.register(),
    CashflowForecastHandler.register(),
    BankConnectionExpiredHandler.register(),
  ];
}
