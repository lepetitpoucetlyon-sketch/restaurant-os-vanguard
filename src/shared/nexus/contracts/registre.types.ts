/**
 * 📝 REGISTRE TYPES - Grade X Sovereignty
 */

export type RegisterDocStatus = 'certified' | 'attention' | 'expired' | 'pending';

export interface InterventionLog {
    id: string;
    prestataire: string;
    type: string;
    description: string;
    date: string;
    status: 'realise' | 'planifie' | 'annule';
    documentUrl?: string;
}
