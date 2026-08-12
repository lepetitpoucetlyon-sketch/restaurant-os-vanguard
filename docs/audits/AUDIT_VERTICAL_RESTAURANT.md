# Audit Vertical Restaurant — Blind Spots Complet
> Date : 2026-08-07 · Lecture seule · Session : restaurant-vertical-audit

---

## Chiffres clés

| Métrique | Valeur |
|----------|--------|
| Boucles infinies dans `RestaurantVertical.initialize()` | **7** |
| Dead events émis sans handler | **11** |
| Events écoutés par les mauvais handlers (nom différent) | **3** |
| Adapter déclaré mais absent de la vertical | **1** (`RestaurantFacilityAdapter`) |
| Appels à `registerRbacConfig()` | **0** |
| Appels à `registerStoreAtom()` | **0** |
| Routes phantom (enregistrées sans `page.tsx`) | **2** (`/menu-engineering`, `/nf525`) |
| Routes critiques absentes de l'ICM | **1** (`/intelligence` → LLM = OFF) |
| Tests pour `RestaurantVertical.ts` | **0** |
| Tests pour les 9 adapters restaurant | **0** |

---

## AXE 1 — Routes

### ✅ Correct
- 28 routes existent dans `src/app/(client)/(ops)/` — toutes ont un `page.tsx`
- `/floor-plan` est enregistrée dans `registerRoute()` ET existe en filesystem

### ❌ Blind spots

**2 routes phantom** — enregistrées via `registerRoute()` mais sans `page.tsx` Next.js :
- `/menu-engineering` → `presentation/MenuEngineeringDashboard.tsx` existe mais est unreachable
- `/nf525` → pointe vers `@/modules/finance/comptabilite/fec` mais aucun `page.tsx`

**25 routes non déclarées dans la vertical** — fonctionnent grâce au filesystem Next.js, pas via la vertical.

**Capabilities DNA sans garde navConfig** (`requiredCapability` manquant) :
- `mod_omnichannel`, `mod_pms`, `mod_agent_dashboard`, `mod_fleet_management` → ne peuvent jamais être désactivées par tenant

### ⚠️ Ambigu
`registerRoute()` stocke des métadonnées dans Firestore (`tenants/{id}/vertical-config.registeredRoutes`) mais ne contrôle pas le routing Next.js. Son utilité est purement informative.

---

## AXE 2 — Event Bus ⚠️ CRITIQUE

### ✅ Events correctement câblés
- `reservation.confirmed` → `ResaKitchenTaskHandler` ✅
- `haccp.check.saved` → `HaccpCheckArchiverHandler` ✅
- `sensor.temperature_anomaly` → `FridgeTempAlertHandler` ✅
- `dlc.expired` → `registerDLCExpiryHandler` ✅
- `mcc.health_ping` → `MccHealthPingHandler` ✅
- `ops.order_notification` → émet `finance.order_sealed` + `analytics.sales_data_ready` (événements différents ✅)
- `reservation.no_show` → émet `crm.rfm_trigger` ✅
- `tenant.ready` → émet `mcc.health_ping` ✅

### ❌ 7 BOUCLES INFINIES dans `RestaurantVertical.initialize()`

Le pattern : le handler écoute un event X, appelle un adapter qui ré-émet le même event X → boucle infinie.
`NexusEventBus` n'a **aucun circuit-breaker** → crash/OOM en production.

| Ligne | Event écouté | Re-émis par |
|-------|-------------|-------------|
| 50 | `table.released` | `RestaurantOpsAdapter.emitTableReleased()` |
| 57 | `reservation.confirmed` | `RestaurantCommerceAdapter.emitReservationConfirmed()` |
| 73 | `finance.z_report_requested` | `RestaurantFinanceAdapter.emitZReportRequested()` |
| 81 | `sensor.temperature_anomaly` | `RestaurantComplianceAdapter.emitTemperatureAnomaly()` |
| 92 | `hr.shift_started` | `RestaurantHumanAdapter.emitShiftStarted()` |
| 100 | `dlc.expired` | `RestaurantLogisticsAdapter.emitDlcExpiry()` |
| 108 | `intelligence.menu_engineering_requested` | `RestaurantIntelligenceAdapter.emitMenuEngineeringRequest()` |

