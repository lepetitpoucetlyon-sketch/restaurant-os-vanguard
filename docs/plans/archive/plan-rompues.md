# Plan de traitement — 53 Promesses Rompues

> Audit vérifié contre code réel · 2026-07-31  
> Vague 1 (DLQ) déjà livrée → BS-26 ✅ BS-27 ✅

---

## Résumé

| Métrique | Valeur |
|---|---|
| Promesses R à corriger | **53** |
| Vagues planifiées | **10** (V2 → V11) |
| Nouveaux events NexusEventBus | **~38** |
| Nouveaux handlers | **~30** |

Ordre de priorité : Critique → Haute → Moyenne → Basse.

---

## V2 — Fiscal & Paiements `CRITIQUE` `effort M`

**Raison :** NF525 — les lignes de règlement sont la base du FEC et de la conformité fiscale. Sans PaymentLedger, aucune ventilation CB/espèces/split dans le journal.

### Promesses (5 R)

| ID | Description |
|---|---|
| P01-D | Paiement CB → ligne débit caisse CB |
| P01-E | Paiement espèces → ligne débit caisse |
| P01-F | Paiement split → N lignes par mode de règlement |
| P01-G | Plat offert (comp) → catégorie comptable "offerts" |
| P01-H | Remboursement → écriture extourne miroir |

### À créer

**Events NexusEventBus :**
- `order.split`
- `order.comp`
- `order.refunded`

**Handlers :**
- `PaymentLedgerHandler` — écoute `order.paid`, écrit ligne CB ou espèces selon `paymentMethod`
- `SplitPaymentHandler` — écoute `order.split`, écrit N lignes
- `CompEntryHandler` — écoute `order.comp`, écrit dans catégorie "offerts"
- `RefundExtourneHandler` — écoute `order.refunded`, écrit écriture miroir extourne

**Fichiers clés :**
- `src/shared/eventBus/NexusEvents.ts`
- `src/shared/eventBus/registerHandlers.ts`
- `src/shared/eventBus/handlers/PaymentLedgerHandler.ts` (nouveau)
- `src/shared/eventBus/handlers/RefundExtourneHandler.ts` (nouveau)
- `src/infrastructure/services/finance/FinancialNexusBridge.ts` (emit les nouveaux events)

---

## V3 — Stocks complets `HAUTE` `effort M`

**Raison :** Rupture de stock silencieuse = ventes impossible non bloquées. BL sans rapprochement BC = écarts non détectés.

### Promesses (4 R)

| ID | Description |
|---|---|
| P02-C | Stock = 0 → produit bloqué POS + carte en ligne |
| P02-E | BL signé → lien BC vérifié, écart signalé |
| P02-J | Transfert stock inter-site → déduction A, crédit B |
| P02-K | Inventaire physique → rapport de dérive |

### À créer

**Events NexusEventBus :**
- `stock.zero`
- `stock.transfer`
- `inventory.physical`

**Handlers :**
- `StockZeroBlockerHandler` — écoute `stock.zero`, flag produit hors-vente dans Nexus
- `StockTransferHandler` — écoute `stock.transfer`, déduction site A + crédit site B
- `PhysicalInventoryHandler` — écoute `inventory.physical`, calcule dérive vs théorique

**Fichiers clés :**
- `src/shared/eventBus/NexusEvents.ts`
- `src/shared/eventBus/registerHandlers.ts`
- `src/shared/eventBus/handlers/StockZeroBlockerHandler.ts` (nouveau)
- `src/shared/eventBus/handlers/StockReceptionHandler.ts` (+ BC-matching)

---

## V4 — HACCP aval & IoT `HAUTE` `effort S`

**Raison :** Obligation réglementaire — quarantaine activée mais non propagée au POS = vente possible de produits dangereux.

### Promesses (4 R)

| ID | Description |
|---|---|
| P03-C | `inventory.quarantine_activated` → produits bloqués POS + carte |
| P03-D | Capteur IoT offline > N min → alerte "silencieux" |
| P03-I | Rappel produit → bloqué POS + notification urgente |
| P03-L | DLC dépassée → alerte + déduction stock |

### À créer

**Events NexusEventBus :**
- `recall.declared`
- `dlc.expired`
- `iot.offline`

