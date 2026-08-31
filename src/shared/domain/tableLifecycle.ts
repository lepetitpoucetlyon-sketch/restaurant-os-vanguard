/**
 * Table Lifecycle State Machine — PLAN LOGIQUE MÉTIER LOT D (P1)
 *
 * Formalise le cycle de vie d'une table en salle avec transitions autorisées
 * explicites. AVANT ce module : le statut `dirty` n'avait pas de sortie
 * métier (seule remise `free` manuelle depuis l'éditeur de plan de salle),
 * et le statut `cleaning` existait dans le type mais n'était écrit nulle
 * part dans le flux restaurant.
 *
 * Cycle canonique :
 *   free → reserved → seated → ordered → eating → paying → dirty → cleaning → free
 *
 * Transitions dérivées autorisées (annulations, transferts, no-shows) sont
 * listées explicitement — toute transition hors liste est rejetée par
 * `assertTableTransition` (fail-closed au niveau du domaine, pas de l'UI).
 */

// TableStatus dupliqué en local pour éviter le cycle facility → ops (types.ts vit dans facility, mais ops en a besoin via son floorHooks — la copie ici est la source neutre du domaine).
export type TableStatus = 'free' | 'seated' | 'ordered' | 'eating' | 'paying' | 'dirty' | 'reserved' | 'cleaning' | 'locked';

/** Transitions canoniques du golden path + dérivées légitimes. */
export const TABLE_LIFECYCLE_TRANSITIONS: ReadonlyMap<TableStatus, ReadonlySet<TableStatus>> = new Map([
    // free → réservation prise / assignation directe (walk-in)
    ['free',     new Set<TableStatus>(['reserved', 'seated', 'locked'])],
    // reserved → arrivée client / no-show (libération) / annulation
    ['reserved', new Set<TableStatus>(['seated', 'free', 'locked'])],
    // seated → première commande envoyée / libération anticipée
    ['seated',   new Set<TableStatus>(['ordered', 'dirty', 'free'])],
    // ordered → plats servis / rappel cuisine
    ['ordered',  new Set<TableStatus>(['eating', 'seated'])],
    // eating → demande addition / commande complémentaire (retour à ordered)
    ['eating',   new Set<TableStatus>(['paying', 'ordered', 'dirty'])],
    // paying → paiement encaissé (dirty) / retour eating (paiement annulé)
    ['paying',   new Set<TableStatus>(['dirty', 'eating'])],
    // dirty → équipe salle démarre nettoyage
    ['dirty',    new Set<TableStatus>(['cleaning', 'free'])],
    // cleaning → nettoyage terminé
    ['cleaning', new Set<TableStatus>(['free'])],
    // locked (verrouillage admin) → libération manuelle uniquement
    ['locked',   new Set<TableStatus>(['free'])],
]);

/** Vérifie qu'une transition `from → to` est autorisée par le cycle canonique. */
export function isTableTransitionAllowed(from: TableStatus, to: TableStatus): boolean {
    if (from === to) return true; // idempotence (setStatus(currentStatus) toléré)
    return TABLE_LIFECYCLE_TRANSITIONS.get(from)?.has(to) ?? false;
}

/**
 * Fail-closed : lève une erreur si la transition n'est pas autorisée.
 * À appeler AVANT toute écriture Nexus sur `status`.
 */
export class TableTransitionError extends Error {
    constructor(public readonly from: TableStatus, public readonly to: TableStatus) {
        super(`[TableLifecycle] Transition interdite : ${from} → ${to}. Transitions autorisées depuis '${from}' : ${[...(TABLE_LIFECYCLE_TRANSITIONS.get(from) ?? [])].join(', ') || '(aucune — état terminal)'}`);
        this.name = 'TableTransitionError';
    }
}

export function assertTableTransition(from: TableStatus, to: TableStatus): void {
    if (!isTableTransitionAllowed(from, to)) {
        throw new TableTransitionError(from, to);
    }
}

/** Retourne les transitions autorisées depuis un état donné (pour UI). */
export function getAllowedTransitions(from: TableStatus): TableStatus[] {
    return [...(TABLE_LIFECYCLE_TRANSITIONS.get(from) ?? [])];
}
