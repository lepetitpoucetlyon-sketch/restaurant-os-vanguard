// @ts-nocheck
/**
 * 🏛️ DOMAIN TYPES - Restaurant OS
 * Specific business data structures for services.
 */

import { TransactionCategory, AccountSide } from './accounting.types';

export interface ExpenseData {
    amountInCents: number;
    category: TransactionCategory | string;
    description: string;
    timestamp?: string;
}

export interface SyncMessage<T = any> {
    type: string;
    payload: T;
    timestamp: number;
    nodeId: string;
}

export interface JournalLineProvision {
    accountId: string;
    accountCode: string;
    accountName: string;
    description: string;
    side: AccountSide | 'debit' | 'credit';
    amountInCents: number;
}

export interface ShiftProvision {
    pieceNumber: string;
    date: string;
    description: string;
    status: 'draft' | 'validated';
    referenceId: string;
    referenceType: 'payroll';
    isSystemGenerated: true;
    isValidated: false;
    lines: JournalLineProvision[];
    metadata: {
        userId: string;
        hours: number;
        hourlyRate: number;
    };
}
