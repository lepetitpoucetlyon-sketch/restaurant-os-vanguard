// @ts-nocheck
"use server";

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { FiscalEngine } from '@/domain/services/FiscalEngine';
import { NexusTransaction } from '@/lib/NexusTransaction';
import { ExpenseClaimSchema, JournalEntrySchema } from '@/domain/schemas/accounting';
import { TransactionCategory } from '@/types';

import { AccountingService } from '@/domain/services/AccountingService';

/**
 * 🧾 Accounting Actions - Restaurant OS
 */

export async function submitExpenseAction(tenantId: string, expenseData: {
    userId: string;
    userName: string;
    amountInCents: number;
    category: TransactionCategory;
    description: string;
    receiptImage?: string;
}) {
    logger.info(`[ServerAction] Submitting Expense Claim (Tenant: ${tenantId})`);

    try {
        const timestamp = new Date();
        const expenseId = `exp_${timestamp.getTime()}`;
        
        // Define paths
        const fiscalPath = `tenants/${tenantId}/fiscalLedger`;
        const expenseClaimsPath = `tenants/${tenantId}/expenseClaims`;
        const journalEntriesPath = `tenants/${tenantId}/journalEntries`;
        
        // 1. Fetch Last Seal (Cloud-Strict)
        const lastSeals = await Nexus.adapter.query(fiscalPath, {
            orderBy: { field: 'timestamp', direction: 'desc' },
            limit: 1
        });
        const lastHash = lastSeals.length > 0 ? lastSeals[0].hash : null;

        // 2. Prepare Data via AccountingService
        const { seal, journalEntry } = await AccountingService.prepareExpenseTransaction(
            tenantId, 
            expenseId, 
            expenseData, 
            lastHash
        );

        // 3. ATOMIC TRANSACTION
        return await NexusTransaction.run({
            expense: { 
                schema: ExpenseClaimSchema, 
                data: { ...expenseData, id: expenseId, status: 'pending', date: timestamp.toISOString() } 
            }
        }, async (transaction) => {
            // A. Create Expense Claim
            transaction.set(`${expenseClaimsPath}/${expenseId}`, {
                ...expenseData,
                id: expenseId,
                status: 'pending',
                date: timestamp.toISOString(),
                createdAt: timestamp.toISOString(),
                updatedAt: timestamp.toISOString(),
                receiptUrl: expenseData.receiptImage
            });

            // B. Persist Fiscal Seal
            const sealId = Nexus.adapter.generateId(fiscalPath);
            transaction.set(`${fiscalPath}/${sealId}`, seal);

            // C. Create Journal Entry
            const journalId = Nexus.adapter.generateId(journalEntriesPath);
            transaction.set(`${journalEntriesPath}/${journalId}`, {
                ...journalEntry,
                id: journalId
            });

            logger.info(`[NexusTransaction] Expense Industrialized Commitment for ${expenseId}`);
            return { success: true, id: expenseId, hash: seal.hash };
        });

    } catch (error) {
        logger.error(`[ServerAction] Accounting Transaction Failed!`, error);
        throw new Error("Critical Failure: Accounting transaction rejected by validation engine.");
    }
}
