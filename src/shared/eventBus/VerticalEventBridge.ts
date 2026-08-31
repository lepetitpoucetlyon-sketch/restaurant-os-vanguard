/**
 * VerticalEventBridge — pont de traduction du vocabulaire vertical vers le générique.
 *
 * Problème : 42/66 événements verticaux sont réutilisables mais ont des noms différents
 * selon la verticale (auto.vehicle_released ≠ hotel.guest_checked_out ≠ table.released).
 * Ce pont normalise vers les événements génériques que les handlers métier consomment
 * déjà, sans dupliquer les handlers par verticale (7 × 42 = 294 abonnements → 1 pont).
 *
 * Fondé sur MAPPING_EVENEMENTS_VERTICALES.md §3 (72 lignes mesurées).
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import type { PlatformVariant } from '@nexus/contracts';
import { logger } from '@/lib/logger';

type BridgePayload = Record<string, unknown> & { tenantId: string };

interface BridgeRule<TIn extends BridgePayload> {
    /** Événement vertical source. */
    source: string;
    /** Événement générique cible déjà consommé par les handlers métier. */
    target: string;
    /** Transforme le payload source → payload cible. */
    transform: (payload: TIn) => BridgePayload;
}

// ── Table de traduction (42 mappings réutilisables) ────────────────────────────

