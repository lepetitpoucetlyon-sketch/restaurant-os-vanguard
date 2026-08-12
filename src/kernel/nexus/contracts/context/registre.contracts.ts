import type { SovereignNode } from '@nexus/contracts/nexus-contract';
import type { Dispatch } from 'react';

export interface Vassal extends SovereignNode {
  id: string;
  name: string;
}

export interface NexusError {
  code: string;
  message: string;
}

export interface RegistreState {
  vassals: Vassal[];
  activeVassalId: string | null;
  status: 'idle' | 'loading' | 'error' | 'ready';
  error: NexusError | null;
}

export type RegistreAction =
  | { type: 'SET_VASSALS'; payload: Vassal[] }
  | { type: 'SET_ACTIVE'; payload: string }
  | { type: 'SET_STATUS'; payload: RegistreState['status'] }
  | { type: 'SET_ERROR'; payload: NexusError };

export interface ComplianceDocument {
  id: string;
  url: string;
  name: string;
  status: 'valid' | 'expired' | 'missing' | 'pending';
  validUntil: string | null;
  updatedAt: string;
}

/** Extincteur avec ses champs spécifiques (différents du ComplianceDocument générique) */
export interface ExtincteurDocument {
  id: string;
  location?: string;
  type?: string;
  lastCheck?: string;
  nextCheck?: string;
  numero?: string;
  status?: 'ok' | 'a_verifier' | 'hors_service';
  [k: string]: string | number | boolean | undefined | null;
}

/** Exercice d'évacuation */
export interface ExerciceDocument {
  id: string;
  date?: string;
  type?: string;
  participants?: number;
  duration?: string;
  observations?: string;
  status?: 'planifie' | 'realise' | 'annule';
  [k: string]: string | number | boolean | undefined | null;
}

/** Intervention de maintenance */
export interface InterventionDocument {
  id: string;
  date?: string;
  type?: string;
  description?: string;
  prestataire?: string;
  technicien?: string;
  status?: string;
  [k: string]: string | number | boolean | undefined | null;
}

/** Prestataire / sous-traitant */
export interface PrestataireDocument {
  id: string;
  name?: string;
  contact?: string;
  service?: string;
  type?: string;
  contratExpiry?: string;
  email?: string;
  phone?: string;
  nextIntervention?: string;
  certifications?: string;
  [k: string]: string | number | boolean | undefined | null;
}

export interface PMRAmenagement {
  id: string;
  status: 'conforme' | 'en_cours' | 'a_faire';
  zone: string;
  description: string;
  deadline?: string;
}

export interface RegistreContextValue {
  cerfa?: ComplianceDocument;
  duerp?: ComplianceDocument;
  incendieDoc?: ComplianceDocument;
  extincteurs?: ExtincteurDocument[];
  exercices?: ExerciceDocument[];
  interventions?: InterventionDocument[];
  pmrDoc?: ComplianceDocument;
  pmrAmenagements?: PMRAmenagement[];
  prestataires?: PrestataireDocument[];
  certHalal?: ComplianceDocument;
  agrementBoucher?: ComplianceDocument;
  hottesDoc?: ComplianceDocument;

  state: RegistreState;
  dispatch: Dispatch<RegistreAction>;
}
