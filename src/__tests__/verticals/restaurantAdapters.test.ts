import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import {
  RestaurantFinanceAdapter,
  RestaurantCommerceAdapter,
  RestaurantHumanAdapter,
  RestaurantIntelligenceAdapter,
  RestaurantFacilityAdapter,
  RestaurantMccAdapter,
} from '@/verticals/restaurant/adapters';

// Compliance & Logistics : plus d'adapter restaurant dédié — les events
// (haccp.check.saved, dlc.expired, sensor.temperature_anomaly, inventory.deducted)
// sont émis directement par les modules compliance/logistics. Un adapter qui les
// ré-émettait depuis un handler du MÊME event provoquait une boucle infinie.

describe('Restaurant Vertical Adapters (6 Adapters)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

    it('RestaurantFinanceAdapter emits finance events correctly', () => {
    const emitDurableSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(async () => {});

    RestaurantFinanceAdapter.emitOrderFiscalSeal({ tenantId: 't1', orderId: 'o1', totalInMicrounits: 5000, operatorId: 'op1' });
    expect(emitDurableSpy).toHaveBeenCalledWith('finance.order_sealed', { tenantId: 't1', orderId: 'o1', totalInMicrounits: 5000, operatorId: 'op1' });
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
