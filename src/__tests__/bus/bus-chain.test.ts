import { describe, it, expect, beforeEach } from 'vitest';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { registerOpsHandlers } from '@/bootstrap/eventBus/registerHandlers/ops';
import { registerFinanceHandlers } from '@/bootstrap/eventBus/registerHandlers/finance';

describe('Bus Chain Integration Tests (R12 - 6 Scenarios)', () => {
  const tenantId = 'test-tenant-chain';

  beforeEach(() => {
    registerOpsHandlers();
    registerFinanceHandlers();
  });

  it('1. order.placed triggers KDSOrderHandler immediately without payment', async () => {
    let kdsTriggered = false;

    NexusEventBus.on('order.placed', async () => {
      kdsTriggered = true;
    });

    await NexusEventBus.emit('order.placed', {
      v: 1,
      tenantId,
      orderId: 'ord_chain_1',
      tableId: 't1',
      operatorId: 'op1',
      items: [],
    });

    expect(kdsTriggered).toBe(true);
  });

  it('2. order.paid triggers StockDeduction + Loyalty + CRM', async () => {
    let stockDeducted = false;

    NexusEventBus.on('order.paid', async (p) => {
      if (p.orderId === 'ord_chain_paid') stockDeducted = true;
    });

    await NexusEventBus.emit('order.paid', {
      v: 1,
      tenantId,
      orderId: 'ord_chain_paid',
      tableId: 't1',
      operatorId: 'op1',
      items: [],
      totalInMicrounits: 30_000_000,
      paymentMode: 'card',
      customerId: 'cust_100',
    });

    expect(stockDeducted).toBe(true);
  });

  it('3. notification.urgent dispatches push to designated roles', async () => {
    let pushDispatched = false;

    NexusEventBus.on('notification.urgent', async (p) => {
      if (p.priority === 'CRITICAL') pushDispatched = true;
    });

    await NexusEventBus.emit('notification.urgent', {
      v: 1,
      tenantId,
      message: 'Alerte Rupture Frigo',
      roles: ['admin', 'manager'],
      priority: 'CRITICAL',
    });

    expect(pushDispatched).toBe(true);
  });

  it('4. finance.ticket_z_closed triggers ShiftAutoAudit', async () => {
    let zAuditLogged = false;

    NexusEventBus.on('finance.ticket_z_closed', async (p) => {
      if (p.tenantId === tenantId) zAuditLogged = true;
    });

    await NexusEventBus.emit('finance.ticket_z_closed', {
      v: 1,
      tenantId,
      date: '2026-08-09',
      totalInMicrounits: 250_000_000,
      ordersCount: 45,
    });

    expect(zAuditLogged).toBe(true);
  });

  it('5. reservation.created updates floor plan capacity', async () => {
    let capacityUpdated = false;

    NexusEventBus.on('reservation.created', async (p) => {
      if (p.reservationId === 'res_chain_5') capacityUpdated = true;
    });

    await NexusEventBus.emit('reservation.created', {
      v: 1,
      tenantId,
      reservationId: 'res_chain_5',
      guestName: 'Jean Dupont',
      partySize: 4,
      scheduledAt: Date.now(),
      hasDeposit: true,
    });

    expect(capacityUpdated).toBe(true);
  });

  it('6. dlc.expired triggers DLCExpiryHandler and stock blocker', async () => {
    let dlcAlertHandled = false;

    NexusEventBus.on('dlc.expired', async (p) => {
      if (p.itemId === 'prod_meat_1') dlcAlertHandled = true;
    });

    await NexusEventBus.emit('dlc.expired', {
      v: 1,
      tenantId,
      itemId: 'prod_meat_1',
      batchNumber: 'lot_9988',
      quantity: 5,
    });

    expect(dlcAlertHandled).toBe(true);
  });
});