### ❌ 11 Dead events (émis dans le vide)

| Event | Émis par | Handler existant ? |
|-------|----------|-------------------|
| `finance.order_sealed` | `RestaurantFinanceAdapter.emitOrderFiscalSeal()` | **Aucun** ❌ |
| `analytics.sales_data_ready` | `RestaurantIntelligenceAdapter.emitSalesDataReady()` | **Aucun** ❌ |
| `analytics.anomaly_detected` | `RestaurantIntelligenceAdapter.emitAnomalyDetected()` | **Aucun** ❌ |
| `intelligence.menu_engineering_requested` | `RestaurantIntelligenceAdapter.emitMenuEngineeringRequest()` | **Aucun** ❌ |
| `hr.tip_distributed` | `RestaurantHumanAdapter.emitTipDistributed()` | **Aucun** ❌ |
| `hr.overtime_alert` | `RestaurantHumanAdapter.emitOvertimeAlert()` | Handler écoute `hr.shift_ended` ❌ |
| `inventory.deducted` | `RestaurantLogisticsAdapter.emitStockDeducted()` | Handler écoute `order.paid` ❌ |
| `kds.course_passed` | `RestaurantOpsAdapter.emitKdsPassthrough()` | **Aucun** ❌ |
| `crm.rfm_trigger` | `RestaurantCommerceAdapter.emitCustomerRFMTrigger()` | Handler écoute `crm.points_earned` ❌ |
| `facility.floor_plan_updated` | `RestaurantFacilityAdapter.emitTableLayoutChanged()` | **Aucun** ❌ |
| `facility.maintenance_required` | `RestaurantFacilityAdapter.emitMaintenanceRequired()` | **Aucun** ❌ |

**`finance.order_sealed` est le plus critique** — c'est l'entrée NF525 de la vertical, mais l'event disparaît.

### ❌ Handler orphelin
`WasteStockReconciliationHandler` écoute `waste.logged` mais `RestaurantLogisticsAdapter` émet `inventory.waste_logged` → jamais déclenché depuis la vertical.

---

## AXE 3 — RBAC

### ✅ Correct
- `DEFAULT_PAGE_ACCESS` définit des règles spécifiques restaurant (chef_rang, serveur, barman, hôtesse, plongeur)
- `useRbacGate.ts` (POS) : PIN protection + vérification permissions discount/offer/cancel/refund ✅
- `fetchRbacConfigAtom` charge depuis Nexus avec fallback sur les defaults ✅

### ❌ Blind spots
- `RestaurantVertical.initialize()` n'appelle **jamais** `context.registerRbacConfig()`
- `ProvisioningEngine.ts` seede un RBAC **vide** : `TenantRBACConfigSchema.parse({})` → `{ pageOverrides: {}, tabOverrides: {}, actionOverrides: {} }`. `DEFAULT_PAGE_ACCESS` et `DEFAULT_TAB_ACCESS` ne sont jamais écrits en Nexus — ils sont des constantes statiques UI uniquement.
- Le rôle `comptable` existe dans `DEFAULT_PAGE_ACCESS` mais n'est vérifié dans aucun test d'authentification.

---

## AXE 4 — Atoms Jotai

### ✅ Correct
- `store/pillars/ops.ts` exporte `ordersAtom`, `tablesAtom`, `activeCartAtom` depuis les modules piliers ✅
- `store/pillars/rbac.ts` expose `rbacConfigAtom` et `fetchRbacConfigAtom` ✅

