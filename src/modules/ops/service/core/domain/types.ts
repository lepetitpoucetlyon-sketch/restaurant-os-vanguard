/**
 * ServiceTicket — abstraction générique de toute « prise en charge » multi-verticale.
 *
 * Fondée sur la lecture du POS restaurant (SPEC_SERVICE_TICKET.md §1-4) :
 * le PosTicket existant est à 80 % générique. Les 4 champs restaurant-spécifiques
 * (tableId, covers, consumptionMode, ingredientId) deviennent des délégations.
 *
 * Règle NF525 : une fois CLOSED, le ServiceTicket est IMMUABLE (jamais delete/update).
 * Règle RGPD  : si subject.isPii === true, seuls ref + label anonymisé vivent ici ;
 *               le détail réel est dans PiiVault.
 */
import type { Microunits } from '@/shared/schemas/primitives';
import type { ServiceSubject } from '@nexus/contracts';
// BillingUnit — inlined depuis §7.8 IVerticalInvoicingAdapter (non extrait dans ce lot)
type BillingUnit = 'per_cover' | 'per_night' | 'parts_labor' | 'per_act' | 'per_item' | 'per_session' | 'per_service';

// ── Machine à états ────────────────────────────────────────────────────────────

export type ServiceState =
    | 'OPEN'       // Ressource assignable, lignes ajoutables
    | 'WORKING'    // En cours de production (sous-états délégués à la verticale)
    | 'READY'      // Produit livrable, en attente de clôture
    | 'CLOSED'     // Scellé NF525, ressource libérée — IMMUABLE
    | 'CANCELLED'; // Annulé avant scellement (après → credit_note via InvoiceService)

// ── Lignes de service ──────────────────────────────────────────────────────────

/** Modificateur d'une ligne (supplément, déduction, note). */
export interface ServiceModifier {
    id?: string;
    name: string;
    action?: 'add' | 'remove' | 'info';
    priceImpactInMicrounits?: Microunits;
}

/**
 * Ligne de service — équivalent générique de CartLine / OrderItem.
 * `ingredientId` n'est PAS obligatoire (couplage recette = présupposé restaurant).
 */
export interface ServiceLine {
    lineId: string;
    productId: string;
    label: string;
    quantity: number;
    unitPriceInMicrounits: Microunits;
    taxRatePercent: number;
    modifiers?: ServiceModifier[];
    notes?: string;
    /** Meta vertical libre : recette, pièce, acte médical, type de chambre… */
    verticalMeta?: Record<string, unknown>;
}

// ── Paiement ───────────────────────────────────────────────────────────────────

export interface PaymentSplit {
    method: 'cash' | 'card' | 'transfer' | 'voucher' | 'other';
    amountInMicrounits: Microunits;
    reference?: string;
}

// ── ServiceTicket ──────────────────────────────────────────────────────────────

export interface ServiceTicket {
    // — Identité & traceabilité —
    id: string;
    correlationId: string;
    tenantId: string;

    // — Chaîne NF525 (générique, identique à PosTicket) —
    hashPrecedent: string;
    hash: string;
    serverTimestamp: string; // ISO 8601 — serveur autoritaire
    deviceId?: string;
    operatorId: string;
    /** Niveau RBAC universel (PERMISSION_ROLE_LEVELS) — PAS un libellé restaurant ('waiter', 'barman'). */
    operatorLevel: number;

    // — Cycle de vie —
    state: ServiceState;
    openedAt: string;
    closedAt: string | null;

    // — Ressource assignée (générique — remplace tableId) —
    resourceId: string | null;
    /** Déclaré par la verticale : 'table' | 'bay' | 'room' | 'bed' | 'chair' | … */
    resourceKind: string | null;

    // — Commercial —
    lines: ServiceLine[];
    totalHTInMicrounits: Microunits;
    totalTTCInMicrounits: Microunits;
    tvaBreakdown: Record<string, number>; // taux% → montant µ
    payments: PaymentSplit[];

    // — Lien facturation (NF525) —
    /** ID du JournalEntry scellé produit lors du bill(). */
    sourceEntryId: string | null;

    // — Délégations verticales —
    subject: ServiceSubject;
    billingUnit: BillingUnit;
    /** Données spécifiques à la verticale : couverts, VIN, kilométrage, dates séjour… */
    verticalMeta: Record<string, unknown>;
}

// ── Interfaces ICart / ICheckoutSession (rétrocompat scaffold) ─────────────────

export interface ICart {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICartItem {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICheckoutSession {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITicket {
    id: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}
