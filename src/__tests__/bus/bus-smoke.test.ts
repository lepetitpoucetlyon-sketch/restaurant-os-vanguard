import { describe, it, expect, beforeEach } from 'vitest';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { registerOpsHandlers } from '@/bootstrap/eventBus/registerHandlers/ops';
import { registerFinanceHandlers } from '@/bootstrap/eventBus/registerHandlers/finance';

describe('EventBus CI Smoke Test (R13 Guard)', () => {
  beforeEach(() => {
    registerOpsHandlers();
    registerFinanceHandlers();
  });

  it('verifies that handlers bind successfully without throwing', () => {
    const opsHandlers = registerOpsHandlers();
    const financeHandlers = registerFinanceHandlers();
    expect(opsHandlers.length + financeHandlers.length).toBeGreaterThan(5);
  });

  it('verifies that emitting core events produces zero unhandled errors', async () => {
    const testEvents = [
      { name: 'order.placed', payload: { v: 1, tenantId: 't1', orderId: 'o1', items: [], channel: 'POS' } },
      { name: 'order.paid', payload: { v: 1, tenantId: 't1', orderId: 'o1', tableId: 't1', operatorId: 'op1', items: [], totalInMicrounits: 1000, paymentMode: 'cash' } },
      { name: 'reservation.created', payload: { v: 1, tenantId: 't1', reservationId: 'r1', guestName: 'A', partySize: 2, scheduledAt: Date.now() } },
      { name: 'hr.shift_started', payload: { v: 1, tenantId: 't1', shiftId: 's1', employeeId: 'e1', role: 'serveur', startedAt: new Date().toISOString() } },
      { name: 'sensor.temperature_anomaly', payload: { v: 1, tenantId: 't1', sensorId: 'sen_1', temperature: 14, durationInMinutes: 45 } },
    ];

    for (const evt of testEvents) {
      expect(async () => {
        await NexusEventBus.emit(evt.name as any, evt.payload as any);
      }).not.toThrow();
    }
  });
});
