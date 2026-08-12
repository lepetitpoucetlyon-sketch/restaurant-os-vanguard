# AUDIT DE LA PROMESSE PLATEFORME — RESTAURANT OS
**Date** : 31 Juillet 2026
**Cible** : `src/` (EventBus, API, Handlers, Finance, Stocks)

---

## 1. MATRICE DE CONFORMITÉ DES ÉVÉNEMENTS

| Événement | Source d'émission | Handler(s) | Statut de la Promesse | Faille Identifiée |
| :--- | :--- | :--- | :--- | :--- |
| `order.paid` | `FinancialNexusBridge.ts`, `MarketplaceSyncService.ts` | `TicketZHandler`, `StockDeductionHandler`, `IntelligenceHandler` | 🔴 ROMPUE (RBAC manquant) | Les handlers font confiance au `payload.tenantId` sans validation. |
| `order.placed` | `MarketplaceSyncService.ts`, `WaitlistManager.ts`, `usePos.ts` | (Divers) | 🟡 FRAGILE | Dépendance aux webhooks externes non sécurisés. |
| `stock.low` | `StockDeductionHandler`, `WasteStockReconciliationHandler` | `StockAlertHandler` | 🟢 TENUE | Arrêt de la cascade propre avec log et persistance. |
| `inventory.quarantine_activated` | `QuarantineHandler` | `FoodCostRecomputer` | 🟢 TENUE | |
| `commerce.margin_warning` | `FoodCostRecomputer`, `WasteToFoodCostHandler` | `MarginWarningHandler` | 🟢 TENUE | |
| `haccp.alert` | `MqttProvider` | `QuarantineHandler` | 🟢 TENUE | |
| `waste.logged` | `HACCPLogService` | `WasteStockReconciliationHandler`, `WasteToFoodCostHandler` | 🟢 TENUE | |
| `cash_drawer.opened_unauthorized` | `useCashDrawer.ts` | `CashDrawerAnomalyHandler` | 🟢 TENUE | |
| `sovereign.breach` | `SovereignGuard`, `CashDrawerAnomalyHandler` | `SovereignBreachHandler` | 🟢 TENUE | |
| `support.ticket_submitted` | API Diverses | `SupportTicketAnalysisHandler` | 🟢 TENUE | |
| `staff.clock_in` / `out` | `TimeclockDashboard` | `PayrollTimeclockHandler` | 🟢 TENUE | |

---

## 2. LES BLIND SPOTS CRITIQUES (PHASE 1)

**Les APIs Silencieuses (Écriture base SANS événement) :**

1. 🔴 **CRITIQUE : `src/app/api/finance/bank/sync/route.ts`**
   - **Explication :** Cette route crée des `journalEntries`, `bankTransactions`, et scelle le tout via `FiscalEngine.sealEntry` (NF525) directement via des requêtes `batch.set`. **Aucun `NexusEventBus.emit` n'est déclenché !**
   - **Conséquence :** Les modules de rapprochement bancaire ou les alertes de trésorerie qui écouteraient un événement de type `finance.transaction_synced` sont complètement aveuglés. L'âme événementielle du système est contournée au profit d'un script procédural.

2. 🔴 **CRITIQUE : `src/app/api/hr/employees/route.ts`**
   - **Explication :** Crée et met à jour des employés (`staff`) et leur `dpae` avec `Nexus.adapter.set`. Le seul traceur est un log d'audit (`empireAudit.log`), mais l'événement métier `hr.employee_created` n'est **jamais émis** sur le bus.
   - **Conséquence :** Les systèmes de provisionnement de caisse (POS) ou de planification ne seront pas notifiés de l'arrivée du nouvel employé en temps réel.

---

## 3. FAILLES RBAC ET SÉCURITÉ ASYNCHRONE (PHASE 2)

**Confiance Aveugle Asynchrone :**
Dans la quasi-totalité des Handlers (ex: `TicketZHandler.ts`, `StockDeductionHandler.ts`), le code extrait le `tenantId` directement du payload de l'événement et construit le chemin Firestore :
```typescript
const path = `tenants/${tenantId}/ticketZ/${today}`;
await Nexus.adapter.runTransaction(async (tx) => { ... });
```
**Il n'y a AUCUNE validation** de ce `tenantId` via `SovereignGuard.enforce()` ou preuve cryptographique (JWT). Si un service émet un événement malveillant ou erroné, les données d'un autre restaurant peuvent être modifiées (effets de bord destructeurs sur le Ticket Z ou les stocks).

