import { LucideIcon } from "lucide-react";

export type CandidateStatus = 'new' | 'interview' | 'trial' | 'refused' | 'hired';

export interface GDPRConsent {
    consented: boolean;
    date: string;
    method: 'written' | 'digital' | 'verbal_logged';
}

export interface Candidate {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: CandidateStatus;
    appliedRole: string;
    cvUrl?: string; // Local storage or Dexie Blob
    cvText?: string; // Extracted text for search
    notes?: string;
    gdpr: GDPRConsent;
    createdAt: string;
    updatedAt: string;
    lastContactDate?: string;
    interviewDate?: string;
}

export interface RecruitmentLog {
    id: string;
    candidateId: string;
    action: string;
    performedBy: string;
    timestamp: string;
    notes?: string;
}
