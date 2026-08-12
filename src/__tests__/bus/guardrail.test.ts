import { describe, it, expect, beforeAll } from 'vitest';
import { NexusEventBus, isExpectedUnconsumed } from '@orchestration/NexusEventBus';
import { assertHandlerTenant, TenantMismatchError } from '@orchestration/guards/assertHandlerTenant';
import { registerOpsHandlers } from '@orchestration/registerHandlers/ops';
import { registerFinanceHandlers } from '@orchestration/registerHandlers/finance';
import { registerLogisticsHandlers } from '@orchestration/registerHandlers/logistics';
import { registerComplianceHandlers } from '@orchestration/registerHandlers/compliance';

/**
 * §9.0 Garde-fou du bus — empêche la récidive « fil débranché en silence ».
 * Voir PLAN_COMPLET §9 + PLAN_BUS_EVENEMENTIEL Partie 8.
 */
describe('§9.0 Garde-fou bus — isExpectedUnconsumed (liste blanche)', () => {
  it('whiteliste les préfixes des verticales NON ouvertes', () => {
    expect(isExpectedUnconsumed('auto.vehicle_checked_in')).toBe(true);
    expect(isExpectedUnconsumed('health.patient_admitted')).toBe(true);
    expect(isExpectedUnconsumed('hotel.room_booked')).toBe(true);
    expect(isExpectedUnconsumed('salon.appointment_booked')).toBe(true);
    expect(isExpectedUnconsumed('retail.sale_completed')).toBe(true);
    expect(isExpectedUnconsumed('bakery.batch_started')).toBe(true);
  });

  it('whiteliste la Classe B (état persisté avant l\'emit)', () => {
    expect(isExpectedUnconsumed('ops.service_ticket_opened')).toBe(true);
    expect(isExpectedUnconsumed('ops.service_ticket_closed')).toBe(true);
    expect(isExpectedUnconsumed('crm.allergen_flagged')).toBe(true);
  });

  it('ne whiteliste PAS les events restaurant/transverses (un orphelin ici = bug)', () => {
    expect(isExpectedUnconsumed('inventory.stock_adjusted')).toBe(false);
    expect(isExpectedUnconsumed('order.paid')).toBe(false);
    expect(isExpectedUnconsumed('haccp.temperature_logged')).toBe(false);
    expect(isExpectedUnconsumed('finance.month_closed')).toBe(false);
  });
});

describe('§9.0 Garde-fou bus — couverture des chaînes critiques restaurant', () => {
  beforeAll(() => {
    // Câble les domaines qui portent les chaînes critiques (idempotent au niveau assertion).
    registerOpsHandlers();
    registerFinanceHandlers();
    registerLogisticsHandlers();
    registerComplianceHandlers();
  });

  // Ces events DOIVENT avoir un consommateur enregistré. Si un refactor dé-câble un
  // handler (le pattern qui a lancé l'audit §9), ce test casse au lieu de passer en silence.
  it.each([
    'order.paid',
    'order.placed',
    'order.refunded',
    'stock.received',
    'inventory.deducted',
    'inventory.stock_adjusted',
    'haccp.nonconform',
    'support.ticket_escalated',
    'order.proforma_printed',
  ])('« %s » a ≥1 handler enregistré', (event) => {
    expect(NexusEventBus.listenerCount(event as never)).toBeGreaterThan(0);
  });
});

describe('§9.2 assertHandlerTenant — barrière cross-tenant dans les handlers', () => {
  it('laisse passer un path cohérent avec le tenantId', () => {
    expect(() => assertHandlerTenant('test', 'tenant-A', 'tenants/tenant-A/stockItems/x')).not.toThrow();
  });

  it('laisse passer un path sans préfixe tenants/ (global)', () => {
    expect(() => assertHandlerTenant('test', 'tenant-A', 'globalCollection/x')).not.toThrow();
  });

  it('bloque un path cross-tenant', () => {
    expect(() => assertHandlerTenant('test', 'tenant-A', 'tenants/tenant-B/stockItems/x'))
      .toThrow(TenantMismatchError);
  });

  it('inclut les IDs dans le message d\'erreur', () => {
    try {
      assertHandlerTenant('my-handler', 'tenant-A', 'tenants/tenant-B/orders/o1');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(TenantMismatchError);
      expect((err as TenantMismatchError).handlerId).toBe('my-handler');
      expect((err as TenantMismatchError).payloadTenantId).toBe('tenant-A');
      expect((err as TenantMismatchError).pathTenantId).toBe('tenant-B');
    }
  });
});
