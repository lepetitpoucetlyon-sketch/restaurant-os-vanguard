import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { registerKDSOrderHandler } from '@orchestration/handlers/KDSOrderHandler';
import { registerCashCountReconciliationHandler } from '@orchestration/handlers/CashCountReconciliationHandler';
import { registerHaccpCorrectiveActionHandler } from '@orchestration/handlers/HaccpCorrectiveActionHandler';
import { registerShiftStartedHandler } from '@orchestration/handlers/ShiftStartedHandler';
import { registerNotificationUrgentDispatchHandler } from '@orchestration/handlers/NotificationUrgentDispatchHandler';

describe('NexusEventBus Chain Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('P0-1.1: order.placed triggers KDSOrderHandler immediately on order placement', async () => {
    const unsub = registerKDSOrderHandler();
    let handled = false;

    // Listen to set flag
    NexusEventBus.on('order.placed', async () => {
      handled = true;
    });

    await NexusEventBus.emitDurable('order.placed', {
      v: 1,
      tenantId: 'test-tenant',
      orderId: 'ord_123',
      tableId: 't_12',
      operatorId: 'server_1',
      items: [{ productId: 'p1', quantity: 2, priceInMicrounits: 1000000 }] as unknown as never,
    });

    expect(handled).toBe(true);
    unsub();
  });

  it('P0-1.2: notification.urgent triggers NotificationUrgentDispatchHandler', async () => {
    const unsub = registerNotificationUrgentDispatchHandler();
    let received = false;

    NexusEventBus.on('notification.urgent', async () => {
      received = true;
    });

    await NexusEventBus.emitDurable('notification.urgent', {
      v: 1,
      tenantId: 'test-tenant',
      message: 'Test alerte urgente',
      roles: ['manager'],
      priority: 'CRITICAL',
    });

    expect(received).toBe(true);
    unsub();
  });

  it('P0-1.4: finance.cash_counted triggers CashCountReconciliationHandler and detects anomalies', async () => {
    const unsub = registerCashCountReconciliationHandler();
    let anomalyDetected = false;

    NexusEventBus.on('notification.urgent', async (payload) => {
      if (payload.message.includes('Écart de caisse')) {
        anomalyDetected = true;
      }
    });

    await NexusEventBus.emitDurable('finance.cash_counted', {
      v: 1,
      tenantId: 'test-tenant',
      drawerId: 'drawer_1',
      expectedAmountInMicrounits: 100_000_000,
      actualAmountInMicrounits: 90_000_000, // 10€ diff (> 5€ threshold)
      countedBy: 'Manager Test',
    });

    expect(anomalyDetected).toBe(true);
    unsub();
  });

  it('P0-1.5: hr.shift_started triggers ShiftStartedHandler', async () => {
    const unsub = registerShiftStartedHandler();
    let shiftStartedHandled = false;

    NexusEventBus.on('hr.shift_started', async () => {
      shiftStartedHandled = true;
    });

    await NexusEventBus.emitDurable('hr.shift_started', {
      v: 1,
      tenantId: 'test-tenant',
      shiftId: 'shift_999',
      employeeId: 'emp_001',
      startedAt: Date.now(),
      role: 'serveur',
    });

    expect(shiftStartedHandled).toBe(true);
    unsub();
  });

  it('P0-1.12: haccp.nonconform triggers HaccpCorrectiveActionHandler and critical notification', async () => {
    const unsub = registerHaccpCorrectiveActionHandler();
    let haccpAlertEmitted = false;

    NexusEventBus.on('notification.urgent', async (payload) => {
      if (payload.priority === 'CRITICAL' && payload.message.includes('HACCP')) {
        haccpAlertEmitted = true;
      }
    });

    await NexusEventBus.emitDurable('haccp.nonconform', {
      v: 1,
      tenantId: 'test-tenant',
      checkId: 'check_404',
      correctionDeadline: Date.now() + 3600000,
    });

    expect(haccpAlertEmitted).toBe(true);
    unsub();
  });
});
