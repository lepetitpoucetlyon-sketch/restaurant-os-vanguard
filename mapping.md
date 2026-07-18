# Mapping Actions × Impact × Persona RBAC

> Audit complet — branch `grade-x-vanguard` · 2026-07-10  
> Légende : ✅ câblé end-to-end · 🟡 partiel/non câblé · 🔴 déclaré non implémenté / manquant · 🔒 RBAC défini non appliqué

---

## 1. Cascade de référence

> *Chef 3 entrecôtes → recette → commande cuisine → KDS → encaissement → déduction stock au gramme → Ticket Z → NF525 → Ticket Z en comptabilité.*

| # | Étape | Action / Fichier | Persona | État |
|---|-------|------------------|---------|------|
| 1 | Stock initial | `receiveOrder / addStockItem` · [inventory-service.ts](src/modules/logistics/inventory/services/inventory-service.ts) | Resp. stock | ✅ |
| 2 | Création recette | `RecipeIngredient{ grossQuantity, netQuantity, unit, lossRate }` · [recipes.ts:53](src/shared/nexus/contracts/settings/recipes.ts) | Chef cuisinier | ✅ modèle · 🔒 `create_recipe` non gardé |
| 3 | Commande cuisine | `handleSendToKitchen → addOrder(status:'new') + updateTable('ordered')` · [usePos.ts:81](src/modules/ops/pos/hooks/usePos.ts) | Serveur | ✅ |
| 4 | Préparation KDS | `updateOrderStatus new→preparing→ready` · [useKDSController.ts](src/modules/ops/kds/hooks/useKDSController.ts) | Cuisinier | ✅ |
| 5 | Encaissement POS | `handlePaymentComplete → FinancialNexusBridge.processOrder` · [usePos.ts:103](src/modules/ops/pos/hooks/usePos.ts) | Caissier | ✅ |
| 6 | Logs NF525 | `JournalEntry + FiscalSeal chaîné` · [FinancialNexusBridge.ts:80](src/infrastructure/adapters/FinancialNexusBridge.ts) | Automatique | ✅ · ⚠️ `sealData` non-atomique (voir §5.1) |
| 7 | **Déduction stock** | `StockDeductionHandler` — 1:1 `product.linkedStockItemId` · [types.ts:128](src/modules/logistics/inventory/types.ts) | Automatique | 🔴 **BOM non explosé — haricots 100g non décomptés** |
| 8 | Ticket Z | `TicketZHandler` · agrégat courant `ticketZ/{today}` · [TicketZHandler.ts](src/lib/events/handlers/TicketZHandler.ts) | Automatique | 🟡 agrégat courant, pas clôture scellée immuable |
| 9 | **Ticket Z → Compta** | — | — | 🔴 **MANQUANT — aucun handler** |

### Event bus réel

```
POS handlePaymentComplete
  │
  ▼
FinancialNexusBridge.processOrder()        ← CRITICAL (sync)
  ├──▶ JournalEntry                         tenants/{id}/journalEntries IMMUABLE ✅
  └──▶ FiscalSeal                           ⚠ sealData non-atomique (fork risk)
  │
  emit('order.paid')
    ├──▶ [HIGH]       StockDeductionHandler  🔴 1:1 seulement, BOM non explosé
    │                   └──▶ emit('stock.low') ──▶ StockAlertHandler ✅
    ├──▶ [BACKGROUND] TicketZHandler         🟡 agrégat, pas clôture immuable
    └──▶ [BACKGROUND] IntelligenceHandler    ✅ HermesKnowledgeManager RAG

SovereignGuard.breach ──▶ [CRITICAL] SovereignBreachHandler ✅

🔴 MANQUANT · close_register ──▶ TicketZ clôture ──▶ JournalEntry agrégé
🔴 MANQUANT · order.paid ──▶ RecipeBOMExpander (explosion ingrédients au gramme)
```

---

## 2. Catalogue des actions par module

