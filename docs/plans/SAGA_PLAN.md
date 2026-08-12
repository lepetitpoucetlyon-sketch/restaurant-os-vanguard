# Plan Opérationnel — Bus Événementiel Saga (NexusEventBus)

> Généré le 2026-07-30 — session `saga-plan-md`  
> Basé sur la cartographie Grade-X + Deep Think Audit du bus événementiel Restaurant OS.  
> Progression persistée sous `restaurant-os-saga-plan-v1` (localStorage).

---

## Contexte & État actuel

### NexusEventBus — acquis vérifiés

| Item | Statut |
|------|--------|
| NexusEventBus 3 tiers (CRITICAL / HIGH / BACKGROUND) | ✅ Livré |
| StockDeductionHandler (order.paid → BOM → stock.low) | ✅ Livré |
| StockAlertHandler (stock.low → stockAlerts Nexus) | ✅ Livré |
| TicketZHandler (order.paid → TicketZ NF525, runTransaction) | ✅ Livré |
| IntelligenceHandler (order.paid → RAG + z-score) | ✅ Livré |
| SovereignBreachHandler (sovereign.breach → killswitch) | ✅ Livré |
| SyncManager IndexedDB (Nexus writes — distinct du bus) | ✅ Livré |
| Cascade order.paid → stock.low (StockDeduction → StockAlert) | ✅ Livré |

### Événements déclarés (12 total)

```
order.placed        order.paid          order.cancelled
stock.low           stock.received      sovereign.breach
commerce.yield_updated   hr.transfer_offer   reservation.confirmed
haccp.alert         payroll.submitted   support.ticket_submitted
```

### Handlers actifs (5 via registerHandlers + 1 serveur)

| Handler | Écoute | Tier |
|---------|--------|------|
| StockDeductionHandler | order.paid | HIGH |
| StockAlertHandler | stock.low | HIGH |
| TicketZHandler | order.paid | BACKGROUND |
| IntelligenceHandler | order.paid | BACKGROUND |
| SovereignBreachHandler | sovereign.breach | CRITICAL |
| SupportTicketAnalysisHandler | support.ticket_submitted | HIGH (server-side API route) |

### Orphelins confirmés (événements déclarés sans handler)

- `order.placed` — émis (delivery webhook, POS local absent), aucun handler
- `order.cancelled` — déclaré, jamais émis, aucun handler
- `stock.received` — déclaré, jamais émis, aucun handler
- `reservation.confirmed` — déclaré, jamais émis, aucun handler
- `commerce.yield_updated` — émis (YieldEngine), aucun handler
- `hr.transfer_offer` — émis (LiquidStaffingEngine), aucun handler
- `payroll.submitted` — déclaré, jamais émis, aucun handler
- `haccp.alert` — déclaré, MqttProvider actif mais **n'émet jamais sur le bus**

### Schémas dormants (existent, non câblés au bus)

| Schéma | Fichier | Type d'event manquant |
|--------|---------|----------------------|
| WasteSchema | `src/domain/schemas/haccp.ts:46` | `waste.logged` |
| ClockEventType | `src/modules/human/connectors/timeclock/types.ts` | `staff.clock_in / staff.clock_out` |

### DOM CustomEvents (canal secondaire)

| Event | Émetteur | Écouteur |
|-------|----------|----------|
| `ambiance-changed` | AmbianceService | useAmbiance (POS) + SidebarQuickActions |
| `sovereign-guard-alert` | ImmunityAuditLogger | SovereignShield UI overlay |
| `ai:context_update` | **INTROUVABLE** | VoiceAssistantOverlay (feature cassée) |

---

## P0 — Fondations critiques (à faire en premier)

> Sans ces deux items, tout le reste est bâti sur du sable.  
> Un handler qui plante = event perdu à jamais (pas de retry, pas de trace).

### P0-1 · EventOutbox dédié aux émissions bus

**Problème** : `SyncManager` couvre les écritures Nexus (IndexedDB) mais **pas** les `emit()` du bus.  
Un crash entre le `Nexus.adapter.set()` (persisté) et le `NexusEventBus.emit()` (RAM) = handlers jamais exécutés, état Firestore ≠ état handlers.