### ❌ Blind spots
- `RestaurantVertical.initialize()` n'appelle **jamais** `context.registerStoreAtom()` → `getRegisteredAtoms()` retourne toujours `0`
- Tous les atoms sont déclarés globalement — si un tenant hôtel et un restaurant tournent dans le même process, `activeCartAtom` (spécifique POS restaurant) est présent pour l'hôtel sans raison → pollution d'état inter-vertical

---

## AXE 5 — ICM (chargement sélectif)

### ✅ Correct
- `/pos`, `/kds`, `/bar`, `/kitchen`, `/floor-plan`, `/finance`, `/operations`, `/compliance`, `/reservations`, `/staff`, `/inventory`, `/haccp`, `/crm`, `/marketing`, `/analytics`, `/registre`, `/groups` → task maps correctes ✅

### ❌ Routes absentes des ROUTE_SEGMENTS

| Route | Problème | Impact |
|-------|----------|--------|
| `/intelligence` | Absent → `intelligence: 'OFF'` dans default | **Critique** — hub IA jamais initialisé |
| `/menu-builder` | Absent → `products: 'MEDIUM'` au lieu de HIGH | Sous-chargement |
| `/leaves` | Absent → `staff: 'LAZY'` au lieu de HIGH | Sous-chargement |
| `/welcome-staff` | Absent → `staff: 'LAZY'` au lieu de HIGH | Sous-chargement |
| `/integrations` | Absent | Modules inutiles chargés |

---

## AXE 6 — DNA & Seeding

### ✅ Correct
- Toutes les `requiredCapability` navConfig correspondent à une capability `true` dans le DNA ✅
- `TenantSeeder` seede PCG, admin PIN, genesis fiscal seal, floors/zones/tables, connectors ✅
- `resolveDNA(variant)` avec fallback `RESTAURANT_FULL_DNA` ✅

### ❌ Blind spots
- `mod_omnichannel`, `mod_pms`, `mod_agent_dashboard`, `mod_fleet_management` → capabilities orphelines (DNA = true mais aucun `requiredCapability` dans navConfig)
- `TenantSeeder` ne seede **aucun produit ni catégorie par défaut** → restaurant provisionné = 10 tables, zéro carte
- `ProvisioningEngine.ts` ligne 76 : `bar: false` hardcodé dans `featureFlags` alors que `mod_bar: true` dans le DNA → incohérence

---

## AXE 7 — Adapters

### ✅ Correct
- 9 adapters légers qui émettent des events — pattern correct
- Types `IFiscalTicket`, `ITipPool`, `IMenuEngineeringItem`, `IPerishableItem` définis dans `domain/types.ts` ✅

### ❌ Blind spots
- **`RestaurantFacilityAdapter` absent de la vertical** : déclaré dans `adapters/index.ts` mais **non importé** dans `RestaurantVertical.ts`. Ses méthodes `emitTableLayoutChanged` et `emitMaintenanceRequired` ne sont jamais appelées depuis la vertical.
- **Tip Pooling** : types définis, `emitTipDistributed()` existe, mais aucune logique de calcul des parts (weighted-hours, weighted-covers, custom) n'est implémentée nulle part.
- **Menu Engineering** : `IMenuEngineeringReport` défini (star/plow-horse/puzzle/dog), `MenuEngineeringDashboard.tsx` existe, mais aucun service ne calcule ces catégories. Route unreachable (phantom).
- `finance/nf525/index.ts` dans la vertical = **1 ligne de commentaire** : `// NF525 — voir @/modules/finance`. Stub vide.

---

## AXE 8 — NF525

### ✅ Correct
- `FiscalSealer.sealDataAtomically()` — scellement atomique ✅
- `closeTicketZForDay()` — clôture Z avec hash chaîné ✅
- `TicketZArchiveHandler` écoute `finance.ticket_z_closed` ✅
- `MonthlyFECExportHandler` écoute `finance.month_closed` ✅
- Tests `FiscalSealer.test.ts`, `TicketZHandler.test.ts` passent ✅

