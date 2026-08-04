import type { IPayrollConnectorProvider, TimesheetEntry, Payslip, PayrollCost, PayrollSyncResult } from '../types';
import type { PayrollPeriodSummary } from '../../../remuneration/payroll/types';
import { MergePayrollClient } from '../../../remuneration/payroll/MergePayrollClient';
import { logger } from '@/lib/logger';

/**
 * Adaptateur IPayrollConnectorProvider → MergePayrollClient.
 * Merge.dev unifie PayFit, BambooHR, ADP, Gusto, etc. via un seul token.
 */
export class MergeConnectorProvider implements IPayrollConnectorProvider {
    readonly id = 'merge';

    private client(): MergePayrollClient {
        return new MergePayrollClient({
            provider: 'merge',
            mergeAccountToken: process.env.MERGE_ACCOUNT_TOKEN,
            mergeLinkedAccountId: process.env.MERGE_LINKED_ACCOUNT_ID,
        });
    }

    async ping(): Promise<{ ok: boolean; info?: string }> {
        try {
            const client = this.client();
            const employees = await client.listRemoteEmployees();
            return { ok: true, info: `${employees.length} employé(s) distant(s)` };
        } catch (err) {
            logger.warn('[MergeConnectorProvider] ping failed', String(err));
            return { ok: false };
        }
    }

    async pushTimesheet(_employeeId: string, hours: TimesheetEntry[]): Promise<void> {
        logger.info('[MergeConnectorProvider] pushTimesheet', hours.length, 'lignes');
    }

    async fetchPayslips(tenantId: string, month: string): Promise<Payslip[]> {
        logger.info('[MergeConnectorProvider] fetchPayslips', tenantId, month);
        return [];
    }

    async fetchPayrollCost(tenantId: string, month: string): Promise<PayrollCost> {
        logger.info('[MergeConnectorProvider] fetchPayrollCost', tenantId, month);
        return { month, totalGross: 0, totalNet: 0, totalEmployerCost: 0, headcount: 0 };
    }

    async syncPeriod(summary: PayrollPeriodSummary): Promise<PayrollSyncResult> {
        const client = this.client();
        const raw = await client.syncPeriod(summary);
        return {
            success: raw.success,
            employeesUpserted: raw.synced,
            variablesAccepted: 0,   // Merge HRIS ne distingue pas les variables de paie
            errors: raw.errors,
        };
    }
}
