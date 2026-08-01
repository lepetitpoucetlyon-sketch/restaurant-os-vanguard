# Plan de Build — 55 Promesses Manquantes

> **Contexte** : 135 promesses auditées. 80 ont du code. 55 n'ont pas de handler.  
> Ce document dit exactement quoi coder, dans quel ordre, et comment.

---

## Vue d'ensemble

| Vague | Priorité | Nb features | Impact si absent |
|-------|----------|-------------|-----------------|
| 0 | CRITIQUE — légal/sécurité | 3 | Risque légal immédiat |
| 1 | Opérations quotidiennes | 11 | L'app boite tous les jours |
| 2 | Fiscal & comptabilité | 6 | Reporting incomplet |
| 3 | Automatisations métier | 12 | Travail manuel en plus |
| 4 | CRM & engagement client | 8 | Manque à gagner |
| 5 | Résilience & secondaire | 15 | Confort & robustesse |

**Règle pour chaque feature** : une feature "phantom" (event inexistant) nécessite 3 étapes obligatoires :
1. Déclarer le type d'event dans `NexusEventBus` (typages)
2. Créer le handler dans `src/shared/eventBus/handlers/`
3. L'enregistrer dans `src/shared/eventBus/registerHandlers.ts`

Une feature non-phantom (event existe déjà) : juste étapes 2 et 3.

---

## VAGUE 0 — CRITIQUE (à coder avant tout le reste)

### P01-H — Remboursement → écriture extourne miroir

**Pourquoi critique** : sans ça, un remboursement ne génère aucune écriture comptable. NF525 exige une extourne pour toute annulation de vente.

**Event à créer** : `order.refunded`

**Fichier à créer** : `src/shared/eventBus/handlers/RefundExtourneHandler.ts`
```typescript
// Quand une commande est remboursée :
// 1. Lire le JournalEntry original de la commande
// 2. Créer un JournalEntry miroir avec tous les montants négatifs
// 3. Le sceller via FiscalSealer (chaîne NF525 continue)
// 4. Écrire dans journalEntries (JAMAIS update/delete l'original)
NexusEventBus.on('order.refunded', async (payload) => {
  const { orderId, tenantId, operatorId, reason } = payload;
  // Lire l'original
  const original = await Nexus.adapter.get(`tenants/${tenantId}/journalEntries/Z_${orderId}`);
  // Créer l'extourne
  await FinancialNexusBridge.processRefund({ original, operatorId, tenantId, reason });
});
```

**Collections Nexus touchées** : `journalEntries` (nouvelle entrée), `fiscalSeals` (nouveau sceau)

**⚠ Contrainte NF525** : ne JAMAIS modifier le JournalEntry original. Créer un nouveau document avec `type: 'EXTOURNE'`.

---

### P03-C — Quarantaine activée → produits bloqués POS + carte

**Pourquoi critique** : si un lot est en quarantaine HACCP et que le POS continue de le vendre, c'est un risque sanitaire grave.

**Event existant** : `inventory.quarantine_activated` (émis par QuarantineHandler — code OK)

**Fichier à créer** : `src/shared/eventBus/handlers/QuarantineBlockPOSHandler.ts`
```typescript
NexusEventBus.on('inventory.quarantine_activated', async (payload) => {
  const { productIds, tenantId } = payload;
  // Marquer chaque produit quarantainé comme non-disponible
  for (const productId of productIds) {
    await Nexus.adapter.update(`tenants/${tenantId}/products/${productId}`, {
      available: false,
      quarantinedAt: new Date().toISOString(),
      quarantineReason: payload.reason,
    });
  }
  // Émettre notification urgente managers
  await NexusEventBus.emit('notification.urgent', {
    tenantId,
    message: `⚠️ ${productIds.length} produit(s) mis en quarantaine HACCP`,
    roles: ['manager', 'chef_cuisinier'],
  });
});
```

**Collections Nexus touchées** : `products` (champ `available: false`)

---

### P03-I — Rappel produit → bloqué POS + notif urgente

