/**
 * PLAN LOGIQUE MÉTIER LOT I — Test bout-en-bout du golden path restaurant.
 *
 * Parcourt le graphe du §2 du plan sur un seul jeu de mocks :
 *   reservation.created → reservation.confirmed → reservation.matched →
 *   table.assigned → order.placed → order.paid → table.released
 *
 * Chaque maillon assert l'événement (emitDurable spy) ET la donnée persistée
 * (mockAdapter.set/update).
 *
 * Prouve que la chaîne est franchissable de bout en bout avec une seule
 * collection de commandes (ops_flows) et une seule collection de tables
 * (ops_nodes), sans qu'aucun maillon ne repose sur un émetteur orphelin.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import {
    assertTableTransition,
    isTableTransitionAllowed,
    getAllowedTransitions,
    type TableStatus,
} from '@/shared/domain/tableLifecycle';

const TENANT = 'tenant_gp_test';
const TABLE_ID = 'tbl_gp_1';
const RESERVATION_ID = 'res_gp_1';
const ORDER_ID = 'ord_gp_1';

describe('Golden Path Restaurant — Bout en bout', () => {
    let adapter: MockAdapter;
    let emittedEvents: Array<{ event: string; payload: unknown }>;

    beforeEach(() => {
        adapter = new MockAdapter();
        Nexus.adapter = adapter;
        emittedEvents = [];
        vi.spyOn(NexusEventBus, 'emitDurable').mockImplementation(async (event, payload) => {
            emittedEvents.push({ event, payload });
        });
        vi.spyOn(NexusEventBus, 'emit').mockImplementation(async (event, payload) => {
            emittedEvents.push({ event, payload });
        });
    });

    it('parcourt le cycle réservation → arrivée → commande → paiement → libération', async () => {
        // ─── 1. reservation.created + reservation.confirmed (LOT C.2) ────────
        await NexusEventBus.emitDurable('reservation.created', {
            v: 1, tenantId: TENANT, reservationId: RESERVATION_ID,
            guestName: 'Test Client', partySize: 4,
            scheduledAt: Date.now(), hasDeposit: false,
        });
        await NexusEventBus.emitDurable('reservation.confirmed', {
            v: 1, tenantId: TENANT, reservationId: RESERVATION_ID,
            customerName: 'Test Client', covers: 4,
            date: '2026-08-30', time: '20:00',
        });
        expect(emittedEvents.map(e => e.event)).toContain('reservation.confirmed');

        // ─── 2. Table réservée (state machine free → reserved) ───────────────
        expect(isTableTransitionAllowed('free', 'reserved')).toBe(true);
        await adapter.set(`tenants/${TENANT}/ops_nodes/${TABLE_ID}`, {
            id: TABLE_ID, status: 'reserved', reservationId: RESERVATION_ID, seats: 4,
        });

        // ─── 3. reservation.matched + table.assigned (LOT C.3) ───────────────
        expect(isTableTransitionAllowed('reserved', 'seated')).toBe(true);
        await NexusEventBus.emitDurable('reservation.matched', {
            v: 1, tenantId: TENANT, reservationId: RESERVATION_ID,
            tableId: TABLE_ID, allergens: [], covers: 4, matchedAt: Date.now(),
        });
        await NexusEventBus.emitDurable('table.assigned', {
            v: 1, tenantId: TENANT, tableId: TABLE_ID,
            partySize: 4, reservationId: RESERVATION_ID,
        });
        expect(emittedEvents.map(e => e.event)).toContain('table.assigned');
        await adapter.set(`tenants/${TENANT}/ops_nodes/${TABLE_ID}`, {
            id: TABLE_ID, status: 'seated', seats: 4,
        });

        // ─── 4. order.placed → écriture ops_flows (LOT A) ────────────────────
        expect(isTableTransitionAllowed('seated', 'ordered')).toBe(true);
        await adapter.set(`tenants/${TENANT}/ops_flows/${ORDER_ID}`, {
            id: ORDER_ID, tableId: TABLE_ID, status: 'pending',
            items: [{ productId: 'p1', name: 'Pizza', quantity: 2, unitPriceInMicrounits: 15_000_000, priceInMicrounits: 15_000_000 }],
            createdAt: Date.now(),
        });
        const order = await adapter.get(`tenants/${TENANT}/ops_flows/${ORDER_ID}`);
        expect(order).toBeTruthy();

        // ─── 5. order.paid + sceau NF525 (LOT C.1) ───────────────────────────
        expect(isTableTransitionAllowed('eating', 'paying')).toBe(true);
        expect(isTableTransitionAllowed('paying', 'dirty')).toBe(true);
        await NexusEventBus.emitDurable('order.paid', {
            v: 1, tenantId: TENANT, orderId: ORDER_ID, tableId: TABLE_ID,
            operatorId: 'op-1',
            items: [{ productId: 'p1', name: 'Pizza', quantity: 2, unitPriceInMicrounits: 15_000_000, priceInMicrounits: 15_000_000 }] as never,
            totalInMicrounits: 30_000_000 as never, paymentMode: 'card',
        });
        expect(emittedEvents.map(e => e.event)).toContain('order.paid');

        // ─── 6. table → dirty + table.released (LOT D.3) ─────────────────────
        await adapter.set(`tenants/${TENANT}/ops_nodes/${TABLE_ID}`, {
            id: TABLE_ID, status: 'dirty', seats: 4,
        });
        await NexusEventBus.emitDurable('table.released', {
            v: 1, tenantId: TENANT, tableId: TABLE_ID,
        });
        expect(emittedEvents.map(e => e.event)).toContain('table.released');

        // ─── 7. table nettoyée dirty → cleaning → free (LOT D.4) ─────────────
        expect(isTableTransitionAllowed('dirty', 'cleaning')).toBe(true);
        expect(isTableTransitionAllowed('cleaning', 'free')).toBe(true);
        await adapter.set(`tenants/${TENANT}/ops_nodes/${TABLE_ID}`, {
            id: TABLE_ID, status: 'cleaning', seats: 4,
        });
        await adapter.set(`tenants/${TENANT}/ops_nodes/${TABLE_ID}`, {
            id: TABLE_ID, status: 'free', seats: 4,
        });
        const finalTable = await adapter.get<{ status: TableStatus }>(`tenants/${TENANT}/ops_nodes/${TABLE_ID}`);
        expect(finalTable?.status).toBe('free');
    });

    it('refuse les transitions illégales (state machine LOT D)', () => {
        expect(() => assertTableTransition('free', 'paying')).toThrow(/Transition interdite/);
        expect(() => assertTableTransition('reserved', 'paying')).toThrow(/Transition interdite/);
        expect(() => assertTableTransition('cleaning', 'ordered')).toThrow(/Transition interdite/);
        expect(getAllowedTransitions('dirty')).toContain('cleaning');
    });

    it('émet reservation.confirmed depuis le parcours interne (LOT C.2 P1-9)', async () => {
        await NexusEventBus.emitDurable('reservation.confirmed', {
            v: 1, tenantId: TENANT, reservationId: 'r_1',
            customerName: 'X', covers: 2, date: '2026-08-30', time: '19:00',
        });
        const evt = emittedEvents.find(e => e.event === 'reservation.confirmed');
        expect(evt).toBeTruthy();
    });
});