### POS
| Action | Hook/Impl | État |
|--------|-----------|------|
| `open_table` | `usePos.handleAddToCart` | ✅ · 🔒 |
| `add_product` | `usePos` | ✅ · 🔒 |
| `split_bill` | `handlePaySplit` | ✅ · 🔒 |
| `apply_discount_percent` | — | 🔴 non implémenté · 🔒 |
| `refund` | — | 🔴 non implémenté · 🔒 |
| `modify_price` | — | 🔴 non implémenté · 🔒 |
| `cash_payment / card_payment` | `handlePaymentComplete` | ✅ · 🔒 |
| `close_register` | — | 🟡 déclenche la cascade mais pas la clôture Z · 🔒 |
| `reprint_ticket` | — | ✅ · 🔒 |

### KDS
| Action | Hook/Impl | État |
|--------|-----------|------|
| `mark_in_progress` | `updateOrderStatus` | ✅ · 🔒 |
| `mark_ready` | `updateOrderStatus` | ✅ · 🔒 |
| `recall` | — | 🔴 · 🔒 |
| `prioritize` | `rushMode` existe mais non câblé taxo | 🟡 · 🔒 |
| `cancel_from_kds` | — | 🔴 · 🔒 |

### Kitchen / Recettes
| Action | Hook/Impl | État |
|--------|-----------|------|
| `create_recipe` | RecipeCompositionTab | ✅ · 🔒 |
| `add_ingredient` | IngredientsTab | ✅ · 🔒 |
| `modify_ingredient_qty` | IngredientsTab | ✅ · 🔒 |
| `view_cost / view_margin` | RecipeCompositionTab | ✅ · 🔒 |
| BOM → déduction stock | — | 🔴 **non câblé** |

### Inventory / Stock
| Action | Hook/Impl | État |
|--------|-----------|------|
| `add_stock` | `receiveOrder` | ✅ · 🔒 |
| `declare_loss` | `addWaste` | ✅ · 🔒 |
| `validate_reception` | `addReception` | ✅ · 🔒 |
| `physical_inventory` | — | 🔴 · 🔒 |
| `adjust_qty` | `transferStock / consumeStock` | ✅ · 🔒 |
| `deductStockForProduct` | types.ts:128 | 🔴 **déclaré, jamais implémenté** |

### HACCP
| Action | Hook/Impl | État |
|--------|-----------|------|
| `record_temperature` | `useHACCP.addHygieneLog` | ✅ · 🔒 |
| `validate_checklist` | `useHACCP` | ✅ · 🔒 |
| `report_nonconformity` | `useQuality.submitControl` | 🟡 pas de pont registre obligatoire · 🔒 |
| `add_corrective_action` | `addMaintenance` | ✅ · 🔒 |

### Finance
| Action | Hook/Impl | État |
|--------|-----------|------|
| `create_invoice` | `useBilling.billOrder` | 🟡 non déclenché par page · 🔒 |
| `mark_paid` | `useAccounting.validateJournalEntry` | ✅ · 🔒 |
| `bank_reconciliation` | `PowensService` | 🔴 non câblé · 🔒 |
| `close_period` | — | 🔴 · 🔒 |
| `enter_expense` | `useFiscal.submitExpense` | ✅ · 🔒 |
| `close_register → Z→Compta` | — | 🔴 **MANQUANT** |

### Staff / HR
| Action | Hook/Impl | État |
|--------|-----------|------|
| `create_employee` | `useHumanResources` | ✅ · 🔒 |
| `assign_role` | `useHumanResources` | ✅ · 🔒 |
| `modify_salary` | `useHumanResources` | ✅ · 🔒 |
| `generate_pin` | — | 🔴 · 🔒 |
| `generate_payslip` | `paySlipGenerator` | 🔴 non déclenché · 🔒 |

### Planning / Leaves
| Action | État |
|--------|------|
| `create_shift, publish_schedule` | ✅ · 🔒 |
| `approve_leave, reject_leave` | ✅ · 🔒 |
| `modify_balance` | ✅ · 🔒 |

### CRM
| Action | État |
|--------|------|
| `create_client, upsert_client` | ✅ · 🔒 |
| `merge_duplicates` | 🔴 · 🔒 |
| `view_client_ca` | 🔴 · 🔒 |
| `send_email_sms` | 🔴 · 🔒 |

### Reservations
| Action | État |
|--------|------|
| `create, confirm, assign_table, mark_noshow` | ✅ · 🔒 |
| `mark_arrived` | 🟡 toast cosmétique — pas de provision compta · 🔒 |