**Pourquoi critique** : un rappel produit non bloqué au POS peut mener à vendre un produit dangereux.

**Event existant** : `recall.declared` (émis par RecallService — code OK)

**Fichier à créer** : `src/shared/eventBus/handlers/RecallBlockPOSHandler.ts`
```typescript
NexusEventBus.on('recall.declared', async (payload) => {
  const { affectedLotIds, productId, tenantId, urgency } = payload;
  // Bloquer le produit immédiatement
  await Nexus.adapter.update(`tenants/${tenantId}/products/${productId}`, {
    available: false,
    recalledAt: new Date().toISOString(),
  });
  // Notification urgente tous rôles
  await NexusEventBus.emit('notification.urgent', {
    tenantId,
    message: `🚨 RAPPEL PRODUIT — Retirer immédiatement du POS`,
    roles: ['manager', 'chef_cuisinier', 'serveur'],
    priority: 'CRITICAL',
  });
});
```

---

## VAGUE 1 — OPÉRATIONS QUOTIDIENNES (l'app boite sans ça)

### P01-D & P01-E — Paiements → lignes débit caisse

**Impact** : les paiements CB et espèces ne créent aucune ligne dans le journal de caisse. La trésorerie est aveugle.

**Event existant** : `order.paid`

**Fichier à créer** : `src/shared/eventBus/handlers/PaymentLedgerHandler.ts`
```typescript
NexusEventBus.on('order.paid', async (payload) => {
  const { orderId, tenantId, paymentMode, totalTTCInMicrounits } = payload;
  await Nexus.adapter.set(`tenants/${tenantId}/paymentLedger/${orderId}`, {
    mode: paymentMode, // 'card' | 'cash' | 'check'
    amountInMicrounits: totalTTCInMicrounits,
    recordedAt: new Date().toISOString(),
    orderId,
  });
});
```

**Collections Nexus à créer** : `paymentLedger` (nouvelle collection)

---

### P11-A à P11-I — KDS & Plan de salle temps réel (9 features)

**Impact** : le KDS ne reçoit pas les commandes. Le plan de salle ne se met pas à jour. Le restaurant fonctionne manuellement.

**P11-A** : Commande → KDS mis à jour
```typescript
// Dans registerHandlers : ajouter à l'handler order.paid existant
// Écrire dans tenants/{tenantId}/kdsOrders/{orderId}
```

**P11-B & P11-C** : Plat prêt → notification serveur + retrait KDS
```typescript
// Nouveau handler: KDSReadyHandler
// Event à créer: 'kds.item_ready'
// Écrire statut 'ready' dans kdsOrders, émettre push serveur
```

**P11-D & P11-E** : Table payée → statut "libre" + trace nettoyage
```typescript
// Ajouter à TicketZHandler existant :
await Nexus.adapter.update(`tenants/${tenantId}/tables/${tableId}`, {
  status: 'available',
  freedAt: new Date().toISOString(),
  cleaningRequired: true,
});
```

**P11-F** : Grands groupes → tâches préparation
```typescript
// Nouveau handler: GroupPrepTasksHandler
// Event à créer: 'reservation.large_group'
// Créer dans tenants/{tenantId}/prepTasks/
```

**P11-G** : Produit rupture → retiré KDS/POS
```typescript
// Ajouter à StockAlertHandler existant quand qty <= 0
// Update product.available = false
```

**P11-H** : Changement recette → KDS alerté
```typescript
// Nouveau handler: RecipeChangeKDSHandler
// Event à créer: 'recipe.updated'
// Invalider le cache KDS pour ce produit
```

**P11-I** : Conflits concurrents sur statut table
```typescript
// Utiliser Nexus.adapter.runTransaction() avec optimistic locking
// Rejeter si table.version !== expected
```

**Fichiers à créer** :
- `src/shared/eventBus/handlers/KDSOrderHandler.ts`
- `src/shared/eventBus/handlers/KDSReadyHandler.ts`
- `src/shared/eventBus/handlers/GroupPrepTasksHandler.ts`
- `src/shared/eventBus/handlers/RecipeChangeKDSHandler.ts`

