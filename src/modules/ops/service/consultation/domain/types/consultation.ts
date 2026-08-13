export type ConsultationStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Consultation {
  id: string;
  tenantId: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  practitionerId?: string;
  practitionerName?: string;
  subject: string;
  startAt: string;
  durationMinutes: number;
  status: ConsultationStatus;
  notes?: string;
  followUpAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationCreateInput {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  practitionerId?: string;
  practitionerName?: string;
  subject: string;
  startAt: string;
  durationMinutes: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}
