import type { SovereignNode } from '@/shared/nexus-contract';
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
  extincteurs?: ComplianceDocument[];
  exercices?: ComplianceDocument[];
  interventions?: ComplianceDocument[];
  pmrDoc?: ComplianceDocument;
  pmrAmenagements?: PMRAmenagement[];
  prestataires?: any[]; // Keep any for now as it's complex, but mark as list
  certHalal?: ComplianceDocument;
  agrementBoucher?: ComplianceDocument;
  hottesDoc?: ComplianceDocument;

  state: RegistreState;
  dispatch: Dispatch<RegistreAction>;
}