---

## 4. CASCADE ET EFFET PAPILLON (PHASE 3)

**Analyse de la Profondeur Maximale :**

La profondeur de cascade maximale observée est de **3** :
`haccp.alert` (Capteur IoT) ➡️ `QuarantineHandler` ➡️ (Émet) `inventory.quarantine_activated` ➡️ `FoodCostRecomputer` ➡️ (Émet) `commerce.margin_warning` ➡️ `MarginWarningHandler`.

**Risque :** Faible. Les cascades s'arrêtent proprement à la couche d'alerte (StockAlertHandler, MarginWarningHandler) qui se contentent d'écrire en base et de déclencher des logs/WebPush sans relancer d'événements.

---

## 5. LA FAILLE 0-DAY DU MULTI-TENANT (PHASE 6)

🚨 **LA FAILLE ZÉRO A ÉTÉ DÉCOUVERTE !** 🚨
**Fichier :** `src/app/api/tenant/api-keys/validate/route.ts`

```typescript
// Ligne 28-34 :
const body = await req.json().catch(() => null);
// ...
const all = await Nexus.adapter.query(`tenants/${body.tenantId}/apiKeys`);
```
**Explication :** Cette route publique extrait le `tenantId` directement du **corps de la requête** (`body.tenantId`) sans passer par `requireTenantAdmin()` ni `requireTenantUser()`.
**Impact :** Un attaquant peut usurper le `tenantId` de n'importe quel restaurant du SaaS. Bien qu'il doive posséder une clé d'API valide, cette absence d'isolation stricte au niveau du contexte JWT brise le principe d'étanchéité absolue de l'Empire.

---

## 6. L'INTELLIGENCE ARTIFICIELLE ET LA FUITE DE MÉMOIRE (PHASE 7)

🔴 **DÉBORDEMENT ET PERTE D'ÉVÉNEMENTS DANS NEXT.JS**
**Fichier :** `src/shared/eventBus/handlers/IntelligenceHandler.ts`

```typescript
let eventBuffer: PendingIntelligenceEvent[] = [];
let debounceTimeout: NodeJS.Timeout | null = null;
// ...
eventBuffer.push(payload);
debounceTimeout = setTimeout(..., 30_000);
```
**Explication :** Le handler d'IA utilise un `setTimeout` et un tableau global en mémoire pour "coalescer" les appels LLM après un paiement.
**Conséquence :** Dans l'environnement Serverless de Next.js, l'instance Vercel/Node est gelée (ou détruite) après la réponse HTTP. Les événements stockés dans `eventBuffer` **seront perdus** (Cold Start). C'est une hérésie architecturale. Il faut utiliser une architecture Outbox, Redis, ou Google Cloud Tasks pour ce debounce.

---

## 7. INTÉGRITÉ FINANCIÈRE NF525 (PHASE 4)

L'intégrité NF525 dans `TicketZHandler.ts` est globalement saine. Elle utilise `FiscalSealer.sealDataAtomically` et un chaînage de `receiptNumber`. L'idempotence est respectée (si le `JournalEntry` existe déjà, l'opération est abandonnée).

Cependant, le contournement évoqué dans le Blind Spot de la synchronisation bancaire (Phase 1) compromet la vision globale de la chaîne de scellement.

---

## CONCLUSION DE L'AUDIT

La "Promesse Plateforme" est une excellente architecture conceptuelle, mais son implémentation actuelle souffre de **3 défauts fatals** :
1. **La Faille Zéro-Day** (`api-keys/validate`) qui trahit l'isolation Sovereign.
2. L'oubli criminel d'émettre des événements dans des processus critiques (`bank/sync`, `hr/employees`).
3. L'usage naïf du `setTimeout` pour l'IA en Serverless entraînant des pertes de données massives.

L'Event Engine n'est pas encore l'âme infaillible du système, il doit être sécurisé d'urgence.