**Handlers :**
- `QuarantineActivatedHandler` — écoute `inventory.quarantine_activated`, flag hors-vente POS
- `RecallPOSBlockerHandler` — écoute `recall.declared`, bloque lot + push notif urgente
- `DLCExpiryHandler` — écoute `dlc.expired`, alerte + déduction stock
- `IotOfflineAlertHandler` — écoute `iot.offline`, alerte manager + log HACCP

**Fichiers clés :**
- `src/shared/eventBus/NexusEvents.ts`
- `src/shared/eventBus/registerHandlers.ts`
- `src/shared/eventBus/handlers/QuarantineActivatedHandler.ts` (nouveau)
- `src/shared/eventBus/handlers/RecallPOSBlockerHandler.ts` (nouveau)
- `src/modules/compliance/haccp/` (emit `iot.offline` sur timeout capteur)

---

## V5 — KDS cuisine complet `MOYENNE` `effort XL`

**Raison :** CAT-11 entier fantôme — aucun des 9 events KDS n'existe dans NexusEventBus. Le KDS est actuellement déconnecté du bus.

### Promesses (9 R)

| ID | Description |
|---|---|
| P11-A | Commande passée → KDS mis à jour temps réel |
| P11-B | Plat prêt → statut "prêt" → notification serveur |
| P11-C | Plat prêt → retiré de la liste active KDS |
| P11-D | Table payée → statut plan de salle "libre" auto |
| P11-E | Table libre → nettoyage tracé avant réassignation |
| P11-F | Grand groupe → tâches préparation auto-créées |
| P11-G | Produit rupture → retiré affichage KDS/POS |
| P11-H | Changement recette → KDS nouveaux ingrédients |
| P11-I | Statut table modifié → conflits concurrents gérés |

### À créer

**Events NexusEventBus :**
- `order.created`
- `dish.ready`
- `table.paid`
- `table.free`
- `recipe.updated`
- `table.status`
- `biggroup.confirmed` *(partagé V6)*
- `stock.zero` *(partagé V3)*

**Handlers :**
- `KDSUpdateHandler` — écoute `order.created`, push ligne KDS
- `DishReadyNotifHandler` — écoute `dish.ready`, notif serveur
- `TableStatusHandler` — écoute `table.paid` / `table.free` / `table.status`, sync plan de salle avec OCC check
- `RecipeKDSHandler` — écoute `recipe.updated`, met à jour affichage KDS
- `BigGroupPrepHandler` — écoute `biggroup.confirmed`, crée tâches préparation cuisine

**Fichiers clés :**
- `src/shared/eventBus/NexusEvents.ts`
- `src/shared/eventBus/registerHandlers.ts`
- `src/shared/eventBus/handlers/KDSUpdateHandler.ts` (nouveau)
- `src/shared/eventBus/handlers/TableStatusHandler.ts` (nouveau — OCC pour conflits)
- `src/modules/ops/kds/` (refactor pour émettre les events)
- `src/modules/ops/engine/components/floor-plan/` (subscribe `table.status`)

---

## V6 — Réservations & plan de salle `MOYENNE` `effort L`

**Raison :** 8 events fantômes — le flux réservation est muet après `reservation.confirmed`. Rappels, no-shows, pénalités = zéro automatisation.

### Promesses (8 R)

| ID | Description |
|---|---|
| P05-B | Réservation J-1 → rappel auto client |
| P05-C | Réservation J-1 → tâches cuisine auto-créées |
| P05-D | Annulation tardive → pénalité auto-débitée |
| P05-E | No-show → score CRM dégradé |
| P05-F | No-show → table libérée sur plan de salle |
| P05-H | Table assignée → statut plan "réservée" temps réel |
| P05-I | Couvert servi → statut "libérée" en fin de service |
| P05-K | Groupe > N couverts → alerte gérant validation |

### À créer

**Events NexusEventBus :**
- `resa.j1`
- `resa.cancel.late`
- `resa.noshow`
- `table.assigned`
- `table.seated`
- `biggroup.confirmed` *(partagé V5)*

**Handlers :**
- `ResaReminderHandler` — écoute `resa.j1`, envoie email/SMS + crée tâches cuisine
- `LateCancelPenaltyHandler` — écoute `resa.cancel.late`, débite pénalité
- `NoShowCRMHandler` — écoute `resa.noshow`, dégrade score CRM + libère table
- `TablePlanStatusHandler` — écoute `table.assigned` / `table.seated`, sync plan de salle

