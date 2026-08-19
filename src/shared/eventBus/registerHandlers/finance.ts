import { registerFinanceNf525Handlers } from './finance-nf525';
import { registerFinanceBankingHandlers } from './finance-banking';
import { registerFinanceLedgerHandlers } from './finance-ledger';

export function registerFinanceHandlers(): Array<() => void> {
  return [
    ...registerFinanceNf525Handlers(),
    ...registerFinanceBankingHandlers(),
    ...registerFinanceLedgerHandlers(),
  ];
}
