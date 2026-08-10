import { createProxyDomain } from '@/store/nexusNodeFactory';
import { JournalEntry, Account, BankTransaction, ExpenseClaim } from '../types';
import { atom } from 'jotai';

/**
 * 📊 ACCOUNTING & FINANCE DOMAIN - Grade VI
 */

const _journalEntries = createProxyDomain<JournalEntry>('journalEntries');
export const journalEntriesNodeAtom = _journalEntries.node;
export const journalEntriesAtom = _journalEntries.data;

const _accounts = createProxyDomain<Account>('accounts');
export const accountsNodeAtom = _accounts.node;
export const accountsAtom = _accounts.data;

const _bankTransactions = createProxyDomain<BankTransaction>('bankTransactions');
export const bankTransactionsNodeAtom = _bankTransactions.node;
export const bankTransactionsAtom = _bankTransactions.data;

const _expenseClaims = createProxyDomain<ExpenseClaim>('expenseClaims');
export const expenseClaimsNodeAtom = _expenseClaims.node;
export const expenseClaimsAtom = _expenseClaims.data;

// UI States
export const accountingViewModeAtom = atom<'simple' | 'expert'>('simple');
export const isAccountingSyncingAtom = atom(false);
export const accountingLoadingAtom = atom(
    (get) =>
        get(journalEntriesNodeAtom).loading ||
        get(accountsNodeAtom).loading ||
        get(bankTransactionsNodeAtom).loading,
);

// Grade X Anchors
export { nexusPulseAtom } from '@/store/pulseAtoms';
export { tenantIdAtom } from '@/bootstrap/store/pillars/sovereign';
