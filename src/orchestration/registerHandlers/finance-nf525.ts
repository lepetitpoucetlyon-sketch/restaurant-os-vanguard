import { registerOrderSealedNF525Handler } from '../handlers/OrderSealedNF525Handler';
import { registerTicketZHandler } from '../handlers/TicketZHandler';
import { registerPaymentLedgerHandler } from '../handlers/PaymentLedgerHandler';
import { registerSplitPaymentHandler } from '../handlers/SplitPaymentHandler';
import { registerCompEntryHandler } from '../handlers/CompEntryHandler';
import { registerRefundExtourneHandler } from '../handlers/RefundExtourneHandler';
import { registerRefundJournalHandler } from '../handlers/RefundJournalHandler';
import { registerCompJournalHandler } from '../handlers/CompJournalHandler';
import { registerTechAuditLedgerHandler } from '../handlers/TechAuditLedgerHandler';
import { registerCryptoIntegrityCheckHandler } from '../handlers/CryptoIntegrityCheckHandler';
import { registerMonthlyFECExportHandler } from '../handlers/MonthlyFECExportHandler';
import { registerPaymentRejectAuditHandler } from '../handlers/PaymentRejectAuditHandler';
import { registerTaxMismatchAlertHandler } from '../handlers/TaxMismatchAlertHandler';
import { registerTicketZArchiveHandler } from '../handlers/TicketZArchiveHandler';
import { registerZReportCloseHandler } from '../handlers/ZReportCloseHandler';

export function registerFinanceNf525Handlers(): Array<() => void> {
  return [
    registerOrderSealedNF525Handler(),
    registerTicketZHandler(),
    registerZReportCloseHandler(),
    registerPaymentLedgerHandler(),
    registerSplitPaymentHandler(),
    registerCompEntryHandler(),
    registerRefundExtourneHandler(),
    registerRefundJournalHandler(),
    registerCompJournalHandler(),
    registerTechAuditLedgerHandler(),
    registerCryptoIntegrityCheckHandler(),
    registerMonthlyFECExportHandler(),
    registerPaymentRejectAuditHandler(),
    registerTaxMismatchAlertHandler(),
    registerTicketZArchiveHandler(),
  ];
}