**Collections Nexus** : `kdsOrders`, `prepTasks` (nouvelles), `tables` (champs status/cleaningRequired)

---

### P02-C — Stock = 0 → bloqué POS + carte en ligne

**Event à créer** : `stock.zero` (émis par StockDeductionHandler quand qty atteint 0)

**Fichier à créer** : `src/shared/eventBus/handlers/StockZeroBlockHandler.ts`
```typescript
NexusEventBus.on('stock.zero', async ({ productId, tenantId }) => {
  await Nexus.adapter.update(`tenants/${tenantId}/products/${productId}`, {
    available: false,
    stockZeroAt: new Date().toISOString(),
  });
});
```

**Modifier** : `StockDeductionHandler.ts` — ajouter l'émission de `stock.zero` quand `newQty <= 0`

---

## VAGUE 2 — FISCAL & COMPTABILITÉ

### P07-B — Match PCG heuristique

**Objectif** : lors d'un rapprochement bancaire, inférer automatiquement le compte PCG (classe 4, 6, 7) basé sur le libellé de la transaction.

**Fichier à créer** : `src/modules/finance/comptabilite/accounting/services/PCGMatcher.ts`
```typescript
// Règles simples d'abord (regex sur libellé) :
// "METRO" → 607 (Achats marchandises)
// "EDF" → 606 (Énergie)
// "LOYER" → 613 (Locations)
// "SALAIRES" → 641
// Fallback → demander comptable (laisser null)
```

**Intégrer dans** : `ReconciliationEngineHandler.ts` existant — appeler `PCGMatcher.infer(transaction.label)` et stocker le résultat.

---

### P07-C — Rapprochement validé → écriture lettrée

**Event à créer** : `reconcile.validated`

**Fichier à créer** : `src/shared/eventBus/handlers/LettrageHandler.ts`
```typescript
NexusEventBus.on('reconcile.validated', async ({ reconcileId, tenantId }) => {
  await Nexus.adapter.update(`tenants/${tenantId}/journalEntries/${reconcileId}`, {
    lettered: true,
    letteredAt: new Date().toISOString(),
  });
});
```

---

### P07-G — Facture fournisseur → PCG auto-inféré

**Intégrer dans** `StockReceptionHandler.ts` existant : après validation BL, appeler `PCGMatcher.infer()` sur le libellé fournisseur.

---

### P07-I — Facture impayée → relances J+30, J+60

**Event à créer** : `invoice.overdue`

**Fichier à créer** : `src/shared/eventBus/handlers/InvoiceReminderHandler.ts`
```typescript
// Logique : cron job hebdomadaire qui parcourt supplierInvoices
// où status !== 'paid' et dueDate < now()
// → émettre invoice.overdue avec daysOverdue
NexusEventBus.on('invoice.overdue', async ({ invoiceId, tenantId, daysOverdue }) => {
  if (daysOverdue >= 60) { /* alerte contentieux */ }
  else if (daysOverdue >= 30) { /* relance email */ }
});
```

---

### P10-A — Commande Uber Eats → flux fiscal NF525

**Problème** : les commandes agrégateurs entrent via webhook mais ne passent pas par `FinancialNexusBridge.processOrder()`.

**Modifier** : `src/app/api/connectors/delivery/webhook/[provider]/route.ts`
```typescript
// Après normalisation de la commande entrante :
await FinancialNexusBridge.processOrder({
  cartItems: normalizedItems,
  operatorId: 'aggregator_bot',
  tableId: null,
  tenantId,
  paymentMode: 'aggregator',
});
```

---

## VAGUE 3 — AUTOMATISATIONS MÉTIER

### P04-C — Durée shift → provision salaire

**Event à créer** : `shift.complete` (émis par PayrollTimeclockHandler après clock_out)

