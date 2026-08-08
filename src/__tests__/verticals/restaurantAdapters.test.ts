import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import {
  RestaurantOpsAdapter,
  RestaurantFinanceAdapter,
  RestaurantLogisticsAdapter,
  RestaurantComplianceAdapter,
  RestaurantCommerceAdapter,
  RestaurantHumanAdapter,
  RestaurantIntelligenceAdapter,
  RestaurantFacilityAdapter,
  RestaurantMccAdapter,
} from '@/verticals/restaurant/adapters';

describe('Restaurant Vertical Adapters (9 Adapters)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('RestaurantOpsAdapter emits ops events correctly', () => {
    const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockImplementation(async () => {});
    const emitDurableSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(async () => {});

    RestaurantOpsAdapter.emitOrderPlaced({ tenantId: 't1', orderId: 'o1', totalInMicrounits: 1000 });
    expect(emitDurableSpy).toHaveBeenCalledWith('ops.order_notification', { tenantId: 't1', orderId: 'o1', totalInMicrounits: 1000 });

    RestaurantOpsAdapter.emitTableReleased({ tenantId: 't1', tableId: 'tbl1' });
    expect(emitSpy).toHaveBeenCalledWith('table.released', { v: 1, tenantId: 't1', tableId: 'tbl1' });
  });

  it('RestaurantFinanceAdapter emits finance events correctly', () => {
    const emitDurableSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(async () => {});

    RestaurantFinanceAdapter.emitOrderFiscalSeal({ tenantId: 't1', orderId: 'o1', totalInMicrounits: 5000, operatorId: 'op1' });
    expect(emitDurableSpy).toHaveBeenCalledWith('finance.order_sealed', { tenantId: 't1', orderId: 'o1', totalInMicrounits: 5000, operatorId: 'op1' });
  });

  it('RestaurantLogisticsAdapter emits waste events correctly', () => {
    const emitDurableSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(async () => {});

    RestaurantLogisticsAdapter.emitWasteLogged({ tenantId: 't1', wasteId: 'w1', items: [{ productId: 'p1', quantity: 2 }] });
    expect(emitDurableSpy).toHaveBeenCalledWith('inventory.waste_logged', {
      v: 1,
      tenantId: 't1',
      wasteId: 'w1',
      items: [{ productId: 'p1', quantity: 2 }],
    });
  });

  it('RestaurantComplianceAdapter emits haccp events correctly', () => {
    const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockImplementation(async () => {});
    const emitDurableSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(async () => {});

    RestaurantComplianceAdapter.emitHaccpCheckSaved({ tenantId: 't1', checkId: 'c1', operatorId: 'op1', timestamp: 1000 });
    expect(emitDurableSpy).toHaveBeenCalledWith('haccp.check.saved', { v: 1, tenantId: 't1', checkId: 'c1', operatorId: 'op1', timestamp: 1000 });

    RestaurantComplianceAdapter.emitTemperatureAnomaly({ tenantId: 't1', sensorId: 's1', temperature: 12, durationInMinutes: 30 });
    expect(emitSpy).toHaveBeenCalledWith('sensor.temperature_anomaly', { v: 1, tenantId: 't1', sensorId: 's1', temperature: 12, durationInMinutes: 30 });
  });

  it('RestaurantCommerceAdapter emits reservation and loyalty events correctly', () => {
    const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockImplementation(async () => {});
    const emitDurableSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(async () => {});

    RestaurantCommerceAdapter.emitReservationConfirmed({ tenantId: 't1', reservationId: 'r1', customerName: 'Alice', covers: 4, date: '2026-08-08', time: '19:30' });
    expect(emitDurableSpy).toHaveBeenCalledWith('reservation.confirmed', { v: 1, tenantId: 't1', reservationId: 'r1', customerName: 'Alice', covers: 4, date: '2026-08-08', time: '19:30' });

    RestaurantCommerceAdapter.emitLoyaltyPointsEarned({ tenantId: 't1', customerId: 'c1', points: 50, sourceOrderId: 'o1' });
    expect(emitSpy).toHaveBeenCalledWith('crm.points_earned', { v: 1, tenantId: 't1', customerId: 'c1', points: 50, sourceOrderId: 'o1' });
  });

  it('RestaurantHumanAdapter emits shift and overtime events correctly', () => {
    const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockImplementation(async () => {});
    const emitDurableSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(async () => {});

    RestaurantHumanAdapter.emitShiftStarted({ tenantId: 't1', shiftId: 's1', employeeId: 'e1', role: 'server', startedAt: 1000 });
    expect(emitSpy).toHaveBeenCalledWith('hr.shift_started', { v: 1, tenantId: 't1', shiftId: 's1', employeeId: 'e1', role: 'server', startedAt: 1000 });

    RestaurantHumanAdapter.emitOvertimeAlert({ tenantId: 't1', employeeId: 'e1', extraMinutes: 45 });
    expect(emitDurableSpy).toHaveBeenCalledWith('hr.overtime_alert', { tenantId: 't1', employeeId: 'e1', extraMinutes: 45 });

    RestaurantHumanAdapter.emitTipDistributed({ tenantId: 't1', orderId: 'o1', tipInMicrounits: 500, staffIds: ['e1'] });
    expect(emitSpy).toHaveBeenCalledWith('hr.tip_distributed', { tenantId: 't1', orderId: 'o1', tipInMicrounits: 500, staffIds: ['e1'] });
  });

  it('RestaurantIntelligenceAdapter emits sales data correctly', () => {
    const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockImplementation(async () => {});

    RestaurantIntelligenceAdapter.emitSalesDataReady({ tenantId: 't1', periodStart: '2026-01-01', periodEnd: '2026-01-31', totalInMicrounits: 10000, covers: 20 });
    expect(emitSpy).toHaveBeenCalledWith('analytics.sales_data_ready', { tenantId: 't1', periodStart: '2026-01-01', periodEnd: '2026-01-31', totalInMicrounits: 10000, covers: 20 });
  });

  it('RestaurantFacilityAdapter emits floor plan and maintenance events correctly', () => {
    const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockImplementation(async () => {});
    const emitDurableSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(async () => {});

    RestaurantFacilityAdapter.emitTableLayoutChanged({ tenantId: 't1', floorId: 'f1', tables: [{ id: 'tbl1', capacity: 4, x: 10, y: 20 }] });
    expect(emitSpy).toHaveBeenCalledWith('facility.floor_plan_updated', { tenantId: 't1', floorId: 'f1', tables: [{ id: 'tbl1', capacity: 4, x: 10, y: 20 }] });

    RestaurantFacilityAdapter.emitMaintenanceRequired({ tenantId: 't1', assetId: 'a1', assetType: 'oven', description: 'Overheating' });
    expect(emitDurableSpy).toHaveBeenCalledWith('facility.maintenance_required', { tenantId: 't1', assetId: 'a1', assetType: 'oven', description: 'Overheating' });
  });

  it('RestaurantMccAdapter emits health ping and fiscal audit events correctly', () => {
    const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockImplementation(async () => {});
    const emitDurableSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(async () => {});

    RestaurantMccAdapter.emitHealthPing({ tenantId: 't1', status: 'healthy', posOnline: true, kdsOnline: true, printerOnline: true });
    expect(emitSpy).toHaveBeenCalledWith('mcc.health_ping', { tenantId: 't1', status: 'healthy', posOnline: true, kdsOnline: true, printerOnline: true });

    RestaurantMccAdapter.emitFiscalAuditRequired({ tenantId: 't1', reason: 'Annual Audit', urgency: 'high' });
    expect(emitDurableSpy).toHaveBeenCalledWith('mcc.fiscal_audit_required', { tenantId: 't1', reason: 'Annual Audit', urgency: 'high' });
  });
});
