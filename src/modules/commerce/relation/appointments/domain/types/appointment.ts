export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

/** Generic kind — verticals set their own meaning */
export type AppointmentKind =
  | 'service'       // salon: haircut, spa treatment
  | 'consultation'  // clinic: medical, legal, accounting
  | 'reservation'   // restaurant: table booking
  | 'check_in'      // hotel: room check-in
  | 'delivery'      // logistics: scheduled delivery
  | 'custom';

export interface Appointment {
  id: string;
  tenantId: string;
  kind: AppointmentKind;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  /** Service, product, room, or table being booked */
  serviceId?: string;
  serviceName: string;
  /** Staff member assigned (optional) */
  staffId?: string;
  staffName?: string;
  /** ISO 8601 date-time */
  startAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
  /** Vertical-specific extras (e.g. covers for restaurant, room type for hotel) */
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BookingSlot {
  startAt: string;
  endAt: string;
  availableCapacity: number;
  staffId?: string;
}

export interface AppointmentCreateInput {
  kind: AppointmentKind;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceId?: string;
  serviceName: string;
  staffId?: string;
  staffName?: string;
  startAt: string;
  durationMinutes: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface AppointmentUpdateInput {
  status?: AppointmentStatus;
  startAt?: string;
  durationMinutes?: number;
  staffId?: string;
  staffName?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}
