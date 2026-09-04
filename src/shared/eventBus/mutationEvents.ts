/**
 * mutationEvents — Registre des événements « à mutation » (argent, stock, paie).
 *
 * Invariant #1 (idempotence) : tout handler qui consomme l'un de ces événements
 * DOIT être idempotent, car un re-jeu (retry réseau, replay outbox multi-device,
 * rejeu DLQ) ne doit JAMAIS appliquer deux fois l'effet (double déstockage,
 * double avoir, double paie, double point de fidélité, total Z gonflé…).
 *
 * Le bus (`NexusEventBus.on`) active automatiquement l'`IdempotencyGuard` pour
 * tout handler abonné à l'un de ces événements — l'idempotence devient le DÉFAUT
 * pour les mutations, au lieu d'être un opt-in oublié (cf. audit archi 2026-09).
 *
 * Opt-out : un handler qui gère lui-même son idempotence (ex. `withIdempotencyGuard`
 * manuel) doit passer `idempotent: false` à `on(...)` pour éviter le double-emballage.
 *
 * Le cliquet `scripts/gate-idempotency.mjs` vérifie que tout consommateur d'un
 * événement de mutation est bien idempotent (auto ou explicite).
 */
export const MUTATION_EVENTS: ReadonlySet<string> = new Set<string>([
    // ── Ventes / encaissement ─────────────────────────────────────────────────
    'order.paid',
    'order.placed',
    'order.completed',
    'order.sealed_nf525',
    'order.cancelled',
    'order.refunded',
    'order.comp',
    'order.split',
    'order.proforma_printed',
    // ── Paiement ──────────────────────────────────────────────────────────────
    'payment.captured',
    'payment.refunded',
    'payment.rejected',
    // ── Facturation ───────────────────────────────────────────────────────────
    'invoice.overdue',
    'invoice.generated',
    'invoice.issued',
    // ── Stock / inventaire ────────────────────────────────────────────────────
    'inventory.deducted',
    'inventory.physical',
    'inventory.stock_adjusted',
    'inventory.waste_logged',
    'stock.received',
    'stock.deductions_reconciled',
    'stock.pending_recipe_deduction',
    // ── Paie / RH ─────────────────────────────────────────────────────────────
    'payroll.submitted',
    'hr.hcr_payroll_computed',
    // ── Trésorerie ────────────────────────────────────────────────────────────
    'finance.cash_variance_recorded',
    'finance.smart_tip_distributed',
]);

/** True si l'événement mute de l'argent/stock/paie → handlers idempotents obligatoires. */
export function isMutationEvent(event: string): boolean {
    return MUTATION_EVENTS.has(event);
}