**Périmètre fichiers** :
- `src/infrastructure/services/offline/offline-store.ts` — nouvelle table `busOutbox`
- `src/shared/eventBus/NexusEventBus.ts` — méthode `emitDurable()`
- `src/lib/nexus/NexusSyncService.ts` — `replayPendingEvents()` au boot
- `src/infrastructure/adapters/FinancialNexusBridge.ts:246` — migration vers `emitDurable`
- `src/shared/eventBus/handlers/StockDeductionHandler.ts` — cascade `stock.low` → `emitDurable`
- `src/app/api/connectors/delivery/webhook/[provider]/route.ts:73` — migration vers `emitDurable`

**Implémentation** :

```typescript
// offline-store.ts — nouvelle table
interface BusOutboxEntry {
  id: string;           // crypto.randomUUID()
  eventName: string;
  payload: unknown;
  createdAt: number;
  attempts: number;
  status: 'pending' | 'done' | 'failed';
}

// NexusEventBus.ts — wrapper durable
async emitDurable<K extends keyof NexusEvents>(
  name: K,
  payload: NexusEvents[K]
): Promise<void> {
  const id = crypto.randomUUID();
  await busOutboxStore.put({ id, eventName: name, payload, createdAt: Date.now(), attempts: 0, status: 'pending' });
  await this.emit(name, payload);
  await busOutboxStore.patch(id, { status: 'done' });
}

// NexusSyncService.ts — replay au boot
async replayPendingEvents(): Promise<void> {
  const pending = await busOutboxStore.getByStatus('pending');
  for (const entry of pending) {
    await NexusEventBus.emit(entry.eventName as keyof NexusEvents, entry.payload as never);
    await busOutboxStore.patch(entry.id, { status: 'done' });
  }
}
```

**Critères de succès** :
- [ ] Table `busOutbox` dans offline-store
- [ ] `emitDurable()` implémenté et testé
- [ ] `replayPendingEvents()` appelé dans `NexusSyncService.init()`
- [ ] 3 sites critiques migrés (FinancialNexusBridge, StockDeductionHandler, delivery webhook)
- [ ] Test : simuler crash entre set() et emit() → vérifier replay au redémarrage

---

### P0-2 · Dead Letter Queue (DLQ)

**Problème** : un handler qui throw = erreur loguée, event définitivement perdu.  
Aucun mécanisme de retry, aucune visibilité opérationnelle.

**Périmètre fichiers** :
- `src/infrastructure/services/offline/offline-store.ts` — table `deadLetterEvents`
- `src/shared/eventBus/NexusEventBus.ts` — catch dans `emit()` CRITICAL/HIGH
- `src/shared/nexus/guards/admin/mcc/EventBusHealthPanel.tsx` — nouveau composant MCC

**Implémentation** :

```typescript
// Structure DLQ
interface DeadLetterEntry {
  id: string;
  eventName: string;
  payload: unknown;
  handlerId: string;
  error: string;
  failedAt: number;
  attempts: number;        // max 5 → quarantine
  nextRetryAt: number;     // backoff exponentiel : 2^attempts × 1000 ms
  status: 'retry' | 'quarantine';
}

// NexusEventBus.ts — catch enrichi
// Dans CRITICAL sequential et HIGH allSettled :
// si handler.fn() throw → dlqStore.push({ ...context, error: e.message, attempts: 1, nextRetryAt: now + 2000 })

// EventBusHealthPanel — colonnes MCC
// | eventName | handlerId | error (50 chars) | attempts | status | [Retry] [Quarantine] |
```

**Critères de succès** :
- [ ] Table `deadLetterEvents` dans offline-store
- [ ] Backoff exponentiel : `2^attempts × 1 000 ms`, cap 5 tentatives
- [ ] Statut `quarantine` après 5 échecs
- [ ] `EventBusHealthPanel` accessible dans MCC (`/admin/mcc/event-bus`)
- [ ] Bouton "Retry" déclenche un re-emit immédiat depuis le panneau
- [ ] Test : handler qui throw 5× → vérifier quarantine + entrée DLQ

---

## P1 — Câblage schémas dormants & nouveaux événements

> Quick wins : les schémas existent, il manque juste le `emit`.

### P1-1 · Câbler `waste.logged` depuis HACCPLogService

**Schéma** : `WasteSchema` existe dans `src/domain/schemas/haccp.ts:46`  
**Émetteur à créer** : `src/modules/compliance/haccp/services/HACCPLogService.ts`

```typescript
// Dans logWaste() :
await NexusEventBus.emitDurable('waste.logged', {
  tenantId,
  itemId: waste.itemId,
  quantityInMicrounits: waste.quantityInMicrounits,
  reason: waste.reason,
  recordedAt: Date.now(),
  operatorId,
});
```

