/**
 * 🏛️ Banking Types - Grade X+++
 */

export interface KYBData {
    companyName: string;
    registrationNumber: string; // SIREN
    address: string;
    legalRepresentative: {
        firstName: string;
        lastName: string;
        email: string;
        dateOfBirth: string;
    };
}

export interface BankAccount {
    id: string;
    iban: string;
    bic: string;
    currency: string;
    status: 'pending' | 'active' | 'suspended';
}

export interface VirtualCard {
    id: string;
    panMasked: string;
    expirationDate: string;
    pillarId: string;
    monthlyLimitInMicrounits: number;
    monthlyLimitInCents?: number;
    status: 'active' | 'frozen' | 'cancelled';
}

export interface IBankingProvider {
    createAccount(tenantId: string, kyb: KYBData): Promise<BankAccount>;
    getBalance(accountId: string): Promise<number>;
    getTransactions(accountId: string, fromDate: string): Promise<Record<string, unknown>[]>;
    issueVirtualCard(accountId: string, pillarId: string, limitInMicrounits: number): Promise<VirtualCard>;
    executeSepaTransfer(iban: string, amountInMicrounits: number, reference: string): Promise<string>;
}