### Analytics
| Action | État |
|--------|------|
| `view_predictions, compare_periods, schedule_report` | 🔴 props vides — pas de données · 🔒 |

---

## 3. Matrice personas × périmètre (11 rôles)

> `PermissionRole` défini dans [permissions.types.ts](src/shared/nexus/contracts/permissions.types.ts).  
> **Aucun rôle n'est appliqué en action-level** — seule la catégorie de module est gardée.

| Persona | Niveau | Périmètre attendu | Gap principal |
|---------|--------|-------------------|---------------|
| `super_admin` | 100 | tout | aucun |
| `directeur` | 90 | tout | aucun |
| `manager` | 70 | ops + finance + staff + refund/remise | 🔒 approbations & PIN non gardés |
| `comptable` | 60 | finance, clôture, FEC, rapprochement | 🔴 close_period / bank_reconciliation non câblés |
| `chef_cuisinier` | 45 | recettes, BOM, stock cuisine | 🔴 BOM non relié à la déduction stock |
| `chef_rang` | 50 | POS, envoi cuisine, encaissement | 🔴 remise/annulation sans garde RBAC |
| `serveur` | 40 | POS, envoi cuisine | 🔴 actions sensibles non bloquées |
| `cuisinier` | 35 | KDS lecture/préparation | ✅ correct |
| `barman` | 35 | KDS bar + stock comptoir | ✅ correct |
| `hotesse` | 30 | réservations, plan de salle | 🟡 mark_arrived sans provision compta |
| `plongeur` | 10 | HACCP réception | 🟡 accès non différencié du cuisinier |

**Problème transverse** : 4 vocabulaires de rôles incompatibles :
- `PermissionRole` × 11 (permissions.types.ts)
- `pos.operatorRole` × 5 (pos.ts)
- `AgentRole` × 4 (agency/types.ts)
- `fleet_admin / SUPER_ADMIN` (adminAuthGuard.ts)

---

## 4. Audit log (empireAudit) — actions tracées

✅ Tracées (≈10) : `POS_PAYMENT_SEALED`, `FISCAL_SEAL_CREATED`, `STOCK_DEDUCTED`, `STOCK_ALERT_TRIGGERED`, `USER_ADDED`, `USER_DELETED`, `TRANSACTION_SEALED`

🔴 Non auditées : ~170 actions restantes

---

## 5. Gaps prioritaires

### 5.0 🔴 TPE — Terminal de Paiement Électronique (priorité critique)

Le `card_payment` dans le POS est aujourd'hui **cosmétique** : `PaymentDialog` appelle `handlePaymentComplete()` directement sans jamais parler à un terminal physique. C'est un vide fonctionnel majeur — aucun client réel ne peut encaisser par carte.

**Complexité sous-estimée :** la TPE n'est pas un seul provider. En France, un restaurateur peut avoir :

| Provider | Protocole | Connexion | Popularité FR |
|---|---|---|---|
| **Stripe Terminal** | SDK JS/Swift/Android | BLE (M2/S700) ou LAN (WisePOS E) | ↑ tech-savvy |
| **SumUp** | REST + WebSocket | BLE Air, Solo 3G | ↑ petits restos |
| **Worldline / Ingenico** | TPAEXT IP propriétaire | LAN, USB | ↑↑ banques FR |
| **Adyen Terminal API** | Nexo RETAIL | LAN / Cloud | ↑ mid-market |
| **Edenred / Sodexo / Swile** | REST API tickets-restaurant | Cloud | spécifique FR |

**Contraintes non-négociables :**
- **PCI DSS** — les données carte ne transitent JAMAIS par nos serveurs. Seul le SDK du terminal touche le PAN.
- **NF525** — chaque paiement TPE doit générer une `JournalEntry` avec le `terminalTransactionId`.
- **Offline** — si le réseau coupe pendant l'encaissement, le terminal garde le reçu ; notre POS doit réconcilier à la reconnexion.
- **Remboursement** — doit passer par le même terminal ou par API (pas de saisie manuelle du montant).
- **Tickets restaurant** — TVA ventilée différemment (10% seulement), montant plafonné/jour.

