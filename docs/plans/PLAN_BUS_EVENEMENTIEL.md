# Plan de remédiation — NexusEventBus complet
> Audit spider web — Restaurant OS Core · 2026-08-09
> Promesse : **tout s'auto-complète, tout s'auto-calcule pour tous les rôles**
> Taux de connexion actuel : **34%** — 94 events orphelins, 12 chaînes rompues, 0 cron actif

---

## Légende priorités
| Niveau | Signification |
|--------|--------------|
| **P0** | Cassé fonctionnellement — le logiciel ne tient pas sa promesse de base |
| **P1** | Automatisation absente — action manuelle requise là où ça devrait être auto |
| **P2** | Complétude — handler prêt mais déclencheur manquant |
| **P3** | Polish — amélioration UX/DX sans impact fonctionnel critique |

---

## PARTIE 1 — Chaînes rompues (P0)

### 1.1 `order.placed` → KDS : le flow restaurant est inversé

**Problème**  
`posOrderSubmit` et `WaitlistManager` émettent `order.placed` à chaque prise de commande.  
`KDSOrderHandler` écoute `order.paid` — donc la cuisine reçoit la commande **à l'encaissement**, pas à la prise de commande. Délai réel en salle : 30 min à 2h.

**Impact rôles** : Serveur, Cuisinier, Chef cuisinier

**À faire**
- [ ] Modifier `KDSOrderHandler` : écouter `order.placed` (pas `order.paid`)
- [ ] Vérifier que `order.placed` transporte les items avec `course` (services 1/2/3)
- [ ] `order.paid` → garder uniquement pour déduction stock + NF525 + fidélité
- [ ] Créer `OrderPlacedKDSBridge` si séparation nécessaire (items cuisine ≠ items bar)
- [ ] Tester : commande → KDS reçoit immédiatement sans paiement

**Fichiers**
- `src/shared/eventBus/handlers/KDSOrderHandler.ts`
- `src/modules/ops/service/pos/hooks/posOrderSubmit.ts`

---

### 1.2 `notification.urgent` → WebPush : le dernier kilomètre est mort

**Problème**  
`notification.urgent` est émis ×17 (DLCBlocker, ResaAllergen, ShiftAutoAudit, HRClockInGuard, DishRebound, HRBreakCheck...). La route `/api/push/internal` existe et fonctionne. Le `WebPushService` est opérationnel. Mais **aucun handler n'écoute `notification.urgent`** pour router vers WebPush.

**Impact rôles** : Tous — chaque rôle rate ses alertes critiques

**À faire**
- [ ] Créer `NotificationUrgentDispatchHandler` :
  - Écoute `notification.urgent` (priority: CRITICAL)
  - Pour chaque rôle dans `payload.roles` : appel WebPush via `fetch('/api/push/internal', ...)`
  - Format title/body depuis le message
  - Dégradation gracieuse si pas de subscription (log uniquement)
- [ ] Créer `NotificationCreatedDispatchHandler` :
  - Écoute `notification.created`
  - Persiste dans `tenants/{id}/notifications/{id}` pour le centre de notifications UI
  - Badge count atom pour l'interface
- [ ] Enregistrer les deux dans `registerHandlers/ops.ts` ou nouveau `registerHandlers/notifications.ts`
- [ ] Tester : émettre `notification.urgent` → vérifier réception push

**Fichiers à créer**
- `src/shared/eventBus/handlers/NotificationUrgentDispatchHandler.ts`
- `src/shared/eventBus/handlers/NotificationCreatedHandler.ts`
- `src/shared/eventBus/registerHandlers/notifications.ts`

---

### 1.3 `order.cancelled` → stock non restitué, table non libérée

**Problème**  
`kitchenHooks` émet `order.cancelled` mais 0 handler. Annulation → stock non rendu, table reste "occupée", cuisine pas notifiée.

**Impact rôles** : Serveur, Stock, Cuisine

**À faire**
- [ ] `OrderCancelRestockHandler` écoute `order.cancelled` (fichier existe déjà !)
  - Vérifier qu'il est bien enregistré dans `registerHandlers/`
  - S'il n'est pas enregistré → l'ajouter dans `logistics-stock.ts`
- [ ] Ajouter dans le même handler : `table.released` → libération table auto
- [ ] Notification cuisine : "Commande X annulée — arrêter préparation"

**Fichiers**
- `src/shared/eventBus/handlers/OrderCancelRestockHandler.ts`
- `src/shared/eventBus/registerHandlers/logistics-stock.ts`

---

### 1.4 `finance.cash_counted` → 0 handler (caisse sans réconciliation)

**Problème**  
La route `/api/finance/cash-count` émet `finance.cash_counted` (typé dans catalog) mais aucun handler ne le traite. Pas de réconciliation auto, pas d'écart détecté, pas d'audit.

