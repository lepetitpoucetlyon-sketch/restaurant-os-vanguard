import { IFinanceRepository } from '@/modules/finance';
import { JournalEntry, Account, BankTransaction, ExpenseClaim } from '@nexus/contracts';
import { INexusAdapter, Nexus } from '@/lib/nexus/NexusAdapter';
import { FirestoreHydrator } from '@/infrastructure/services/sovereign/firestoreHydrator';

/**
 * 🏛️ FirestoreFinanceRepository - Grade X Adapter
 * Implements IFinanceRepository using the Firestore database.
 * Handles domain-specific hydration for financial records.
 */
export class FirestoreFinanceRepository implements IFinanceRepository {
    private adapter: INexusAdapter;
    private tenantId: string;

    constructor(tenantId: string) {
        this.adapter = Nexus.adapter;
        this.tenantId = tenantId;
    }

    private getPath(collection: string): string {
        return `tenants/${this.tenantId}/${collection}`;
    }

    async getJournalEntries(): Promise<JournalEntry[]> {
        const raw = await this.adapter.query<Record<string, unknown>>(this.getPath('journalEntries'));
        return FirestoreHydrator.hydrateCollection(raw, FirestoreHydrator.hydrateJournalEntry);
    }

    async saveJournalEntry(entry: JournalEntry): Promise<void> {
        await this.adapter.set(this.getPath(`journalEntries/${entry.id}`), entry);
    }

    async getAccounts(): Promise<Account[]> {
        const raw = await this.adapter.query<Record<string, unknown>>(this.getPath('accounts'));
        return FirestoreHydrator.hydrateCollection(raw, FirestoreHydrator.hydrateAccount);
    }

    async saveAccount(account: Account): Promise<void> {
        await this.adapter.set(this.getPath(`accounts/${account.id}`), account);
    }

    async getBankTransactions(): Promise<BankTransaction[]> {
        const raw = await this.adapter.query<Record<string, unknown>>(this.getPath('bankTransactions'));
        return FirestoreHydrator.hydrateCollection(raw, FirestoreHydrator.hydrateBankTransaction);
    }

    async getExpenseClaims(): Promise<ExpenseClaim[]> {
        const raw = await this.adapter.query<Record<string, unknown>>(this.getPath('expenseClaims'));
        return FirestoreHydrator.hydrateCollection(raw, FirestoreHydrator.hydrateExpenseClaim);
    }

    async saveExpenseClaim(claim: ExpenseClaim): Promise<void> {
        await this.adapter.set(this.getPath(`expenseClaims/${claim.id}`), claim);
    }
}
