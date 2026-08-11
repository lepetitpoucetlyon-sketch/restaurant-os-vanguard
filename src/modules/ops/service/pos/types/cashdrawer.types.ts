export interface CashDrawerSession {
    id: string;
    openedAt: string;
    openingInMicrounits: number;
    closedAt?: string;
    closingInMicrounits?: number;
    collectedInMicrounits: number;
    changeGivenInMicrounits: number;
    userId: string;
}