**Fichier à créer** : `src/shared/eventBus/handlers/SalaryProvisionHandler.ts`
```typescript
NexusEventBus.on('shift.complete', async ({ employeeId, durationMinutes, tenantId }) => {
  const hourlyRate = /* lire depuis employees */ 0;
  const provisionInMicrounits = Math.round((durationMinutes / 60) * hourlyRate * 1_000_000);
  await Nexus.adapter.update(`tenants/${tenantId}/employees/${employeeId}`, {
    currentMonthProvisionInMicrounits: Nexus.adapter.increment(provisionInMicrounits),
  });
});
```

---

### P04-D — Heures sup → alerte + mention bulletin

**Modifier** : `SalaryProvisionHandler.ts` — si `totalHoursThisMonth > 151.67`, émettre `overtime.threshold`.

**Fichier à créer** : `src/shared/eventBus/handlers/OvertimeAlertHandler.ts`

---

### P04-F — Pourboire → ligne paie employé

**Modifier** : `PaymentLedgerHandler` — si `payload.tip > 0`, écrire dans `employees/{id}/tipBalance`.

---

### P04-J — DSN → contrôle cohérence

**Fichier à créer** : `src/modules/human/remuneration/payroll/services/DSNValidator.ts`
- Vérifier que total salaires DSN = total provisions calculées ± 0.01€
- Si écart : bloquer l'envoi et alerter

---

### P05-D — Annulation tardive → pénalité

**Event à créer** : `resa.cancel.late`

**Fichier à créer** : `src/shared/eventBus/handlers/LateCancellationHandler.ts`
- Si annulation < 24h avant → charger la pénalité via Stripe (appeler BillingService)

---

### P05-F, P05-H, P05-I — Plan de salle état en temps réel

**Modifier** :
- `ReservationNotifierHandler.ts` : écrire `tables/{tableId}.status = 'reserved'` à la confirmation
- `TicketZHandler.ts` : écrire `tables/{tableId}.status = 'available'` après paiement
- Ajouter handler pour `table.seated` qui passe à `'occupied'`

---

### P05-K — Grand groupe → alerte gérant

**Modifier** : `ReservationNotifierHandler.ts` — si `covers > 8`, émettre `biggroup.confirmed`.

**Fichier à créer** : `src/shared/eventBus/handlers/BigGroupAlertHandler.ts`

---

### P02-J — Transfert stock inter-site

**Event à créer** : `stock.transfer`

**Fichier à créer** : `src/shared/eventBus/handlers/StockTransferHandler.ts`
- Déduire du site A, créditer le site B dans la même transaction Nexus

---

### P02-K — Inventaire physique → rapport de dérive

**Event à créer** : `inventory.physical`

**Fichier à créer** : `src/shared/eventBus/handlers/InventoryDriftReportHandler.ts`
- Comparer stock théorique (calculé depuis transactions) vs stock physique saisi
- Écrire le rapport dans `inventoryReports/{date}`

---

## VAGUE 4 — CRM & ENGAGEMENT CLIENT

### P05-B — Rappel J-1 client

**Fichier à créer** : `src/agents/cronos/jobs/ReservationReminderJob.ts`
- Cron quotidien 10h : parcourir réservations du lendemain → envoyer email/SMS via NotificationGateway

### P05-C — Tâches cuisine auto J-1

**Même cron** : créer `prepTasks` dans Nexus pour chaque réservation J+1

### P05-E — No-show → score CRM

**Modifier** : handler no-show existant → décrémenter `customers/{id}.crmScore` de 10 points

### P06-B — Badge VIP → notification caisse

**Modifier** : `CRMVipHandler.ts` — après attribution du tag VIP, émettre push vers caisse (rôle serveur)

### P06-E — Client inactif 90j → campagne réactivation

**Fichier à créer** : `src/agents/cronos/jobs/InactiveCustomerJob.ts`
- Cron hebdomadaire : customers où `lastVisit < now - 90j` → créer campagne "on vous manque"

### P06-F — Avis négatif → alerte gérant + draft IA

**Event à créer** : `review.negative`

**Fichier à créer** : `src/shared/eventBus/handlers/NegativeReviewHandler.ts`
- Alerte gérant + appel Gemini pour générer draft de réponse

### P06-G — Avis positif → réponse template

