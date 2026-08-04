import { JournalEntry, JournalLine } from '@nexus/contracts';

/**
 * ⚖️ PayrollAccountingMapper - Restaurant OS (Internal Mapper)
 * Traduit les bulletins de paie validés en écritures comptables (PCG 641/421).
 */
export class PayrollAccountingMapper {
    
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
    }): Omit<JournalEntry, 'id' | 'pieceNumber' | 'updatedAt'> {
        
        const description = `Paie ${payrollData.period} - ${payrollData.employeeName}`;
        
        const now = new Date().toISOString();
        const pieceNumber = `PAY-${Date.now()}`;
        const grossTotal = payrollData.grossAmount + payrollData.chargesSociales;
        const lines: JournalLine[] = [
            {
                accountId: this.ACCOUNT_PAYROLL_EXPENSE,
                accountCode: '641',
                accountName: 'Rémunérations du personnel',
                description: `Salaire brut + Charges`,
                side: 'debit',
                amountInCents: grossTotal,
                amountInMicrounits: grossTotal * 10_000,
                date: now,
                pieceNumber,
                debitInCents: grossTotal,
                debitInMicrounits: grossTotal * 10_000,
                creditInCents: 0,
                creditInMicrounits: 0,
                runningBalanceInCents: 0,
                runningBalanceInMicrounits: 0,
            },
            {
                accountId: this.ACCOUNT_PAYROLL_LIABILITY,
                accountCode: '421',
                accountName: 'Personnel - Rémunérations dues',
                description: `Net à payer`,
                side: 'credit',
                amountInCents: payrollData.netAmount,
                amountInMicrounits: payrollData.netAmount * 10_000,
                date: now,
                pieceNumber,
                debitInCents: 0,
                debitInMicrounits: 0,
                creditInCents: payrollData.netAmount,
                creditInMicrounits: payrollData.netAmount * 10_000,
                runningBalanceInCents: 0,
                runningBalanceInMicrounits: 0,
            }
        ];

        // Note: Dans une configuration réelle, on ajouterait ici les lignes de taxes (431 URSSAF, etc.)
        
        return {
            date: now,
            description,
            lines,
            referenceId: payrollData.id,
            referenceType: 'payroll',
            isSystemGenerated: true,
            isValidated: false,
            metadata: {
                employeeId: payrollData.employeeId,
                period: payrollData.period
            }
        };
    }
}