**Handler à créer** : `WasteStockReconciliationHandler`
- Écoute : `waste.logged` (HIGH)
- Action : décrémenter stock + log empireAudit `WASTE_RECORDED`

**Critères de succès** :
- [ ] `waste.logged` déclaré dans `NexusEvents` (NexusEventBus.ts)
- [ ] `HACCPLogService.logWaste()` émet via `emitDurable`
- [ ] `WasteStockReconciliationHandler` enregistré dans `registerHandlers.ts`
- [ ] Test : logWaste() → vérifier décrément stock + audit log

---

### P1-2 · Câbler `staff.clock_in / staff.clock_out`

**Type** : `ClockEventType` existe dans `src/modules/human/connectors/timeclock/types.ts`  
**Émetteur** : `QrCodeTimeclockProvider` (fichier à identifier ou créer)

```typescript
// Dans handleScan() :
await NexusEventBus.emitDurable('staff.clock_in', {
  tenantId,
  employeeId: scan.employeeId,
  timestamp: Date.now(),
  method: 'qr_code',
});
```

**Handler à créer** : `PayrollTimeclockHandler`
- Écoute : `staff.clock_in` + `staff.clock_out` (HIGH)
- Action : écrire dans `tenants/${tenantId}/timeclock/${employeeId}/${shiftId}`, log audit

**Critères de succès** :
- [ ] `staff.clock_in` et `staff.clock_out` déclarés dans `NexusEvents`
- [ ] `QrCodeTimeclockProvider` émet via `emitDurable`
- [ ] `PayrollTimeclockHandler` enregistré dans `registerHandlers.ts`
- [ ] Test : scan QR → entrée timeclock créée dans Nexus

---

### P1-3 · Câbler `order.placed` depuis le POS local

**Problème** : `order.placed` n'est émis que par le delivery webhook. Le POS local crée des commandes sans passer par le bus → KDS ne peut pas écouter le bus pour les commandes internes.

**Émetteur** : `src/modules/ops/pos/` (hook usePos ou OrderService)

```typescript
// Dans submitOrder() / confirmOrder() :
await NexusEventBus.emitDurable('order.placed', {
  orderId: order.id,
  tableId: order.tableId,
  tenantId,
  operatorId: currentUser.id,
  items: order.items,
});
```

**Critères de succès** :
- [ ] POS local émet `order.placed` via `emitDurable` à chaque nouvelle commande
- [ ] KDS écoute `order.placed` (handler à créer ou existant via onSnapshot)
- [ ] Pas de doublon si le POS et le delivery webhook émettent le même orderId (idempotence via existence check)

---

### P1-4 · Câbler `order.cancelled`

**Problème** : déclaré, jamais émis. Une annulation ne déclenche aucune compensation de stock.

**Émetteur** : hook annulation POS + webhook delivery (statut `cancelled`)

**Handler à créer** : `StockRestitutionHandler`
- Écoute : `order.cancelled` (HIGH)
- Action : reverse la déduction BOM (re-crédite les ingrédients), log audit `STOCK_RESTITUTED`

**Critères de succès** :
- [ ] `order.cancelled` émis par POS et delivery webhook
- [ ] `StockRestitutionHandler` enregistré — inverse BOM exactement comme StockDeductionHandler
- [ ] Test : order.paid → stock déduit → order.cancelled → stock restitué (solde net = 0)

---

### P1-5 · Câbler `stock.received` (réception fournisseur)

**Problème** : déclaré, jamais émis. La réception d'une commande fournisseur n'est pas signalée au bus.

**Émetteur** : `src/modules/logistics/` — InventoryReceptionDashboard ou service dédié

```typescript
await NexusEventBus.emitDurable('stock.received', {
  tenantId,
  supplierId: reception.supplierId,
  items: reception.lines.map(l => ({
    stockItemId: l.itemId,
    quantityReceived: l.qty,
    unitCostInMicrounits: l.unitCostInMicrounits,
  })),
  receivedAt: Date.now(),
  operatorId,
});
```

**Handler à créer** : `StockReceptionHandler`
- Écoute : `stock.received` (HIGH)
- Action : créditer stock items, mettre à jour `lastCostInMicrounits`, log audit `STOCK_RECEIVED`

**Critères de succès** :
- [ ] `stock.received` émis depuis InventoryReceptionDashboard via `emitDurable`
- [ ] `StockReceptionHandler` enregistré et testé
- [ ] `unitCostInMicrounits` mis à jour → FoodCostRecomputer peut réagir (P2)

---

