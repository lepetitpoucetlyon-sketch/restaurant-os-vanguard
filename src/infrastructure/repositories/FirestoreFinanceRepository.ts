import { IFinanceRepository } from '@domain/repositories/IFinanceRepository';
import { JournalEntry, Account, BankTransaction, ExpenseClaim } from '@nexus/contracts';
import { FirestoreAdapter } from '@/infrastructure/adapters/FirestoreAdapter';

/**
 * 🏛️ FirestoreFinanceRepository - Grade X Adapter
 * Implements IFinanceRepository using the Firestore database.
 */
export class FirestoreFinanceRepository implements IFinanceRepository {
    private adapter: FirestoreAdapter;
    private tenantId: string;

    constructor(tenantId: string) {
        this.adapter = new FirestoreAdapter();
        this.tenantId = tenantId;
    }

    private getPath(collection: string): string {
        return `tenants/${this.tenantId}/${collection}`;
    }

    async getJournalEntries(): Promise<JournalEntry[]> {
        return await this.adapter.query<JournalEntry>(this.getPath('journalEntries'));
    }

    async saveJournalEntry(entry: JournalEntry): Promise<void> {
        await this.adapter.set(this.getPath(`journalEntries/${entry.id}`), entry);
    }

    async getAccounts(): Promise<Account[]> {
        return await this.adapter.query<Account>(this.getPath('accounts'));
    }

    async saveAccount(account: Account): Promise<void> {
        await this.adapter.set(this.getPath(`accounts/${account.id}`), account);
    }

    async getBankTransactions(): Promise<BankTransaction[]> {
        return await this.adapter.query<BankTransaction>(this.getPath('bankTransactions'));
    }

    async getExpenseClaims(): Promise<ExpenseClaim[]> {
        return await this.adapter.query<ExpenseClaim>(this.getPath('expenseClaims'));
    }

    async saveExpenseClaim(claim: ExpenseClaim): Promise<void> {
        await this.adapter.set(this.getPath(`expenseClaims/${claim.id}`), claim);
    }
}
