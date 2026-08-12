import { describe, it, expect, beforeAll } from 'vitest';
import { NexusEventBus, isExpectedUnconsumed } from '@orchestration/NexusEventBus';
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
  ])('« %s » a ≥1 handler enregistré', (event) => {
    expect(NexusEventBus.listenerCount(event as never)).toBeGreaterThan(0);
  });
});
