# Plan de traitement — 50 Promesses Partielles + 7 Blind Spots partiels

> Audit v3 post V1-V10 · 2026-07-31  
> Les 53 R sont résolues. Ce plan couvre les 50 P + 7 BS-P restants.

---

## Résumé

| Groupe | Titre | Count | Effort |
|---|---|---|---|
| G1 | Gaps handlers existants | 9 P | XS–S |
| G2 | API REST → migrer vers bus | 7 P | S–M |
| G3 | RH avancé | 7 P | M |
| G4 | Finance avancée | 5 P | M–L |
| G5 | IA & Oracle avancés | 5 P | L |
| G6 | CRM & Réservations avancées | 6 P | M |
| G7 | MCC Fleet & SaaS | 9 P | L–XL |
| G8 | Connecteurs avancés | 3 P | M |
| **G9** | **Blind Spots partiels** | **7 BS-P** | **S–M** |

---

## G1 — Gaps dans handlers existants `effort XS–S` `priorité HAUTE`

Ces handlers existent et sont registrés mais il manque une pièce précise. Corrections rapides.

| ID | Description | Ce qui manque | Fichier cible |
|---|---|---|---|
| P10-B | Commande livreur → stock déduit | `items:[]` hardcodé dans ACL → mapper `rawPayload.items` vers `CartItem[]` | `AntiCorruptionLayerHandler.ts` |
| P01-I | Annulation → restitution stock (avoir absent) | `StockRestitutionHandler` restitue le stock mais ne crée pas l'avoir comptable | `StockRestitutionHandler.ts` + `FinancialNexusBridge` |
| P01-J | Vente offline → outbox → re-scellement NF525 | `emitDurable` + `busOutbox` OK, mais le re-scellement NF525 côté serveur sur replay n'est pas implémenté | `NexusSyncService.replayPendingEvents()` |
| P01-L | Mode formation / exo TVA → signature placeholder | Signature placeholder présente mais taux TVA 0% sur produits exonérés absent | `FiscalSealer.ts` + config TVA |
| P08-F | Anomalie détectée → signal z-score → alerte manager | Le z-score est calculé mais l'émission de l'event `anomaly.detected` est manquante | `IntelligenceHandler.ts` |
| P08-H | Clôture caisse → prévision J+1 | TicketZ scellé NF525 OK, mais la prévision de CA J+1 via l'Oracle n'est pas déclenchée | `TicketZHandler.ts` (ajouter emit post-seal) |
| P09-K | Route admin sans RBAC → alerte ArchitecturalHealth | L'alerte existe partiellement — les routes sans garde RBAC ne sont pas toutes couvertes | `adminAuthGuard.ts` + scan statique |
| P10-F | Webhook réservation → idempotent (doublon ignoré) | Le dedup existe mais n'est pas systématique sur toutes les sources | `delivery/webhook/[provider]/route.ts` |
| P10-H | Sync bancaire → chaque transaction importée une seule fois | Dedup via API mais non vérifié si `BankSyncAuditHandler` vérifie l'existence avant écriture | `BankSyncAuditHandler.ts` (ajouter check idempotent) |

### Fix P10-B (le plus urgent — seul R restant)

```typescript
// AntiCorruptionLayerHandler.ts
items: rawPayload.items?.map((i: any) => ({
  productId: i.external_data?.plu ?? i.id,
  name: i.title ?? i.name,
  quantity: i.quantity,
  unitPriceInMicrounits: (i.price_cents ?? 0) * 10_000,
  notes: i.special_instructions ?? '',
})) ?? [],
```

---

## G2 — API REST → migrer vers bus `effort S–M` `priorité MOYENNE`

Ces features existent via des appels REST directs ou des modules isolés. Il faut les faire émettre des events NexusEventBus pour les intégrer dans la chaîne asynchrone.

| ID | Description | Situation actuelle | Action requise |
|---|---|---|---|
| P03-E | Contrôle HACCP manuel → horodatage + archivage | `haccpLog` via API REST uniquement | Émettre `haccp.check.saved` depuis l'API HACCP + créer handler d'archivage |
| P03-F | Non-conformité → action corrective + délai | `actionLog` via API REST | Émettre `haccp.nonconform` + `NonConformActionHandler` |
| P03-G | Formation hygiène expirée → alerte conformité RH | `hrAlerts` via API | Émettre `hr.training_expired` + `TrainingComplianceAlertHandler` |
| P03-H | Rappel produit → lots spécifiques quarantinés | `quarantine via API (pas bus)` | `RecallPOSBlockerHandler` existe mais l'API de rappel ne l'émet pas encore — câbler l'API |
| P03-K | Calendrier conformité → alertes J-7, J-1 | `calAlerts via cron` | Cron émet `compliance.deadline_approaching` + `ComplianceDeadlineHandler` |
| P09-F | PIN incorrect ×5 → kiosque verrouillé 30s | `rate-limit via API (non-bus)` | Émettre `security.pin_locked` + handler pour log + notif manager |
| P09-H | Rate limit PIN survit rechargement page (Nexus) | `Nexus persist (à confirmer)` | Vérifier que `Nexus.adapter.set` persiste bien entre reloads — ajouter test |

