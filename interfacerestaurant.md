# 🍴 Interface Restaurant — Plan d'Implémentation Ultra-Complet

> **Repo** : RESTAURANT-OS-CORE · verticale **restaurant** (base généraliste multi-variant depuis §8.6)
> **Rédigé le** : 2026-08-09 · session `ui-backend-coherence`
> **Mis à jour** : 2026-08-13 · session `teintes-finish-ui-plan` — audit câblage exhaustif + généralisation MetricLabels + fix DLQ WasteHandler
> **Base commit** : `a6ffafdcb` (branche `agent/antigravity-exec`)
> **Objectif** : connecter chaque feature backend construite à une surface client visible.
>
> Ce document est la **source de vérité UI** pour la verticale restaurant. Il inventorie
> tout ce qui existe côté back-end et n'apparaît pas côté client, chaque composant TSX
> construit mais jamais monté, chaque route API sans consommateur, chaque handler
> silencieux, et propose un plan d'exécution en 11 sprints.
>
> **Complément sécurité / intégrité** : `docs/PLAN_RESTE_A_FAIRE.md` (16 chantiers,
> dont fuite cross-tenant corrigée, tests Vitest, tier-awareness DEMO/TEST/REF).

---

## Table des matières

0. [Périmètre généraliste vs restaurant](#0-périmètre-généraliste-vs-restaurant) ← **NOUVEAU §8.6**
1. [Résumé exécutif chiffré](#1-résumé-exécutif-chiffré)
2. [Correctifs déjà livrés (commit 2acb5dab9)](#2-correctifs-déjà-livrés)
3. [Bugs Priorité 0 — état](#3-bugs-priorité-0)
4. [Partie 1 — Pages existantes sous-exploitées](#4-partie-1--pages-existantes-sous-exploitées)
   - [1.1 HACCP / Qualité](#11-haccp--qualité--haccp)
   - [1.2 Plan de Salle](#12-plan-de-salle--floor-plan)
   - [1.3 Réservations](#13-réservations--reservations)
   - [1.4 Finance](#14-finance--finance)
   - [1.5 Cuisine / KDS](#15-cuisine--kds--kds--kitchen)
   - [1.6 POS](#16-pos--pos)
   - [1.7 Intelligence / Analytics](#17-intelligence--analytics--intelligence--analytics)
   - [1.8 Inventaire / Logistique](#18-inventaire--logistique--inventory)
   - [1.9 RH / Staff](#19-rh--staff--staff)
   - [1.10 Marketing / SEO](#110-marketing--seo--marketing)
   - [1.11 Onboarding / Migration](#111-onboarding--migration--onboarding--migration)
5. [Partie 2 — Routes hors navigation (17 routes)](#5-partie-2--routes-hors-navigation)
6. [Partie 3 — Services backend sans UI](#6-partie-3--services-backend-sans-ui)
   - [3.1 Event Bus — 165 handlers silencieux](#31-event-bus--165-handlers-silencieux)
   - [3.2 Engines Métier — 31 engines sans écran](#32-engines-métier--31-engines-sans-écran)
   - [3.3 Cron Jobs — 15 jobs sans monitoring](#33-cron-jobs--15-jobs-sans-monitoring)
7. [Partie 4 — Verticales SaaS (7 verticales)](#7-partie-4--verticales-saas)
8. [Partie 5 — Plan d'exécution en 11 sprints](#8-partie-5--plan-dexécution-en-11-sprints)
9. [Partie 6 — Métriques d'avancement](#9-partie-6--métriques-davancement)
10. [Corrections à apporter au plan initial](#10-corrections-à-apporter-au-plan-initial)
11. [Annexe — Fichiers immuables & invariants](#11-annexe--fichiers-immuables--invariants)

---

## 0. Périmètre généraliste vs restaurant

> **Ajouté le 2026-08-13** — session `teintes-finish-ui-plan`. Audit complet des vagues teintées (§8.6 — 6 vagues) + décision de base verticale généraliste.

Depuis la session §8.6, le **socle UI est devenu généraliste** : les mêmes composants s'adaptent automatiquement au `PlatformVariant` (`restaurant | hotel | bakery | garage | salon | clinic | retail | custom`) via trois mécanismes complémentaires.

### 0.1 Mécanisme 1 — MetricLabels (UX labels adaptatifs)

**Fichiers** : `src/verticals/_shared/labels.ts` + `src/verticals/_shared/labels.types.ts`

```ts
labelFor('unitPlural', variant)  // 'couverts' | 'chambres' | 'baies' | 'postes' | ...
labelFor('server', variant)       // 'serveur' | 'réceptionniste' | 'mécanicien' | ...
labelFor('spatialContext', variant) // 'salle' | 'étage' | 'atelier' | ...
```

**Composants généralisés en Phase 0 (2026-08-13)** — commit `a6ffafdcb` :

| Composant | Teinte supprimée | Remplacement |
|-----------|-----------------|--------------|
| `SimpleFloorPlanEditor` | `"couverts"` hardcodé × 2 | `labelFor('unitPlural', variant)` |
| `GroupFormModal` | `"Couverts min/max"` labels | `labelFor('unitPlural', variant)` |
| `ReservationCreateDialog` | `"Couverts"` label | `labelFor('unitPlural', variant)` |
| `useReservationsPage` | `restaurantName: "Restaurant OS"` | `tenantConfig?.name ?? ''` |
| `CampaignAttributionService` | `couverts: number` (interface + 3 refs) | `unitCount: number` |

### 0.2 Mécanisme 2 — TEMPLATES_BY_VARIANT (floor plan adaptatif)

**Fichier** : `src/modules/commerce/acquisition/onboarding/wizard/SimpleFloorPlanEditor.tsx`

```ts
const TEMPLATES_BY_VARIANT: Partial<Record<PlatformVariant, Template[]>> = {
  restaurant: RESTAURANT_TEMPLATES,  // Bistrot 20 / Restaurant 40 / Brasserie 80
  bakery:     RESTAURANT_TEMPLATES,  // Même structure que restaurant
  hotel:      HOTEL_TEMPLATES,       // Chambres par étage
  garage:     GARAGE_TEMPLATES,      // Baies d'atelier numérotées
  salon:      SALON_TEMPLATES,       // Postes de travail
  clinic:     SALON_TEMPLATES,       // Identique salon
};
```

### 0.3 Mécanisme 3 — FloorPlanProfile adaptatif par vertical

**Fichier** : `src/verticals/_shared/onboarding.ts` → `resolveFloorPlanProfile(variant)`

Chaque vertical exporte son `floorPlanProfile` depuis `src/verticals/<variant>/onboarding.ts`.
Aucun fichier `floorPlanProfiles.ts` séparé n'est nécessaire — la structure est déjà correcte et complète.

> **Vérification Étape 2 (audit 08/13)** : `verticals/restaurant/onboarding.ts` existe en tant que fichier (pas répertoire), exporte `floorPlanProfile = { spaceName: 'Table', zones: [Salle, Terrasse, Bar, Salon privé] }`. `_shared/onboarding.ts` dispatch par variant. ✅ Aucun fichier à créer.

### 0.4 Ce qui reste restaurant-spécifique (légitime)

| Composant / Feature | Raison |
|---------------------|--------|
| Zones "Salle/Terrasse/Bar/Salon privé" (FloorPlanEditor) | Zones typiques restauration |
| Modules HACCP : `ReleveTemperatures`, DLC, chaîne du froid | Obligation légale restauration |
| Modules KDS (`KDSDashboard`, `KDSTicket`) | Production cuisine uniquement |
| NF525 — `fiscalSeals`, Ticket Z | Obligation légale restauration/vente |
| `DailyPrepList`, `MiseEnPlaceTab` | Mise en place cuisine |
| `PlanDeVente`, `PlanJour` | Terminologie métier restauration |

### 0.5 Règle d'or (non négociable)

> Tout nouveau label UX visible utilisateur **doit** passer par `labelFor(key, variant)` — jamais de chaîne en dur "Couverts", "Restaurant", "Serveur" dans un composant partagé. Violation = teinture = sprint de refactoring.

---

## 1. Résumé exécutif chiffré

| Catégorie | Dénombrement | État |
|---|---|---|
| Composants TSX construits mais non câblés | ~~127~~ **→ ~109 composants** | 🔴 18 câblés depuis 08/09 — inventaire ci-dessous |
| Composants généralisés via MetricLabels | **5 composants** (Phase 0 08/13) | ✅ Généralisation base verticale complète |
| Routes existant hors `navConfig` (inaccessibles) | **17 routes** | 🔴 Corrigé de 13 → 17 après audit |
| Pages partiellement câblées (fonctions cachées) | **11 pages** | 🟠 Détaillées Partie 1 |
| Handlers d'événements sans feedback UI | **172 handlers** | 🟠 Priorités Partie 3.1 |
| Handlers DLQ aveugles (catch sans rethrow) | ~~6~~ **→ 1 corrigé** (08/13) | ✅ WasteToFoodCostHandler — rethrow ajouté |
| Engines métier sans écran de monitoring | **31 engines** | 🟠 Priorités Partie 3.2 |
| Cron jobs sans dashboard de supervision | **15 jobs** | 🟠 Priorités Partie 3.3 |
| Verticales SaaS sans route Next.js | **7 verticales** | 🟡 Ordre par ROI Partie 4 |
| Bugs Priorité 0 NF525 | **3 bugs → 3 ✅** | ✅ **Résolus commit `2acb5dab9`** |

---

## 2. Correctifs déjà livrés

Regroupés dans le commit **`2acb5dab9`** (branche `fix/coherence-ui-backend-securite`, non poussée).
**Ne pas refaire**, vérifier avant tout nouveau travail.

### 2.1 Sécurité & intégrité (relatifs à la verticale)

| Correctif | Fichier | Vérification |
|---|---|---|
| **Freeze POS** — `AnimatePresence mode="wait"` retiré | `src/modules/ops/service/pos/components/ProductGrid.tsx` | Changement de catégorie fluide |
| **Freeze POS** — référence `stockItems` stabilisée par `useMemo` | idem | Grille ne recalcule plus à chaque render |
| **Rapatriement POS** — 6 composants `commerce/ui/pos/` → `ops/service/pos/components/` | `CashDrawerModal`, `CourseManager`, `ModifierModal`, `PinModal`, `TipPanel`, `VoidModal` | 6 `eslint-disable no-restricted-imports` supprimés ; `commerce/ui/` n'existe plus |
| **`toMicrounits`** — validation runtime réelle | `src/shared/schemas/primitives.ts` | dev/test lève, prod normalise + journalise |
| **`crypto.integrity_failed`** — émetteur créé | `src/modules/finance/fiscalite/FiscalAdapter.ts` | 8 tests dans `src/e2e/vanguard/fiscal-breach-alert.test.ts` — vanguard 56 → **64/64** |
| **Cycle d'import** cassé | `src/lib/NexusSyncService.ts` | `VerticalRegistry`/`CoreContext` en import dynamique dans `init()` |
| **`audit_id`** — entropie 25 bits → UUID v4 | `src/lib/axiom.ts` | `crypto.randomUUID()` |
| **Doublon `NexusFiscalProvider`** supprimé | `src/shared/providers/finance/` supprimé | Le provider monté lit `fiscalSealsNodeAtom` |
| **20 handlers** — `throw` ajouté dans le `catch` | `src/shared/eventBus/handlers/` | La DLQ voit enfin les échecs |
| **Violation barrel** `ops → finance` | `src/modules/ops/domain/schemas/pos.ts` | Import via `@/modules/finance` |
| **Fuite cross-tenant** `tenantOverride` interdit côté serveur | `src/lib/nexus/NexusAdapter.ts` | Le setter lève hors navigateur |
| **Propriété snapshots** vérifiée | `src/modules/.../ImportSnapshotService.ts` | `assertOwnership()` sur `restore`/`delete`, filtrage sur `list` |
| **Accès anonyme RBAC** fermé (phase 1) | `src/shared/hooks/useActionPermission.ts` | Contrôle `!currentUser` remonté avant le cas « action non déclarée » |

### 2.2 État après commit

- `npx tsc --noEmit` → **0 erreur**
- Vanguard fiscal → **64/64** ✅
- Isolation multi-tenant → **8/8** ✅
- Suite globale → **292 échecs / 476 succès** (les 292 échecs sont ceux de la baseline `main` — bug Vitest 4 documenté dans `docs/PLAN_RESTE_A_FAIRE.md` chantier 1)

---

## 3. Bugs Priorité 0

Ces 3 bugs bloquaient la conformité NF525 ou injectaient de fausses données. **Tous corrigés** dans le commit `2acb5dab9`.

### ✅ C-01 : Deux `FiscalEngine` divergents — RÉSOLU

**Symptôme** : Le barrel `@/modules/finance` exportait `src/modules/finance/services/FiscalEngine.ts` qui utilisait `current.previousHash ?? ""` dans `verifyChain` — au lieu de `FISCAL_CONSTANTS.GENESIS_ROOT`. Le premier sceau de la chaîne avait donc un `previousHash` de `""`, non de `GENESIS_ROOT`, rendant `verifyChain` faux à la première vérification.

**Fix appliqué** :
- ❌ Supprimé : `src/modules/finance/services/FiscalEngine.ts`
- ✅ Source unique : `src/modules/finance/fiscalite/FiscalAdapter.ts`
- 📝 Barrel `src/modules/finance/index.ts` mis à jour

### ✅ C-02 : Hashes codés en dur dans `useFinanceReflex` — RÉSOLU

**Symptôme** : `src/modules/finance/hooks/useFinanceReflex.ts:38` injectait `hash: '1'.repeat(64)` et `hashPrecedent: '0'.repeat(64)` dans le journal NF525 — des faux hashes qui corrompaient la chaîne fiscale.

**Fix appliqué** : `useFinanceReflex.ts` écoute désormais `inventory.waste_logged` et émet proprement `finance.food_cost_impacted` (pas d'injection directe de faux hashes).

### ✅ C-03 : `RestaurantVertical.initialize()` jamais appelée à runtime — RÉSOLU

**Symptôme** : `RestaurantVertical.initialize()` n'était appelée que pendant le provisioning (`ProvisioningEngine`, `TenantProvisioningService`). À runtime, la verticale restaurant n'était jamais activée — ses adapters `RestaurantOpsAdapter` et `RestaurantCommerceAdapter` n'étaient pas montés.

**Fix appliqué** : `NexusSyncService.init()` invoque le plugin vertical au sync du tenant via `VerticalRegistry.resolve(variant).initialize(new CoreContext())`.

---

## 4. Partie 1 — Pages existantes sous-exploitées

Ces pages sont dans la nav et se chargent, mais n'exposent qu'une **fraction** des composants construits.

### 1.1 HACCP / Qualité (`/haccp`)

**Ce qui est affiché aujourd'hui** (9 onglets) :
- `ReleveTemperatures`, `GestionHuiles`, `PlanNettoyage`, `GestionAnomalies`
- `ProductControlList`, `SanitaryReport`, `CleaningPlan`, `DLCTracker`, `NonConformityForm`

**Ce qui est construit mais invisible** (29 composants) :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| ✅ `TracabiliteEtiquettes` | `qualite/haccp/components/TracabiliteEtiquettes.tsx` | Impression étiquettes DLC directement depuis HACCP |
| ✅ `WasteManagementHACCP` | `qualite/haccp/components/WasteManagementHACCP.tsx` | Tableau de bord gaspillage alimentaire (AGEC) |
| `BatchLabelGenerator` | `qualite/haccp/components/BatchLabelGenerator.tsx` | Génération étiquettes lot par lot |
| `CorrectiveActionModal` | `qualite/haccp/components/quality/CorrectiveActionModal.tsx` | Modal plan d'action correctif sur NC |
| `CriticalThresholdAlert` | `qualite/haccp/components/quality/CriticalThresholdAlert.tsx` | Alerte seuil critique temps réel |
| `DLCAlertBadge` | `qualite/haccp/components/quality/DLCAlertBadge.tsx` | Badge alerte DLC sur produits |
| `DeliveryItemRow` | `qualite/haccp/components/quality/DeliveryItemRow.tsx` | Ligne de contrôle réception marchandises |
| `DigitalSignature` | `qualite/haccp/components/quality/DigitalSignature.tsx` | Signature numérique rapports HACCP |
| `FreshnessRating` | `qualite/haccp/components/quality/FreshnessRating.tsx` | Notation fraîcheur produits (visuel) |
| `HACCPBadge` | `qualite/haccp/components/quality/HACCPBadge.tsx` | Badge conformité HACCP sur produits |
| `HACCPGauge` | `qualite/haccp/components/quality/HACCPGauge.tsx` | Jauge score HACCP global |
| `HACCPVisionScanner` | `qualite/haccp/components/quality/HACCPVisionScanner.tsx` | Scanner visuel IA produits (Gemini Vision) |
| `NF525SelfAudit` | `qualite/haccp/components/quality/NF525SelfAudit.tsx` | Auto-audit NF525 depuis HACCP |
| `NCStatusBadge` | `qualite/haccp/components/quality/NCStatusBadge.tsx` | Badge statut non-conformité |
| `ProductControlCard` | `qualite/haccp/components/quality/ProductControlCard.tsx` | Carte contrôle produit (scan + verdict) |
| ✅ `QualityDashboardHeader` | `qualite/haccp/components/quality/QualityDashboardHeader.tsx` | Header dashboard qualité avec KPIs |
| `ReceptionMarchandises` | `qualite/haccp/components/quality/ReceptionMarchandises.tsx` | Wizard réception marchandises complet |
| `ReceptionSummary` | `qualite/haccp/components/quality/ReceptionSummary.tsx` | Récap réception (scores, alertes) |
| ✅ `ReceptionWizard` | `qualite/haccp/components/quality/ReceptionWizard.tsx` | Wizard étape-par-étape réception |
| `SupplierAuditForm` | `qualite/haccp/components/quality/SupplierAuditForm.tsx` | Audit fournisseur complet |
| `TemperatureCard` | `qualite/haccp/components/quality/TemperatureCard.tsx` | Carte température sonde IoT |
| `TemperatureGauge` | `qualite/haccp/components/quality/TemperatureGauge.tsx` | Jauge température visuelle |
| `TraceabilityLog` | `qualite/haccp/components/quality/TraceabilityLog.tsx` | Journal traçabilité lot → assiette |
| `VisualCheckGrid` | `qualite/haccp/components/quality/VisualCheckGrid.tsx` | Grille de contrôle visuel (photos) |
| `VisualInspection` | `qualite/haccp/components/quality/VisualInspection.tsx` | Module inspection visuelle avec IA |
| `ComplianceCalendar` | `qualite/calendar/ComplianceCalendar.tsx` | Calendrier plannings conformité |
| ✅ `RecallView` | `qualite/recall/RecallView.tsx` | Vue rappels produits (DGCCRF) |
| `ElevationPrompt` | `securite/audit/ElevationPrompt.tsx` | Demande élévation de droits contextuelle |
| `OverrideLogView` | `securite/audit/OverrideLogView.tsx` | Journal des overrides sécurité |

**Plan d'action** → [Sprint 3 — HACCP Avancé](#sprint-3--haccp-avancé-semaine-5-6)

---

### 1.2 Plan de Salle (`/floor-plan`)

**Ce qui est affiché** : `FloorPlanEditor` de base (drag tables)

**Ce qui est construit mais invisible** (10 éléments) :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `EditPanel` | `facility/spaces/floor-plan/EditPanel.tsx` | Panneau édition propriétés table (couleur, forme, couverts) |
| `TableChairs` | `facility/spaces/floor-plan/TableChairs.tsx` | Rendu visuel chaises autour de la table |
| `TableInsightPanel` | `facility/spaces/floor-plan/TableInsightPanel.tsx` | Panel métriques par table (CA moyen, rotation) |
| `ZoneRenderer` | `facility/spaces/floor-plan/ZoneRenderer.tsx` | Rendu de zone (terrasse, salle, privé) |
| `FloorArchitecture` | `facility/spaces/settings/FloorArchitecture.tsx` | Config architecturale (murs, portes) |
| `MobilierConfig` | `facility/spaces/settings/MobilierConfig.tsx` | Catalogue mobilier (tables, chaises) |
| `RolesPermissionsPanel` | `facility/spaces/settings/RolesPermissionsPanel.tsx` | Permissions par zone (staff vs client) |
| `TablesToolbar` | `facility/spaces/settings/TablesToolbar.tsx` | Barre outils tables (aligner, distribuer) |
| `ZoneService` | `facility/spaces/settings/ZoneService.tsx` | CRUD zones (service TS, pas un composant React) |
| `useFloorPlan` | `facility/spaces/hooks/useFloorPlan.tsx` | Hook état plan de salle (sélection, drag) |

**Plan d'action** → [Sprint 5 — Plan de Salle Complet](#sprint-5--plan-de-salle-complet-semaine-9-10)

---

### 1.3 Réservations (`/reservations`)

**Ce qui est affiché** : calendrier principal + liste réservations

**Ce qui est construit mais invisible** (12 composants) :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `CustomerListView` | `commerce/relation/reservations/components/CustomerListView.tsx` | Vue clients avec historique réservations |
| `FloorPlanView` | `commerce/relation/reservations/components/FloorPlanView.tsx` | Plan de salle dans réservations (placement) |
| `NewReservationDialog` | `commerce/relation/reservations/components/NewReservationDialog.tsx` | Dialog création réservation complète |
| `ReservationCalendarPopup` | `commerce/relation/reservations/components/ReservationCalendarPopup.tsx` | Popover calendrier inline |
| `ReservationToolbar` | `commerce/relation/reservations/components/ReservationToolbar.tsx` | Barre d'outils filtres/actions |
| Event Quote sections (3) | `reservations/event-quote/` | Devis événements privatisation |
| Settings sections (4) | `reservations/settings/` | Config rappels, canaux, politiques |

**Plan d'action** → [Sprint 6 — Réservations Avancées](#sprint-6--réservations-avancées-semaine-11-12)

---

### 1.4 Finance (`/finance`)

**Ce qui est affiché** : 5 onglets (Comptabilité, Facturation, Banque, Trésorerie, Audit)

**Ce qui est construit mais invisible dans les onglets** (9 éléments) :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| ❌ `BalanceSheetView` | `finance/components/accounting/views/BalanceSheetView.tsx` | Bilan comptable (Actif/Passif) |
| ❌ `GeneralLedgerView` | `finance/components/accounting/views/GeneralLedgerView.tsx` | Grand-livre comptable |
| ❌ `JournalEntriesView` | `finance/components/accounting/views/JournalEntriesView.tsx` | Vue journal comptable filtrée |
| ❌ `ProfitLossView` | `finance/components/accounting/views/ProfitLossView.tsx` | Compte de résultat |
| ✅ `FiscalAuditView` | `finance/components/accounting/FiscalAuditView.tsx` | Vue audit fiscal NF525 détaillé — câblé AuditTab |
| ✅ `TreasuryDashboard` | `finance/components/accounting/TreasuryDashboard.tsx` | Dashboard trésorerie — câblé AccountingTab |
| `ExpenseClaimDialog` | `finance/components/accounting/ExpenseClaimDialog.tsx` | Note de frais (accessible via bouton) |
| ✅ `FacturXDownloadButton` | `finance/components/FacturXDownloadButton.tsx` | Téléchargement Factur-X — câblé BillingTab |
| `NexusFiscalProvider` | `finance/providers/NexusFiscalProvider.tsx` | Context fiscal (⚠️ non monté dans l'arbre) |

> **Note** : `AccountingTab`, `BillingTab`, `AuditTab`, `BankTab` sont chargés dynamiquement depuis `FinanceDashboard.tsx` — ils sont techniquement connectés mais leurs sous-vues internes (`BalanceSheetView`, etc.) ne sont pas câblées.

**Plan d'action** → [Sprint 4 — Finance Complète](#sprint-4--finance-complète-semaine-7-8)

---

### 1.5 Cuisine / KDS (`/kds` + `/kitchen`)

**Ce qui est affiché** : `KDSDashboard` + `KitchenDashboard` (état actuel des commandes)

**Ce qui est construit mais invisible** (25 composants) :

#### KDS — Tickets & Interface Production (6)

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| ✅ `KDSEmptyState` | `ops/production/kds/components/KDSEmptyState.tsx` | État vide KDS — câblé KDSDashboard |
| ✅ `KDSHeader` | `ops/production/kds/components/KDSHeader.tsx` | Header KDS avec compteurs — câblé KDSDashboard |
| ✅ `KDSTicket` | `ops/production/kds/components/KDSTicket.tsx` | Ticket commande KDS — câblé KDSDashboard |
| `KDSContextDrawer` | `ops/production/kds/components/kds-ticket/KDSContextDrawer.tsx` | Drawer contexte commande (historique table) |
| `KDSItemCard` | `ops/production/kds/components/kds-ticket/KDSItemCard.tsx` | Carte item KDS (avec modifs, allergènes) |
| `KDSSortableItem` | `ops/production/kds/components/kds-ticket/KDSSortableItem.tsx` | Item drag-to-reorder (DnD Kit) |

#### Éditeur Recettes — 8 onglets non montés

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| ❌ `RecipeBasicsTab` | `ops/production/kitchen/components/recipe-editor/RecipeBasicsTab.tsx` | Infos de base recette |
| `RecipeCompositionTab` | `ops/production/kitchen/components/recipe-editor/RecipeCompositionTab.tsx` | Composition ingrédients |
| `RecipeProtocolTab` | `ops/production/kitchen/components/recipe-editor/RecipeProtocolTab.tsx` | Protocole préparation étape-par-étape |
| `RecipeAnalyticTab` | `ops/production/kitchen/components/recipe-editor/RecipeAnalyticTab.tsx` | Analytics recette (marge, popularité) |
| `AllergensTab` | `ops/production/kitchen/components/tabs/AllergensTab.tsx` | Gestionnaire allergènes (14 EU) |
| `IngredientsTab` | `ops/production/kitchen/components/tabs/IngredientsTab.tsx` | Liste ingrédients avec coûts |
| `MarginsTab` | `ops/production/kitchen/components/tabs/MarginsTab.tsx` | Analyse marge recette |
| `MiseEnPlaceTab` | `ops/production/kitchen/components/tabs/MiseEnPlaceTab.tsx` | Planning mise en place |
| `CookingTimesTab` | `ops/production/kitchen/components/tabs/CookingTimesTab.tsx` | Temps de cuisson par poste |
| `RecipesTab` | `ops/production/kitchen/components/tabs/RecipesTab.tsx` | Liste recettes du poste |
| `SuppliersTab` | `ops/production/kitchen/components/tabs/SuppliersTab.tsx` | Fournisseurs par ingrédient |
| `WasteTab` | `ops/production/kitchen/components/tabs/WasteTab.tsx` | Gaspillage par recette |

#### Outils Cuisine Avancés

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `ModificationAlerts` | `ops/production/kitchen/components/ModificationAlerts.tsx` | Alertes modifications commande en cours |
| `PlateAuditWizard` | `ops/production/kitchen/components/PlateAuditWizard.tsx` | Wizard audit assiette (photo + IA Gemini) |
| `PrepTaskDetailDialog` | `ops/production/kitchen/components/PrepTaskDetailDialog.tsx` | Détail tâche de préparation |
| `RecipeTechnicalSheet` | `ops/production/kitchen/components/RecipeTechnicalSheet.tsx` | Fiche technique recette (impression PDF) |
| `BarRecipeCard` | `ops/production/recipes/BarRecipeCard.tsx` | Carte recette bar (cocktail) |
| `DailyPrepList` | `ops/production/recipes/DailyPrepList.tsx` | Liste prépa quotidienne auto-générée |
| `RecipeCostBadge` | `ops/production/recipes/RecipeCostBadge.tsx` | Badge coût matière recette |

**Plan d'action** → [Sprint 2 — KDS & Cuisine](#sprint-2--kds--cuisine-semaine-3-4)

---

### 1.6 POS (`/pos`)

**Ce qui est affiché** : grille produits, panier, paiement, tables — **fluidifié** par le commit `2acb5dab9`.

**Ce qui est construit mais invisible** (8 composants) :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| ✅ `CashCounterModal` | `ops/service/pos/components/CashCounterModal.tsx` | Comptage caisse — câblé ProductGrid |
| `CategoryList` | `ops/service/pos/components/CategoryList.tsx` | Liste catégories sidebar (alternative à la grille) |
| `ProductDetailsDialog` | `ops/service/pos/components/ProductDetailsDialog.tsx` | Détail produit client (photo, allergènes, modifs) |
| `ProductBarFields` | `ops/service/pos/components/product-form/ProductBarFields.tsx` | Champs bar (alcool, température) |
| `ProductBasicDetails` | `ops/service/pos/components/product-form/ProductBasicDetails.tsx` | Nom, description, catégorie (édition) |
| `ProductFinancials` | `ops/service/pos/components/product-form/ProductFinancials.tsx` | Prix, TVA, coût matière |
| `ProductIngredients` | `ops/service/pos/components/product-form/ProductIngredients.tsx` | Lien recette ↔ ingrédients |
| `ProductSteps` | `ops/service/pos/components/product-form/ProductSteps.tsx` | Étapes de préparation produit |

> ✅ **Livré par le commit `2acb5dab9`** : freeze fluidifié + rapatriement des 6 modales POS depuis `commerce/ui/pos/` vers `ops/service/pos/components/`. Le POS ne traverse plus deux piliers.

---

### 1.7 Intelligence / Analytics (`/intelligence` + `/analytics`)

**Ce qui est affiché** : dashboards analytics de base

**Ce qui est construit mais invisible** (8 composants) :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| ✅ `OracleChatDrawer` | `intelligence/analytique/analytics/components/OracleChatDrawer.tsx` | Chat NL → SQL — câblé ClientComponents (lazy) |
| `OraclePredictor` | `intelligence/analytique/analytics/components/OraclePredictor.tsx` | Prédictions IA (CA, fréquentation 7 jours) |
| ❌ `DirectorFlashReport` | `intelligence/analytique/components/DirectorFlashReport.tsx` | Flash report directeur (quotidien, hebdo) |
| ✅ `ConnectorCard` | `intelligence/connectors/hub/components/ConnectorCard.tsx` | Carte connecteur — câblé IntegrationsPage |
| `ConnectorConfigModal` | `intelligence/connectors/hub/components/ConnectorConfigModal.tsx` | Configuration connecteur tiers |
| ✅ `ConnectorStatusBadge` | `intelligence/connectors/hub/components/ConnectorStatusBadge.tsx` | Badge statut — câblé IntegrationsPage |
| `AIStatusBanner` | `intelligence/ia/resilience/AIStatusBanner.tsx` | Bannière statut IA (dégradé/ok) |
| ✅ `NexusFleetProvider` | `intelligence/ia/fleet/NexusFleetProvider.tsx` | Provider flotte IA — câblé NexusProviderStack |

**Plan d'action** → [Sprint 7 — Intelligence & Analytics](#sprint-7--intelligence--analytics-semaine-13-14)

---

### 1.8 Inventaire / Logistique (`/inventory`)

**Ce qui est affiché** : liste stocks, alertes DLC, réceptions

**Ce qui est construit mais invisible** (7 composants) :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `InventoryInlineModals` | `logistics/stock/inventory/components/InventoryInlineModals.tsx` | Modals inline (ajustement, mouvement) |
| `InvoiceReviewModal` | `logistics/stock/inventory/components/inventory/InvoiceReviewModal.tsx` | Révision facture fournisseur (OCR) |
| `DraggableIngredient` | `logistics/stock/inventory/components/storage-map/DraggableIngredient.tsx` | Drag ingrédient dans carte de stockage |
| `DraggingIngredientOverlay` | `logistics/stock/inventory/components/storage-map/DraggingIngredientOverlay.tsx` | Overlay drag-over (DnD) |
| `DroppableStorageCard` | `logistics/stock/inventory/components/storage-map/DroppableStorageCard.tsx` | Zone de stockage droppable |
| `StorageDetailBubble` | `logistics/stock/inventory/components/storage-map/StorageDetailBubble.tsx` | Bulle détail zone de stockage |
| `SupplierProductAutocomplete` | `logistics/connectors/suppliers/SupplierProductAutocomplete.tsx` | Autocomplétion produits catalogue fournisseurs |

---

### 1.9 RH / Staff (`/staff`)

**Ce qui est affiché** : 4 onglets (équipe, planning, congés, recrutement)

**Ce qui est construit mais invisible** (5 composants) :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| ✅ `PaySlipViewer` | `human/effectifs/hr/components/PaySlipViewer.tsx` | Visualiseur fiches de paie — câblé StaffPortal |
| ✅ `StaffPortal` | `human/effectifs/hr/components/StaffPortal.tsx` | Portail self-service — câblé /mon-espace |
| `ShiftEditModal` | `human/effectifs/hr/components/planning/ShiftEditModal.tsx` | Modal édition shift planning |
| `CandidateModal` | `human/effectifs/hr/components/staff/CandidateModal.tsx` | Fiche candidat recrutement |
| `StaffAuditLog` | `human/effectifs/hr/components/staff/StaffAuditLog.tsx` | Journal audit actions staff (RGPD) |

---

### 1.10 Marketing / SEO (`/marketing`)

**Ce qui est affiché** : onglets campagnes, SEO, devis

**Ce qui est construit mais invisible** (13 composants) :

#### CRM, Campagnes & Réseaux Sociaux

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `InsightsConsole` | `commerce/acquisition/marketing/components/InsightsConsole.tsx` | Console insights (performance posts, reach) |
| `CRMContactForm` | `commerce/acquisition/marketing/components/CRMContactForm.tsx` | Formulaire contact CRM depuis marketing |
| `LoyaltyCard` | `commerce/acquisition/marketing/components/LoyaltyCard.tsx` | Carte fidélité digitale |
| `CampaignCard` | `commerce/acquisition/marketing/components/CampaignCard.tsx` | Carte campagne avec métriques |
| `NewPostModal` | `commerce/acquisition/marketing/components/NewPostModal.tsx` | Modal nouveau post réseaux sociaux |
| `NewSegmentModal` | `commerce/acquisition/marketing/components/NewSegmentModal.tsx` | Modal nouveau segment CRM |
| `ScheduledPostItem` | `commerce/acquisition/marketing/components/ScheduledPostItem.tsx` | Item post planifié |
| `SegmentCard` | `commerce/acquisition/marketing/components/SegmentCard.tsx` | Carte segment (taille, critères) |
| `SocialAccountCard` | `commerce/acquisition/marketing/components/SocialAccountCard.tsx` | Carte compte réseau social connecté |

#### SEO

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `GoogleProfileCard` | `commerce/acquisition/seo/GoogleProfileCard.tsx` | Fiche Google Business Profile |
| `KeywordsCard` | `commerce/acquisition/seo/KeywordsCard.tsx` | Carte mots-clés SEO (position, volume) |
| `PageCard` | `commerce/acquisition/seo/PageCard.tsx` | Carte page web (score SEO, actions) |
| `ScoreGauge` | `commerce/acquisition/seo/ScoreGauge.tsx` | Jauge score SEO global |

---

### 1.11 Onboarding / Migration (`/onboarding` + `/migration`)

> ⚠️ **Correction du plan initial** : `/onboarding` **n'est PAS un stub**. `src/app/(client)/(ops)/onboarding/page.tsx` rend `OnboardingWizard` qui câble déjà `ProgressStepper`, `SourceSystemSelector`, `ConnectorOAuthPanel`, `ImportCategoryPanel`, `SimpleFloorPlanEditor`, `OnboardingHelpButton`. Seuls `OCRUploadZone` et `PreviewTable` restent non montés.

**Composants du wizard onboarding déjà câblés** :
- `ProgressStepper`, `SourceSystemSelector`, `ConnectorOAuthPanel`
- `ImportCategoryPanel`, `SimpleFloorPlanEditor`, `OnboardingHelpButton`

**Composants restant à câbler (2)** :
- `OCRUploadZone` — Zone upload OCR (menus, fiches)
- `PreviewTable` — Tableau prévisualisation import

**Composants disponibles pour extension** (via `commerce/onboarding/`) :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `ExportGuidePanel` | `commerce/onboarding/ExportGuidePanel.tsx` | Guide export depuis l'ancien système |
| `CSVTemplateDownloads` | `commerce/onboarding/CSVTemplateDownloads.tsx` | Téléchargement templates CSV prêts |
| `FECImportPanel` | `commerce/onboarding/FECImportPanel.tsx` | Import FEC (Fichier Écritures Comptables) |
| `FloorPlanSetupWizard` | `commerce/onboarding/FloorPlanSetupWizard.tsx` | Wizard configuration plan complet |
| `OnboardingProgress` | `commerce/onboarding/OnboardingProgress.tsx` | Barre progression + résumé |
| `UniversalImportDropzone` | `commerce/onboarding/UniversalImportDropzone.tsx` | Zone drag-drop import universel |
| `BatchTableForm` | `commerce/onboarding/BatchTableForm.tsx` | Création tables en lot |

---

## 5. Partie 2 — Routes hors navigation

Ces pages existent dans Next.js mais n'ont **aucune entrée** dans `src/config/navConfig.ts` — inaccessibles sans URL directe.

> ⚠️ **Correction du plan initial** : la liste réelle est de **17 routes**, pas 13 :
> - `/pos-mobile` et `/mon-espace` **sont** dans `navConfig` (lignes 243-244) ✅
> - S'ajoutent à la liste : `/staff`, `/planning`, `/leaves`, `/recruitment` (accessibles uniquement par `?tab=` depuis `navConfig`)

### 5.1 Vraiment inaccessibles (priorités hautes)

| Route | Priorité | Ce qui manque |
|-------|----------|---------------|
| `/nf525` | 🔴 P0 | Entrée `navConfig` Finance > Audit fiscal ✅ **FAIT commit 2acb5dab9** |
| `/migration` | 🟠 P1 | Entrée `navConfig` + câblage wizard (15 composants) |
| `/menu-engineering` | 🟠 P2 | Lien depuis `/kitchen` ou `/menu-builder` |
| `/timeclock` | 🟠 P2 | Entrée `navConfig` section RH |
| `/aide` | 🟡 P2 | Bouton ? dans header, toutes pages |
| `/vanguard-simulator` | 🟡 P3 | Accès admin uniquement (MCC) |

### 5.2 Routes publiques (absence de nav normale)

| Route | Nature |
|-------|--------|
| `/` | Root |
| `/login`, `/signup`, `/auth/logout` | Auth |
| `/showcase`, `/landing`, `/welcome` | Marketing tenant |

### 5.3 Accessibles via query param uniquement (route directe manquante)

| Route | Actuellement | À ajouter |
|-------|-------------|-----------|
| `/staff` | Route directe absente | Route + deep link |
| `/planning` | Via `/staff?tab=planning` | Route directe + notif planning |
| `/leaves` | Via `/staff?tab=leaves` | Route directe + notif congés |
| `/recruitment` | Via `/staff?tab=recruitment` | Route directe + email candidats |

### 5.4 ICM TaskContext manquant

15 routes n'ont pas d'*importance map* déclarée dans `src/lib/icm/TaskContext.ts` et retombent sur `TASK_MAPS.default` — chargent plus de données que nécessaire.

```
/nf525   /migration   /onboarding   /integrations   /menu-engineering
/aide    /landing     /showcase     /welcome        /signup
/login   /marketing/seo             /vanguard-simulator
/auth/logout          /
```

**Cas le plus coûteux** : `/nf525` — page d'audit fiscal qui charge la map par défaut au lieu de cibler `finance` + `compliance`.

---

## 6. Partie 3 — Services backend sans UI

### 3.1 Event Bus — 165 handlers silencieux

**Aucun handler n'a de feedback visuel en production.** Tous opèrent silencieusement. Les plus critiques à exposer :

| Handler | Événement | UI manquante |
|---------|-----------|--------------|
| `DLQQuarantineAlertHandler` | `DLQ_QUARANTINE` | Toast + badge rouge dans header |
| `OvertimeAlertHandler` | `OVERTIME_ALERT` | Notification RH en temps réel |
| `NoShowCRMHandler` | `NO_SHOW` | Action CRM suggérée (SMS automatique ?) |
| `NoShowHandler` | `NO_SHOW` | Libération table + alerte |
| `CryptoIntegrityHandler` | `NF525_BREACH` | Alerte critique dashboard admin ✅ **émetteur livré 2acb5dab9** |
| `TicketZHandler` | `TICKET_Z` | Confirmation clôture Z |
| `OutboxProcessor` | (tous) | Monitoring Outbox (messages en attente) |

> ⚠️ **54 handlers** écoutent des événements que **personne n'émet** (bus débranché).
> Détails et méthode dans `docs/PLAN_RESTE_A_FAIRE.md` chantier 2.

### 3.2 Engines Métier — 31 engines sans écran

| Engine | Module | UI manquante |
|--------|--------|--------------|
| `ReservationEngine` | commerce/relation | Visualisation état machine réservation |
| `LoyaltyEngine` | commerce/fidelite | Tableau de bord points fidélité client |
| `QuoteEngine` | commerce/fidelite | Suivi devis (envoyé / accepté / converti) |
| `PricingEngine` | commerce/relation | Règles de prix dynamique |
| `RecipeEngine` | ops/production | Coût matière live (recette ↔ stock) |
| `MenuEngineeringEngine` | ops/production | Matrice popularité × marge (4 quadrants) |
| `WorkflowEngine` | ops/workflow | Visualisation workflows actifs |
| `PayrollEngine` | human/remuneration | Calcul paie (pas de prévisualisation) |
| `TimeclockEngine` | human/effectifs | Suivi pointages (décompte temps réel) |
| `StockEngine` | logistics/stock | Mouvements stock temps réel |
| `ProcurementEngine` | logistics/appro | Commandes fournisseurs (statut) |
| `IoTMonitorEngine` | compliance/qualite | Monitoring sondes IoT (temps réel) |
| `AuditTrailEngine` | compliance/securite | Journal audit complet |
| `FiscalBridgeEngine` | finance/fiscalite | Chaîne NF525 (vérification + audit) |
| `BankReconciliationEngine` | finance/tresorerie | Rapprochement bancaire |

### 3.3 Cron Jobs — 15 jobs sans monitoring

| Job | Fréquence | UI manquante |
|-----|-----------|--------------|
| `DLCExpiryJob` | Quotidien | Dashboard DLC avec alertes |
| `QuoteReminderJob` | Hebdo | Suivi devis en attente |
| `IotOfflineMonitor` | 5 min | Alertes sondes IoT déconnectées |
| `OutboxRetryJob` | 2 min | File d'attente messages (monitoring) |
| `FiscalArchiveJob` | Mensuel | Téléchargement archives fiscales |
| `PayrollExportJob` | Mensuel | Export DSN/paie |
| `BankSyncJob` | Quotidien | Statut synchronisation bancaire |
| `InventoryAlertJob` | Quotidien | Alertes stock bas (dashboard) |
| `ReservationReminderJob` | Continu | Rappels SMS/email réservations |
| `NoShowEscalationJob` | Réel | Escalade no-show (CRM) |

---

## 7. Partie 4 — Verticales SaaS

Ces verticales ont des composants construits mais **aucune route** dans le router Next.js. Ordre par ROI estimé :

| Ordre | Verticale | Composants construits | Ce qui manque |
|-------|-----------|----------------------|---------------|
| 1 | **Retail** ★★★★★ | `CatalogPage`, `PromotionsPage`, `RetailStockPage`, `RetailPOSPage`, `ReturnsPage` | Routes `/retail/*` + layout vertical |
| 2 | **Bakery** ★★★★☆ | `PreorderManagement`, `AllergenRegistry`, `DisplayStockPage`, `BatchProductionDashboard` | Routes `/bakery/*` + précommandes |
| 3 | **Hotel** ★★★☆☆ | `PMSDashboard` | Routes PMS + intégration channel manager |
| 4 | **Salon** ★★★☆☆ | `AppointmentCalendar`, `StylistDashboard`, `CabinStockPage` | Routes `/salon/*` + booking rendez-vous |
| 5 | **Garage** ★★☆☆☆ | `GarageDashboard`, `GarageStatCard` | Routes `/garage/*` + OR |
| 6 | **Clinic** ★★☆☆☆ | `ClinicDashboard` | Routes `/clinic/*` + RPPS |
| 7 | **Custom** | — | Framework vertical custom |

> **Rappel des 3 tiers par verticale** (voir `docs/versionbase.md`) :
> Chaque verticale dispose de 3 tenants système — `_demo_{variant}`, `_test_{variant}`, `_ref_{variant}` — soit **24 tenants système au total**.
> - **DEMO** : vitrine prospect, Simulacra Mode
> - **TEST** : bac à sable dev, seul tier acceptant les écritures directes
> - **REFERENCE** : maître cloneable pour nouveaux clients, écriture bloquée sauf promotion MCC

---

## 8. Partie 5 — Plan d'exécution en 11 sprints

### Sprint 1 — Fondations & Bugs P0 (semaine 1-2)

> ✅ **Sprint entièrement livré** dans le commit `2acb5dab9`.

**Objectif atteint** : Bugs critiques corrigés, `/nf525` accessible.

#### ✅ Tâche 1.1 — Fix C-01 : Unifier FiscalEngine
- Supprimé : `src/modules/finance/services/FiscalEngine.ts`
- Barrel `src/modules/finance/index.ts` pointe désormais sur `fiscalite/FiscalAdapter.ts`
- Critère validé : **56 → 64/64 tests vanguard** (+8 tests intégrité chaîne)

#### ✅ Tâche 1.2 — Fix C-02 : Supprimer faux hashes de useFinanceReflex
- Faux hashes `'1'.repeat(64)` et `'0'.repeat(64)` supprimés
- `useFinanceReflex.ts` écoute `inventory.waste_logged` et émet `finance.food_cost_impacted`

#### ✅ Tâche 1.3 — Fix C-03 : Activer RestaurantVertical à runtime
- `NexusSyncService.init()` invoque `VerticalRegistry.resolve(variant).initialize(new CoreContext())`
- `RestaurantOpsAdapter` et `RestaurantCommerceAdapter` désormais montés à runtime

#### ✅ Tâche 1.4 — Ajouter `/nf525` à navConfig
- Entrée ajoutée : `{ label: "Export FEC / NF525", key: "nf525_export", href: "/nf525", icon: ScrollText, category: "accounting", requiredCapability: "mod_accounting_management" }`

---

### Sprint 2 — KDS & Cuisine (semaine 3-4)

**Objectif** : Le KDS devient un vrai écran de production avec tous ses composants (25 composants à câbler).

#### ✅ Tâche 2.1 — KDSDashboard complet — LIVRÉ (post 08/09)
**Fichier** : `src/modules/ops/production/kds/components/KDSDashboard.tsx`

`KDSTicket`, `KDSHeader`, `KDSEmptyState` câblés dans `KDSDashboard`. Reste : `KDSContextDrawer`, `KDSItemCard`, `KDSSortableItem`.

#### Tâche 2.2 — Éditeur Recettes complet
**Fichier** : `src/app/(client)/(ops)/kitchen/page.tsx`

Actions :
1. Ajouter bouton "Modifier la recette" → ouvre un dialog avec les 8 onglets :
   - `RecipeBasicsTab`, `RecipeCompositionTab`, `RecipeProtocolTab`, `RecipeAnalyticTab`
   - `AllergensTab`, `IngredientsTab`, `MarginsTab`, `WasteTab`
2. Ajouter `RecipeTechnicalSheet` avec bouton d'impression PDF
3. Ajouter `ModificationAlerts` en overlay (commandes avec modif en cours)

#### Tâche 2.3 — Printers : Wizard d'ajout
**Fichier** : `src/app/(client)/(ops)/settings/page.tsx`

Actions :
1. Ajouter `AddPrinterWizard` (2 étapes : `ConfigureStep` + test)

---

### Sprint 3 — HACCP Avancé (semaine 5-6)

**Objectif** : La page HACCP devient un vrai outil métier complet (29 composants à câbler).

#### Tâche 3.1 — Onglet "Réception Marchandises"
```
Page: /haccp?tab=reception
Composants: ReceptionWizard → ReceptionSummary → DeliveryItemRow + SupplierAuditForm
Flow: scan produit → contrôle température → VisualCheckGrid → signature DigitalSignature
```

#### Tâche 3.2 — Onglet "Traçabilité"
```
Page: /haccp?tab=tracabilite
Composants: TraceabilityLog + TracabiliteEtiquettes + BatchLabelGenerator
Flow: lot → affichage log → impression étiquettes
```

#### Tâche 3.3 — Onglet "Gaspillage"
```
Page: /haccp?tab=waste
Composants: WasteManagementHACCP
✅ Le bridge HACCP → FiscalSealer est corrigé (fix C-02 livré)
```

#### Tâche 3.4 — KPIs HACCP dans le header
```
Composants: QualityDashboardHeader + HACCPGauge + CriticalThresholdAlert
Position: header de la page HACCP (remplace le h1 basique actuel)
```

#### Tâche 3.5 — Audit sécurité
```
Page: /haccp?tab=audit
Composants: NF525SelfAudit + ElevationPrompt + OverrideLogView
```

#### Tâche 3.6 — Rappels produits
```
Page: /haccp?tab=recalls  (nouvelle entrée nav)
Composant: RecallView
Câblage: DLCAlertJob + DGCCRF feed
```

---

### Sprint 4 — Finance Complète (semaine 7-8)

**Objectif** : Exposer les 9 vues comptables construites.

#### Tâche 4.1 — AccountingTab : sous-navigation interne
```
Fichier: src/modules/finance/components/_tabs/AccountingTab.tsx
Ajouter sous-onglets :
  - "Vue d'ensemble" → SimpleDashboardView (actuel)
  - "Grand Livre" → GeneralLedgerView
  - "Journal" → JournalEntriesView
  - "P&L" → ProfitLossView
  - "Bilan" → BalanceSheetView
```

#### ✅ Tâche 4.2 — AuditTab : vue NF525 détaillée — LIVRÉ (post 08/09)
`FiscalAuditView` câblé dans `AuditTab`.

#### Tâche 4.3 — Monter NexusFiscalProvider
```
Fichier: src/app/(client)/layout.tsx ou NexusOpsProvider.tsx
Action: <NexusFiscalProvider> doit wrapper les pages finance
⚠️ Actuellement non monté dans l'arbre React
```

#### ✅ Tâche 4.4 — FacturXDownloadButton — LIVRÉ (post 08/09)
`FacturXDownloadButton` câblé dans `BillingTab`.

---

### Sprint 5 — Plan de Salle Complet (semaine 9-10)

**Objectif** : Le floor plan devient un outil de gestion réel (10 composants à câbler).

#### Tâche 5.1 — Sélection table → EditPanel
```
Fichier: src/app/(client)/(ops)/floor-plan/page.tsx
Action: clic sur table → EditPanel en sidebar (couleur, forme, couverts, zone)
Composants: EditPanel + TableChairs (rendu chaises autour)
```

#### Tâche 5.2 — Zones et analytics
```
Action: ZoneRenderer par zone (terrasse, salle, privé)
+ clic table → TableInsightPanel (CA moyen, rotation, historique réservations)
```

#### Tâche 5.3 — Settings plan de salle
```
Page: /floor-plan?tab=settings
Composants: FloorArchitecture + MobilierConfig + TablesToolbar + RolesPermissionsPanel
```

---

### Sprint 6 — Réservations Avancées (semaine 11-12)

#### Tâche 6.1 — NewReservationDialog complet
```
Actuellement: bouton "Nouvelle réservation" → dialog basique
Remplacer par: NewReservationDialog (guests, preferences, table, notes)
```

#### Tâche 6.2 — Vues alternatives
```
Ajouter toolbar: ReservationToolbar avec toggle Vue Liste / Vue Calendrier / Vue Plan
Composants: CustomerListView (timeline client) + FloorPlanView (placement sur plan)
```

#### Tâche 6.3 — Devis événements
```
Page: /reservations?tab=events
Composants: EventQuoteFormSections (3 sections)
Flow: création devis → envoi → suivi conversion
```

---

### Sprint 7 — Intelligence & Analytics (semaine 13-14)

#### ✅ Tâche 7.1 — Oracle Chat — LIVRÉ (post 08/09)
`OracleChatDrawer` câblé dans `ClientComponents` (lazy). Reste : `OraclePredictor`.

#### ❌ Tâche 7.2 — Flash Report Directeur — EN ATTENTE
```
Composant: DirectorFlashReport
Position: page /analytics en haut (résumé quotidien auto-généré)
Envoi: email automatique via ReportEngine (déjà construit)
```

#### ✅ Tâche 7.3 — Hub Connecteurs — LIVRÉ (post 08/09)
`ConnectorCard` + `ConnectorStatusBadge` câblés dans `IntegrationsPage`. Reste : `ConnectorConfigModal`.

---

### Sprint 8 — Routes Orphelines (semaine 15-16)

#### Tâche 8.1 — `/nf525` : Page Archive Fiscale
✅ **Route livrée** commit `2acb5dab9` — `FECExportPage` monté avec `withPageGuard(NF525Page, "finance")`.
Reste à enrichir : chaîne de scellement lisible, export archive complète.

#### Tâche 8.2 — `/pos-mobile` : Mode Waiter
```
Route: src/app/(client)/(ops)/pos-mobile/page.tsx
Composants: POS simplifié pour tablette/mobile
Nav: ✅ Déjà dans navConfig (ligne 243) — enrichir le contenu
```

#### Tâche 8.3 — `/timeclock` : Badgeuse
```
Route: src/app/(client)/(ops)/timeclock/page.tsx
Composants: TimeclockEngine UI (pointage NFC/code PIN)
Nav: entrée à ajouter dans la section RH
```

#### Tâche 8.4 — `/menu-engineering` : Matrice
```
Route: src/app/(client)/(ops)/menu-engineering/page.tsx
Composants: MenuEngineeringEngine UI (4 quadrants Stars/Plowhorses/Puzzles/Dogs)
Nav: lien depuis Menu Builder
```

#### ✅ Tâche 8.5 — `/mon-espace` : Portail Employé — LIVRÉ (post 08/09)
`StaffPortal` + `PaySlipViewer` câblés dans `/mon-espace`.

---

### Sprint 9 — Monitoring & Ops Backend (semaine 17-18)

**Objectif** : Rendre les 165 handlers et 15 crons visibles.

#### Tâche 9.1 — Dashboard Monitoring Temps Réel
```
Page: /admin/mcc?tab=monitoring (nouvelle entrée MCC)
Composants à créer :
  - EventBusMonitor : compteur events/min par handler
  - DLQMonitor : file d'attente dead letters + retry manuel
  - CronJobStatus : statut dernier run + prochaine exécution
  - OutboxMonitor : messages en attente de dispatch
```

#### Tâche 9.2 — Notifications Push Handlers Critiques
```
Handlers: DLQQuarantineAlertHandler, CryptoIntegrityHandler, OvertimeAlertHandler
Action: émettre une WebPush notification + toast in-app quand ces handlers se déclenchent
Les clés VAPID sont la seule dépendance manquante (env)
```

---

### Sprint 10 — Onboarding Wizard (semaine 19-20)

> ⚠️ **Correction du plan initial** : `/onboarding` **n'est pas un stub**, le wizard est déjà partiellement câblé. Ce sprint enrichit l'existant plutôt que de le créer.

#### Tâche 10.1 — Câbler `OCRUploadZone` et `PreviewTable`
Les 2 composants restants à intégrer dans le wizard existant.

#### Tâche 10.2 — Enrichir le stepper avec les composants disponibles
```
Route: src/app/(client)/(ops)/onboarding/page.tsx
Stepper en 6 étapes:
  1. SourceSystemSelector (depuis quel logiciel ?) ✅ déjà câblé
  2. UniversalImportDropzone (CSV/FEC) + OCRUploadZone (à câbler)
  3. PreviewTable (à câbler) + ImportCategoryPanel ✅
  4. ConnectorOAuthPanel ✅
  5. SimpleFloorPlanEditor ✅ + BatchTableForm (à câbler)
  6. OnboardingProgress (résumé + lancement) — à câbler

Composants: tous déjà construits dans commerce/onboarding/
```

---

### Sprint 11 — Verticales SaaS (semaine 21-24)

**Objectif** : Ouvrir la plateforme aux autres secteurs.

#### Ordre recommandé par ROI estimé :

1. **Retail** (5 composants) → `/retail/*` — ajout au VerticalRegistry + navConfig par variant
2. **Bakery** (4 composants) → `/bakery/*` — précommandes + étiquetage allergènes
3. **Hotel** (1 composant `PMSDashboard`) → `/hotel/pms` — channel manager à câbler
4. **Salon** (3 composants) → `/salon/*` — booking rendez-vous
5. **Garage / Clinic** — verticales de niche, post-PMF

---

## 9. Partie 6 — Métriques d'avancement

Utiliser ces métriques pour tracker la progression sprint par sprint :

| Indicateur | Baseline (2acb5dab9) | Post §8.6 (a6ffafdcb) | Cible S11 |
|------------|---------------------|--------------------------|-----------|
| Composants TSX câblés / total | ~65 / 192 | **~83 / 192** (+18 câblés post 08/09) | 180 / 192 |
| Composants généralisés MetricLabels | 0 | **5** (Phase 0 — 08/13) | 30+ |
| Routes dans navConfig | 39 (`/nf525` ajouté) | **39** (inchangé) | 50 |
| Handlers avec feedback UI | 0 / 165 | 0 / 172 | 15 / 172 |
| Handlers DLQ aveugles (catch sans rethrow) | ~6 | **~5** (WasteHandler corrigé) | 0 |
| Pages avec 100% fonctionnalités visibles | 3 | **4** (Sprint 2.1 KDS livré) | 20 |
| Verticales actives en production | 1 (restaurant) | 1 — base généraliste prête | 3 |
| Tests vanguard passants | 64 / 64 ✅ | **64 / 64 ✅** | 64 / 64 |
| Bugs C-01/C-02/C-03 résolus | 3 / 3 ✅ | **3 / 3 ✅** | 3 / 3 |
| Fuite cross-tenant | ✅ Verrouillée (8 tests) | ✅ Maintenue | Maintenue |
| RBAC accès anonyme | ✅ Fermé (phase 1) | ✅ Phase 1 maintenue | Phase 2 |
| Cycles imports billing | 2 (baseline) | **2** (baseline stable) | 0 |
| Barrel violations finance | 4 (pré-existants) | **4** (inchangés) | 0 |

---

## 10. Corrections à apporter au plan initial

Ce document corrige **trois affirmations fausses** du `PLAN_IMPLEMENTATION_UI.md` original, vérifiées cette session :

### ❌ Correction 1 : `/onboarding` n'est PAS un stub

`src/app/(client)/(ops)/onboarding/page.tsx` rend `OnboardingWizard` qui câble réellement :
- `ProgressStepper`, `SourceSystemSelector`, `ConnectorOAuthPanel`
- `ImportCategoryPanel`, `SimpleFloorPlanEditor`, `OnboardingHelpButton`

Seuls **2 composants** restent non montés dans le wizard : `OCRUploadZone` et `PreviewTable`.

### ❌ Correction 2 : `/pos-mobile` et `/mon-espace` SONT dans navConfig

Contrairement à ce qu'indique le plan initial, ces deux routes sont bien déclarées dans `src/config/navConfig.ts` (lignes 243-244). Elles nécessitent enrichissement du contenu, pas ajout à la nav.

### ❌ Correction 3 : Nombre réel de routes hors navigation

La liste réelle des routes hors navigation est **17**, pas 13. S'ajoutent :
- `/staff`, `/planning`, `/leaves`, `/recruitment` (accessibles uniquement par `?tab=`)
- Nuance : les routes publiques `/login`, `/signup`, `/auth/logout`, `/showcase`, `/landing`, `/welcome`, `/` sont normalement absentes de la nav.

---

## 11. Annexe — Fichiers immuables & invariants

### 11.1 Fichiers à ne jamais toucher

| Fichier | Raison |
|---------|--------|
| `tenants/{id}/journalEntries/*` | **Immuable NF525** — jamais `update`/`delete` |
| `tenants/{id}/fiscalSeals/*` | **Immuable NF525** — jamais `update`/`delete` |
| `tenants/{id}/fiscalLedger/*` | **Immuable NF525** — jamais `update`/`delete` |
| `tenants/{id}/ticketZ/*` | Immuable | scellement Z |
| `tenants/{id}/haccpLogs/*` | Immuable | conformité HACCP |
| `tenants/{id}/iotHistory/*` | Immuable | audit IoT |
| `src/shared/nexus/SovereignGuard.ts` | Barrière cross-tenant — **ne jamais contourner** |
| `src/lib/nexus/NexusAdapter.ts` | Singleton Nexus — modifier uniquement via PR dédiée |

### 11.2 Invariants système (rappel `CLAUDE.md`)

| Règle | Portée |
|---|---|
| Toute écriture Nexus : chemin `tenants/{tenantId}/{collection}/{id}` | Multi-tenant |
| `tenantId` = `activeTenantId` depuis `useTenant()` — **jamais codé en dur** | Multi-tenant |
| **Serveur** : passer `tenantId` par appel via `NexusContext.vassalId`, **jamais** `Nexus.tenantOverride` | Multi-tenant (nouveau, commit `2acb5dab9`) |
| Monnaie en microunités (`*InMicrounits`), cast via `toMicrounits()` — désormais validé runtime | Finance |
| Import uniquement depuis le barrel racine `@/modules/<pilier>` | Architecture |
| Tout nouveau code d'un pilier va dans `src/modules/<pilier>/` | Architecture |
| **Ne jamais `git push`** — migration GitLab en cours, commits locaux uniquement | Process |
| S'inscrire dans `.claude/sessions.md` avant toute action | Process |

### 11.3 Contexte multi-tier (verticale restaurant)

La verticale restaurant dispose de **3 tenants système** permanents :

| Tier | tenantId | Rôle | Règle d'écriture |
|------|----------|------|------------------|
| **DEMO** | `_demo_restaurant` | Vitrine prospect | Simulacra Mode (fork mémoire) |
| **TEST** | `_test_restaurant` | Bac à sable dev | **Seul acceptant les écritures directes** |
| **REFERENCE** | `_ref_restaurant` | Maître cloneable nouveaux clients | Écriture **bloquée** sauf promotion MCC |

**Registre** : `src/lib/mcc/SystemTenantRegistry.ts`

**API utile** :
```ts
import {
  getSystemTenantId,      // (variant, tier) → '_ref_restaurant'
  isSystemTenant,         // (tenantId) → boolean
  getSystemTenantTier,    // (tenantId) → 'DEMO' | 'TEST' | 'REFERENCE' | null
  isWritable,             // (tenantId) → boolean (true seulement pour _test_*)
} from '@/lib/mcc/SystemTenantRegistry';
```

> ⚠️ Un vrai client est un deep-copy de `_ref_restaurant` vers `tenant_{siret}`.
> Le `SovereignGuard` filtre les tenants `_*` de la fleet MCC cliente.

### 11.4 Documents liés

| Document | Rôle |
|---|---|
| `docs/PLAN_RESTE_A_FAIRE.md` | **16 chantiers sécurité/intégrité** — à lire en parallèle |
| `docs/plans/PLAN_IMPLEMENTATION_UI.md` | Version originale (source de ce document) |
| `docs/versionbase.md` | Organisation DEMO / TEST / REFERENCE — détails multi-tenants système |
| `CLAUDE.md` | Conventions projet — piliers, NF525, microunits, SovereignGuard |

---

*Ce document est la source de vérité UI pour la verticale restaurant.
Maintenir à jour au fur et à mesure des sprints — mettre à jour la table des métriques (Partie 6) à chaque livraison, marquer les tâches ✅ dans les sprints (Partie 5) et bumper les correctifs livrés dans la section 2.*
