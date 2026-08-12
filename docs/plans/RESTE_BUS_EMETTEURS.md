# Reste à faire — Émetteurs du bus événementiel (R1-R13)
> ⟵ ex-`PLAN_RESTE_A_FAIRE.md` (racine), renommé le 2026-08-12 pour lever l'ambiguïté
> avec [`PLAN_RESTE_A_FAIRE.md`](PLAN_RESTE_A_FAIRE.md) (chantiers cohérence/sécu — périmètre distinct, 0 recouvrement).
>
> **Périmètre** : émetteurs manquants dans les modules — le bus écoute, mais personne n'émet.
> État après v2.2.0 · rédigé 2026-08-09. ⚠️ Snapshot daté : vérifier l'avancement réel
> contre [`../../.claude/sessions.md`](../../.claude/sessions.md) et `git log` avant reprise.
> Bus : ~80% connecté — ce document couvre les ~20% restants.

---

## P0 — Émetteurs manquants dans les modules (le bus écoute mais personne ne parle)

### R1 — `reservation.created/updated/cancelled` jamais émis depuis le module Résa
Le module écrit directement en Nexus. `FloorPlanCapacityHandler` attend ces 3 events sans jamais les recevoir. Plan de salle jamais mis à jour en temps réel.

**Fichier à modifier** : `src/modules/commerce/relation/reservations/` (hooks de création/modif/annulation)

- [ ] Ajouter `NexusEventBus.emitDurable('reservation.created', ...)` à la création
- [ ] Ajouter `NexusEventBus.emitDurable('reservation.updated', ...)` à la modification
- [ ] Ajouter `NexusEventBus.emitDurable('reservation.cancelled', ...)` à l'annulation

**Impact** : Chef de rang, Hôtesse, Manager — plan de salle en temps réel

---

### R2 — `reservation.matched` — bouton "Accueillir le client" absent
`ResaAllergenCheckHandler` attend cet event pour transmettre les allergènes au KDS. Personne ne l'émet à l'accueil.

**Fichier à modifier** : `src/modules/commerce/relation/reservations/components/NewReservationDialog.tsx` ou composant check-in

- [ ] Ajouter bouton "Accueillir le client" dans l'UI d'accueil réservation
- [ ] Ce bouton émet `reservation.matched` avec `allergens` depuis le profil CRM du client

**Impact** : Allergènes ne parviennent jamais au cuisinier ⚠️

---

### R3 — `hr.absence_declared` jamais émis depuis le formulaire RH
`AbsenceUnderstaffingHandler` est prêt. Personne ne déclenche l'alerte sous-effectif automatique.

**Fichier à modifier** : composant déclaration d'absence dans `src/modules/human/effectifs/hr/`

- [ ] Ajouter `NexusEventBus.emitDurable('hr.absence_declared', ...)` à la soumission du formulaire

**Impact** : Manager jamais alerté d'un sous-effectif automatiquement

---

### R4 — `commerce.promotion_activated` jamais émis à la sauvegarde
`PromotionPriceHandler` et `PromotionExpiryHandler` sont prêts. `PromotionExpiryJob` existe. Mais la sauvegarde d'une promo n'émet rien.

**Fichier à modifier** : hook/service de sauvegarde promotion dans `src/modules/commerce/`

- [ ] Ajouter `NexusEventBus.emitDurable('commerce.promotion_activated', ...)` à l'activation

**Impact** : Prix promo jamais appliqués automatiquement au POS

---

## P1 — Handlers existants à enrichir

### R5 — `SupplierInvoiceLedgerHandler` — matching PO ↔ facture non automatique
Le handler enregistre la facture mais ne cherche pas le PO correspondant.

**Fichier** : `src/shared/eventBus/handlers/SupplierInvoiceLedgerHandler.ts`

- [ ] Après enregistrement : chercher PO (même fournisseur, montant proche ±5%)
- [ ] Si match → émettre `finance.reconciliation_completed`
- [ ] Si écart > seuil → émettre `procurement.mismatch_detected`
- [ ] Si pas de match → laisser en attente validation manuelle

---

### R6 — `TableAutoReleaseHandler` — hôtesse non notifiée
La table est libérée mais l'hôtesse ne reçoit pas de push.

**Fichier** : `src/shared/eventBus/handlers/TableAutoReleaseHandler.ts`

- [ ] Après libération : WebPush vers `hotesse` + `chef_rang`
- [ ] Message : "Table {tableId} disponible"

---

### R7 — `FridgeTempAlertHandler` — journal légal HACCP non persisté
Les alertes température sont gérées mais pas enregistrées dans le registre légal immuable.

