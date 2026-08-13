// Appointments — Generic booking engine
export type {
  Appointment,
  AppointmentStatus,
  AppointmentKind,
  AppointmentCreateInput,
  AppointmentUpdateInput,
  BookingSlot,
} from './domain/types/appointment';

export { AppointmentService } from './application/services/AppointmentService';
export {
  appointmentsAtom,
  appointmentsLoadingAtom,
  selectedDateAtom,
  appointmentFiltersAtom,
  filteredAppointmentsAtom,
} from './application/store/appointmentsAtom';

export { useAppointments } from './presentation/hooks/useAppointments';
export { AppointmentCard } from './presentation/components/AppointmentCard';
export { AppointmentForm } from './presentation/components/AppointmentForm';
export { AppointmentsView } from './presentation/views/AppointmentsView';
