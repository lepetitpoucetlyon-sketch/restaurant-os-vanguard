import { JournalEntry, Account, BankTransaction, ExpenseClaim } from '@nexus/contracts';

/**
 * 🏛️ IFinanceRepository - Grade X Port
 * Defines the contract for financial data access, independent of the storage engine.
 */
export interface IFinanceRepository {
    // Journal Entries
    getJournalEntries(): Promise<JournalEntry[]>;
    saveJournalEntry(entry: JournalEntry): Promise<void>;
    
    // Accounts
    getAccounts(): Promise<Account[]>;
    saveAccount(account: Account): Promise<void>;
    
    // Transactions
    getBankTransactions(): Promise<BankTransaction[]>;
    
    // Claims
    getExpenseClaims(): Promise<ExpenseClaim[]>;
    saveExpenseClaim(claim: ExpenseClaim): Promise<void>;
}