**Fichier** : `src/shared/eventBus/handlers/FridgeTempAlertHandler.ts`

- [ ] Persister dans `tenants/{id}/haccpTemperatureLog/{id}` (jamais delete)
- [ ] Si `severity: 'CRITICAL'` → WebPush responsable HACCP + déclencher `HaccpCorrectiveActionHandler`

---

### R8 — `FleetOutboxHandler` — émetteur `finance.payment_failed` introuvable
Le handler écoute un event qui n'est jamais émis.

**À investiguer** : `src/shared/eventBus/handlers/FleetOutboxHandler.ts`

- [ ] Vérifier si c'est `payment.rejected` (Stripe webhook) qui devrait déclencher ce handler
- [ ] Corriger le nom d'event ou ajouter l'émetteur depuis `src/app/api/webhooks/stripe/route.ts`

---

## P2 — Petits manquants

### R9 — `staff.clock_in/out` — tracer les deux chemins jusqu'à `shiftEntries`
Deux chemins existent (TimeclockDashboard et `/api/hr/clock-in`). Pas certain qu'ils aboutissent au même enregistrement.

- [ ] Tracer `TimeclockDashboard → staff.clock_in → PayrollTimeclockHandler → shiftEntries`
- [ ] Tracer `API /hr/clock-in → hr.clock_in → PayrollTimeclockHandler → shiftEntries`

---

### R10 — `ai.query_received` — jamais émis depuis l'Oracle
`OracleQueryAuditHandler` existe. Les requêtes IA ne sont pas auditées.

**Fichier** : `src/modules/intelligence/ia/ai/AIProviderRouter.ts` (déjà modifié aujourd'hui)

- [ ] Émettre `ai.query_received` avant chaque requête LLM

---

### R11 — `store.rush_mode_toggled` → sync UberEats/Deliveroo
Vérifier que `RushModeIntegrationHandler` appelle bien les APIs plateformes.

**Fichier** : `src/shared/eventBus/handlers/RushModeIntegrationHandler.ts`

- [ ] Si `isPaused: true` → appel API UberEats/Deliveroo suspend
- [ ] Si `isPaused: false` → réactivation

---

## P3 — Tests d'intégration bus

### R12 — Tests de chaîne (6 scénarios)

**Fichier à créer** : `src/__tests__/bus/bus-chain.test.ts`

- [ ] `order.placed → KDSOrderHandler` (cuisine reçoit sans paiement)
- [ ] `order.paid → StockDeduction + Loyalty + CRM + DigitalReceipt`
- [ ] `notification.urgent → NotifUrgentDispatch → WebPush (mock)`
- [ ] `finance.ticket_z_closed → ShiftAutoAudit → hrAlerts`
- [ ] `reservation.created → FloorPlanCapacity → plan de salle mis à jour`
- [ ] `dlc.expired → DLCExpiryHandler + DLCBlockerHandler`

---

### R13 — Bus smoke test (CI guard)

**Fichier à créer** : `src/__tests__/bus/bus-smoke.test.ts`

- [ ] Pour chaque event catalogué : au moins 1 handler écoute
- [ ] Pour chaque handler : au moins 1 émetteur existe
- [ ] CI échoue si un nouveau trou apparaît

---

## Récapitulatif

| # | Item | Priorité | Effort |
|---|------|----------|--------|
| R1 | reservation.created/updated/cancelled — émetteurs module | P0 | 1h |
| R2 | reservation.matched — bouton accueil allergènes | P0 | 1h |
| R3 | hr.absence_declared — émetteur formulaire | P0 | 30min |
| R4 | commerce.promotion_activated — émetteur sauvegarde | P0 | 30min |
| R5 | SupplierInvoiceLedgerHandler — matching PO auto | P1 | 2h |
| R6 | TableAutoReleaseHandler — notif hôtesse | P1 | 30min |
| R7 | FridgeTempAlertHandler — journal HACCP légal | P1 | 1h |
| R8 | FleetOutboxHandler — corriger émetteur | P1 | 30min |
| R9 | staff.clock_in — tracer les deux chemins | P2 | 1h |
| R10 | ai.query_received — émetteur Oracle | P2 | 30min |
| R11 | RushModeIntegrationHandler — vérif UberEats | P2 | 30min |
| R12 | Tests de chaîne (6 scénarios) | P3 | 3h |
| R13 | Bus smoke test CI | P3 | 2h |

**Total : ~14h pour atteindre 100%**
**P0 seul (R1→R4) : ~3h — bus à 90%+**

---

*Restaurant OS Core v2.2.0 · 2026-08-09*
