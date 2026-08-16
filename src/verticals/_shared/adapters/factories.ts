/**
 * 🔌 Adapter Factories — la couche de CAPITALISATION des adapters de verticale
 *
 * CONSTAT : les ~72 adapters (9 piliers × 8 verticales) sont quasi-clonés. Beaucoup
 * de méthodes émettent EXACTEMENT le même event universel (finance.order_sealed,
 * mcc.fiscal_audit_required, facility.maintenance_required, analytics.anomaly_detected,
 * crm.rfm_trigger, hr.shift_started…) avec le même corps.
 *
 * Ces factories portent une fois pour toutes le SOCLE UNIVERSEL. Chaque verticale :
 *   export const SalonFinanceAdapter = makeFinanceAdapter();               // 100 % réutilisé
 *   export const SalonCommerceAdapter = { ...makeCommerceAdapter(),        // socle + deltas
 *     emitAppointmentBooked(p) { NexusEventBus.emitDurable('salon.appointment_booked', p); } };
 *
 * Typage : chaque méthode référence `NexusEventPayload<'event'>` → alignée sur le
 * catalogue d'events, aucune forme de payload recopiée. Le pilier OPS n'a pas de
 * factory : ses events sont intrinsèquement propres à chaque verticale.
 */

import { NexusEventBus, type NexusEventPayload } from '@/shared/eventBus/NexusEventBus';

// ── FINANCE — 100 % universel (caisse NF525 identique partout) ──────────────────
export function makeFinanceAdapter() {
    return {
        emitServiceSealed(p: NexusEventPayload<'finance.order_sealed'>) {
            NexusEventBus.emitDurable('finance.order_sealed', p);
        },
        emitZReportRequested(p: NexusEventPayload<'finance.z_report_requested'>) {
            NexusEventBus.emitDurable('finance.z_report_requested', p);
        },
        emitRefundIssued(p: NexusEventPayload<'finance.refund_issued'>) {
            NexusEventBus.emitDurable('finance.refund_issued', p);
        },
    };
}

// ── MCC — audit fiscal universel + health ping à métriques variables ────────────
/**
 * @typeParam M - forme des métriques santé propres à la verticale
 *                (ex. `{ chairsActive: number; appointmentsToday: number }`).
 *                `mcc.health_ping` accepte `[key: string]: unknown` → extensible.
 */
export function makeMccAdapter<M extends Record<string, unknown> = Record<never, never>>() {
    return {
        emitHealthPing(p: { tenantId: string; status: 'healthy' | 'degraded' } & M) {
            NexusEventBus.emit('mcc.health_ping', p);
        },
        emitFiscalAuditRequired(p: NexusEventPayload<'mcc.fiscal_audit_required'>) {
            NexusEventBus.emitDurable('mcc.fiscal_audit_required', p);
        },
    };
}

// ── FACILITY — maintenance équipement universelle ───────────────────────────────
export function makeFacilityAdapter() {
    return {
        emitMaintenanceRequired(p: NexusEventPayload<'facility.maintenance_required'>) {
            NexusEventBus.emitDurable('facility.maintenance_required', p);
        },
    };
}

// ── INTELLIGENCE — détection d'anomalie universelle ─────────────────────────────
export function makeIntelligenceAdapter() {
    return {
        emitAnomalyDetected(p: NexusEventPayload<'analytics.anomaly_detected'>) {
            NexusEventBus.emitDurable('analytics.anomaly_detected', p);
        },
    };
}

// ── HUMAN — shift + heures sup universels ───────────────────────────────────────
export function makeHumanAdapter() {
    return {
        emitShiftStarted(p: Omit<NexusEventPayload<'hr.shift_started'>, 'v'>) {
            NexusEventBus.emit('hr.shift_started', { v: 1 as const, ...p });
        },
        emitOvertimeAlert(p: NexusEventPayload<'hr.overtime_alert'>) {
            NexusEventBus.emitDurable('hr.overtime_alert', p);
        },
    };
}

// ── COMMERCE — déclencheur RFM CRM universel ────────────────────────────────────
export function makeCommerceAdapter() {
    return {
        emitRFMTrigger(p: NexusEventPayload<'crm.rfm_trigger'>) {
            NexusEventBus.emitDurable('crm.rfm_trigger', p);
        },
    };
}

// ── COMPLIANCE — contrôle HACCP + consentement RGPD universels ──────────────────
export function makeComplianceAdapter() {
    return {
        emitProductSafetyCheck(p: Omit<NexusEventPayload<'haccp.check.saved'>, 'v'>) {
            NexusEventBus.emitDurable('haccp.check.saved', { v: 1 as const, ...p });
        },
        emitRgpdConsent(p: NexusEventPayload<'health.consent_recorded'>) {
            NexusEventBus.emitDurable('health.consent_recorded', p);
        },
    };
}

// ── LOGISTICS — alerte stock bas universelle ────────────────────────────────────
export function makeLogisticsAdapter() {
    return {
        emitStockAlert(p: NexusEventPayload<'retail.stock_alert'>) {
            NexusEventBus.emitDurable('retail.stock_alert', p);
        },
    };
}