### Nouveaux events à ajouter dans `NexusEventBus.ts`

```typescript
'haccp.check.saved': { v:1; tenantId:string; checkId:string; operatorId:string; timestamp:number }
'haccp.nonconform': { v:1; tenantId:string; checkId:string; correctionDeadline:number }
'hr.training_expired': { v:1; tenantId:string; employeeId:string; trainingType:string }
'compliance.deadline_approaching': { v:1; tenantId:string; type:string; daysLeft:number }
'security.pin_locked': { v:1; tenantId:string; terminalId:string; lockedUntil:number }
```

---

## G3 — RH avancé `effort M` `priorité MOYENNE`

Le bus RH existe (V7) mais plusieurs cas métier ne sont pas encore câblés.

| ID | Description | Situation actuelle | Action requise |
|---|---|---|---|
| P04-E | Absence maladie → alerte sous-effectif planning | `hr.transfer_offer` couvre le staffing d'urgence, pas l'absence déclarée | Émettre `hr.absence_declared` + `AbsenceUnderstaffingHandler` |
| P04-G | Clôture mois → pré-paie auto-calculée | `prePay via API (payroll.submitted = event sans calcul auto)` | `PayrollComplianceHandler` reçoit `hr.payroll_exported` mais le calcul de pré-paie doit être déclenché avant — ajouter étape calcul |
| P04-H | Pré-paie validée → push Silae/Merge.dev | `silaeExport via API uniquement` | Émettre `hr.preroll_validated` + `SilaeExportHandler` |
| P04-K | Contrat expiré → alerte renouvellement J-30 | `hrAlerts via cron` | Cron émet `hr.contract_expiring` + `ContractRenewalAlertHandler` |
| P04-L | Visite médicale expirée → alerte + blocage tâches | `hrAlerts via API` | Émettre `hr.medical_visit_expired` + `MedicalVisitAlertHandler` |
| P04-M | Planning créé → notification équipe | `ScheduleNotifierHandler` registré — vérifier que l'API planning émet bien `hr.schedule_published` | Câbler l'API de publication planning pour émettre l'event |
| P04-N | Candidature reçue → assignée au bon recruteur | `recruiterQueue via API` | Émettre `hr.application_received` + `RecruitmentRouterHandler` |

### Nouveaux events

```typescript
'hr.absence_declared': { v:1; tenantId:string; employeeId:string; startDate:string; expectedReturn:string }
'hr.preroll_validated': { v:1; tenantId:string; period:string; validatedBy:string; totalGrossInMicrounits:number }
'hr.contract_expiring': { v:1; tenantId:string; employeeId:string; expiresAt:number; daysLeft:number }
'hr.medical_visit_expired': { v:1; tenantId:string; employeeId:string; expiredAt:number }
'hr.application_received': { v:1; tenantId:string; applicationId:string; role:string; candidateName:string }
```

---

## G4 — Finance avancée `effort M–L` `priorité MOYENNE`

Les fondations V8 sont posées. Ce groupe complète le cycle comptable complet.

| ID | Description | Situation actuelle | Action requise |
|---|---|---|---|
| P07-A | Transaction bancaire → rapprochement proposé | `reconciliation via API` — `BankSyncAuditHandler` écrit la transaction mais ne propose pas de match | Ajouter logique de matching heuristique dans `ReconciliationEngineHandler` |
| P07-D | Solde bancaire temps réel → dashboard financier | `dashFinance via API` | L'event `finance.bank_transaction_synced` existe — connecter au dashboard MCC en temps réel |
| P07-F | Clôture période → plus aucune écriture possible | `periodLocked via API` | Émettre `finance.period_locked` + `PeriodLockGuardHandler` (refuse toute écriture post-clôture) |
| P07-J | Stripe renewal → écriture comptable auto | `journalEntries via billing webhook` | Webhook Stripe émet `finance.invoice_approved` → `SupplierInvoiceLedgerHandler` prend le relais |
| P07-K | Paiement Stripe échoué → retry + mail client | `retryQueue via webhook` | Émettre `finance.payment_failed` + `StripePaymentRetryHandler` |

