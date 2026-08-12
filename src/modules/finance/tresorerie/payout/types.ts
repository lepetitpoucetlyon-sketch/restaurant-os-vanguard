/**
 * 🏛️ Payout Types - Grade X+++
 */

export interface PayoutInvoice {
    id: string;
    supplierId: string;
    amountInMicrounits: number;
    /** @deprecated use amountInMicrounits */
    amountInCents?: number;
    status: 'draft' | 'validated' | 'paid' | 'disputed';
    bankAccountIban: string;
}

export interface PayoutApproval {
    adminId: string;
    signatureHash: string;
    timestamp: string;
}

export interface PayoutRequest {
    id: string;
    invoiceId: string;
    amountInMicrounits: number;
    /** @deprecated use amountInMicrounits */
    amountInCents?: number;
    status: 'pending_approval' | 'approved' | 'processing' | 'completed' | 'failed';
    approvals: PayoutApproval[];
    sepaReference?: string;
}