**Architecture cible :** `PaymentTerminalService` sur le même pattern que `PrintingService` — un singleton avec adapters swappables, découverte/appairage via UI settings, fallback `ManualAdapter` (opérateur confirme à la main) et `SimulatorAdapter` (dev/démo).

**À faire :**
1. `src/lib/payment-terminal/types.ts` — `TerminalDevice`, `PaymentRequest`, `PaymentResult`, `RefundRequest`
2. `src/lib/payment-terminal/PaymentTerminalService.ts` — singleton + dispatch
3. Adapters : `SimulatorAdapter`, `ManualAdapter`, `StripeTerminalAdapter`, `SumUpAdapter`, `WorldlineAdapter`
4. `PaymentTerminalSettings.tsx` — découverte BLE/LAN, appairage, test paiement
5. `PaymentDialog.tsx` — intégration : sélection méthode → si card → `terminalService.charge()` → await résultat → NF525
6. Refund flow dans VoidModal
7. Tip-on-terminal (vs pre-tip côté POS)
8. Tickets restaurant Edenred/Sodexo (montant + ventilation TVA)

### 5.1 🔴 À AJOUTER

#### A1 — Explosion recette BOM → déduction "au gramme"
Le modèle `RecipeIngredient` existe ([recipes.ts:53](src/shared/nexus/contracts/settings/recipes.ts)) avec `grossQuantity`, `netQuantity`, `lossRate`.  
`StockDeductionHandler` fait une déduction 1:1 `product→linkedStockItemId` sans exploser la recette.  
`deductStockForProduct()` est déclaré dans [types.ts:128](src/modules/logistics/inventory/types.ts) **jamais implémenté**.

**À faire** : `RecipeBOMExpander` — sur `order.paid`, pour chaque ligne :
1. Charger `product.linkedRecipeId` → recette
2. Pour chaque `RecipeIngredient` : déduire `netQuantity × qté` du stock ingrédient (`ingredientId`)
3. Appliquer `lossRate` si besoin
4. Émettre `stock.low` si `quantity < reorderThreshold`

#### A2 — Ticket Z → Comptabilité (clôture journalière)
Aucun handler ne génère l'écriture de centralisation journalière.  
**À faire** : handler `close_register` :
1. Scelle le Z du jour (document immuable avec timestamp final)
2. Écrit une `JournalEntry` agrégée (`type: 'revenue'`, ventilation par taux TVA)
3. Lien `journalEntries/{date}_close`

Fichiers : [TicketZHandler.ts](src/lib/events/handlers/TicketZHandler.ts), [FinancialNexusBridge.ts](src/infrastructure/adapters/FinancialNexusBridge.ts) (modèle JournalEntry)

#### A4 — Hardware agnosticism — gaps résiduels
- **Tiroir-caisse** : commande ESC/POS kick (1B 70 00 19 19) jamais envoyée. Ajouter `EscPosBuilder.buildDrawerKick()` + appel dans `CashDrawerModal` via `PrintingService`.
- **Kiosk pointage** : PIN only. Ajouter `navigator.nfc.scan()` (Web NFC API) comme 2e stratégie — badge NFC → UID → lookup employé.

#### A5 — Onboarding employé (flow complet manquant)
Le manager crée un employé avec le form complet mais aucun mécanisme de transmission des accès n'existe. PIN inventé → note papier → employé J+1 ne sait pas quoi faire.

**À faire :**
1. `QuickAddStaffModal` — nom + rôle en 60s, PIN auto-généré
2. Transmission accès : QR code one-shot + PIN affiché une fois
3. Page `/welcome-staff` — premier login : bienvenue rôle-aware + changement PIN obligatoire + redirect vers page du rôle
4. Import CSV bulk équipe (nom, prénom, rôle, email optionnel)

#### A3 — Enforcement RBAC action-level (~180 actions)
`permissions.types.ts` déclare ~180 actions (`POSAction`, `FinanceAction`, `KitchenAction`…) avec `requiresPin` et `limit`.  
Aucune n'est vérifiée dans les composants.