### Nouveaux events

```typescript
'finance.period_locked': { v:1; tenantId:string; periodEnd:number; lockedBy:string }
'finance.payment_failed': { v:1; tenantId:string; invoiceId:string; attemptNumber:number; nextRetryAt:number }
```

---

## G5 — IA & Oracle avancés `effort L` `priorité BASSE`

Les modules IA existent (Oracle, LightRAG) mais certains cas d'usage ne sont pas connectés au bus.

| ID | Description | Situation actuelle | Action requise |
|---|---|---|---|
| P08-A | Oracle RAG → réponse contextualisée aux questions | `RAG via API oracle` — fonctionne mais hors-bus | Émettre `ai.query_received` pour tracer l'usage et le contexte |
| P08-B | Nouveau document → indexation LightRAG auto | `ragIndex via API` — manuel uniquement | Émettre `ai.document_uploaded` + `AutoIndexationHandler` |
| P08-D | Cron lundi 8h → rapport hebdo → Resend | `emailSent via cron` — hors-bus | Cron émet `ai.weekly_report_due` + `WeeklyReportHandler` (déjà partiellement dans `ReportFallbackHandler`) |
| P08-I | Strategy Oracle MCC → briefing flotte généré | `stratBriefing via API oracle` | Émettre `ai.fleet_brief_requested` + handler dédié pour MCC |
| P08-K | Simulation scénario → résultats sans écriture prod | `simResults via API` | Isolation OK en API — ajouter flag `simulation:true` sur les events pour que les handlers ignorent |

---

## G6 — CRM & Réservations avancées `effort M` `priorité MOYENNE`

| ID | Description | Situation actuelle | Action requise |
|---|---|---|---|
| P05-A | Réservation → confirmation email/SMS | Event `reservation.confirmed` existe, `ReservationNotifierHandler` registré — vérifier que l'API de création de réservation émet bien l'event | Câbler l'API `/api/reservations` pour émettre `reservation.confirmed` |
| P05-G | Réservation LaFourchette → flux interne | `resaDB via connector` — pas encore intégré au bus | `AntiCorruptionLayerHandler` n'intercepte que UberEats/Deliveroo — étendre à LaFourchette |
| P05-J | Capacité max → réservation en ligne bloquée | `blockOnline via API` — `FloorPlanCapacityHandler` gère la jauge mais ne bloque pas le formulaire en ligne | Exposer l'état de capacité via une route dédiée pour le widget de réservation |
| P06-D | Anniversaire client J-3 → email offre auto | `emailSent via cron` — hors-bus | Cron émet `crm.birthday_approaching` + `BirthdayOfferHandler` |
| P06-J | Promotion activée → prix réduit POS + carte | `posPrice via API` — changement de prix non broadcasté | Émettre `commerce.promotion_activated` + `PromotionPriceHandler` (sync POS + carte en ligne) |
| P06-K | Promotion expirée → retour prix normal auto | `posPrice via API` | Émettre `commerce.promotion_expired` + `PromotionExpiryHandler` |

### Nouveaux events

```typescript
'crm.birthday_approaching': { v:1; tenantId:string; customerId:string; birthdayAt:string; daysUntil:number }
'commerce.promotion_activated': { v:1; tenantId:string; promotionId:string; discountBps:number; productIds:string[] }
'commerce.promotion_expired': { v:1; tenantId:string; promotionId:string }
```

---

## G7 — MCC Fleet & SaaS `effort L–XL` `priorité BASSE`

Fonctionnalités de la plateforme SaaS multi-tenant (gestion de flotte, MDM, billing).