**Impact rôles** : Manager, Comptable

**À faire**
- [ ] Créer `CashCountReconciliationHandler` :
  - Écoute `finance.cash_counted`
  - Calcule `delta = actualAmount - expectedAmount`
  - Si `|delta| > seuil` (ex: 5 000 µ = 5€) → `anomaly.detected` + alerte manager
  - Persiste le résultat dans `tenants/{id}/cashCountLogs/{id}`
  - Audit `finance` + `empireAudit`
- [ ] Enregistrer dans `registerHandlers/finance.ts`

**Fichiers à créer**
- `src/shared/eventBus/handlers/CashCountReconciliationHandler.ts`

---

### 1.5 `hr.shift_started` → 0 handler (début de shift ignoré)

**Problème**  
4 adapters verticaux émettent `hr.shift_started` (Restaurant, Salon, Bakery, Retail) mais 0 handler. Pas de tracking début service, pas de vérification pointage, pas de calcul coût horaire débuté.

**Impact rôles** : RH, Manager, Directeur

**À faire**
- [ ] Créer `ShiftStartedHandler` :
  - Écoute `hr.shift_started`
  - Crée entrée dans `tenants/{id}/activeShifts/{shiftId}`
  - Vérifie que `employeeId` a un contrat actif (si non → alerte RH)
  - Calcule heure de fin prévue basée sur `role` et planning
  - Émet `hr.break_checked` si shift > 6h prévu (pré-check)
- [ ] Enregistrer dans `registerHandlers/human.ts`

**Fichiers à créer**
- `src/shared/eventBus/handlers/ShiftStartedHandler.ts`

---

### 1.6 `procurement.mismatch_detected` → food cost non recalculé

**Problème**  
`SupplierDeliveryReceivedHandler` détecte un écart prix livraison vs PO et émet `procurement.mismatch_detected`. Aucun handler ne recalcule le food cost ni n'alerte le comptable.

**Impact rôles** : Stock, Comptable

**À faire**
- [ ] Créer `ProcurementMismatchHandler` :
  - Écoute `procurement.mismatch_detected`
  - Met à jour `lastCostInMicrounits` du stock item avec le prix réel livraison
  - Émet `finance.food_cost_impacted` pour déclenchement recalcul
  - Alerte comptable si écart > seuil configurable
  - Audit `finance`
- [ ] Enregistrer dans `registerHandlers/logistics-supply.ts`

**Fichiers à créer**
- `src/shared/eventBus/handlers/ProcurementMismatchHandler.ts`

---

### 1.7 `finance.food_cost_impacted` → menu engineering non mis à jour

**Problème**  
`FoodCostRecomputer` émet `finance.food_cost_impacted` après recalcul, mais aucun handler ne réagit. Les marges BCG ne sont pas recalculées, les suggestions de prix ne sont pas mises à jour.

**Impact rôles** : Directeur, Comptable

**À faire**
- [ ] Créer `FoodCostImpactedHandler` :
  - Écoute `finance.food_cost_impacted`
  - Déclenche `intelligence.menu_engineering_requested` (BCG recalcul)
  - Si marge tombe sous seuil → `commerce.margin_warning`
- [ ] Enregistrer dans `registerHandlers/finance.ts`

**Fichiers à créer**
- `src/shared/eventBus/handlers/FoodCostImpactedHandler.ts`

---

### 1.8 `reservation.created/updated/cancelled` jamais émis depuis le module Résa

**Problème**  
`FloorPlanCapacityHandler` (×2) écoute ces 3 events mais le module Réservations écrit directement dans Nexus sans passer par le bus. Le plan de salle n'est jamais mis à jour en temps réel quand une réservation arrive.

**Impact rôles** : Chef de rang, Hôtesse, Manager

**À faire**
- [ ] Localiser où les réservations sont créées/modifiées dans le module commerce
- [ ] Ajouter `NexusEventBus.emitDurable('reservation.created', ...)` à la création
- [ ] Ajouter `NexusEventBus.emitDurable('reservation.updated', ...)` à la modification
- [ ] Ajouter `NexusEventBus.emitDurable('reservation.cancelled', ...)` à l'annulation
- [ ] Vérifier que `FloorPlanCapacityHandler` recalcule correctement la capacité

**Fichiers**
- Module réservations (à localiser dans `src/modules/commerce/relation/reservations/`)

---

### 1.9 `ops.order_notification` → serveurs non notifiés

**Problème**  
`StockDeductionHandler` émet `ops.order_notification` mais 0 handler. Les terminaux serveurs ne reçoivent pas de notification quand une nouvelle commande est prête à servir (plats en pass).

**Impact rôles** : Serveur, Chef de rang