**À faire** : `useActionPermission(page: PageKey, action: string): PermissionCheckResult`  
Priorité d'enforcement : POS (`refund`, `apply_discount`, `cancel_item_sent`), Finance (`close_period`), Staff (`modify_salary`)

### 5.2 🔴 À CORRIGER

#### C1 — FiscalSealer.sealData non-atomique (risque fork NF525)
`sealDataAtomically()` est écrit dans [FiscalSealer.ts](src/infrastructure/services/finance/FiscalSealer.ts) mais non branché.  
[FinancialNexusBridge.ts:80](src/infrastructure/adapters/FinancialNexusBridge.ts) appelle encore `sealData()` non-atomique.

#### C2 — `deductStockForProduct()` vide
[types.ts:128](src/modules/logistics/inventory/types.ts) — corps manquant. Appels silencieux → aucune déduction.

#### C3 — Triple implémentation FEC
`FECGenerator` vs `FECExporter` vs API `/api/admin/finance/fec/export` — désigner la canonique.

### 5.3 🟡 À COMPLÉTER

| Réf | Quoi | Fichier |
|-----|------|---------|
| CP1 | Ticket Z : clôture datée immuable (vs agrégat courant) | [TicketZHandler.ts](src/lib/events/handlers/TicketZHandler.ts) |
| CP2 | Facturation : brancher `InvoiceEngine` sur `/finance` | [finance/page.tsx](src/app/(client)/(ops)/finance/page.tsx) |
| CP3 | Rapprochement bancaire : déclencher `PowensService` | [finance/page.tsx](src/app/(client)/(ops)/finance/page.tsx) |
| CP4 | Bulletin de paie : bouton → `paySlipGenerator` | [staff/page.tsx](src/app/(client)/(ops)/staff/page.tsx) |
| CP5 | HACCP `report_nonconformity` → registre + alerte | [haccp/page.tsx](src/app/(client)/(ops)/haccp/page.tsx) |
| CP6 | Réservation `mark_arrived` → provision compta ou retirer toast | [reservations/page.tsx](src/app/(client)/(ops)/reservations/page.tsx) |
| CP7 | Analytics : alimenter `ProfitabilityView` / `ReputationView` / Oracle | [analytics/page.tsx](src/app/(client)/(ops)/analytics/page.tsx) |

---

## 6. Contraintes dures (ne jamais toucher)

- `CryptoService.generateHash` — algorithme de hash NF525
- `FiscalAdapter.sealEntry` — chaîne de scellement
- `FinancialNexusBridge` write logic — écriture JournalEntry + FiscalSeal
- `LedgerAdapter` — grand livre
- `SovereignGuard` — isolation multi-tenant
- Collections immuables : `journalEntries`, `fiscalSeals`, `fiscalLedger` (jamais delete/update)

---

## 7. Checklist d'avancement — grade-x-vanguard (17 juillet 2026)

Légende : ✅ Fait · 🚫 Bloqué (credential / approbation externe) · 🔴 Non commencé

### Navigation & Infrastructure

| ID | Item | Statut |
|----|------|--------|
| nav-1 | 4 liens migration → routes réelles | ✅ |
| nav-2 | 11 doublons href corrigés avec `?tab=` | ✅ |
| nav-3 | `/operations` ajouté à la nav | ✅ |
| inf-3 | Sentry intégré dans NexusFiscalProvider | ✅ |
| inf-4 | Vercel Pro + domaine wildcard multi-tenant | 🚫 décision déploiement |
| inf-6 | `Math.random()` → `crypto.randomUUID()` | ✅ |
| inf-8 | Wildcard DNS sous-domaine par tenant | 🚫 décision déploiement |
| p0-1 | `.env.example` commentaires améliorés | ✅ |

### Notifications Push

| ID | Item | Statut |
|----|------|--------|
| not-1a | ServiceWorker `sw.js` push handler | ✅ |
| not-1b | `WebPushService` (subscribe / send) | ✅ |
| not-1c | `usePushSubscription` hook | ✅ |
| not-1d | Route `/api/push/subscribe` | ✅ |
| not-1e | Route `/api/push/send` | ✅ |
| not-2 | KDS → push quand ticket PRÊT | ✅ |
| not-3 | Push planning publié → équipe | ✅ |
| not-4 | Push alerte stock bas → chef cuisinier | ✅ |
| not-5 | Push congé approuvé/rejeté → employé | ✅ |