| ID | Description | Situation actuelle | Action requise |
|---|---|---|---|
| P12-C | Onboarding step complété → étape suivante débloquée | `nextStep via API` | Émettre `tenant.onboarding_step_completed` + `OnboardingProgressHandler` |
| P12-D | Stripe activé → fonctionnalités déverrouillées | `features via billing webhook` | Webhook Stripe émet event interne → `FeatureUnlockHandler` |
| P12-E | Abonnement expiré → accès progressivement restreint | `gracePeriod` — implémentation partielle | Émettre `tenant.subscription_expired` + `GracePeriodHandler` (J+0: warning, J+7: read-only, J+14: locked) |
| P12-F | Score santé tenant < seuil → ticket support MCC | `ticketQueue via API` | Intégrer le score de santé (`NexusSyncService.healthScore`) au bus — émettre si < seuil |
| P12-G | Ticket support → analyse IA → draft réponse < 5min | `draftResponse (SSR, non client bus)` | `SupportTicketAnalysisHandler` registré — vérifier que le SSR émet bien l'event au bus client |
| P12-H | MDM Mosyle → tablette provisionnée → app déployée | `tabletProvisioned via fleet API` | Webhook Mosyle → émettre `fleet.device_provisioned` + `MDMProvisionHandler` |
| P12-I | MDM → tablette perdue → wipe distant MCC | `wipeTriggered via fleet API` | Webhook Mosyle → émettre `fleet.device_wipe_requested` + `MDMWipeHandler` |
| P12-J | Upgrade plan → nouvelles features disponibles | `features via billing` | Même pattern que P12-D — partager le `FeatureUnlockHandler` |
| P12-K | Fleet report hebdo → agrégat tous tenants → MCC | `mccDashboard via cron API` | Cron émet `fleet.weekly_report_due` + handler agrégateur MCC |

### Nouveaux events

```typescript
'tenant.onboarding_step_completed': { v:1; tenantId:string; step:string; completedBy:string }
'tenant.subscription_expired': { v:1; tenantId:string; expiredAt:number; gracePeriodEndsAt:number }
'fleet.device_provisioned': { v:1; tenantId:string; deviceId:string; platform:'ios'|'android' }
'fleet.device_wipe_requested': { v:1; tenantId:string; deviceId:string; requestedBy:string }
'fleet.weekly_report_due': { v:1; generatedAt:number }
```

---

## G8 — Connecteurs avancés `effort M` `priorité MOYENNE`

| ID | Description | Situation actuelle | Action requise |
|---|---|---|---|
| P05-G / P10-C | Réservation LaFourchette → flux interne | `resaDB via connector` — connector existe mais hors-bus | Webhook LaFourchette → émettre `reservation.confirmed` avec `channel:'lafourchette'` → mêmes handlers |
| P10-G | Connexion bancaire expirée → alerte re-connexion | `alertQueue via webhook` | Webhook Plaid/Bridge → émettre `finance.bank_connection_expired` + alert handler MCC |
| P09-C | Lockdown souverain → push notification gérant < 5s | `browser notif (≠ push native)` — la notif existe mais c'est du `Notification API` browser, pas du Web Push | Intégrer Web Push (VAPID) pour notifications hors-fenêtre + `SovereignBreachHandler` émet déjà, ajouter push subscription |

---

## Récapitulatif des actions transversales

### Events à créer (tous groupes confondus)

```
haccp.check.saved · haccp.nonconform · hr.training_expired
compliance.deadline_approaching · security.pin_locked
hr.absence_declared · hr.preroll_validated · hr.contract_expiring
hr.medical_visit_expired · hr.application_received
finance.period_locked · finance.payment_failed
ai.document_uploaded · ai.weekly_report_due · ai.fleet_brief_requested
crm.birthday_approaching · commerce.promotion_activated · commerce.promotion_expired
tenant.onboarding_step_completed · tenant.subscription_expired
fleet.device_provisioned · fleet.device_wipe_requested · fleet.weekly_report_due
finance.bank_connection_expired
```

**Total nouveaux events : ~24**

### Handlers à créer

```
NonConformActionHandler · TrainingComplianceAlertHandler · ComplianceDeadlineHandler
AbsenceUnderstaffingHandler · SilaeExportHandler · ContractRenewalAlertHandler
MedicalVisitAlertHandler · RecruitmentRouterHandler · PeriodLockGuardHandler
StripePaymentRetryHandler · AutoIndexationHandler · WeeklyReportHandler
BirthdayOfferHandler · PromotionPriceHandler · PromotionExpiryHandler
OnboardingProgressHandler · FeatureUnlockHandler · GracePeriodHandler
MDMProvisionHandler · MDMWipeHandler
```

**Total nouveaux handlers : ~20**

---

## G9 — Blind Spots partiels `effort S–M` `priorité HAUTE`

Ces 7 Blind Spots avaient été identifiés comme absents de l'audit initial. Certains sont partiellement couverts par V1-V10 mais pas entièrement.

