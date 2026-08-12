import { SovereignNode } from "@nexus/contracts/nexus-contract";

export type CandidateStatus = 'new' | 'interview' | 'trial' | 'offer' | 'refused' | 'hired';

export interface GDPRConsent {
    [key: string]: import('@nexus/contracts/nexus-contract').SovereignField | undefined;
    consented: boolean;
    date: string;
    method: 'written' | 'digital' | 'verbal_logged';
}

/**
 * 👤 CANDIDATE CONTRACT - Recruitment Domain
 * Grade X Sovereign Alignment
 */
export interface Candidate extends SovereignNode {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: CandidateStatus;
    appliedRole: string;
    cvUrl?: string;
    cvText?: string;
    notes?: string;
    gdpr: GDPRConsent;
    lastContactDate?: string;
    interviewDate?: string;
}

export interface RecruitmentLog extends SovereignNode {
    candidateId: string;
    action: string;
    performedBy: string;
    timestamp: string;
    notes?: string;
}