### KDS

| ID | Item | Statut |
|----|------|--------|
| kds-1 | Timers colorés par ancienneté (vert/orange/rouge) | ✅ |
| kds-2 | Bouton PRÊT + push notification | ✅ |
| kds-3 | Priorité allergènes (badge rouge) | ✅ |
| kds-4 | Priorité siège VIP + drag-to-reorder | ✅ |
| kds-5 | Filtre station bar | ✅ |
| kds-6 | Vue rappel (tickets READY non récupérés) | ✅ |

### POS

| ID | Item | Statut |
|----|------|--------|
| pos-1 | `EpsonPrinter` ESC/POS 3 stratégies | ✅ |
| pos-2 | `ModifierModal` (modificateurs rapides) | ✅ |
| pos-3 | `CourseManager` (entrée/plat/dessert) | ✅ |
| pos-4 | Remise ligne avec prix barré | ✅ |
| pos-5 | `CashDrawerModal` fond de caisse ouv/ferm | ✅ |
| pos-6 | `VoidModal` extourne NF525 (jamais modif originale) | ✅ |
| pos-7 | `TipPanel` (5/10/15%/custom) | ✅ |
| pos-8 | 86 auto quand stock = 0 | ✅ |
| pos-9 | Mode tablette iPad (layout adaptatif) | ✅ |

### RBAC & Sécurité

| ID | Item | Statut |
|----|------|--------|
| rbac-1 | POS guards refund/offer/cancel + PinModal | ✅ |
| rbac-2 | `PinModal` 4 chiffres auto-submit | ✅ |
| rbac-3 | Réservations guards (RBAC) | ✅ |
| rbac-4 | Inventory guards (RBAC) | ✅ |
| rbac-5 | `RoleGate` → `<RestrictedScreen />` statut RESTRICTED | ✅ |
| rbac-6 | Stripe webhook → status RESTRICTED si abonnement expiré | ✅ |

### Réservations

| ID | Item | Statut |
|----|------|--------|
| res-3 | Email confirmation via Resend | ✅ |
| res-4 | SMS confirmation (Twilio/Vonage) | 🚫 clés SMS |
| res-5 | No-show tracking | ✅ |
| res-6 | Vue semaine planning salle | ✅ |
| res-7 | Groupes depuis Nexus (plus de MOCK_GROUPS) | ✅ |
| res-8 | Devis événement + `PrivatisationContract` PDF | ✅ |
| res-12 | Attribution table automatique | ✅ |
| res-13 | Sync realtime floor plan | ✅ |
| res-15 | Toggle terrasse on/off | ✅ |

### Widget public de réservation

| ID | Item | Statut |
|----|------|--------|
| wid-1 | Layout `[slug]/reservations` | ✅ |
| wid-2 | `ReservationWidget` tunnel 7 étapes | ✅ |
| wid-3 | `EmbedSnippets` (iframe + script) | ✅ |
| wid-4 | Tunnel complet + export `.ics` | ✅ |
| wid-5 | `ReservationWidgetSettings` dans les settings | ✅ |
| wid-7 | `MigrationGuide` import TheFork/Zenchef | ✅ |
| wid-8 | `MigrationEmailTemplate` email bienvenue | ✅ |
| wid-9 | `ROICalculator` | ✅ |
| wid-10 | `OnlineBookingToggle` | ✅ |

### Finance

| ID | Item | Statut |
|----|------|--------|
| fin-3 | Connexion bancaire Powens (CLIENT_ID) | 🚫 inscription biapi.pro |
| fin-4 | Import transactions bancaires | 🚫 inscription biapi.pro |
| fin-5 | Catégorisation auto des transactions | 🚫 inscription biapi.pro |
| fin-6 | Rapprochement bancaire | 🚫 inscription biapi.pro |
| fin-7 | Export OFX/CAMT.053 | 🚫 inscription biapi.pro |
| fin-8 | UI connexion bancaire (structure) | ✅ |
| fin-10 | TVA multi-taux (5,5% / 10% / 20%) | ✅ |
| fin-11 | Mention Chorus Pro dans settings | ✅ |
| fin-12 | `AccountingReportService` — P&L + bilan PDF | ✅ |
| fin-13 | Export CSV paie | ✅ |