### P1-6 · Versionnage payload (v: number sur tous les NexusEvents)

**Problème** : aucun champ de version sur les payloads → impossible de migrer sans breaking change, impossible de détecter un payload stale en DLQ.

**Périmètre** : `src/shared/eventBus/NexusEventBus.ts` — toutes les interfaces `NexusEvents`

```typescript
// Avant
interface OrderPaidEvent {
  orderId: string;
  tenantId: string;
  // ...
}

// Après
interface OrderPaidEvent {
  v: 1;                  // version littérale, pas number générique
  orderId: string;
  tenantId: string;
  // ...
}

// PayloadMigrator à créer :
// src/shared/eventBus/PayloadMigrator.ts
// migrateTo<K>(name: K, payload: unknown, targetVersion: number): NexusEvents[K]
```

**Critères de succès** :
- [ ] Champ `v: number` ajouté à toutes les interfaces `NexusEvents` (12 events)
- [ ] `PayloadMigrator` implémenté avec au moins 1 migration de test (v0 → v1 order.paid)
- [ ] DLQ affiche la version du payload → facilite le debug
- [ ] TSC 0 après migration

---

## P2 — Résilience & nouvelles cascades métier

### P2-1 · Backpressure IntelligenceHandler

**Problème** : `IntelligenceHandler` appelle RAG + Gemini sur chaque `order.paid` (BACKGROUND).  
Pendant un "coup de feu" (100 commandes/heure) → 100 appels parallèles Gemini = coût × latence.

**Solution** :

```typescript
// src/shared/eventBus/handlers/IntelligenceHandler.ts
// Debounce 30s — coalescencer les order.paid en fenêtre glissante
const debouncedAnalyze = debounce(async (events: OrderPaidEvent[]) => {
  // batch les orderId et analyse l'ensemble
}, 30_000);

// Circuit breaker GeminiProvider — après 3 erreurs consécutives, skip 60s
// src/modules/intelligence/providers/GeminiProvider.ts
```

**Critères de succès** :
- [ ] Debounce 30s sur IntelligenceHandler (coalescence des events)
- [ ] Circuit breaker 3 erreurs → pause 60s sur GeminiProvider
- [ ] Rate limit RAG : max 10 req/min (token bucket)
- [ ] Test : 50 order.paid en 1s → max 1 appel Gemini + 1 appel RAG

---

### P2-2 · Cascade Quarantaine POS (HACCP → POS ProductGrid)

**Flux cible** :
```
MqttProvider (IoT sensor) 
  → haccp.alert (CRITICAL)
  → QuarantineHandler 
  → quarantinedProductsAtom (Jotai)
  → POS ProductGrid filtre les produits quarantinés
```

**Fichiers à créer/modifier** :
- `src/modules/compliance/haccp/handlers/QuarantineHandler.ts` — écoute `haccp.alert`
- `src/modules/compliance/connectors/iot/providers/MqttProvider.ts` — émet `haccp.alert` sur bus
- `src/store/pillars/compliance.ts` — `quarantinedProductsAtom`
- `src/modules/ops/pos/components/ProductGrid.tsx` — filtre via atom

```typescript
// MqttProvider.ts — patch pour émettre sur le bus
onMessage(topic, message) {
  const reading = parseSensorReading(message);
  if (reading.temperature > reading.threshold) {
    NexusEventBus.emitDurable('haccp.alert', {
      v: 1,
      tenantId,
      sensorId: reading.sensorId,
      affectedProductIds: reading.linkedProductIds,
      temperature: reading.temperature,
      threshold: reading.threshold,
      severity: 'critical',
      detectedAt: Date.now(),
    });
  }
}

// QuarantineHandler.ts
NexusEventBus.on('haccp.alert', {
  id: 'quarantine-handler',
  priority: 'CRITICAL',
  fn: async (event) => {
    // Écrire dans Nexus : tenants/${tenantId}/quarantine/${productId}
    // Mettre à jour quarantinedProductsAtom
    // Log empireAudit : PRODUCT_QUARANTINED
  }
});
```

**Critères de succès** :
- [ ] `haccp.alert` émis par MqttProvider (température hors seuil)
- [ ] `QuarantineHandler` enregistré en CRITICAL
- [ ] `quarantinedProductsAtom` mis à jour → POS masque les produits
- [ ] Alerte WebPush envoyée au manager de garde (si VAPID configuré)
- [ ] Test : simulation IoT temp > seuil → produit masqué dans POS

---

