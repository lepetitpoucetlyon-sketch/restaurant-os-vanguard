import { JournalEntry, Account, BankTransaction, ExpenseClaim } from '@nexus/contracts';

/**
 * 🏛️ IFinanceRepository - Grade X Port
 * Defines the contract for financial data access, independent of the storage engine.
 */
export interface IFinanceRepository {
    getJournalEntries(): Promise<JournalEntry[]>;
    saveJournalEntry(entry: JournalEntry): Promise<void>;
    getAccounts(): Promise<Account[]>;
    saveAccount(account: Account): Promise<void>;
    getBankTransactions(): Promise<BankTransaction[]>;
    getExpenseClaims(): Promise<ExpenseClaim[]>;
    saveExpenseClaim(claim: ExpenseClaim): Promise<void>;
}
