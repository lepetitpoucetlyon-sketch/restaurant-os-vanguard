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
        const grossTotalMu = (payrollData.grossAmount + payrollData.chargesSociales) * 10_000;
        const grossTotalCents = Math.round(grossTotalMu / 10_000);
        const netMu = payrollData.netAmount * 10_000;
        const netCents = payrollData.netAmount;
        const lines: JournalLine[] = [
            {
                accountId: this.ACCOUNT_PAYROLL_EXPENSE,
                accountCode: '641',
                accountName: 'Rémunérations du personnel',
                description: `Salaire brut + Charges`,
                side: 'debit',
                amountInMicrounits: grossTotalMu,
                amountInCents: grossTotalCents,
                date: now,
                pieceNumber,
                debitInMicrounits: grossTotalMu,
                debitInCents: grossTotalCents,
                creditInMicrounits: 0,
                creditInCents: 0,
                runningBalanceInMicrounits: 0,
                runningBalanceInCents: 0,
            },
            {
                accountId: this.ACCOUNT_PAYROLL_LIABILITY,
                accountCode: '421',
                accountName: 'Personnel - Rémunérations dues',
                description: `Net à payer`,
                side: 'credit',
                amountInMicrounits: netMu,
                amountInCents: netCents,
                date: now,
                pieceNumber,
                debitInMicrounits: 0,
                debitInCents: 0,
                creditInMicrounits: netMu,
                creditInCents: netCents,
                runningBalanceInMicrounits: 0,
                runningBalanceInCents: 0,
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
