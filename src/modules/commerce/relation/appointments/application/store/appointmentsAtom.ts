import { atom } from 'jotai';
import type { Appointment, AppointmentStatus } from '../../domain/types/appointment';

export const appointmentsAtom = atom<Appointment[]>([]);
export const appointmentsLoadingAtom = atom<boolean>(false);
export const selectedDateAtom = atom<string>(new Date().toISOString().split('T')[0]);

export interface AppointmentFilters {
  status?: AppointmentStatus;
  staffId?: string;
  kind?: Appointment['kind'];
}

export const appointmentFiltersAtom = atom<AppointmentFilters>({});

export const filteredAppointmentsAtom = atom<Appointment[]>((get) => {
  const all = get(appointmentsAtom);
  const filters = get(appointmentFiltersAtom);
  const date = get(selectedDateAtom);

  return all.filter(a => {
    if (!a.startAt.startsWith(date)) return false;
    if (filters.status && a.status !== filters.status) return false;
    if (filters.staffId && a.staffId !== filters.staffId) return false;
    if (filters.kind && a.kind !== filters.kind) return false;
    return true;
  });
});
