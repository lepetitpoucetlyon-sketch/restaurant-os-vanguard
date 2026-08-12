/**
 * 🏷️ §8.6 Vague 2 — Contrat des libellés métier par verticale
 *
 * Un module « générique » qui parle de « Couverts » ou « Bon cuisine » impose
 * une teinture restaurant à toutes les autres verticales. Ce contrat définit
 * l'ensemble minimal de libellés qu'un module transverse doit résoudre par
 * `resolveMetricLabels(variant)` au lieu de les inscrire en dur.
 *
 * Portée volontairement étroite : 5 clés seulement, choisies à partir des
 * teintures effectivement constatées dans l'audit AUDIT_MODULES_TEINTES.md
 * (buckets E/F/H). On étendra la clé par nécessité, jamais par anticipation.
 *
 * Motif identique à `roles.ts` : niveaux invariants (chiffres), libellés
 * variables (strings). Ici : le concept est invariant (« l'unité commerciale »,
 * « la personne qui accueille »), le mot pour le dire change.
 */

export interface MetricLabels {
  /**
   * L'unité commerciale au singulier — ce qu'on compte : couvert / intervention
   * / séance / consultation / passage / vente. Utilisé par reports, marketing,
   * widgets, fleet-benchmark, reservations.
   */
  unit: string;

  /**
   * L'unité commerciale au pluriel — accord français, jamais dérivé.
   */
  unitPlural: string;

  /**
   * Le conteneur spatial atomique (attribué à un ou plusieurs `unit`) —
   * table / chambre / baie / poste / cabine / salle d'attente. Utilisé par
   * printers (KitchenTicket.contextLabel), reservations, floor-plan (à terme).
   */
  spatialContext: string;

  /**
   * Le nom d'espèce du commerçant, tel qu'il s'appelle lui-même — restaurant
   * / hôtel / garage / salon / clinique / boulangerie / commerce. Utilisé par
   * printers (ReceiptTicket.merchantName), marketing (slug défaut), widgets
   * (« votre RDV chez X »), contrats événementiels.
   */
  merchantKind: string;

  /**
   * Le libellé de la personne qui accueille / prend la commande / opère —
   * serveur / réceptionniste / mécanicien / coiffeur / praticien / vendeur.
   * Utilisé par KitchenTicket.serverName et rapports d'activité.
   */
  server: string;

  /**
   * Le nom du ticket de production interne — « bon cuisine » chez restaurant,
   * « ordre de préparation » ailleurs. Utilisé par printers (types.ts) et KDS.
   */
  prepTicket: string;
}
