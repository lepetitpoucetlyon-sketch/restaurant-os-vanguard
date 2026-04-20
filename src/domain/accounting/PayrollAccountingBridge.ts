import { JournalEntry, JournalLine } from '@/types';

/**
 * ⚖️ PayrollAccountingBridge - Restaurant OS
 * Traduit les bulletins de paie validés en écritures comptables (PCG 641/421).
 */
export class PayrollAccountingBridge {
    
    private static ACCOUNT_PAYROLL_EXPENSE = 'acc_641'; // Rémunérations du personnel
    private static ACCOUNT_PAYROLL_LIABILITY = 'acc_421'; // Personnel - Rémunérations dues

    /**
     * Prépare une écriture comptable à partir d'un bulletin de paie.
     */
    static preparePayrollEntry(payrollData: {
        id: string;
        employeeId: string;
        employeeName: string;
        netAmount: number;
        grossAmount: number;
        chargesSociales: number;
        period: string;
    }): Omit<JournalEntry, 'id' | 'pieceNumber' | 'isSystemGenerated' | 'isValidated'> {
        
        const description = `Paie ${payrollData.period} - ${payrollData.employeeName}`;
        
        const lines: JournalLine[] = [
            {
                accountId: this.ACCOUNT_PAYROLL_EXPENSE,
                accountCode: '641',
                accountName: 'Rémunérations du personnel',
                description: `Salaire brut + Charges`,
                side: 'debit',
                amountInCents: payrollData.grossAmount + payrollData.chargesSociales
            },
            {
                accountId: this.ACCOUNT_PAYROLL_LIABILITY,
                accountCode: '421',
                accountName: 'Personnel - Rémunérations dues',
                description: `Net à payer`,
                side: 'credit',
                amountInCents: payrollData.netAmount
            }
        ];

        // Note: Dans une configuration réelle, on ajouterait ici les lignes de taxes (431 URSSAF, etc.)
        
        return {
            date: new Date(),
            description,
            lines,
            referenceId: payrollData.id,
            referenceType: 'payroll',
            metadata: {
                employeeId: payrollData.employeeId,
                period: payrollData.period
            }
        } as any;
    }
}
