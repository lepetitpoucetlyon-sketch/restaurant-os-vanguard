export interface PnLLine {
    accountCode: string;
    accountName: string;
    debitInMicrounits: number;
    creditInMicrounits: number;
    balanceInMicrounits: number;
}

export interface PnLResult {
    revenue: number;          // microunits
    costs: number;            // microunits
    grossMargin: number;      // microunits
    operatingResult: number;  // microunits
    revenueLines: PnLLine[];
    costLines: PnLLine[];
    periodStart: number;
    periodEnd: number;
}

export interface BalanceSheetResult {
    actifLines: PnLLine[];
    passifLines: PnLLine[];
    totalActif: number;
    totalPassif: number;
    asOfDate: number;
}

export interface PayrollRow {
    nom: string;
    prenom: string;
    matricule: string;
    heuresNormales: number;
    heuresSup: number;
    tauxHoraireBrut: number;   // EUR
    salaireBrut: number;       // EUR
}

export const MU_TO_EUR = 1_000_000;
export const LEGAL_MONTHLY_HOURS = 151.67;

export function microToEur(mu: number): number {
    return mu / MU_TO_EUR;
}

export function formatEur(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}