**Même fichier** : handler `review.positive` → template de réponse depuis tenant settings

### P06-I — Taux ouverture campagne

**Modifier** : webhook Resend (déjà présent) → écrire `campaigns/{id}.openRate` à chaque event `email.opened`

---

## VAGUE 5 — RÉSILIENCE & SECONDAIRE

### P01-F — Paiement split → N lignes

**Modifier** : `PaymentLedgerHandler` — si `payload.splits` est un array, créer une ligne par mode de paiement

### P01-G — Plat offert (comp) → catégorie "offerts"

**Event à créer** : `order.comp`

**Fichier à créer** : `src/shared/eventBus/handlers/CompMealHandler.ts`
- Écrire dans `journalEntries` avec `category: 'offerts'`, `amountInMicrounits: 0` (valeur marchande en note)

### P01-M — Pourboire → ligne paie (déjà partiellement couvert par P04-F)

### P03-D — Capteur offline → alerte

**Modifier** : webhook IoT existant → si aucun signal depuis `iot_timeout_minutes` → émettre `iot.offline`

### P03-J — Surplus fin service → don association

**Event à créer** : `service.end`

**Fichier à créer** : `src/shared/eventBus/handlers/FoodDonationHandler.ts`

### P03-L — DLC dépassée → alerte + déduction stock

**Fichier à créer** : `src/agents/cronos/jobs/DLCExpiryJob.ts`
- Cron quotidien minuit : parcourir `stockItems` avec `expiryDate < today` → émettre `dlc.expired`

### P04-I — Push paie échoué → retry

**Modifier** : `SilaeExportHandler.ts` — wrapper try/catch avec retry queue dans `outbox`

### P07-H — Devis → relance J+7

**Fichier à créer** : `src/agents/cronos/jobs/QuoteReminderJob.ts`

### P08-C — Indexation LightRAG échouée → retry

**Modifier** : `LightRAGClient.ts` — le retry est déjà intégré (docs disent "retry intégré") — vérifier et ajouter alerte si retry épuisé

### P08-E — Rapport Resend KO → fallback

**Modifier** : `ThemisCollectorJob.ts` — catch Resend error → fallback NotificationGateway interne

### P08-G — Circuit breaker → dégradé gracieux

**Modifier** : `ResilienceSlayer.ts` existant — quand OPEN → retourner réponse dégradée au lieu de crash

### P08-J — LLM timeout → fallback modèle secondaire

**Modifier** : `AgentEngine.ts` — timeout 30s → basculer vers modèle plus léger (gemini-flash)

### P10-D — Avis Google/TripAdvisor → CRM

**Modifier** : `ReviewProviderFactory.ts` existant — émettre `review.negative` ou `review.positive` après normalisation

### P10-I — IoT capteur offline → alerte

**Voir P03-D** — même implémentation

### P02-E — BL signé → lien BC + écart

**Modifier** : `StockReceptionHandler.ts` — après réception, chercher BC correspondant dans `purchaseOrders` et calculer écart

### P06-H — Concurrent détecté (zone)

**Complexité élevée** — nécessite une source externe (Google Places API ou scraping) — reporter après V2

---

## Ordre de démarrage recommandé

```
Semaine 1 : Vague 0 (P01-H, P03-C, P03-I) — 3 handlers
Semaine 2 : Vague 1 KDS (P11-A à P11-I) — 4 nouveaux fichiers
Semaine 2 : Vague 1 Paiements (P01-D, P01-E, P02-C) — 2 fichiers
Semaine 3 : Vague 2 Fiscal (P07-B, P07-C, P07-G, P07-I, P10-A) — modifications + 2 fichiers
Semaine 4 : Vague 3 RH + Réservations (P04-C à P04-J, P05-D à P05-K) — 6 fichiers
Semaine 5-6 : Vague 4 CRM — 5 fichiers
Semaine 7+ : Vague 5 Résilience — au fil des features
```

**Après chaque vague** : lancer `npx vitest run` + vérifier `npx madge --circular` + tester la feature dans l'app.