const BRIDGE_RULES: BridgeRule<BridgePayload>[] = [

    // ── ORDER.PAID — déclenche StockDeduction, Loyalty, CRM, FiscalSeal, DigitalReceipt ──

    { source: 'auto.invoice_issued',
      target: 'order.paid',
      transform: (p) => ({ v: 1, tenantId: p['tenantId'] as string, orderId: p['invoiceId'] as string ?? '', tableId: p['workOrderId'] as string ?? null, operatorId: p['operatorId'] as string ?? 'system', items: [], totalInMicrounits: p['totalInMicrounits'] as number ?? 0, paymentMode: p['paymentMode'] as string ?? 'card' }) },

    { source: 'hotel.guest_checked_out',
      target: 'order.paid',
      transform: (p) => ({ v: 1, tenantId: p['tenantId'] as string, orderId: p['bookingId'] as string ?? '', tableId: p['roomId'] as string ?? null, operatorId: p['receptionistId'] as string ?? 'system', items: [], totalInMicrounits: p['totalInMicrounits'] as number ?? 0, paymentMode: p['paymentMethod'] as string ?? 'card' }) },

    { source: 'retail.sale_completed',
      target: 'order.paid',
      transform: (p) => ({ v: 1, tenantId: p['tenantId'] as string, orderId: p['saleId'] as string ?? '', tableId: null, operatorId: p['cashierId'] as string ?? 'system', items: [], totalInMicrounits: p['totalInMicrounits'] as number ?? 0, paymentMode: p['paymentMode'] as string ?? 'cash' }) },

    { source: 'salon.appointment_completed',
      target: 'order.paid',
      transform: (p) => ({ v: 1, tenantId: p['tenantId'] as string, orderId: p['appointmentId'] as string ?? '', tableId: null, operatorId: p['stylistId'] as string ?? 'system', items: [], totalInMicrounits: p['totalInMicrounits'] as number ?? 0, paymentMode: p['paymentMode'] as string ?? 'card' }) },

    { source: 'bakery.sale_completed',
      target: 'order.paid',
      transform: (p) => ({ v: 1, tenantId: p['tenantId'] as string, orderId: p['saleId'] as string ?? '', tableId: null, operatorId: p['cashierId'] as string ?? 'system', items: [], totalInMicrounits: p['totalInMicrounits'] as number ?? 0, paymentMode: p['paymentMode'] as string ?? 'cash' }) },

    { source: 'health.act_billed',
      target: 'order.paid',
      transform: (p) => ({ v: 1, tenantId: p['tenantId'] as string, orderId: p['actId'] as string ?? '', tableId: p['bedId'] as string ?? null, operatorId: p['practitionerId'] as string ?? 'system', items: [], totalInMicrounits: p['totalInMicrounits'] as number ?? 0, paymentMode: p['paymentMode'] as string ?? 'transfer' }) },

    // ── INVENTORY.DEDUCTED — déclenche StockDeductionHandler ──

    { source: 'auto.part_consumed',
      target: 'inventory.deducted',
      transform: (p) => ({ tenantId: p['tenantId'] as string, itemId: p['partId'] as string ?? '', quantity: p['quantity'] as number ?? 1, workOrderId: p['workOrderId'] as string ?? '' }) },

    { source: 'hotel.amenity_consumed',
      target: 'inventory.deducted',
      transform: (p) => ({ tenantId: p['tenantId'] as string, itemId: p['amenityId'] as string ?? '', quantity: p['quantity'] as number ?? 1, bookingId: p['bookingId'] as string ?? '' }) },

    { source: 'health.medication_dispensed',
      target: 'inventory.deducted',
      transform: (p) => ({ tenantId: p['tenantId'] as string, itemId: p['medicationId'] as string ?? '', quantity: p['quantity'] as number ?? 1, patientId: p['patientRef'] as string ?? '' }) },

    { source: 'bakery.ingredient_consumed',
      target: 'inventory.deducted',
      transform: (p) => ({ tenantId: p['tenantId'] as string, itemId: p['ingredientId'] as string ?? '', quantity: p['quantity'] as number ?? 0 }) },

    // ── STOCK.LOW — déclenche StockAlertHandler ──

    { source: 'auto.stock_alert',
      target: 'stock.low',
      transform: (p) => ({ tenantId: p['tenantId'] as string, itemId: p['partId'] as string ?? '', currentQty: p['currentQty'] as number ?? 0, threshold: p['threshold'] as number ?? 0 }) },

    { source: 'hotel.display_stock_low',
      target: 'stock.low',
      transform: (p) => ({ tenantId: p['tenantId'] as string, itemId: p['itemId'] as string ?? '', currentQty: p['currentQty'] as number ?? 0, threshold: p['threshold'] as number ?? 0 }) },

    { source: 'retail.reorder_needed',
      target: 'stock.low',
      transform: (p) => ({ tenantId: p['tenantId'] as string, itemId: p['productId'] as string ?? '', currentQty: p['currentQty'] as number ?? 0, threshold: p['reorderPoint'] as number ?? 0 }) },

    // ── TABLE.RELEASED — déclenche TableAutoReleaseHandler, TicketZHandler ──

    { source: 'auto.vehicle_released',
      target: 'table.released',
      transform: (p) => ({ tenantId: p['tenantId'] as string, tableId: p['bayId'] as string ?? p['vehicleId'] as string ?? '' }) },

    { source: 'hotel.guest_checked_out',
      target: 'table.released',
      transform: (p) => ({ tenantId: p['tenantId'] as string, tableId: p['roomId'] as string ?? '' }) },

    { source: 'health.patient_discharged',
      target: 'table.released',
      transform: (p) => ({ tenantId: p['tenantId'] as string, tableId: p['bedId'] as string ?? '' }) },

    // ── RESERVATION.CREATED — déclenche ReservationHandlers ──

    { source: 'auto.appointment_booked',
      target: 'reservation.created',
      transform: (p) => ({ tenantId: p['tenantId'] as string, reservationId: p['appointmentId'] as string ?? '', customerId: p['customerId'] as string ?? '', date: p['date'] as string ?? '', time: p['time'] as string ?? '', covers: 1 }) },

    { source: 'hotel.room_booked',
      target: 'reservation.created',
      transform: (p) => ({ tenantId: p['tenantId'] as string, reservationId: p['bookingId'] as string ?? '', customerId: p['guestId'] as string ?? '', date: p['checkInDate'] as string ?? '', time: '14:00', covers: p['guests'] as number ?? 1 }) },

    { source: 'salon.appointment_booked',
      target: 'reservation.created',
      transform: (p) => ({ tenantId: p['tenantId'] as string, reservationId: p['appointmentId'] as string ?? '', customerId: p['clientId'] as string ?? '', date: p['date'] as string ?? '', time: p['time'] as string ?? '', covers: 1 }) },

    { source: 'health.appointment_booked',
      target: 'reservation.created',
      transform: (p) => ({ tenantId: p['tenantId'] as string, reservationId: p['appointmentId'] as string ?? '', customerId: p['patientRef'] as string ?? '', date: p['date'] as string ?? '', time: p['time'] as string ?? '', covers: 1 }) },

    // ── RESERVATION.NO_SHOW — déclenche NoShowHandlers ──

    { source: 'salon.no_show',
      target: 'reservation.no_show',
      transform: (p) => ({ tenantId: p['tenantId'] as string, reservationId: p['appointmentId'] as string ?? '', customerId: p['clientId'] as string ?? '' }) },

    { source: 'auto.no_show',
      target: 'reservation.no_show',
      transform: (p) => ({ tenantId: p['tenantId'] as string, reservationId: p['appointmentId'] as string ?? '', customerId: p['customerId'] as string ?? '' }) },

    // ── FACILITY.MAINTENANCE_REQUIRED ──

    { source: 'auto.vehicle_maintenance_required',
      target: 'facility.maintenance_required',
      transform: (p) => ({ tenantId: p['tenantId'] as string, assetId: p['vehicleId'] as string ?? '', assetType: 'vehicle', description: p['description'] as string ?? '' }) },

    { source: 'hotel.maintenance_required',
      target: 'facility.maintenance_required',
      transform: (p) => ({ tenantId: p['tenantId'] as string, assetId: p['assetId'] as string ?? '', assetType: p['assetType'] as string ?? 'equipment', description: p['description'] as string ?? '' }) },

    { source: 'health.equipment_maintenance_required',
      target: 'facility.maintenance_required',
      transform: (p) => ({ tenantId: p['tenantId'] as string, assetId: p['equipmentId'] as string ?? '', assetType: 'medical_device', description: p['description'] as string ?? '' }) },

    { source: 'retail.equipment_maintenance_required',
      target: 'facility.maintenance_required',
      transform: (p) => ({ tenantId: p['tenantId'] as string, assetId: p['equipmentId'] as string ?? '', assetType: 'equipment', description: p['description'] as string ?? '' }) },
];