### ❌ Blind spots
- `finance/nf525/index.ts` dans la vertical = stub vide → NF525 n'est pas encapsulé par la vertical
- `finance.order_sealed` émis par `RestaurantFinanceAdapter` → **aucun handler** → chaîne NF525 verticale cassée. Le vrai scellement passe par `order.paid` → `TicketZHandler` en bypass total de la couche vertical.
- `finance.z_report_requested` handler dans la vertical crée une boucle infinie (AXE 2)
- `pos-to-fiscal.test.ts` est en `describe.skip(...)` → non exécuté en CI

---

## AXE 9 — Comparaison autres verticals

### HotelVertical
- Pas de boucle infinie — les handlers appellent des adapters qui émettent des events différents ✅
- Importe et utilise `HotelFacilityAdapter` correctement ✅
- Même problème de routes phantom (pms, housekeeping, yield, city-ledger → aucun `page.tsx`)

### Interface `VerticalRoute[]`
Propriété optionnelle `routes?: VerticalRoute[]` (label, icon, roles, componentLoader) déclarée dans `IVerticalPlugin` mais **non implémentée par aucune vertical**. Interface morte.

---

## AXE 10 — Tests

### ✅ Correct
- `FiscalSealer.test.ts`, `TicketZHandler.test.ts`, `saga.finance.test.ts` passent ✅

### ❌ Manque
- **0 test** pour `RestaurantVertical.ts`
- **0 test** pour les 9 adapters restaurant
- **0 test** détectant les boucles infinies (passeraient silencieusement jusqu'au timeout CI)
- `pos-to-fiscal.test.ts` → `describe.skip` → flow NF525 non validé en CI
- 0 test E2E pour commande → NF525 → clôture Z via la couche verticale

---

## Tableau de priorités

| # | P | Problème | Impact |
|---|---|----------|--------|
| 1 | **P0** | 7 boucles infinies `RestaurantVertical.ts` | Crash/OOM prod |
| 2 | **P0** | `finance.order_sealed` dead event — chaîne NF525 verticale cassée | NF525 via vertical non fonctionnel |
| 3 | **P0** | Aucun circuit-breaker sur `NexusEventBus` | Amplifie les boucles |
| 4 | **P0** | `RestaurantFacilityAdapter` absent de la vertical | Floor plan + maintenance events jamais émis |
| 5 | **P1** | `/intelligence` absent ICM → `intelligence: 'OFF'` | Hub IA inutilisable |
| 6 | **P1** | 3 events écoutés par mauvais handlers (overtime, stock, RFM) | Features silencieuses |
| 7 | **P1** | `finance/nf525/index.ts` stub vide | NF525 non encapsulé par la vertical |
| 8 | **P1** | `registerRbacConfig()` jamais appelé | RBAC restaurant non piloté par la vertical |
| 9 | **P1** | `pos-to-fiscal.test.ts` skipé | Flow NF525 non validé en CI |
| 10 | **P1** | 0 test pour RestaurantVertical + 9 adapters | Boucles indétectables en CI |
| 11 | **P2** | `registerStoreAtom()` jamais appelé | Isolation multi-vertical inexistante |
| 12 | **P2** | `ProvisioningEngine` `bar: false` hardcodé vs DNA `mod_bar: true` | Incohérence DNA/featureFlags |
| 13 | **P2** | 4 capabilities DNA sans `requiredCapability` navConfig | Capabilities non actionables |
| 14 | **P2** | `/menu-builder`, `/leaves`, `/welcome-staff` absents ICM | Chargement modules sous-optimal |
| 15 | **P2** | Tip Pooling + Menu Engineering : types définis, 0 logique | Features déclarées non implémentées |
| 16 | **P2** | `routes?: VerticalRoute[]` interface jamais utilisée | Interface morte |
| 17 | **P3** | TenantSeeder : 0 produit/catégorie par défaut | Restaurant vide à la création |

---

*Généré automatiquement — session restaurant-vertical-audit · 2026-08-07*
