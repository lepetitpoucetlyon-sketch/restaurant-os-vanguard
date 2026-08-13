import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/orchestration/NexusEventBus';
import { logger } from '@/lib/logger';
import type {
  Appointment,
  AppointmentCreateInput,
  AppointmentUpdateInput,
  BookingSlot,
} from '../../domain/types/appointment';

const COLLECTION = 'appointments';

function tenantPath(tenantId: string, suffix = '') {
  return `tenants/${tenantId}/${COLLECTION}${suffix ? `/${suffix}` : ''}`;
}

export const AppointmentService = {
  async create(tenantId: string, input: AppointmentCreateInput): Promise<Appointment> {
    const id = `appt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const appointment: Appointment = {
      id,
      tenantId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      ...input,
    };

    await Nexus.adapter.set(tenantPath(tenantId, id), appointment);

    NexusEventBus.emit('appointments.appointment_created', {
      tenantId,
      appointmentId: id,
      kind: appointment.kind,
      clientEmail: appointment.clientEmail,
      startAt: appointment.startAt,
    });

    logger.info(`[Appointments] Created ${id} for ${tenantId}`);
    return appointment;
  },

  async get(tenantId: string, id: string): Promise<Appointment | null> {
    return Nexus.adapter.get<Appointment>(tenantPath(tenantId, id));
  },

  async update(tenantId: string, id: string, input: AppointmentUpdateInput): Promise<void> {
    await Nexus.adapter.update(tenantPath(tenantId, id), {
      ...input,
      updatedAt: new Date().toISOString(),
    });
  },

  async confirm(tenantId: string, id: string): Promise<void> {
    await this.update(tenantId, id, { status: 'confirmed' });
    NexusEventBus.emit('appointments.appointment_confirmed', { tenantId, appointmentId: id });
  },

  async cancel(tenantId: string, id: string): Promise<void> {
    await this.update(tenantId, id, { status: 'cancelled' });
    NexusEventBus.emit('appointments.appointment_cancelled', { tenantId, appointmentId: id });
  },

  async complete(tenantId: string, id: string): Promise<void> {
    await this.update(tenantId, id, { status: 'completed' });
    NexusEventBus.emit('appointments.appointment_completed', { tenantId, appointmentId: id });
  },

  async markNoShow(tenantId: string, id: string): Promise<void> {
    await this.update(tenantId, id, { status: 'no_show' });
    NexusEventBus.emit('appointments.appointment_no_show', { tenantId, appointmentId: id });
  },

  async listByDate(tenantId: string, date: string): Promise<Appointment[]> {
    const all = await Nexus.adapter.query<Appointment>(tenantPath(tenantId));
    return (all ?? []).filter(a => a.startAt.startsWith(date));
  },

  async listByStatus(tenantId: string, status: Appointment['status']): Promise<Appointment[]> {
    const all = await Nexus.adapter.query<Appointment>(tenantPath(tenantId));
    return (all ?? []).filter(a => a.status === status);
  },

  /** Returns available 30-min slots for a given date based on existing bookings */
  async getAvailableSlots(
    tenantId: string,
    date: string,
    openHour = 9,
    closeHour = 19,
    slotMinutes = 30,
  ): Promise<BookingSlot[]> {
    const booked = await this.listByDate(tenantId, date);
    const slots: BookingSlot[] = [];

    for (let h = openHour; h < closeHour; h++) {
      for (let m = 0; m < 60; m += slotMinutes) {
        const start = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
        const end = new Date(start.getTime() + slotMinutes * 60_000);

        const conflict = booked.some(a => {
          if (a.status === 'cancelled') return false;
          const aStart = new Date(a.startAt).getTime();
          const aEnd = aStart + a.durationMinutes * 60_000;
          return start.getTime() < aEnd && end.getTime() > aStart;
        });

        if (!conflict) {
          slots.push({
            startAt: start.toISOString(),
            endAt: end.toISOString(),
            availableCapacity: 1,
          });
        }
      }
    }

    return slots;
  },
};
