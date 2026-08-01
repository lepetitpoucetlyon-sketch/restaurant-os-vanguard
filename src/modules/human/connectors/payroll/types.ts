export interface TimesheetEntry {
    date: string;   // YYYY-MM-DD
    hours: number;
    type: 'normal' | 'overtime' | 'night' | 'sunday' | 'holiday';
}

export interface Payslip {
    employeeId: string;
    month: string;    // YYYY-MM
    grossAmount: number;
    netAmount: number;
    employerCost: number;
    downloadUrl?: string;
}

export interface PayrollCost {
    month: string;
    totalGross: number;
    totalNet: number;
    totalEmployerCost: number;
    headcount: number;
}

export interface PayrollSyncResult {
    success: boolean;
    employeesUpserted: number;
    variablesAccepted: number;
    errors: string[];
    externalRef?: string;
}

export interface IPayrollConnectorProvider {
    readonly id: string;
    /** Vérifie la connexion sans rien persister. */
    ping(): Promise<{ ok: boolean; info?: string }>;
    pushTimesheet(employeeId: string, hours: TimesheetEntry[]): Promise<void>;
    fetchPayslips(tenantId: string, month: string): Promise<Payslip[]>;
    fetchPayrollCost(tenantId: string, month: string): Promise<PayrollCost>;
    /** Exporte le résumé pré-paie complet vers le prestataire. */
    syncPeriod(summary: import('@/modules/human/payroll/types').PayrollPeriodSummary): Promise<PayrollSyncResult>;
}