### P2-3 · Cascade Inflation Shield (fournisseur → marge)

**Flux cible** :
```
supplier.invoice_processed (nouveau)
  → FoodCostRecomputer (HIGH)
  → si marge < seuil → commerce.margin_warning (nouveau)
  → MarginWarningHandler (HIGH)
  → MarginAlertPanel MCC
```

**Nouveaux événements à déclarer** :

```typescript
'supplier.invoice_processed': {
  v: 1;
  tenantId: string;
  supplierId: string;
  invoiceId: string;
  lines: Array<{ stockItemId: string; unitCostInMicrounits: Microunits }>;
  processedAt: number;
}

'commerce.margin_warning': {
  v: 1;
  tenantId: string;
  productId: string;
  currentMarginBps: number;    // basis points : 2000 = 20%
  thresholdBps: number;
  triggerEventId: string;      // invoiceId qui a déclenché
}
```

**Handlers à créer** :
- `FoodCostRecomputer` — lit unitCostInMicrounits des ingrédients, recalcule `foodCostBps` par produit fini
- `MarginWarningHandler` — persiste alerte dans Nexus, pousse vers `MarginAlertPanel`

**Critères de succès** :
- [ ] `supplier.invoice_processed` déclaré + émis depuis API factures fournisseur
- [ ] `commerce.margin_warning` déclaré
- [ ] `FoodCostRecomputer` implémenté (HIGH)
- [ ] `MarginWarningHandler` implémenté (HIGH)
- [ ] `MarginAlertPanel` accessible dans MCC Finance
- [ ] Test : invoice avec hausse +20% ingrédient clé → alerte marge produit fini

---

### P2-4 · Nouveaux schémas événementiels

Déclarer dans `NexusEventBus.ts` (interfaces + type union) :

| Événement | Payload clé | Handler cible |
|-----------|-------------|---------------|
| `waste.logged` | itemId, quantityInMicrounits, reason | WasteStockReconciliationHandler |
| `staff.clock_in` | employeeId, method | PayrollTimeclockHandler |
| `staff.clock_out` | employeeId, shiftDurationMs | PayrollTimeclockHandler |
| `cash_drawer.opened_unauthorized` | drawerId, operatorId, detectedAt | CashDrawerAnomalyHandler |
| `supplier.invoice_processed` | supplierId, lines[] | FoodCostRecomputer |
| `inventory.quarantine_activated` | productIds[], reason | QuarantineHandler |
| `commerce.margin_warning` | productId, currentMarginBps | MarginWarningHandler |

**Critères de succès** :
- [ ] 7 nouveaux événements déclarés dans `NexusEvents` avec champ `v: 1`
- [ ] TSC 0 après ajout
- [ ] Chaque event a au moins 1 handler enregistré ou un commentaire `// handler P?-? pending`

---

## P3 — Cascades différenciantes (valeur métier haute)

### P3-1 · CRM VIP (order.paid → fidélisation)

**Flux** :
```
order.paid 
  → CRMVipHandler (BACKGROUND)
  → si client récurrent (≥ 5 visites ou CA > seuil) → badge VIP Nexus
  → WebPush "Votre table habituelle vous attend" (prochaine réservation)
```

**Handler** : `src/modules/commerce/marketing/handlers/CRMVipHandler.ts`

**Critères de succès** :
- [ ] `CRMVipHandler` enregistré en BACKGROUND
- [ ] Seuils configurables par tenant (Jotai atom + MCC Settings)
- [ ] WebPush conditionnel (VAPID_PUBLIC_KEY présente en env)
- [ ] Test : 5 order.paid même clientId → badge VIP créé dans Nexus

---

### P3-2 · Rain Staffing (weather → staff call)

**Flux** :
```
Cron toutes les 4h → WeatherService.check()
  → si pluie prévue dans 2h → hr.transfer_offer émis
  → RainStaffingHandler (HIGH)
  → notifie candidats disponibles via WebPush
```

**Critères de succès** :
- [ ] `WeatherService` interroge API météo (OpenMeteo — gratuit, no-key)
- [ ] `RainStaffingHandler` écoute `hr.transfer_offer`
- [ ] Test : mock météo pluie → WebPush envoyé à la liste de garde

---

### P3-3 · Cash Drawer Anomaly (tiroir → alerte sécurité)

**Flux** :
```
cash_drawer.opened_unauthorized (nouveau)
  → CashDrawerAnomalyHandler (CRITICAL)
  → sovereign.breach si drawerId inconnu du tenant
  → POS lockdown mode
  → WebPush manager de garde
```