**À faire**
- [ ] Créer `OrderNotificationHandler` :
  - Écoute `ops.order_notification`
  - WebPush vers rôles `chef_rang` + `serveur` du tenant
  - Message : "Table {tableId} — commande prête"
- [ ] Enregistrer dans `registerHandlers/notifications.ts` (nouveau fichier)

---

### 1.10 `crm.rfm_trigger` — pas de déclenchement auto après paiement

**Problème**  
`CustomerRFMAnalyzerHandler` existe et fonctionne. `crm.rfm_trigger` est émis manuellement à 4 endroits mais jamais automatiquement après `order.paid` (le moment logique).

**Impact rôles** : CRM, Manager commerce

**À faire**
- [ ] Dans `LoyaltyPointsAccrualHandler` (qui écoute `order.paid`) : après accrual, émettre `crm.rfm_trigger`
- [ ] Alternativement : créer un handler dédié `CRMTriggerOnPaymentHandler` qui écoute `order.paid` et émet `crm.rfm_trigger` si `customerId` présent

---

### 1.11 `finance.month_closed` → MonthlyFECExportHandler non vérifié

**Problème**  
`FECExportPage` émet `finance.month_closed`. `MonthlyFECExportHandler` existe mais vérifier qu'il est bien enregistré dans `registerHandlers/finance-nf525.ts`.

**À faire**
- [ ] Grep `registerHandlers/finance-nf525.ts` — vérifier import + appel `registerMonthlyFECExportHandler()`
- [ ] Si absent → l'ajouter

---

### 1.12 `haccp.nonconform` → action corrective non créée automatiquement

**Problème**  
`CoolingCycleHandler` et `HaccpCheckArchiverHandler` émettent `haccp.nonconform`. Aucun handler ne crée l'action corrective obligatoire dans le registre HACCP avec deadline légale.

**Impact rôles** : HACCP, Manager

**À faire**  
- [ ] Créer `HaccpCorrectiveActionHandler` :
  - Écoute `haccp.nonconform`
  - Crée `tenants/{id}/haccpCorrectiveActions/{checkId}` avec deadline
  - Notifie le responsable HACCP via `notification.urgent`
- [ ] Enregistrer dans `registerHandlers/compliance.ts`

---

## PARTIE 2 — Cron Scheduler (P0)

### 2.1 Créer le CronScheduler central

**Problème**  
4 jobs cron existent avec leurs schedules définis mais aucun scheduler ne les démarre. Tous les processus cron (DLC, IoT, quotes, analytics) sont morts.

**À faire**
- [ ] Créer `src/lib/cron/CronScheduler.ts` :
  ```typescript
  // Démarre tous les jobs pour tous les tenants actifs
  // Utiliser node-cron ou Vercel Cron selon l'infrastructure
  export const CronScheduler = {
    start(tenantIds: string[]) {
      DLCExpiryJob // 0 0 * * *
      QuoteReminderJob // 0 9 * * *
      IotOfflineMonitorJob // */15 * * * *
      ThemisCollectorJob // 0 8 * * *
      ZReportAutoJob // 59 23 * * * (NOUVEAU)
      BirthdayScanJob // 0 10 * * * (NOUVEAU)
      ContractExpiryJob // 0 7 * * 1 (NOUVEAU, lundi)
      DailyDigestJob // 0 23 * * * (NOUVEAU)
    }
  }
  ```
