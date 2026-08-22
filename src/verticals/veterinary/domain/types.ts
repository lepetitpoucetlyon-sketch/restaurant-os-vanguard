import { Microunits } from '@/shared/schemas/primitives';

// ─── DOSSIERS ANIMAUX ─────────────────────────────────────────────────────────

export type PetSpecies = 'chien' | 'chat' | 'nac' | 'equide' | 'autre';

export interface IPetRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  petName: string;
  species: PetSpecies;
  breed?: string;
  chipId?: string;        // n° ICAD/puce électronique
  birthDate?: string;     // ISO 8601
  lastConsultationAt?: string;
}

export interface ICareLoadReport {
  periodStart: string;
  periodEnd: string;
  totalPatients: number;
  totalConsultations: number;
  avgConsultationsPerPatient: number;
  vaccinesDueCount: number;
}

// ─── CONSULTATIONS ────────────────────────────────────────────────────────────

export type ConsultationStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface IConsultation {
  id: string;
  petId: string;
  petName: string;
  vetId: string;
  vetName: string;
  status: ConsultationStatus;
  scheduledAt: string;    // ISO 8601
  reason: string;
  priceInMicrounits: Microunits;
}

// ─── ORDONNANCES ──────────────────────────────────────────────────────────────

export type PrescriptionStatus = 'active' | 'fulfilled' | 'expired';

export interface IPrescription {
  id: string;
  petId: string;
  petName: string;
  vetId: string;
  vetName: string;
  medication: string;
  dosage: string;
  status: PrescriptionStatus;
  issuedAt: string;       // ISO 8601
  expiresAt: string;      // ISO 8601
}