| ID | Description | Situation actuelle | Action requise |
|---|---|---|---|
| BS-08 | Formation HACCP expirée → blocage accès cuisine ou alerte | Alert via API (P03-G couvre la notif RH, pas le blocage opérationnel) | Ajouter gate dans `KDSRoutingHandler` : si formation expirée → ticket bloqué + alerte HACCP |
| BS-09 | Visite médicale expirée → alerte conformité RH | Alert via API (P04-L couvre l'alerte, pas le blocage de tâches) | `MedicalVisitAlertHandler` doit aussi bloquer le pointage si visite expirée depuis > 30j |
| BS-15 | Abonnement MCC expiré → accès tenant restreint progressivement | `gracePeriod` partiel (P12-E) | `GracePeriodHandler` doit couvrir les 3 phases : warning J+0, read-only J+7, locked J+14 |
| BS-17 | Terminal hors-ligne → queue offline + sync à reconnexion | `busOutbox` (emitDurable) OK mais sync non confirmée | Vérifier que `NexusSyncService.replayPendingEvents()` est appelé au retour réseau — ajouter listener `online` event |
| BS-18 | Salarié absent (maladie) → alerte sous-effectif planning | `hr.transfer_offer` pour staffing d'urgence (P04-E couvre la déclaration d'absence) | `AbsenceUnderstaffingHandler` doit croiser l'absence avec le planning du jour et émettre alerte si couverture insuffisante |
| BS-20 | Produit rappelé fournisseur → tous stocks du lot concernés | `RecallPOSBlockerHandler` bloque le produit mais par productId uniquement | Étendre pour bloquer par `batchNumber` — un rappel vise un lot, pas tous les stocks du produit |
| BS-28 | Commande offline → outbox → re-scellement NF525 côté serveur | `emitDurable` OK côté client, mais le re-scellement via `FiscalSealer` sur le serveur au moment du replay n'est pas confirmé | Dans `replayPendingEvents()` : pour chaque event `order.paid` replayed, vérifier si un sceau serveur NF525 existe — si non, déclencher `FiscalSealer.sealDataAtomically()` |

### Détail BS-20 — rappel par lot vs rappel par produit

```typescript
// RecallPOSBlockerHandler.ts — extension requise
// Actuellement : payload.productIds → flagUnavailable par productId
// À ajouter : payload.batchNumbers → query stock par batchNumber → flagUnavailable

const affectedBatches = await db.stockEntries
  .where('batchNumber').anyOf(payload.batchNumbers)
  .toArray();

for (const batch of affectedBatches) {
  await ProductAvailabilityService.flagUnavailable(
    tenantId, batch.productId, `Rappel lot ${batch.batchNumber}`
  );
}
```

### Détail BS-17 — listener réseau pour replay

```typescript
// NexusSyncService.ts — à ajouter dans init()
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    logger.info('[NexusSync] Réseau restauré — replay de la busOutbox');
    this.replayPendingEvents();
  });
}
```

### Détail BS-28 — NF525 re-seal sur replay

```typescript
// replayPendingEvents() — ajout dans la boucle de replay
if (event.name === 'order.paid') {
  const existingSeal = await db.ticketZSeals.get(event.payload.orderId);
  if (!existingSeal) {
    await FiscalSealer.sealDataAtomically(event.payload.tenantId, event.payload.orderId);
  }
}
```

---

## Récapitulatif des actions transversales

### Events à créer (tous groupes confondus)

```
haccp.check.saved · haccp.nonconform · hr.training_expired
compliance.deadline_approaching · security.pin_locked
hr.absence_declared · hr.preroll_validated · hr.contract_expiring
hr.medical_visit_expired · hr.application_received
finance.period_locked · finance.payment_failed
ai.document_uploaded · ai.weekly_report_due · ai.fleet_brief_requested
crm.birthday_approaching · commerce.promotion_activated · commerce.promotion_expired
tenant.onboarding_step_completed · tenant.subscription_expired
fleet.device_provisioned · fleet.device_wipe_requested · fleet.weekly_report_due
finance.bank_connection_expired
```

**Total nouveaux events : ~24**

### Handlers à créer

```
NonConformActionHandler · TrainingComplianceAlertHandler · ComplianceDeadlineHandler
AbsenceUnderstaffingHandler · SilaeExportHandler · ContractRenewalAlertHandler
MedicalVisitAlertHandler · RecruitmentRouterHandler · PeriodLockGuardHandler
StripePaymentRetryHandler · AutoIndexationHandler · WeeklyReportHandler
BirthdayOfferHandler · PromotionPriceHandler · PromotionExpiryHandler
OnboardingProgressHandler · FeatureUnlockHandler · GracePeriodHandler
MDMProvisionHandler · MDMWipeHandler
```

**Total nouveaux handlers : ~20**

---

*Plan généré post-vérification V1-V10 · audit-promesses v3 mis à jour.*