- [ ] Appeler `CronScheduler.start(tenantIds)` dans l'initialisation de l'app (NexusSyncService ou route d'init)
- [ ] Alternative Vercel Cron : créer `/api/cron/[job]/route.ts` pour chaque job

### 2.2 Créer `ZReportAutoJob`

**Problème**  
La clôture Z est 100% manuelle depuis `FinanceDashboard`. Aucun cron.

**À faire**
- [ ] Créer `src/lib/cron/ZReportAutoJob.ts` :
  - Schedule : `59 23 * * *` (23h59 chaque jour)
  - Pour chaque tenant actif : appeler `closeTicketZForDay(tenantId, today)`
  - Uniquement si le Z n'a pas déjà été clôturé manuellement (vérifier flag)
  - Émet `finance.ticket_z_closed` → déclenche ShiftAutoAuditHandler

### 2.3 Créer `BirthdayScanJob`

**Problème**  
`BirthdayOfferHandler` attend `crm.birthday_approaching` mais ce cron n'existe pas.

**À faire**
- [ ] Créer `src/lib/cron/BirthdayScanJob.ts` :
  - Schedule : `0 10 * * *` (10h chaque matin)
  - Scanner `tenants/{id}/crms/` pour les clients avec birthday dans J+7
  - Émettre `crm.birthday_approaching` pour chaque match

### 2.4 Créer `ContractExpiryJob`

**Problème**  
`ContractRenewalAlertHandler` et `MedicalVisitAlertHandler` attendent leurs events mais aucun cron ne scanne les contrats.

**À faire**
- [ ] Créer `src/lib/cron/ContractExpiryJob.ts` :
  - Schedule : `0 7 * * 1` (lundi 7h)
  - Scanner `tenants/{id}/users/` pour contrats expirant dans 30j
  - Émettre `hr.contract_expiring` pour chaque match
  - Scanner visites médicales expirées → `hr.medical_visit_expired`

### 2.5 Créer `DailyDigestJob`

**Problème**  
`finance.daily_audit` est émis mais 0 handler ne crée le rapport quotidien pour le directeur.

**À faire**
- [ ] Créer `src/lib/cron/DailyDigestJob.ts` :
  - Schedule : `0 23 * * *` (23h chaque soir)
  - Agréger : CA du jour, couverts, gaspillage, anomalies, top/flop produits
  - Émettre `finance.daily_audit` avec payload complet
- [ ] Créer `DailyDigestHandler` :
  - Écoute `finance.daily_audit`
  - Persiste le digest dans `tenants/{id}/dailyDigests/`
  - WebPush vers directeur + admin

### 2.6 Corriger `WeeklyReportHandler` — non enregistré

**Problème**  
`WeeklyReportHandler` écoute `ai.weekly_report_due` mais n'est pas importé dans `registerHandlers/intelligence.ts`.

**À faire**
- [ ] Ajouter dans `registerHandlers/intelligence.ts` :
  ```typescript
  import { WeeklyReportHandler } from '../handlers/WeeklyReportHandler';
  // Dans registerIntelligenceHandlers() :
  WeeklyReportHandler.register(),
  ```

---

## PARTIE 3 — Handlers ghosts : émetteurs manquants (P1)

### 3.1 `staff.clock_in/out` — format divergent API vs Timeclock

**Problème**  
`TimeclockDashboard` émet `staff.clock_in` (format correct).  
`/api/hr/clock-in` émet `hr.clock_in` (format API) → bridgé vers `staff.clock_in` via `PayrollTimeclockHandler`.  
`PayrollTimeclockHandler` écoute les deux mais vérifier que les deux paths aboutissent bien au même enregistrement `shiftEntries`.

**À faire**
- [ ] Tracer le chemin complet `TimeclockDashboard → staff.clock_in → PayrollTimeclockHandler → shiftEntries`
- [ ] Tracer `API /hr/clock-in → hr.clock_in → PayrollTimeclockHandler → staff.clock_in → shiftEntries`
- [ ] Écrire un test d'intégration qui vérifie les deux chemins

### 3.2 `hr.absence_declared` — jamais émis depuis le module RH

**Problème**  
`AbsenceUnderstaffingHandler` est prêt mais `hr.absence_declared` n'est jamais émis depuis le formulaire de déclaration d'absence.

**À faire**
- [ ] Localiser le composant de déclaration d'absence dans `src/modules/human/`
- [ ] Ajouter `NexusEventBus.emitDurable('hr.absence_declared', ...)` à la soumission
- [ ] `AbsenceUnderstaffingHandler` déclenche l'alerte sous-effectif automatiquement

### 3.3 `finance.period_locked` — jamais émis après clôture

**Problème**  
`PeriodLockGuardHandler` écoute `finance.period_locked` mais l'event n'est jamais émis automatiquement après une clôture de période.

**À faire**
- [ ] Après `MonthlyFECExportHandler` (clôture mois) : émettre `finance.period_locked`
- [ ] `PeriodLockGuardHandler` bloque automatiquement toute écriture sur la période

### 3.4 `tenant.subscription_expired` — jamais émis depuis billing

**Problème**  
`GracePeriodHandler` est prêt pour gérer la période de grâce mais l'event n'est jamais émis depuis le système de facturation.

**À faire**
- [ ] Créer `SubscriptionExpiryJob` (cron mensuel) ou webhook Stripe → émettre `tenant.subscription_expired`
- [ ] `GracePeriodHandler` active automatiquement la période de grâce et réduit les accès

### 3.5 `commerce.promotion_activated / expired` — promotions non automatiques

**Problème**  
`PromotionPriceHandler` et `PromotionExpiryHandler` sont prêts mais les promotions sont gérées manuellement.

**À faire**
- [ ] Ajouter dans la sauvegarde d'une promotion (module commerce) :
  - `NexusEventBus.emitDurable('commerce.promotion_activated', ...)` à l'activation
  - Créer `PromotionExpiryJob` : cron qui vérifie les promotions expirées → `commerce.promotion_expired`

### 3.6 `reservation.matched` — qui l'émet à l'accueil ?

**Problème**  
`ResaAllergenCheckHandler` attend `reservation.matched` (client accueilli) mais qui l'émet dans l'UI d'accueil ?

**À faire**
- [ ] Dans le composant accueil/check-in réservation : ajouter bouton "Accueillir le client"
- [ ] Ce bouton émet `reservation.matched` avec `allergens` depuis le profil client CRM
- [ ] `ResaAllergenCheckHandler` transmet automatiquement au KDS

### 3.7 `ai.query_received` — jamais émis depuis l'interface Oracle

**Problème**  
`OracleQueryAuditHandler` audite les requêtes IA mais `ai.query_received` n'est jamais émis depuis l'interface.

**À faire**
- [ ] Dans `GeminiLiveService` ou l'Oracle : émettre `ai.query_received` avant chaque requête LLM
- [ ] L'audit des requêtes Oracle sera automatique

---

## PARTIE 4 — Automatisations manquantes par rôle (P1/P2)

### 4.1 Serveur — auto-envoi ticket numérique client

**Problème**  
Après `order.paid`, le client ne reçoit pas automatiquement son ticket (email/SMS).

**À faire**
- [ ] Créer `DigitalReceiptHandler` :
  - Écoute `order.paid`
  - Si `customerId` → récupérer email depuis CRM
  - Générer PDF ticket (ou HTML) avec les lignes de commande
  - Émettre vers service email (EmailService)
  - Persister dans `tenants/{id}/digitalReceipts/{orderId}`
- [ ] Ajouter préférence tenant : "Envoyer ticket numérique auto" (toggle dans settings)

### 4.2 Serveur — kds.ticket_done → notification "plats prêts"

**Problème**  
`KDSReadyHandler` marque le ticket comme terminé mais le serveur n'est pas notifié automatiquement.

**À faire**
- [ ] Dans `KDSReadyHandler` (ou nouveau handler `KDSTicketDoneNotifier`) :
  - Écoute `kds.ticket_done`
  - WebPush vers `serveur` + `chef_rang` du tenant
  - Message : "Table {tableId} — plats prêts à envoyer"
  - Mettre à jour atom `tableReadyAtom` pour clignoter dans le plan de salle

### 4.3 Chef cuisinier — mise en place J-1 auto

**Problème**  
Aucune automatisation qui calcule les quantités à préparer la veille basées sur les réservations.

**À faire**
- [ ] Créer `MiseEnPlaceJob` (cron `0 16 * * *`, 16h chaque jour) :
  - Récupère réservations J+1
  - Pour chaque plat × couverts prévus × ratio historique : calcule quantité
  - Crée `tenants/{id}/miseEnPlaceTasks/{date}` avec les prep tasks
  - Émet `notification.created` pour le chef cuisinier
- [ ] Créer `MiseEnPlaceHandler` pour traitement

### 4.4 Manager — kds.rush_alert → notification push manager

**Problème**  
`KdsPrepDelayAlertHandler` émet `kds.rush_alert` mais personne ne le reçoit.

**À faire**
- [ ] Créer `KDSRushAlertNotifier` :
  - Écoute `kds.rush_alert`
  - WebPush vers `manager` + `chef_cuisinier`
  - Log dans `tenants/{id}/kdsAnomalies/`

### 4.5 Manager — rapport fin de service automatique

**Problème**  
`EndOfServiceActionHandler` écoute `store.shift_ended` mais se contente de mettre en pause les commandes et d'envoyer une notification "valider les pertes". Pas de résumé de service complet.

**À faire**
- [ ] Enrichir `EndOfServiceActionHandler` :
  - Agréger : nombre de commandes, CA estimé, couverts, plats retournés (dish.rebound)
  - Comparer avec service précédent (delta %)
  - Émettre `notification.created` avec résumé complet pour le manager
  - Déclencher `ZReportAutoJob.triggerFor(tenantId)` si pas encore fait

### 4.6 Comptable — auto-matching factures fournisseurs

**Problème**  
`SupplierInvoiceLedgerHandler` existe mais le matching PO ↔ facture n'est pas automatique.

**À faire**
- [ ] Dans `SupplierInvoiceLedgerHandler` : après enregistrement facture
  - Chercher le PO correspondant (même fournisseur, montant proche)
  - Si match → émettre `finance.reconciliation_completed`
  - Si écart > seuil → émettre `procurement.mismatch_detected`
  - Sinon → laisser en attente validation manuelle

### 4.7 Directeur — intelligence.bcg_calculated → action suggérée

**Problème**  
`MenuEngineeringHandler` calcule le BCG et émet `intelligence.bcg_calculated` mais aucun handler ne propose des actions concrètes sur les "Dogs" (plats peu populaires + mauvaise marge).

**À faire**
- [ ] Créer `BCGActionSuggestionHandler` :
  - Écoute `intelligence.bcg_calculated`
  - Pour chaque "Dog" : suggérer retrait ou reformulation
  - Pour chaque "Plowhorses" : suggérer augmentation prix ou réduction portion
  - Persiste suggestions dans `tenants/{id}/menuSuggestions/`
  - `notification.created` pour directeur avec résumé BCG

### 4.8 Stock — brouillon PO → envoi auto si non validé sous 24h

**Problème**  
`AutoSupplierDraftHandler` crée un brouillon commande fournisseur mais il reste `draft` indéfiniment.

**À faire**
- [ ] Créer `DraftPOEscalationJob` (cron `0 8 * * *`) :
  - Scanne les PO en `status: 'draft'` de plus de 24h
  - Si item critique (stock.zero) : escalade → `notification.urgent` manager
  - Si aucune action sous 48h : envoie automatiquement (configurable par tenant)

### 4.9 Stock — `stock.received` → recalcul food cost auto

**Problème**  
`StockReceptionHandler` enregistre la réception mais ne met pas à jour le `lastCostInMicrounits` avec le prix réel de livraison.

**À faire**
- [ ] Dans `StockReceptionHandler` : après enregistrement réception
  - Mettre à jour `lastCostInMicrounits` de chaque item reçu
  - Émettre `finance.food_cost_impacted` → cascade vers `FoodCostRecomputer`

### 4.10 RH — planification automatique basée sur réservations

**Problème**  
Aucun lien automatique entre le volume de réservations J+1 et les besoins en personnel.

**À faire**
- [ ] Créer `StaffingPlannerJob` (cron `0 17 * * *`, 17h chaque jour) :
  - Récupère réservations J+1
  - Calcule besoins en personnel par rôle (ratio couverts/serveur, couverts/cuisinier)
  - Compare avec planning existant
  - Si écart → `notification.urgent` pour manager avec suggestion
  - Déclenche `RainStaffingHandler` si sous-effectif prévu

---

## PARTIE 5 — Orphelins à connecter (P2)

### 5.1 `waste.logged` → rapport gaspillage quotidien

**À faire**
- [ ] Créer `WasteDailyAggregatorHandler` :
  - Écoute `waste.logged` (real-time)
  - Incrémente compteur journalier dans `tenants/{id}/wasteAggregates/{date}`
  - À minuit (via ZReportAutoJob) : snapshot final → rapport PDF gaspillage

### 5.2 `table.released` → notification hôtesse

**À faire**
- [ ] Dans `TableAutoReleaseHandler` (ou nouveau handler) : après `table.released`
  - WebPush vers `hotesse` + `chef_rang` : "Table {tableId} disponible"
  - Mettre à jour plan de salle atom en temps réel

### 5.3 `crm.points_earned` → notification client

**À faire**
- [ ] Créer `LoyaltyNotificationHandler` :
  - Écoute `crm.points_earned`
  - Email/SMS client : "Vous avez gagné X points — Total : Y"
  - Si seuil récompense atteint → `crm.reward_unlocked`

### 5.4 `haccp.alert` (température) → journal HACCP légal

**À faire**
- [ ] Dans `FridgeTempAlertHandler` (ou nouveau) : après `haccp.alert`
  - Persiste dans `tenants/{id}/haccpTemperatureLog/{id}` (registre légal immuable)
  - Si `severity: 'CRITICAL'` → WebPush responsable HACCP + action corrective auto

### 5.5 `store.rush_mode_toggled` → sync plateformes livraison

**À faire**
- [ ] Dans `RushModeIntegrationHandler` : vérifier qu'il écoute `store.rush_mode_toggled`
  - Si oui et si `isPaused: true` → appel API UberEats/Deliveroo pour suspendre
  - Si `isPaused: false` → réactiver

---

## PARTIE 6 — Corriger les handlers morts (P1)

### 6.1 `WeeklyReportHandler` — ajouter dans registerHandlers

- [ ] `src/shared/eventBus/registerHandlers/intelligence.ts` : ajouter `WeeklyReportHandler.register()`

### 6.2 `finance.payment_failed → FleetOutboxHandler` — vérifier l'émetteur

- [ ] `finance.payment_failed` n'est jamais émis → vérifier si c'est `payment.rejected` qui devrait déclencher `FleetOutboxHandler`
- [ ] Corriger le nom d'event ou ajouter l'émetteur depuis Stripe webhook

### 6.3 `PromotionPriceHandler / PromotionExpiryHandler` — ajouter émetteurs

- [ ] Voir 3.5 ci-dessus — ajouter dans sauvegarde promotion + cron expiry

---

## PARTIE 7 — Tests d'intégration bus (P2)

### 7.1 Tests de chaîne complets

**À faire**
- [ ] Test : `posOrderSubmit → order.placed → [KDSOrderHandler, StockReservation, NotifCuisine]`
- [ ] Test : `FinancialNexusBridge → order.paid → [StockDeduction, LoyaltyPoints, CRMTrigger, DigitalReceipt]`
- [ ] Test : `DLCExpiryJob → dlc.expired → [DLCExpiryHandler (stock), DLCBlockerHandler (POS)]`
- [ ] Test : `notification.urgent → NotifDispatchHandler → WebPush (mock)`
- [ ] Test : `finance.ticket_z_closed → ShiftAutoAuditHandler → hrAlerts`
- [ ] Test : `reservation.created → FloorPlanCapacityHandler → plan salle mis à jour`

### 7.2 Test de smoke bus

**À faire**
- [ ] Créer `src/__tests__/bus/bus-smoke.test.ts` :
  - Pour chaque event catalogué : vérifier qu'au moins 1 handler écoute
  - Pour chaque handler : vérifier qu'au moins 1 émetteur existe
  - Alerte CI si nouveau trou apparaît

> ⚠️ **Limite du smoke test statique** : il raisonne sur des **noms littéraux**. Un `emit(\`${x}\`)`
> dynamique, un handler enregistré via une forme inhabituelle, ou un handler **écrit mais jamais
> câblé dans `registerHandlers`** lui échappent. Il faut le **doubler** d'un garde-fou runtime
> (Partie 8). Détail du contre-audit et des faux positifs du scan : `PLAN_AUDIT_BUS_ORPHELINS.md`.

---

## PARTIE 8 — Garde-fou runtime : rendre l'invisible visible (P0 — à faire EN PREMIER)

> **Pourquoi P0 et en premier** : ce plan (et les audits de juillet) décrivent des trous depuis
> des mois ; ils restent car **rien ne les signale**. `NexusEventBus.emit()` fait
> `if (all.length === 0) return;` — émettre un event que personne n'écoute **ressemble à un
> succès** ; `emitDurable` marque même l'outbox `done` → **ça n'atteint jamais la DLQ**. Tant
> que ce filet n'existe pas, chaque fil recâblé peut se re-débrancher en silence au prochain
> refactor. Le garde-fou transforme « 94 orphelins invisibles » en « liste au boot » et
> **gèle définitivement le principe**. Faible risque, effet de levier maximal.

### 8.1 Instrumenter `emit()` sur le cas zéro-handler

**Fichier** : `src/orchestration/NexusEventBus.ts` (à la ligne `if (all.length === 0) return;`)

- [ ] En dev (`process.env.NODE_ENV !== 'production'`) : `logger.warn('[EventBus] émis sans handler: ' + event)`
- [ ] Liste blanche `KNOWN_UNCONSUMED` = **préfixes des verticales non ouvertes** (`auto. bakery.
  health. hotel. salon. retail.`) + Classe B assumée (`ops.service_ticket_*`, `crm.allergen_flagged`).
  Dérivée de la table préfixe→verticale (`gen-vertical-playbook.ts:69`). Ne warner que sur l'imprévu.
- [ ] Quand une verticale ouvre (playbook `✅ Prête`), retirer son préfixe → ses orphelins deviennent des erreurs.

### 8.2 Distinguer l'outbox `done` de `done_no_consumer`

**Fichier** : `src/orchestration/NexusEventBus.ts` (`emitDurable`)

- [ ] Faire remonter par `emit()` le nombre de handlers exécutés.
- [ ] Si 0 handler (et event hors liste blanche) → marquer l'outbox `done_no_consumer` au lieu de `done`.
- [ ] Rend l'anomalie **observable et auditable** (requête outbox), sans jamais polluer la DLQ.

### 8.3 Invariant de couverture (complète 7.2, dimension registration)

- [ ] Étendre `bus-smoke.test.ts` : « tout event émis avec `emitDurable` a ≥1 handler **enregistré
  dans `registerHandlers`** (pas seulement un fichier qui existe), SAUF liste blanche §8.1 ».
- [ ] Détecte les **handlers écrits-non-câblés** (Partie 6) que le smoke test actuel rate.

**Effort total Partie 8 : ~2h. Prérequis d'exécution de tout le reste du plan.**

---

## Récapitulatif priorisé

| Priorité | Item | Impact | Effort |
|----------|------|--------|--------|
| **P0 ★** | **8. Garde-fou runtime (warn 0-handler + outbox done_no_consumer + invariant registration)** | **STRUCTUREL — rend tout le reste visible, gèle le principe** | **2h** |
| **P0** | 1.1 order.placed → KDS (flow inversé) | CRITIQUE | 2h |
| **P0** | 1.2 notification.urgent → WebPush | CRITIQUE (tous rôles) | 3h |
| **P0** | 2.1 CronScheduler central | CRITIQUE (0 cron actif) | 4h |
| **P0** | 2.2 ZReportAutoJob | CRITIQUE | 2h |
| **P0** | 1.3 order.cancelled → restitution | HAUTE | 1h |
| **P0** | 1.4 cash_counted → réconciliation | HAUTE | 2h |
| **P0** | 1.8 reservation events depuis module | HAUTE | 3h |
| **P0** | 1.12 haccp.nonconform → corrective action | HAUTE (légal) | 2h |
| **P1** | 2.3 BirthdayScanJob | HAUTE (fidélité) | 1h |
| **P1** | 2.4 ContractExpiryJob | HAUTE (droit du travail) | 1h |
| **P1** | 2.6 WeeklyReportHandler enregistrement | HAUTE | 15min |
| **P1** | 3.2 hr.absence_declared émetteur | HAUTE | 1h |
| **P1** | 4.1 ticket numérique client | HAUTE (UX) | 3h |
| **P1** | 4.2 kds.ticket_done → serveur | HAUTE (ops) | 1h |
| **P1** | 4.7 BCGActionSuggestionHandler | MOYENNE | 2h |
| **P1** | 1.10 crm.rfm_trigger auto | MOYENNE | 30min |
| **P1** | 5.2 table.released → hôtesse | MOYENNE | 1h |
| **P1** | 4.9 stock.received → food cost | HAUTE | 1h |
| **P2** | 1.5 hr.shift_started handler | MOYENNE | 2h |
| **P2** | 1.6 procurement.mismatch handler | HAUTE | 2h |
| **P2** | 2.5 DailyDigestJob + Handler | HAUTE (directeur) | 3h |
| **P2** | 3.1 staff/hr clock-in tracer | HAUTE (paie) | 2h |
| **P2** | 3.5 promotions automatiques | MOYENNE | 2h |
| **P2** | 3.6 reservation.matched émetteur | HAUTE (allergènes) | 2h |
| **P2** | 4.3 MiseEnPlaceJob | HAUTE (cuisine) | 4h |
| **P2** | 4.5 rapport fin de service | MOYENNE | 2h |
| **P2** | 4.8 DraftPO escalation | MOYENNE | 2h |
| **P2** | 4.10 StaffingPlannerJob | MOYENNE | 4h |
| **P2** | 5.1 WasteDailyAggregator | MOYENNE | 2h |
| **P2** | 5.3 LoyaltyNotificationHandler | MOYENNE | 1h |
| **P2** | 5.4 haccp.alert → journal légal | HAUTE (légal) | 1h |
| **P3** | 7.1-7.2 Tests d'intégration bus | QA | 6h |
| **P3** | 3.7 ai.query_received émetteur | BASSE | 30min |
| **P3** | 3.4 subscription_expired | BASSE | 2h |

**Estimation totale : ~70h de développement**  
**P0 seul : ~20h — restaure la promesse de base**

---

## Architecture cible après remédiation

```
Commande POS
  └─ order.placed ──────────────────────────────────────────────┐
       ├─→ KDSOrderHandler (cuisine reçoit immédiatement) ✓     │
       ├─→ StockReservationHandler (pré-réservation) NEW        │
       └─→ NotifCuisineHandler (alerte cuisinier) NEW           │
                                                                 │
Client paie ───────────────────────────────────────────────────→┘
  └─ order.paid
       ├─→ StockDeductionHandler (BOM recette) ✓
       ├─→ LoyaltyPointsAccrualHandler ✓
       ├─→ OrderSealedNF525Handler ✓
       ├─→ CRMTriggerOnPaymentHandler (rfm_trigger) NEW
       └─→ DigitalReceiptHandler (email/SMS client) NEW

notification.urgent ──────────────────────────────────────────→ NotifUrgentDispatchHandler NEW
  └─→ /api/push/internal → WebPushService.sendToRole()

Cron 23:59 ─────────────────────────────────────────────────→ ZReportAutoJob NEW
  └─ finance.ticket_z_closed
       ├─→ TicketZHandler (archive Z) ✓
       ├─→ ShiftAutoAuditHandler (clock-out oubliés) ✓
       └─→ DailyDigestHandler (rapport directeur) NEW

Cron 10:00 ─────────────────────────────────────────────────→ BirthdayScanJob NEW
  └─ crm.birthday_approaching → BirthdayOfferHandler ✓

Cron 7:00 lundi ────────────────────────────────────────────→ ContractExpiryJob NEW
  ├─ hr.contract_expiring → ContractRenewalAlertHandler ✓
  └─ hr.medical_visit_expired → MedicalVisitAlertHandler ✓
```

---

*Généré le 2026-08-09 — Restaurant OS Core v2.1.0*  
*Spider Web Audit NexusEventBus — 142 events catalogue, 136 handlers, 34% connecté*
