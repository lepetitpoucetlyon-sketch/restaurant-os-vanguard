/**
 * 🏛️ Collection Types - Grade X+++
 * Types pour le moteur de relance automatisée (ThemisCollector)
 */

export type EscalationLevel = 'FRIENDLY_REMINDER' | 'FORMAL_NOTICE' | 'LEGAL_WARNING';

export interface InvoiceTarget {
    id: string;
    customerId: string;
    customerEmail: string;
    customerPhone: string;
    dueDate: string | Date;
    amountOwedInMicrounits: number;
    status: 'draft' | 'issued' | 'paid' | 'cancelled' | 'disputed' | 'overdue';
    optOutCollection: boolean;
}

export interface CollectionAction {
    invoiceId: string;
    level: EscalationLevel;
    actionTaken: string;
    timestamp: string;
    sealHash?: string;
}

export type { CommunicationPulse } from '@/lib/CommunicationService';
