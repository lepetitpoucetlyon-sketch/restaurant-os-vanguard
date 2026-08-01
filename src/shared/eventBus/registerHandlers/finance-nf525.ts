import { registerTicketZHandler } from '../handlers/TicketZHandler';
import { registerPaymentLedgerHandler } from '../handlers/PaymentLedgerHandler';
import { registerSplitPaymentHandler } from '../handlers/SplitPaymentHandler';
import { registerCompEntryHandler } from '../handlers/CompEntryHandler';
import { registerRefundExtourneHandler } from '../handlers/RefundExtourneHandler';
import { registerRefundJournalHandler } from '../handlers/RefundJournalHandler';
import { registerCompJournalHandler } from '../handlers/CompJournalHandler';

export function registerFinanceNf525Handlers(): Array<() => void> {
  return [
    registerTicketZHandler(),
    registerPaymentLedgerHandler(),
    registerSplitPaymentHandler(),
    registerCompEntryHandler(),
    registerRefundExtourneHandler(),
    registerRefundJournalHandler(),
    registerCompJournalHandler(),
  ];
}