**Critères de succès** :
- [ ] `cash_drawer.opened_unauthorized` émis par POS si ouverture sans commande associée
- [ ] `CashDrawerAnomalyHandler` enregistré en CRITICAL
- [ ] Condition sovereign.breach : tiroir hors tenant → killswitch

---

### P3-4 · WasteToFoodCost (déchets → révision prix)

**Flux** :
```
waste.logged 
  → WasteToFoodCostHandler (BACKGROUND)
  → cumule gaspillage / 7 jours
  → si waste_rate > 15% → commerce.margin_warning
```

**Critères de succès** :
- [ ] `WasteToFoodCostHandler` enregistré en BACKGROUND
- [ ] Sliding window 7 jours via Nexus `wasteMetrics`
- [ ] Déclenche `commerce.margin_warning` si seuil franchi

---

### P3-5 · Bible Technique — Chapitre Bus Événementiel

**Fichier** : `docs/BIBLE_TECHNIQUE.html`

**Contenu à ajouter** :
- Schéma Mermaid de toutes les cascades (order.paid complet, quarantaine, inflation shield)
- Table des 19 événements (12 actuels + 7 nouveaux P2)
- Guide d'ajout d'un nouvel événement (checklist 8 étapes)
- Règles d'or NexusEventBus (toujours `emitDurable` pour le critique, jamais fire-and-forget sur fiscal)

**Critères de succès** :
- [ ] Chapitre ajouté à `docs/BIBLE_TECHNIQUE.html` (section §26 ou suivante)
- [ ] Diagramme Mermaid rendu correctement
- [ ] Checklist "ajouter un event" référencée depuis `CLAUDE.md`

---

## Règles invariantes (rappel)

> Ces règles s'appliquent à TOUTE implémentation dans ce plan.

1. **NF525** — `journalEntries`, `fiscalSeals`, `fiscalLedger` : jamais `delete`, jamais `update`
2. **Microunits** — tous les montants en `*InMicrounits` (1 µ = 0,000 001 €)
3. **Multi-tenancy** — toute écriture Nexus : `tenants/{tenantId}/{collection}/{id}`, `tenantId` depuis `useTenant()` jamais hardcodé
4. **SovereignGuard** — ne jamais contourner, même pour un handler CRITICAL
5. **emitDurable** — obligatoire pour tout event lié à une transaction fiscale ou stock
6. **Barrel** — tout nouveau handler dans `src/shared/eventBus/handlers/` ou `src/modules/<pilier>/handlers/`, exporté via le barrel `index.ts` du pilier
7. **TSC 0** — `npx tsc --noEmit` doit passer avant tout commit
8. **Tests** — tout nouveau handler a au moins 1 test vitest (happy path + erreur handler)

---

## Ordre d'exécution recommandé

```
P0-1 (EventOutbox) 
  → P0-2 (DLQ) 
    → P1-6 (versionnage payload)    ← peut se faire en parallèle avec P0-2
    → P1-1 (waste.logged)
    → P1-2 (clock_in/out)
    → P1-3 (order.placed POS)
    → P1-4 (order.cancelled)
    → P1-5 (stock.received)
  → P2-4 (déclarer nouveaux schémas) ← prérequis P2-2 et P2-3
  → P2-1 (backpressure Intelligence)
  → P2-2 (Quarantaine POS)
  → P2-3 (Inflation Shield)
  → P3-* (dans l'ordre de priorité métier)
```

---

## Fichiers clés de référence

| Fichier | Rôle dans ce plan |
|---------|------------------|
| `src/shared/eventBus/NexusEventBus.ts` | Déclarer nouveaux events + emitDurable |
| `src/shared/eventBus/registerHandlers.ts` | Enregistrer tous les nouveaux handlers |
| `src/infrastructure/services/offline/offline-store.ts` | Tables busOutbox + deadLetterEvents |
| `src/lib/nexus/NexusSyncService.ts` | replayPendingEvents() au boot |
| `src/infrastructure/adapters/FinancialNexusBridge.ts:246` | Migrer vers emitDurable |
| `src/modules/compliance/connectors/iot/providers/MqttProvider.ts` | Câbler haccp.alert |
| `src/domain/schemas/haccp.ts:46` | WasteSchema déjà existant |
| `src/modules/human/connectors/timeclock/types.ts` | ClockEventType déjà existant |

---

*Plan généré par cartographie Grade-X — session `event-cartography` + `saga-plan-md` (2026-07-30)*
