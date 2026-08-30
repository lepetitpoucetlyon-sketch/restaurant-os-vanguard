import { SovereignNode } from "./sovereign.types";

export type RegisterDocStatus = 'certified' | 'attention' | 'expired' | 'pending';

export interface RegistreEntry extends SovereignNode {
    title: string;
    description: string;
    status: RegisterDocStatus;
    lastUpdated: string;
    nextReview: string;
    documentUrl?: string;
}

export interface InterventionLog extends SovereignNode {
    prestataire: string;
    type: string;
    description: string;
    date: string;
    status: 'realise' | 'planifie' | 'annule';
    documentUrl?: string;
}