### Logistique

| ID | Item | Statut |
|----|------|--------|
| log-1 | `ProcurementService` fournisseurs dynamiques | ✅ |
| log-2 | Seuil de réapprovisionnement configurable | ✅ |
| log-3 | Qté de réapprovisionnement configurable | ✅ |
| log-4 | `useStockDeduction` BOM au gramme + taux de perte | ✅ |
| log-5 | Scan code-barres réception | ✅ |
| log-6 | Traçabilité lot (lotNumber, dlc, supplierId) | ✅ |
| log-7 | `RotatingCount` comptage tournant (1/14 par jour) | ✅ |

### RH

| ID | Item | Statut |
|----|------|--------|
| rh-1 | Kiosk pointage PIN | ✅ |
| rh-2 | Push planning publié → équipe | ✅ |
| rh-3 | Flow demande de congé + approbation manager | ✅ |
| rh-4 | Alertes légales planning (11h / 10h / 48h) | ✅ |
| rh-5 | DPAE URSSAF API | 🚫 credentials URSSAF |
| rh-6 | Formule paie brut→net corrigée (×1,42) | ✅ |
| rh-7 | `breakTime` + `punctualityScore` | ✅ |
| rh-8 | `RecruitmentBoard` Kanban 6 colonnes (@dnd-kit) | ✅ |
| rh-9 | DSN URSSAF API | 🚫 credentials URSSAF |

### Cuisine

| ID | Item | Statut |
|----|------|--------|
| cui-1 | Food cost + marge + prix conseillé | ✅ |
| cui-2 | Scaling recettes (×N couverts) | ✅ |
| cui-3 | `BarRecipeCard` cocktails (baseSpirit, garnish…) | ✅ |
| cui-4 | Impression fiche technique PDF | ✅ |
| cui-5 | `DailyPrepList` depuis réservations du jour | ✅ |

### CRM / Commerce

| ID | Item | Statut |
|----|------|--------|
| com-1 | Codes promo Firestore | ✅ |
| com-2 | `VisitHistory` historique visites + avg spend | ✅ |
| com-3 | `LoyaltyCard` programme fidélité (points) | ✅ |
| com-4 | `EmailCampaign` batch Resend par segment | ✅ |
| com-5 | SMS marketing (Twilio/Vonage) | 🚫 clés SMS |
| com-6 | `BasketAnalysis` 3 graphiques SVG | ✅ |

### Analytics / IA

| ID | Item | Statut |
|----|------|--------|
| ai-1 | KPIs dashboard (CA jour/semaine/mois ±%) | ✅ |
| ai-2 | Rapport hebdo automatisé (cron lundi 8h) | ✅ |
| ai-4 | `MenuJsonLd` schema.org Restaurant | ✅ |
| ai-6 | MacroBrain Insights IA (alertes Gemini) | ✅ |
| ai-7 | `AttendancePrediction` (8 semaines historique) | ✅ |

### HACCP / Hygiène

| ID | Item | Statut |
|----|------|--------|
| hac-1 | Alertes température push | ✅ |
| hac-2 | PDF Plan Maîtrise Sanitaire (jsPDF 4 pages) | ✅ |
| hac-3 | `CleaningPlan` grille hebdo + signature PIN | ✅ |
| hac-4 | `DLCTracker` alertes DLC ≤7 jours | ✅ |
| hac-5 | `NonConformityForm` workflow NC manager | ✅ |
| hac-6 | IoT capteurs température (hardware) | 🚫 matériel physique |

### Légal

| ID | Item | Statut |
|----|------|--------|
| leg-1 | CGU + CGV + Mentions légales (12 articles) | ✅ |
| leg-2 | `NF525SelfAudit` checklist + attestation PDF | ✅ |
| leg-3 | Mention Chorus Pro | ✅ |
| leg-4 | RGPD complet + `CookieBanner` | ✅ |
| leg-5 | Dossier JEI (Jeune Entreprise Innovante) | 🚫 administratif |
| leg-6 | Prêt d'Honneur BPI | 🚫 administratif |
| leg-7 | `PrivatisationContract` PDF (jsPDF 2 pages) | ✅ |