// ── Registre + activation ──────────────────────────────────────────────────────

let initialized = false;

/**
 * Active le pont — à appeler une seule fois au boot (ex. dans registerHandlers.ts).
 * Chaque règle s'abonne à l'event source et émet l'event cible.
 */
export function initVerticalEventBridge(): void {
    if (initialized) return;
    initialized = true;

    for (const rule of BRIDGE_RULES) {
        NexusEventBus.on(rule.source as never, (payload: unknown) => {
            const typed = payload as BridgePayload;
            try {
                const translated = rule.transform(typed);
                NexusEventBus.emit(rule.target as never, translated as never);
            } catch (err) {
                // Le bridge ne doit pas crasher le bus — on log la traduction ratée
                logger.warn('[VerticalEventBridge] Traduction événement vertical échouée', { source: rule.source, target: rule.target, error: err });
            }
        });
    }
}

/**
 * Retourne la liste des événements sources écoutés pour une verticale donnée.
 * Utilisé pour l'outillage gen-vertical-playbook (§8.7).
 */
export function getBridgeSourcesForVariant(variant: PlatformVariant): string[] {
    const prefix = variant === 'garage' ? 'auto' : variant === 'clinic' ? 'health' : variant;
    return BRIDGE_RULES
        .filter(r => r.source.startsWith(prefix + '.'))
        .map(r => r.source);
}

export const BRIDGE_RULE_COUNT = BRIDGE_RULES.length;