**Fichiers clés :**
- `src/shared/eventBus/NexusEvents.ts`
- `src/shared/eventBus/registerHandlers.ts`
- `src/modules/commerce/reservations/` (emit `resa.j1` via cron J-1)
- `src/shared/eventBus/handlers/ResaReminderHandler.ts` (nouveau)
- `src/shared/eventBus/handlers/NoShowCRMHandler.ts` (nouveau)

---

## V7 — RH & paie `MOYENNE` `effort M`

**Raison :** Clôture de shift sans provision salaire = données paie incohérentes, DSN erronée.

### Promesses (5 R)

| ID | Description |
|---|---|
| P04-C | Durée shift → provision salaire mise à jour |
| P04-D | Heures sup dépassées → alerte + mention bulletin |
| P04-F | Pourboire encaissé → ligne de paie employé |
| P04-I | Push paie échoué → retry + alerte RH |
| P04-J | DSN générée → contrôle cohérence avant envoi |

### À créer

**Events NexusEventBus :**
- `shift.complete`
- `overtime.threshold`
- `payroll.push.failed`
- `dsn.generated`

**Handlers :**
- `ShiftProvisionHandler` — écoute `shift.complete`, calcule provision salaire dans Nexus
- `OvertimeAlertHandler` — écoute `overtime.threshold`, alerte manager + flag bulletin
- `PayrollRetryHandler` — écoute `payroll.push.failed`, retry Silae/Merge.dev + alerte RH
- `DSNCoherenceHandler` — écoute `dsn.generated`, vérifie totaux avant envoi

**Fichiers clés :**
- `src/shared/eventBus/NexusEvents.ts`
- `src/shared/eventBus/registerHandlers.ts`
- `src/shared/eventBus/handlers/ShiftProvisionHandler.ts` (nouveau)
- `src/modules/human/payroll/` (emit `payroll.push.failed` sur erreur Silae)

---

## V8 — Finance & banking `MOYENNE` `effort L`

**Raison :** Rapprochement bancaire et inférence PCG sont le cœur de la comptabilité automatisée. Sans ces handlers, tout est manuel.

### Promesses (5 R)

| ID | Description |
|---|---|
| P07-B | Transaction bancaire → match PCG heuristique |
| P07-C | Rapprochement validé → écriture lettrée |
| P07-G | Facture fournisseur → compte PCG auto-inféré |
| P07-H | Devis envoyé → relance si non-réponse J+7 |
| P07-I | Facture impayée → relance J+30, J+60 + contentieux |

### À créer

**Events NexusEventBus :**
- `bank.transaction`
- `reconcile.validated`
- `invoice.received`
- `invoice.overdue`

**Handlers :**
- `BankTransactionHandler` — écoute `bank.transaction`, match PCG heuristique (libellé → compte)
- `ReconcileValidatedHandler` — écoute `reconcile.validated`, lettre les écritures dans le journal
- `PCGMatchHandler` — écoute `invoice.received`, infère compte PCG fournisseur
- `InvoiceRelanceHandler` — écoute `invoice.overdue`, déclenche relances J+30/J+60/contentieux

**Fichiers clés :**
- `src/shared/eventBus/NexusEvents.ts`
- `src/shared/eventBus/registerHandlers.ts`
- `src/modules/finance/banking/` (emit `bank.transaction` sur webhook Plaid/Bridge)
- `src/shared/eventBus/handlers/BankTransactionHandler.ts` (nouveau)
- `src/shared/eventBus/handlers/InvoiceRelanceHandler.ts` (nouveau)

---

## V9 — CRM & marketing `BASSE` `effort M`

**Raison :** Fidélisation — impact business réel mais aucun blocage réglementaire. À faire après V2–V8.

### Promesses (5 R)

| ID | Description |
|---|---|
| P06-B | Badge VIP → notification bienvenue caisse |
| P06-E | Client inactif 90j → campagne réactivation auto |
| P06-F | Avis négatif < 3★ → alerte gérant + draft IA |
| P06-G | Avis positif → réponse template proposée |
| P06-I | Campagne envoyée → taux ouverture tracé |

### À créer

**Events NexusEventBus :**
- `badge.vip`
- `inactive.90d`
- `review.negative`
- `review.positive`
- `campaign.sent`

**Handlers :**
- `VipWelcomeHandler` — écoute `badge.vip`, push notif caisse
- `InactiveClientHandler` — écoute `inactive.90d`, déclenche campagne réactivation
- `ReviewAlertHandler` — écoute `review.negative`, alerte gérant + génère draft IA
- `CampaignTrackingHandler` — écoute `campaign.sent`, initialise tracking taux ouverture