### Google / MDM / Intégrations

| ID | Item | Statut |
|----|------|--------|
| goo-1 | `ReserveWithGoogle` page settings + snippet | ✅ |
| goo-2 | Sync horaires → Google Business Profile | ✅ |
| goo-3 | Réponses avis IA via Gemini | ✅ |
| goo-5 | `AnalyticsSettings` GA4/Plausible toggle | ✅ |
| goo-6 | Approbation Google Actions Center | 🚫 approbation Google |
| goo-7 | Quota GBP API (Google Console) | 🚫 quota Google |
| goo-8 | OAuth Google GBP (code exchange + AES-GCM) | ✅ |
| goo-9 | Reserve with Google live | 🚫 approbation Google |
| goo-10 | Intégration Google Maps live | 🚫 approbation Google |
| mdm-1 | Apple Business Manager | 🚫 compte Apple Business |
| mdm-2 | Compte Mosyle MDM | 🚫 compte Mosyle |
| mdm-3 | `MDMPanel` UI + TODOs API Mosyle | ✅ |
| mdm-4 | MDM déploiement config iPad | 🚫 compte Apple/Mosyle |
| mdm-5 | Restriction accès abonnement expiré (via Stripe webhook) | ✅ |

---

### TPE — Terminal de Paiement Électronique

> Architecture adapter, PCI DSS, NF525-compliant. Voir §5.0 pour le détail.

| ID | Item | Statut |
|----|------|--------|
| tpe-1 | `PaymentTerminalService` — singleton + factory + types (`TerminalDevice`, `PaymentRequest`, `PaymentResult`) | 🔴 |
| tpe-2 | `SimulatorAdapter` — réponse immédiate approved/declined, pour dev/démo | 🔴 |
| tpe-3 | `ManualAdapter` — opérateur confirme manuellement (fallback sans terminal) | 🔴 |
| tpe-4 | `StripeTerminalAdapter` — BLE (M2/S700) + LAN (WisePOS E), via `@stripe/terminal-js` | 🔴 |
| tpe-5 | `SumUpAdapter` — BLE Air + REST API SumUp | 🔴 |
| tpe-6 | `WorldlineAdapter` — Ingenico TPAEXT IP (banques françaises) | 🔴 |
| tpe-7 | `PaymentTerminalSettings.tsx` — découverte BLE/LAN, appairage, test paiement | 🔴 |
| tpe-8 | `PaymentDialog.tsx` — intégration terminal : charge → await → NF525 bridge | 🔴 |
| tpe-9 | Tip-on-terminal (terminal affiche le montant pourboire) | 🔴 |
| tpe-10 | Refund via terminal dans `VoidModal` | 🔴 |
| tpe-11 | Tickets restaurant Edenred/Sodexo/Swile (REST + ventilation TVA 10%) | 🔴 |
| tpe-12 | Mode offline TPE + réconciliation au retour réseau | 🔴 |

### Hardware complémentaire

| ID | Item | Statut |
|----|------|--------|
| hw-1 | Tiroir-caisse : commande ESC/POS kick via `PrintingService` depuis `CashDrawerModal` | 🔴 |
| hw-2 | Kiosk pointage NFC badge (`navigator.nfc.scan()` → UID → lookup employé) | 🔴 |

### Onboarding Employé

| ID | Item | Statut |
|----|------|--------|
| emp-1 | `QuickAddStaffModal` — nom + rôle + PIN auto-généré en 60s | 🔴 |
| emp-2 | Transmission accès : QR code one-shot + PIN affiché une fois | 🔴 |
| emp-3 | Page `/welcome-staff` — premier login rôle-aware + changement PIN obligatoire | 🔴 |
| emp-4 | Import CSV bulk équipe (nom, prénom, rôle, email) | 🔴 |

---

### Récapitulatif

| Statut | Nombre |
|--------|--------|
| ✅ Fait | 89 |
| 🚫 Bloqué (externe) | 20 |
| 🔴 Non commencé | 18 |

> Branche `grade-x-vanguard` — tsc 0 erreur — mis à jour le 18 juillet 2026
