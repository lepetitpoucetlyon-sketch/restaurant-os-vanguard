import { IFinanceRepository } from '@/src/modules/finance/comptabilite/repositories/IFinanceRepository';;
import { JournalEntry, Account, BankTransaction, ExpenseClaim } from '@nexus/contracts';
import { logger } from '@/lib/logger';

/**
 * 🧪 MockFinanceRepository - Validation of Sovereignty
 * This adapter proves that we can swap the data source (e.g. from Firestore to LocalStorage or Memory)
 * without touching the business logic in the Context or Components.
 */
export class MockFinanceRepository implements IFinanceRepository {
    async getJournalEntries(): Promise<JournalEntry[]> {
        return []; // Static mock data
    }

    async saveJournalEntry(entry: JournalEntry): Promise<void> {
        logger.debug("MOCK_SAVE: Journal Entry saved to local memory", entry);
    }

    async getAccounts(): Promise<Account[]> {
        return [];
    }

    async saveAccount(account: Account): Promise<void> {
        logger.debug("MOCK_SAVE: Account saved to local memory", account);
    }

    async getBankTransactions(): Promise<BankTransaction[]> {
        return [];
    }

    async getExpenseClaims(): Promise<ExpenseClaim[]> {
        return [];
    }

    async saveExpenseClaim(claim: ExpenseClaim): Promise<void> {
        logger.debug("MOCK_SAVE: Expense Claim saved to local memory", claim);
    }
}