**Fichiers clés :**
- `src/shared/eventBus/NexusEvents.ts`
- `src/shared/eventBus/registerHandlers.ts`
- `src/modules/commerce/marketing/handlers/` (nouveaux handlers)
- Cron `inactive.90d` : `src/app/api/cron/` (scan clients + emit)

---

## V10 — Connecteurs externes `MOYENNE` `effort M`

**Raison :** Commandes UberEats sans fiscal NF525 = non-conformité sur les ventes livrées.

### Promesses (4 R)

| ID | Description |
|---|---|
| P10-A | Commande Uber Eats → même flux fiscal NF525 |
| P10-B | Commande livreur → stock déduit |
| P10-D | Avis Google/TripAdvisor → importé → CRM |
| P10-I | IoT capteur offline → alerte après timeout |

### À créer

**Events NexusEventBus :**
- `ubereats.order`
- `review.imported`
- `iot.offline` *(partagé V4)*

**Handlers :**
- `UberEatsFiscalHandler` — écoute `ubereats.order`, passe par `FiscalSealer.sealDataAtomically`
- `UberEatsStockHandler` — écoute `ubereats.order`, déduit stock BOM
- `ReviewImportHandler` — écoute `review.imported`, enregistre avis dans CRM
- `IotTimeoutHandler` — webhook IoT → timeout → emit `iot.offline` *(logic dans connector)*

**Fichiers clés :**
- `src/shared/eventBus/NexusEvents.ts`
- `src/shared/eventBus/registerHandlers.ts`
- `src/app/api/connectors/ubereats/` (emit `ubereats.order`)
- `src/shared/eventBus/handlers/UberEatsFiscalHandler.ts` (nouveau)

---

## V11 — Résilience IA `BASSE` `effort S`

**Raison :** Dégradation silencieuse — sans retry et fallback, les pannes IA passent inaperçues jusqu'au lendemain matin.

### Promesses (4 R)

| ID | Description |
|---|---|
| P08-C | Indexation LightRAG échouée → retry + alerte |
| P08-E | Rapport Resend KO → retry + fallback alerte |
| P08-G | Circuit Breaker déclenché → service dégradé gracieux |
| P08-J | LLM timeout → fallback modèle secondaire |

### À créer

**Events NexusEventBus :**
- `indexation.failed`
- `report.send.failed`
- `circuit.break`
- `llm.timeout`

**Handlers :**
- `AIRetryHandler` — écoute `indexation.failed`, retry ×3 puis alerte
- `ReportFallbackHandler` — écoute `report.send.failed`, retry Resend puis fallback email direct
- `CircuitBreakerHandler` — écoute `circuit.break`, bascule mode dégradé gracieux
- `LLMFallbackHandler` — écoute `llm.timeout`, bascule sur modèle secondaire (Haiku)

**Fichiers clés :**
- `src/shared/eventBus/NexusEvents.ts`
- `src/shared/eventBus/registerHandlers.ts`
- `src/modules/intelligence/rag/` (emit `indexation.failed`)
- `src/shared/eventBus/handlers/CircuitBreakerHandler.ts` (nouveau)

---

## Récapitulatif des vagues

| Vague | Titre | Priorité | R | Effort | Events créés | Handlers créés |
|---|---|---|---|---|---|---|
| V2 | Fiscal & paiements | CRITIQUE | 5 | M | 3 | 4 |
| V3 | Stocks complets | HAUTE | 4 | M | 3 | 3 |
| V4 | HACCP aval & IoT | HAUTE | 4 | S | 3 | 4 |
| V5 | KDS cuisine complet | MOYENNE | 9 | XL | 8 | 5 |
| V6 | Réservations & plan salle | MOYENNE | 8 | L | 6 | 4 |
| V7 | RH & paie | MOYENNE | 5 | M | 4 | 4 |
| V8 | Finance & banking | MOYENNE | 5 | L | 4 | 4 |
| V9 | CRM & marketing | BASSE | 5 | M | 5 | 4 |
| V10 | Connecteurs externes | MOYENNE | 4 | M | 3 | 4 |
| V11 | Résilience IA | BASSE | 4 | S | 4 | 4 |
| **Total** | | | **53** | | **~43** | **~40** |

---

*Vague 1 (DLQ infrastructure) déjà livrée — voir `DLQRetryService.ts` et `EventBusTab.tsx`.*
