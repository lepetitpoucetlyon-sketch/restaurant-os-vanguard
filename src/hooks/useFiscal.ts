"use client";

import { useAtomValue } from "jotai";
import { fiscalLedgerNodeAtom } from "@/store/operationalAtoms";
import { useCallback, useMemo } from "react";
import { useAuth, useTenant } from "@/engines/core/NexusCoreProvider";
import { submitExpenseAction } from "@/app/actions/accounting";
import { FiscalEngine } from "@/domain/services/FiscalEngine";

/**
 * ⚖️ useFiscal - Grade VI Atomic Bridge
 * Master Controller for fiscal records and NF525 compliance.
 */
export function useFiscal() {
    const node = useAtomValue(fiscalLedgerNodeAtom);
    const { currentUser } = useAuth();
    const { activeTenantId } = useTenant();

    const ledgerEntries = node.data || [];
    const isLoading = node.loading;

    // Filter seals for audit
    const fiscalSeals = useMemo(() => 
        ledgerEntries.filter((e: any) => e.fiscalSeal).map((e: any) => e.fiscalSeal),
    [ledgerEntries]);

    // Action: Submit Expense
    const submitExpense = useCallback(async (expenseData: any) => {
        if (!activeTenantId || !currentUser) {
            throw new Error("Cannot submit expense: No active tenant ID or User session.");
        }
        try {
            const result = await submitExpenseAction(activeTenantId, {
                ...expenseData,
                userId: currentUser.uid,
                userName: currentUser.displayName || 'System User'
            });
            return result.id;
        } catch (error) {
            console.error('useFiscal: Failed to submit expense:', error);
            throw error;
        }
    }, [activeTenantId, currentUser]);

    // Action: Run Audit
    const runFiscalAudit = useCallback(async () => {
        return await FiscalEngine.runAudit(fiscalSeals, 'default_instance');
    }, [fiscalSeals]);

    return { 
        data: ledgerEntries, 
        ledger: ledgerEntries,
        isLoading, 
        error: node.error,
        submitExpense,
        runFiscalAudit,
        seals: fiscalSeals
    };
}
