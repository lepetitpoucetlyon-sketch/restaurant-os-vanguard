import { NexusEventBus } from '@orchestration/NexusEventBus';

export const AutoCommerceAdapter = {
  emitAppointmentBooked(payload: { tenantId: string; appointmentId: string; customerId: string; vehicleId: string; serviceType: string; slot: string }) {
    NexusEventBus.emitDurable('auto.appointment_booked', payload);
  },
  emitCustomerSatisfactionLogged(payload: { tenantId: string; workOrderId: string; customerId: string; score: number; comment?: string }) {
    NexusEventBus.emit('auto.customer_satisfaction_logged', payload);
  },
};
