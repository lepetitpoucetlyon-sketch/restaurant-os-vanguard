import { registerFinanceNf525Handlers } from "./finance-nf525";
import { registerFinanceLedgerHandlers } from "./finance-ledger";
import { registerFinanceBankingHandlers } from "./finance-banking";
import { registerFinanceFiscalHandlers } from "./finance-fiscal";
import { registerFinanceTreasuryHandlers } from "./finance-treasury";

export function registerFinanceHandlers(): Array<() => void> {
  return [
    ...registerFinanceNf525Handlers(),
    ...registerFinanceLedgerHandlers(),
    ...registerFinanceBankingHandlers(),
    ...registerFinanceFiscalHandlers(),
    ...registerFinanceTreasuryHandlers(),
  ];
}
