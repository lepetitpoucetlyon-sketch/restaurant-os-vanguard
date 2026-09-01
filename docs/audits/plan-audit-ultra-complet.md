# 🏛️ PLAN D'AUDIT & ENCYCLOPÉDIE TECHNIQUE — RESTAURANT OS CORE

> ⚠️ **CARTE D'ORIENTATION ONE-SHOT — INSTANTANÉ DU 2026-09-01**
> Ce document est une photographie à un instant T. Ne pas chercher à le maintenir à jour manuellement. 
> S'il dérive, régénérer ou jeter. **Revérifier le code source (ou la carte générée) avant de citer.**
> 
> **Version** : 3.0 — développée & ancrée dans le code
> **Preuves formelles** (mesurées dans la session de rédaction — cf. [Annexe A](#annexe-a--preuves-formelles-mesurées-en-session)) :
> `npx tsc --noEmit` → **exit 0, 0 erreur** · `npx vitest run src/__tests__/human/` → **3 fichiers, 11/11 tests, 1,20 s** · `node scripts/gate-last-mile.mjs` → **14/14 cliquets, aucun compteur en hausse** · `node scripts/verify-gate-integrity.mjs` → **hash `249420b039b90281` OK**

---

## 📑 Table des matières

- [0. Architecture réelle — 8 piliers, domaines universels & couche Nexus](#0-architecture-réelle--8-piliers-domaines-universels--couche-nexus)
- [Légende des statuts](#légende-des-statuts)
- [1. Caisse, prise de commande & mobilité (POS)](#1-caisse-prise-de-commande--mobilité-pos)
- [2. Encaissement, split bill & moyens de paiement](#2-encaissement-split-bill--moyens-de-paiement)
- [3. KDS multi-stations, passe chef & cadençage (coursing)](#3-kds-multi-stations-passe-chef--cadençage-coursing)
- [4. Géométrie de salle 2D/3D & heatmap d'occupation](#4-géométrie-de-salle-2d3d--heatmap-doccupation)
- [5. Ingénierie du menu, matrice BCG & allergènes](#5-ingénierie-du-menu-matrice-bcg--allergènes)
- [6. Réservations, CRM client & bouclier anti-no-show](#6-réservations-crm-client--bouclier-anti-no-show)
- [7. Kiosque, borne tactile & commande QR à table](#7-kiosque-borne-tactile--commande-qr-à-table)
- [8. Click & collect, delivery hub & agrégateurs](#8-click--collect-delivery-hub--agrégateurs)
- [9. Conformité fiscale NF525, scellement & grand total](#9-conformité-fiscale-nf525-scellement--grand-total)
- [10. Clôtures fiscales (X & Z), FEC & archivage légal](#10-clôtures-fiscales-x--z-fec--archivage-légal)
- [11. Stocks périssables, fiches recettes & coulage SmartSpout](#11-stocks-périssables-fiches-recettes--coulage-smartspout)
- [12. Sécurité alimentaire, HACCP & traçabilité matière](#12-sécurité-alimentaire-haccp--traçabilité-matière)
- [13. Fournisseurs, approvisionnement & facturation Factur-X](#13-fournisseurs-approvisionnement--facturation-factur-x)
- [14. Ressources humaines & moteur de paie HCR (IDCC 1979)](#14-ressources-humaines--moteur-de-paie-hcr-idcc-1979)
- [15. Prestataires freelances, auto-entrepreneurs & self-billing](#15-prestataires-freelances-auto-entrepreneurs--self-billing)
- [16. Générateur juridique de contrats & conventions](#16-générateur-juridique-de-contrats--conventions)
- [17. Pilotes matériels, octets ESC/POS & télémétrie IoT](#17-pilotes-matériels-octets-escpos--télémétrie-iot)
- [18. Architecture offline-first, outbox & résilience](#18-architecture-offline-first-outbox--résilience)
- [19. Gouvernance RBAC, sécurité & flotte MCC](#19-gouvernance-rbac-sécurité--flotte-mcc)
- [20. Audit du code source & matrice de couverture](#20-audit-du-code-source--matrice-de-couverture)
- [Annexe A — Preuves formelles mesurées en session](#annexe-a--preuves-formelles-mesurées-en-session)
- [Annexe B — Matrice de couverture des 20 sections](#annexe-b--matrice-de-couverture-des-20-sections)
- [Annexe C — Dette & angles morts référencés](#annexe-c--dette--angles-morts-référencés)

---

## Légende des statuts

Chaque sous-section porte un marqueur d'état, dans l'esprit de la **Loi 8 « bout-en-bout »** d'`AGENTS.md` (une fonctionnalité écrite ≠ livrée) :

| Marqueur | Signification |
|---|---|
| ✅ **Implémenté** | code présent, atteignable depuis une route ou un handler, testé ou vérifiable |
| 🟡 **Partiel** | logique présente mais non câblée bout-en-bout, ou couverture incomplète |
| 📐 **Spécifié** | design/contrat décrit ici, pas encore de code correspondant — spécification d'ingénierie |
| ⚠️ **Écart connu** | divergence entre l'intention documentée et l'état réel du code (renvoi Annexe C) |

> ⚠️ **Zero-Claim (Loi 7)** : aucun chiffre « d'état du dépôt » n'est recopié ici. Les seules valeurs numériques présentes sont soit des **constantes du code** (citées avec leur fichier), soit des **mesures prises dans la session de rédaction** (Annexe A). Les métriques vivantes appartiennent à `docs/HEALTH.md` et à `.measures/`.

---

## 0. Architecture réelle — 8 piliers, domaines universels & couche Nexus

> Le titre historique de ce document parlait de « 18 piliers ». **Le socle en compte 8.** Les « 18 » correspondaient à un découpage **fonctionnel** (surfaces métier). Voici la carte réelle, celle qui fait autorité (`CLAUDE.md`, `docs/adrs/`).

### 0.1 Les 8 piliers et leurs domaines universels

Structure canonique : `src/modules/<pilier>/<domaine>/<module>/`. L'infrastructure (providers, connectors, hooks, services, store, domain, migration) reste à la racine du pilier.

| Pilier | Domaines universels | Modules cités dans ce document |
|---|---|---|
| **ops** | `service/` · `production/` · `workflow/` | `service/restaurant/pos`, `service/restaurant/kiosk`, `production/kds`, `service/core/printing` |
| **commerce** | `acquisition/` · `relation/` · `fidelite/` | `relation/reservations`, `relation/delivery`, `relation/crm`, `catalog/menu-engineering` |
| **finance** | `comptabilite/` · `tresorerie/` · `fiscalite/` | `comptabilite/fec`, `comptabilite/einvoicing`, `fiscalite` (scellement, Ticket Z), `tresorerie/ap` (3-way match) |
| **compliance** | `qualite/` · `securite/` · `reglementaire/` | `qualite/haccp` (+ `iot/`), `securite/audit` |
| **human** | `effectifs/` · `remuneration/` | `effectifs/hr`, `services/` (paie HCR, self-billing, contrats) |
| **logistics** | `stock/` · `approvisionnement/` | `stock/inventory`, `approvisionnement/procurement` (3-way, auto-procurement) |
| **intelligence** | `analytique/` · `ia/` · `knowledge/` | `analytique/analytics` (menu engineering, no-show), `forecasting` |
| **facility** | `spaces/` · `maintenance/` · `assets/` | `spaces/floor-plan` (+ heatmap), `spaces/settings` |

**Règle du Barrel** : import uniquement depuis `@/modules/<pilier>` (barrel racine). Tout `@/modules/<pilier>/<domaine>/...` en profondeur inter-pilier est une violation (`no-inter-module-imports`).

### 0.2 Nexus — couche d'accès données

```
┌─────────────────────────────────────────────────────────────────────┐
│  Application (modules, verticales, UI)                               │
│        │  écrit/lit toujours via  Nexus.adapter.{get,set,query,...}  │
│        ▼                                                             │
│  Nexus (singleton — src/lib/nexus/NexusAdapter.ts)                   │
│    └─ enveloppe TOUT adapter avec :                                  │
│         • NexusInterceptor  (idempotence, télémétrie, WORM)          │
│         • SovereignGuard    (barrière cross-tenant — jamais bypass)  │
│        ▼                                                             │
│  Adapter concret :  Firestore  │  Postgres (souverain)  │  Mock/Sim  │
└─────────────────────────────────────────────────────────────────────┘
```

- Toute écriture : path `tenants/{tenantId}/{collection}/{id}` — `tenantId` = `activeTenantId` (jamais hardcodé).
- **DB-agnostique** : raisonner au niveau `NexusAdapter`, jamais « Firestore » en dur (cf. audit `docs/audits/AUDIT-DB-AGNOSTICISME-2026-09-01.md`).
- Collections immuables (WORM) protégées par `SovereignGuard` : `journalEntries`, `fiscalSeals`, `fiscalLedger` — **jamais delete, jamais update**.

### 0.3 Canaux de communication inter-modules (ADR-015)

1. **`NexusEventBus.emit/on(...)`** — effets de bord & synchro inter-piliers (découplage total).
2. **Contrats neutres / DI** — `@/kernel/contracts/` (`IStockOracle`, `rbac`, …) pour les requêtes synchrones.
3. **Composants partagés / composition roots** — `@/shared/components/`, slots dans `src/app/`.
4. **Données persistées** — `Nexus.adapter` via collections WORM/Sovereign.
5. **Barrel racine** — `@/modules/<pilier>` pour les types stables uniquement.

### 0.4 Monnaie — microunits obligatoire

- **1 µ = 0,000 001 €** → **1 000 000 µ = 1 €**.
- Champs `*InMicrounits` (jamais `*InCents` dans le nouveau code). Helper `toMicrounits()` ; type branded `Microunits`.
- Accès canonique au total commande : `SovereignMath.orderTotalMicrounits(order)` — préfère `totalInMicrounits`, retombe sur `totalInCents × 10 000` (préservation de valeur pour les documents legacy).

### 0.5 Carte des 20 sections → piliers

| Section | Pilier(s) principal(aux) | Point d'entrée code |
|---|---|---|
| 1 POS | ops | `src/modules/ops/service/restaurant/pos/` |
| 2 Split bill | ops + finance | `pos/hooks/usePosSplit.ts`, `SovereignMath.splitRemainder` |
| 3 KDS | ops | `src/modules/ops/production/kds/` |
| 4 Plan de salle | facility | `src/modules/facility/spaces/floor-plan/` |
| 5 Menu engineering | intelligence + commerce | `analytique/analytics/MenuEngineeringService.ts` |
| 6 Réservations / CRM | commerce + intelligence | `commerce/relation/reservations/`, `NoShow*Handler` |
| 7 Kiosque / QR | ops | `ops/service/restaurant/kiosk/`, `src/app/[slug]/` |
| 8 Delivery | commerce | `commerce/relation/delivery/aggregators/` |
| 9 NF525 scellement | finance | `src/lib/mcc/fiscal/FiscalSealer.ts` |
| 10 Clôtures X/Z + FEC | finance | `finance/comptabilite/fec/`, `TicketZHandler` |
| 11 Stocks / recettes / SmartSpout | logistics + ops | `logistics/services/StockEngine.ts`, `SmartSpoutTelemetryService` |
| 12 HACCP | compliance | `compliance/qualite/haccp/` |
| 13 Fournisseurs / Factur-X | logistics + finance | `approvisionnement/procurement/`, `comptabilite/einvoicing/FacturXParser.ts` |
| 14 Paie HCR | human | `human/services/HcrPayrollEngine.ts` |
| 15 Freelances / self-billing | human + finance | `human/services/ContractorSelfBillingService.ts` |
| 16 Contrats | human | `human/services/HcrLegalContractService.ts` |
| 17 Drivers ESC/POS + IoT | ops + compliance | `ops/service/core/printing/hardware/escpos/` |
| 18 Offline / outbox | lib (transverse) | `src/lib/offline/OutboxService.ts` |
| 19 RBAC / MCC | kernel + human | `src/kernel/contracts/rbac.ts`, `shared/components/rbac/` |
| 20 Audit code | — | ce document + `scripts/` |

---

## 1. Caisse, prise de commande & mobilité (POS)

**Pilier** : ops · **Racine** : `src/modules/ops/service/restaurant/pos/` · **Route** : `src/app/(client)/(ops)/pos/`

### 1.1 Composants & écrans — ✅ Implémenté

| Composant | Fichier | Rôle |
|---|---|---|
| `PosHeader` | `pos/components/PosHeader.tsx` | opérateur connecté, table active, couverts, statut réseau, badge « Coup de Feu » ; actions sensibles (fond de caisse, annulation) protégées par `ActionGuard` avec `disabledMode="disable"` + tooltip |
| `ProductGrid` | `pos/components/ProductGrid.tsx` | grille catégories/articles, densité tactile dynamique, `DataView` + `EmptyState` universels |
| `Cart` | `pos/components/Cart.tsx` | lignes, modificateurs, sous-total, total ; feedback tactile `active:scale` |
| `PaymentDialog` | `pos/components/PaymentDialog.tsx` | tunnel d'encaissement multi-moyens |
| `SplitBillDialog` | `pos/components/SplitBillDialog.tsx` | partage d'addition (cf. §2) |
| `CashCounterModal` | `pos/components/CashCounterModal.tsx` | comptage fond de caisse |
| `TableSelector` | `pos/components/TableSelector.tsx` | sélection/ouverture de table |
| `ProductDetailsDialog` | `pos/components/product-details/` | déclinaisons, suppléments, instructions cuisine |

Hooks : `usePos.ts` (état panier & commande), `useCashDrawer.ts`, `useTableLock.ts` (verrouillage optimiste), `posOrderSubmit.ts` (émission `order.paid`).

### 1.2 Modificateurs & déclinaisons — 🟡 Partiel

Le tunnel `product-details` porte les déclinaisons (cuissons, accompagnements, suppléments payants, instructions cuisine). Les libellés d'exemple (« Bleu / Saignant / À point », « +2,50 € Truffe ») sont **des données tenant** (catalogue produit), pas des constantes du socle : à peupler par `_demo_*` tenants via `TenantSeeder`.

### 1.3 Règles & invariants de domaine

| Règle | Statut | Ancrage |
|---|---|---|
| Prise de commande bloquée sans pointage actif (`CLOCK_IN`) | 🟡 Partiel | logique pointage dans `human/effectifs/hr` ; garde POS à confirmer bout-en-bout |
| Annulation après envoi cuisine → motif normé + PIN Manager, journalisé | ✅ | `AllergenGateService` / `CommercialGestureService` + `AuditLogger`, `useRbacGate.ts` |
| Calculs en microunits | ✅ | `CartItem` = `ops/workflow/engine/types.ts` (`unitPriceInMicrounits`) |
| Détection « dine & dash » (départ sans payer) | ✅ | `pos/services/DineAndDashDetectorService.ts` |
| Verrouillage PIN après inactivité (changement de serveur) | 🟡 | `HardenedTouchUiHelper.ts` + `useTableLock.ts` |

### 1.4 Événements bus émis

- `order.paid` `{ tenantId, orderId, tableId, totalInMicrounits, operatorId }` — émis par `posOrderSubmit`, consommé par `RestaurantVertical` (sceau fiscal + sync intelligence).
- `table.released` — à l'encaissement/libération, consommé par `RestaurantFacilityAdapter`.
- `cash_drawer.*` — anomalies tiroir (`CashDrawerAnomalyHandler`).

### 1.5 Points d'audit

- ⚠️ Historique : `SplitBillDialog` a connu un bug « facteur 10 000 » (µ renommé `amountInCents` sans conversion) — cf. `logiquemetier.md`. Vérifier que `usePosSplit` (microunits natif) est bien le chemin actif.
- Vérifier la garde `CLOCK_IN` réellement appliquée à l'ouverture de ticket.

---

## 2. Encaissement, split bill & moyens de paiement

**Pilier** : ops (UI) + finance (journal) · **Fichiers** : `pos/hooks/usePosSplit.ts`, `pos/hooks/useCashDrawer.ts`, `pos/services/*`

### 2.1 Moyens de paiement

| Moyen | Statut | Ancrage |
|---|---|---|
| Carte bancaire (TPE) | 🟡 | tunnel `PaymentDialog` ; intégration TPE physique = driver hardware (cf. §17) |
| Espèces + rendu de monnaie | ✅ | `pos/services/ExactChangeAssistanceService.ts`, `useCashDrawer.ts` |
| « Rendu → pourboire » | ✅ | `pos/services/ChangeAsTipService.ts` |
| Titres-restaurant, ANCV, compte client | 📐 | non identifiés comme moyens dédiés dans le code POS — spécification |
| Multi-devises | 📐 | pas de moteur de conversion identifié — spécification |

### 2.2 Partage d'addition (split bill) — ✅ Implémenté

`usePosSplit({ items, totalInMicrounits, initialCovers })` — 3 modes : `equal` · `by-item` · `custom`.

**Règle du reliquat indivisible (Invariant #5)** — `SovereignMath.splitRemainder(totalInMicrounits, partsCount)` (`src/shared/services/SovereignMath.ts:128`) :

```
basePart  = ⌊ total / N ⌋
parts     = [basePart, basePart, …, basePart]          (N éléments)
remainder = total − basePart × N
parts[N-1] += remainder            → garantit  Σ parts ≡ total  (0 µ perdu)
```

- Mode `by-item` : `Σ (unitPriceInMicrounits × quantity)` des articles assignés au convive.
- Mode `custom` : montants libres, `remainingInMicrounits = max(0, total − Σ payés)`.
- `isFullyPaid` ⇔ `remaining === 0 && Σ payés ≥ total`. `onSplitComplete()` déclenché au dernier règlement.
- Chaque part réglée : `{ index, amountInMicrounits, paid, method: 'card'|'cash'|'mobile', paidAt }`.

### 2.3 Pourboires & tip pooling — 🟡 Partiel

`pos/services/BilingualTipGratuityHelper.ts` (saisie CB/espèces, bilingue via `useLexicon`). Distribution dans le pool de shift : `TipDistributionService` (branché depuis `PerishableAlertsTracker`/`TipPoolManager` selon `PLAN-CORRECTIF-2026-08-29`). Grille d'affectation par heures travaillées : à relier au moteur de paie (§14).

### 2.4 Points d'audit

- Confirmer que la ligne de débit journal du split est **convertie en µ** avant scellement (bug historique `FinancialJournalBuilder.ts`).
- Titres-restaurant : si implémenté, plafond légal & blocage rendu monnaie à vérifier.

---

## 3. KDS multi-stations, passe chef & cadençage (coursing)

**Pilier** : ops · **Racine** : `src/modules/ops/production/kds/`

```
[order.paid / order.submitted] ─► KDSCourseSequencingEngine.initialize()
        │  1er service non vide → FIRED, le reste → HOLD
        ▼
[Poste Entrées] ──(READY)──► [Passe] ──► service
        │  « Feu suite ! » → fireNextCourse(orderId, course)
        ▼
[Poste Plats]  ──(READY)──► [Passe] ──► SERVED
```

### 3.1 Postes & affichage — ✅ Implémenté

- `components/KDSDashboard.tsx`, `KDSTicket.tsx`, `KDSHeader.tsx`, `OrdersLiveBoard.tsx`, `KDSCoursingAnimationIndicator.tsx`.
- Routage multi-postes : `services/SmartStationRoutingService.ts`, `handlers/KdsRoutingHandler.ts`.
- Synchro chaud/froid : `services/HotColdSyncKdsService.ts`.
- Audio matériel (buzzer) : `services/KDSAudioHardwareService.ts`.
- Hook contrôleur : `hooks/useKDSController.ts`.

### 3.2 Cadençage (coursing) — ✅ Implémenté

`KDSCourseSequencingEngine` (`services/KDSCourseSequencingEngine.ts`) :

- **Statuts** : `type CourseStatus = 'HOLD' | 'FIRED' | 'COOKING' | 'READY' | 'SERVED'` (5 états — le doc historique en listait 4).
- `initialize(orderId, …)` : le premier service non vide passe `FIRED`, les autres `HOLD`.
- `fireNextCourse(orderId, course)` : bouton « Feu suite ! » → passe le service ciblé en `FIRED`, log `[KDS] Service <course> envoyé (FIRED) … par <firedBy>`.
- Handlers associés : `KdsCourseManagerHandler`, `KdsCoursePassedHandler`, `KdsPassNotifierHandler`, `PassPickupReminderService`.
- Verticale : `src/verticals/restaurant/handlers/FireNextCourseHandler.ts`.

### 3.3 Minuteurs, rush & régulation — ✅ Implémenté

- `services/KDSPacingEngine.ts` — **régulation du débit** : si retard moyen KDS `> overheat_threshold_min` (réglage `kds.overheat_threshold_min`, défaut **20 min**), bascule `isThrottled = true`, `maxOrdersPerWindow = kds.throttle_max_orders` (défaut 5) pendant `kds.throttle_duration_sec` (défaut 600 s). Audit `KDS_PACING_THROTTLE_ACTIVATED`.
- `services/KDSVisualDelayWarningService.ts` — codes couleur de retard.
- `handlers/KdsPrepDelayAlertHandler.ts`, `handlers/KDSRushAlertNotifier.ts`, `handlers/KdsPrepTimeAnalyzerHandler.ts`.
- `services/MeatRestingTimerService.ts` — minuteur de repos des viandes.

> Les seuils « vert 0-12 / orange 12-20 / rouge > 20 min » sont des **réglages** (`kds.*`), pas des constantes en dur — cohérent avec la mesure « réglages déclarés non lus » = 0.

### 3.4 86-list (rupture) — ✅ Implémenté

`services/EightysixtService.ts` : un chef met un **ingrédient** en 86 → cascade automatique sur **toutes les recettes** qui l'utilisent (calcul pur + désactivation Nexus + event KDS temps réel). `services/SelfHealingRecipeBomService.ts`, `services/LotAllergenMatrixService.ts` en support.

### 3.5 Modes dégradés — ✅

`services/DegradedDishwashingModeService.ts` (plonge en panne), `handlers/KdsPrintFallbackHandler.ts` (impression bon cuisine KO → repli passe), `services/ThermalOverheatP2PFailoverService.ts` (côté POS).

---

## 4. Géométrie de salle 2D/3D & heatmap d'occupation

**Pilier** : facility · **Racine** : `src/modules/facility/spaces/floor-plan/` · **Route** : `/floor-plan` (`RestaurantVertical.routes`)

### 4.1 Éditeur & modélisation — ✅ Implémenté

- `floor-plan/FloorPlanEditor.tsx` — éditeur, monté sur la route `/floor-plan` (rôles : `admin, directeur, manager, chef_rang, serveur, hotesse`).
- `floor-plan/FloorPlanGeometry.ts` — primitives géométriques (zones, objets paramétriques).
- `floor-plan/useFloorPlanControls.ts`, `spaces/hooks/useFloorPlan.tsx`.
- Onboarding : `commerce/acquisition/onboarding/migration/floor-plan/` (`FloorPlanZonesStep`, `FloorPlanPreviewStep`), `SimpleFloorPlanEditor.tsx`.
- Vue réservations : `commerce/relation/reservations/components/FloorPlanView.tsx`.

### 4.2 Vue 3D isométrique — 🟡 Partiel

`src/shared/components/layout/Map3DOverlay.tsx` existe. Historiquement jamais monté (`setIsMap3DOpen={() => {}}` — cité dans `gate-last-mile.mjs` comme angle mort de référence). Statut de montage réel à confirmer.

### 4.3 Code couleur des tables — ✅ (tokens)

Depuis `restaurant.blueprint.ts` → `tokens.verticalTokens` :

| Token | Valeur | Sens |
|---|---|---|
| `--table-available` | `#e5e7eb` | libre / propre |
| `--table-occupied` | `#1e293b` | convives installés |
| `--table-reserved` | `#fbbf24` | réservation imminente |
| `--table-bill-printed` | `#0ea5e9` | addition demandée |
| `--course-order-sent` | `#C5A059` | commande envoyée cuisine |
| `--course-next-fired` | `#ec4899` | service suivant « au feu » |

> `--table-dirty` (`#f43f5e`) était dans le doc historique mais **absent du blueprint** — à ajouter si le workflow « table à débarrasser » est requis.

### 4.4 Heatmap de rentabilité — ✅ Implémenté

`spaces/services/FloorPlanHeatmapService.ts` → `generateHeatmap(...)` : calcule un `thermalIndex` normalisé = `revenuePerSeatInMicrounits / max(revenuePerSeat)` par table. Test : `src/__tests__/facility/floor-plan-heatmap.test.ts`. `shared/eventBus/handlers/FloorPlanCapacityHandler.ts` gère la capacité.

---

## 5. Ingénierie du menu, matrice BCG & allergènes

**Piliers** : intelligence + commerce · **Fichiers** : `analytique/analytics/MenuEngineeringService.ts`, `commerce/catalog/menu-engineering/`, `verticals/restaurant/presentation/MenuEngineeringDashboard.tsx`

### 5.1 Matrice BCG (Kasavana-Smith / Miller) — ✅ Implémenté

`MenuEngineeringService.classify(dishes)` (`analytique/analytics/MenuEngineeringService.ts:38`) :

```
margin_i          = sellingPriceInMicrounits_i − foodCostInMicrounits_i
avgMargin         = Σ margin / n
avgOrderShare     = 1 / n
isHighPopularity  = ordersCount_i / totalOrders ≥ avgOrderShare
isHighMargin      = margin_i ≥ avgMargin

star       ⇔  haute popularité  ∧  haute marge
plowhorse  ⇔  haute popularité  ∧  marge faible      (« vache à lait »)
puzzle     ⇔  popularité faible ∧  haute marge       (« dilemme »)
dog        ⇔  popularité faible ∧  marge faible       (« poids mort »)
```

`summarize(results)` renvoie `{ star, plowhorse, puzzle, dog }` (comptes). `contributionMarginPct = margin / sellingPrice × 100`.

Décisions stratégiques associées (couche présentation / `BCGActionSuggestionHandler`) :

| Catégorie | Décision |
|---|---|
| ⭐ star | maintenir la visibilité, plat signature |
| 🐄 plowhorse | augmenter le prix ou réduire le grammage |
| ❓ puzzle | repositionner sur la carte, former les serveurs à la vente |
| 🐕 dog | retirer au prochain renouvellement |

Handlers : `MenuEngineeringHandler.ts`, `BCGActionSuggestionHandler.ts`. Dashboard : route `/menu-engineering` (rôles `admin, directeur, manager`). Matrice UI : `analytique/analytics/components/MenuEngineeringMatrix.tsx`.

### 5.2 Food cost & coefficients — 🟡 Partiel

Formules cible (couche recettes, §11) :

```
Marge Brute HT       = Prix Vente HT − Coût Matière HT
Food Cost %          = Coût Matière HT / Prix Vente HT × 100      (cible 25–32 %)
Coefficient multipl. = Prix Vente TTC / Coût Matière HT
```

Coût matière : `kds/services/RecipeBOMCostService.ts`. Le food-cost % consolidé par plat n'a pas de service dédié identifié → à formaliser.

### 5.3 Allergènes (règlement INCO 1169/2011) — ✅ (gate) / 🟡 (référentiel)

- `pos/services/AllergenGateService.ts` : bloque la commande si intersection non vide entre `guestAllergens` et les allergènes des articles → audit `ALLERGEN_ORDER_BLOCKED` + log `ALLERGEN_GATE_BLOCKED`.
- `kds/services/LotAllergenMatrixService.ts` : matrice allergène × lot en cuisine.
- Les **14 allergènes majeurs** (gluten, crustacés, œufs, poissons, arachides, soja, lait, fruits à coque, céleri, moutarde, sésame, sulfites > 10 mg/kg, lupin, mollusques) sont un **référentiel** attaché aux fiches recettes — extraction automatique à consolider comme liste canonique partagée.

---

## 6. Réservations, CRM client & bouclier anti-no-show

**Piliers** : commerce + intelligence · **Racine** : `src/modules/commerce/relation/reservations/`

### 6.1 Cahier de réservation — ✅ Implémenté

- UI : `src/app/(client)/(ops)/reservations/`, hook `src/modules/ops/hooks/useSovereignReservations.ts` (test `__tests__/ops/useSovereignReservations.test.ts`).
- API : `src/app/api/reservations/`, `src/app/api/connectors/reservations/`, `src/app/[slug]/reservations/` (public tenant).
- Token de lien public signé : `src/lib/security/ReservationTokenSigner.ts`.
- Réglages : `shared/components/settings/ReservationSettings.tsx`, contrat `shared/nexus/contracts/settings/reservations.ts`.
- Grille de services & PMA (pacing) : `__tests__/commerce/reservation-customizer-pacing.test.ts`, `FloorPlanCapacityHandler.ts`. Les créneaux (midi/soir 1er/2nd service) et le nombre de couverts max par fenêtre de 15 min sont des **réglages tenant**.
- Rappels : `src/lib/cron/ReservationReminderJob.ts`, `src/lib/templates/ReservationTemplateFormatter.ts`, `src/app/api/email/reservation-confirm/`.
- Événement : `reservations.events.ts`, registre `registerHandlers/ops-reservations.ts`, `ReservationNotifierHandler.ts`. `reservation.confirmed` → notif cuisine (via `RestaurantVertical`).

### 6.2 Bouclier anti-no-show — ✅ Implémenté

- **Empreinte bancaire Stripe** : `src/app/api/reservations/card-imprint/route.ts` — `stripe.setupIntents.create(...)` (SetupIntent = empreinte sans débit), conditionné à `resaConfig.cardImprintEnabled === true` ; statut `reservation.cardImprintStatus` (`collected`), `stripePaymentMethodId` stocké. Route **scellée** via `FiscalSealer.sealDataAtomically` (cf. `PLAN-CORRECTIF-2026-08-29`).
- **Détection & pénalité** : `src/lib/cron/NoShowDetectorJob.ts` (déclenchement à T+delai), handlers `NoShowHandler.ts`, `NoShowPenaltyHandler.ts` (capture des arrhes + facture d'indemnité), `NoShowTableReleaseHandler.ts` (libération de table), `NoShowCRMHandler.ts`.
- **Prévision** : `intelligence/forecasting/NoShowAndWeatherForecaster.ts` (+ test `__tests__/intelligence/noshow-forecaster.test.ts`).

### 6.3 CRM & segmentation RFM — ✅ Implémenté

- `shared/eventBus/handlers/CustomerRFMAnalyzerHandler.ts` — score Récence/Fréquence/Montant.
- `RestaurantVertical` : `reservation.no_show` → `crm.rfm_trigger { tenantId, customerId }`.
- Préférences client mémorisées (table préférée, régime, allergènes) : structure CRM `commerce/relation/crm` / `customers`.
- Reconnaissance client : `GuestRecognition` (cité dans `logiquemetier.md`).

### 6.4 Points d'audit

- ⚠️ `logiquemetier.md` : `reservation.confirmed` n'était pas émis par le parcours interne (seulement le connecteur). Vérifier l'émission sur création interne.
- Clé Stripe (`STRIPE_SECRET_KEY`) : gestion en env, jamais en dur.

---

## 7. Kiosque, borne tactile & commande QR à table

**Pilier** : ops · **Racine** : `src/modules/ops/service/restaurant/kiosk/` · **Route publique** : `src/app/[slug]/` + `src/app/(client)/(public)/`

### 7.1 Borne autonome (kiosk) — 🟡 Partiel

Module `kiosk/` présent (grille produits, tunnel de personnalisation). Fluidité 60 FPS = objectif de rendu (Framer Motion, `MotionProvider` avec respect `prefers-reduced-motion`). Vente suggestive (upselling) : à formaliser comme service dédié.

### 7.2 Commande QR à table (zero-install) — 🟡 Partiel

- Route publique tenant : `src/app/(client)/(public)/` (tenant résolu par `?tenant=` ou sous-domaine), `src/app/[slug]/`.
- Lien signé : `ReservationTokenSigner` / équivalent pour la table.
- Paiement direct (Apple Pay / Google Pay / CB) via Stripe : à câbler sur le tunnel public.
- Injection KDS sans re-saisie : passe par les mêmes events `order.*` que le POS.

### 7.3 Points d'audit

- Vérifier l'atteignabilité réelle du parcours QR de bout en bout (URL → panier → paiement → KDS).
- `filterByCapabilities` : la borne/QR doivent être gatés par `tenant.capabilities` (`mod_kiosk` si déclaré).

---

## 8. Click & collect, delivery hub & agrégateurs

**Pilier** : commerce · **Racine** : `src/modules/commerce/relation/delivery/`

### 8.1 Agrégation des flux externes — ✅ Implémenté (adapters)

- Interface : `delivery/adapters/IAggregatorAdapter.ts`.
- Adapters : `delivery/adapters/UberEatsAdapter.ts`, `DeliverooAdapter.ts`.
- Pont : `delivery/aggregators/AggregatorBridge.ts`.
- Webhooks : `src/app/api/webhooks/delivery/`, connecteurs `src/app/api/connectors/delivery/`.
- Synchro : `handlers/AggregatorMenuSyncHandler.ts`, `AggregatorStockSyncHandler.ts`.
- Surveillance : `commerce/acquisition/marketing/UberEatsWatchdogService.ts`.

### 8.2 Dispatch & retrait — 🟡 Partiel

- Temps de préparation dynamique : recoupe `KDSPacingEngine` (§3.3).
- Écran d'appel client (« Commande #104 prête ») : `KDSTicketDoneNotifier.ts` côté KDS ; écran comptoir dédié à confirmer.
- Fleet coursiers : `src/modules/logistics/fleet/delivery/`, `src/shared/providers/fleet/fleetAggregator.ts`.

### 8.3 Points d'audit

- JustEat / boutique en ligne propre : adapters non présents (seuls UberEats + Deliveroo) → 📐.
- Idempotence des webhooks (clé de dédup) à vérifier sur chaque route.

---

## 9. Conformité fiscale NF525, scellement & grand total

**Pilier** : finance · **Implémentation** : `src/lib/mcc/fiscal/FiscalSealer.ts` (hébergé en `lib/` pour éviter le cycle finance ↔ lib — ADR-015 ; `modules/finance/fiscalite/FiscalSealer.ts` est un simple ré-export).

```
[order.paid] ─► RestaurantFinanceAdapter.emitOrderFiscalSeal
        ▼
FinancialNexusBridge.processOrder()  →  JournalEntry (Zod, équilibré débit/crédit)
        ▼
FiscalSealer.sealDataAtomically(dataSnapshot, tenantId, isTrainingMode, journalEntry, …, registerId)
   dans UNE transaction Nexus :
     prev = chainHead(_<registerId>).hash  ||  GENESIS_ROOT
     hash = CryptoService.generateHash(dataSnapshot, prev)          // SHA-256 chaîné
     sig  = CryptoService.signFiscalData(hash, FiscalKeyService.requireKey(tenantId))
     tx.set(fiscalSeals/<sealId>)   { hash, signature, previousHash, dataSnapshot, transactionId, timestamp, serverRecordedAt, registerId }
     tx.set(fiscalMeta/chainHead[_<registerId>])   { hash, sealId, registerId, updatedAt }
     tx.set(journalEntries/<id>)    { …entry, fiscalSealHash, sealedAt, serverRecordedAt }
```

### 9.1 Chaîne d'inaltérabilité — ✅ Implémenté

- **Chaînage** : `previousHash` = tête de chaîne du registre (`chainHead` ou `chainHead_<registerId>` pour le multi-caisse), initialisée à `FISCAL_CONSTANTS.GENESIS_ROOT`.
- **Atomicité** : sceau + tête de chaîne + `journalEntry` écrits dans **une seule** `Nexus.adapter.runTransaction` → pas de fork.
- **Mode formation** : `isTrainingMode` → `hash = TRAINING_MODE_HASH`, `signature = 'VTC_SCHOOL_TRAINING_SIGNATURE'`, `taxExempt`.
- **Numérotation séquentielle** : `generateSequentialReceiptNumber(tenantId)` → `AAAA-000001` via transaction sur `fiscalMeta/receiptCounter` (reset annuel). `generateReceiptNumberFallback()` est `@deprecated`.
- **Immuabilité** : `journalEntries`, `fiscalSeals`, `fiscalLedger` dans `SovereignGuard` → jamais delete/update. `NexusInterceptor` applique la protection WORM.

> ⚠️ Le doc historique citait un scellement **WASM** (`@nexus/fiscal-seal-wasm`). Le fichier `FiscalSealWasm.ts` a été **supprimé** (0 appelant, second protocole concurrent de `FiscalSealer`) — cf. session `claude-cablage-verticales`. Le scellement canonique et **unique** est `FiscalSealer` + `CryptoService` (SHA-256, pas de WASM). La mesure « scellements non canoniques » (cliquet `NON_CANONICAL_SEAL_MAX=0`) garde cet invariant.

### 9.2 Signature (forme conceptuelle)

```
Signature_N = SHA-256( dataSnapshot_N  ‖  previousHash_N )        // CryptoService.generateHash
previousHash_N = hash_{N-1}   (tête de chaîne du registre)
```

Le `dataSnapshot` sérialise l'écriture (ID, date, total µ, ventilation TVA). `CryptoService.signFiscalData` appose la signature de la clé tenant (`FiscalKeyService`).

### 9.3 Grand total perpétuel & PAF — 🟡 Partiel

- Cumul absolu des ventes TTC + piste d'audit fiable (ouverture tiroir sans vente, réimpression duplicata, modif prix manager) : couche `finance/fiscalite` + `AuditLogger` / `empireAudit`.
- ⚠️ `audit-profondeur-2` a relevé que l'audit de chaîne NF525 joignait sur un champ inexistant (`entryId`) et n'était appelé par aucun cron → `BREACH` constant. Vérifier la correction (`registerFinanceNf525Handlers`, `TicketZHandler`).

### 9.4 Tests

`src/__tests__/infrastructure/FiscalSealer.test.ts`, `src/__tests__/integration/nf525-fiscal-sealing.test.ts`, `src/__tests__/e2e/offline-nf525-resilience.test.ts`.

---

## 10. Clôtures fiscales (X & Z), FEC & archivage légal

**Pilier** : finance · **Racine** : `src/modules/finance/comptabilite/fec/`, `src/modules/finance/fiscalite/`

### 10.1 Clôture journalière (Ticket Z) — ✅ Implémenté

- `finance/fiscalite/TicketZEnforcementService.ts` — force la clôture (empêche l'oubli).
- `shared/eventBus/handlers/TicketZHandler.ts` (consomme `finance.z_report_requested`), `ZReportRequestedHandler.ts`, `TicketZArchiveHandler.ts`.
- `src/lib/cron/ZReportAutoJob.ts` — clôture automatique planifiée.
- Test : `src/__tests__/infrastructure/TicketZHandler.test.ts`.
- Procédure : comptage physique du fond → écart théorique/réel → ventilation TVA → incrément compteur Z → verrouillage irréversible de la journée. Ticket X = état intermédiaire non clôturant (même moteur, sans incrément).

### 10.2 Fichier des Écritures Comptables (FEC) — ✅ Implémenté

- Génération : `fec/FECGenerator.ts`, mapping : `fec/FECMapper.ts`, UI : `fec/FECExportPage.tsx` (route `/nf525`, rôles `admin, directeur, comptable`).
- Import (reprise d'historique) : `finance/migration/FECImporter.ts`, `commerce/acquisition/onboarding/migration/fec-import/`.
- Export mensuel : `shared/eventBus/handlers/MonthlyFECExportHandler.ts`.
- Test format : `src/__tests__/finance/fec-format.test.ts`.

**`FECMapper.mapLine(entry, line)`** — conforme art. A.47 A-1 LPF, 18 champs :
`JournalCode, JournalLib, EcritureNum, EcritureDate, CompteNum, CompteLib, CompAuxNum, CompAuxLib, PieceRef, PieceDate, EcritureLib, Debit, Credit, EcritureLet, DateLet, ValidDate, Montantdevise, Idevise`.

| `entry.type` | `JournalCode` | `JournalLib` |
|---|---|---|
| revenue / sales | `VTE` | Ventes |
| expense / purchases | `ACH` | Achats |
| bank | `BNQ` | Banque |
| payroll | `SAL` | Salaires |
| tax / autre | `OD` | Opérations Diverses |

- Montants : `SovereignMath.fromMicrounits(µ).toFixed(2)` (fallback `fromCents`). Débit **ou** crédit renseigné, l'autre vide.
- Dates : `AAAAMMJJ`. `ValidDate` = `entry.sealedAt` (date de scellement) sinon `entry.date`.
- `Idevise = 'EUR'`. Chaque ligne émet `NexusTelemetryService.emitAuditPulse('FINANCE', 'FEC_LINE_MAPPED', …)`.

### 10.3 Archivage légal WORM — ✅

`modules/compliance/services/LegalArchiveService.ts` (`sealEntry`, `sealPeriod`), `finance/comptabilite/ProvisionalSealService.ts` (`sealedAt`).

---

## 11. Stocks périssables, fiches recettes & coulage SmartSpout

**Piliers** : logistics + ops · **Racine** : `src/modules/logistics/stock/inventory/`, `src/modules/logistics/services/`

### 11.1 Déstockage automatique par recette — ✅ Implémenté

- `logistics/services/StockEngine.ts` — moteur de stock.
- `logistics/hooks/useStockDeduction.ts` — déduction temps réel à la vente.
- `ops/production/kds/services/RecipeBOMCostService.ts` — nomenclature (BOM) & coût.
- `ops/production/kds/services/SelfHealingRecipeBomService.ts` — auto-réparation BOM.
- Une vente déstocke chaque composant de la fiche technique (ex. burger → bun, steak, cheddar, sauce = mayo + relish). Les grammages sont des **données recette** (module `logistics/recettes` / `recipes`).

### 11.2 Yield management & parage — 🟡 Partiel

Coefficient de parage (1 kg brut → portion nette) : la fiche technique doit porter un `yieldRatio` / coût indexé sur le poids brut. À formaliser dans le schéma recette.

### 11.3 Réconciliation débitmètres SmartSpout — ✅ Implémenté (logiciel) / 📐 (hardware)

`ops/service/restaurant/pos/services/SmartSpoutTelemetryService.ts` → `analyzeSpoutActivity(event)` :

```
event = { tenantId, spoutId, productId, productName, dispensedCl, billedCl, tolerancePct? }
varianceCl   = round((dispensedCl − billedCl) × 10) / 10
variancePct  = billedCl > 0 ? round(varianceCl / billedCl × 1000) / 10 : 100
isOverPouring       = variancePct > tolerance        (tolérance défaut 5 %)
isFreePourSuspected = billedCl === 0 && dispensedCl > 0     (dose coulée sans ticket)
```

- Émet `bar.spout_variance_detected` si sur-versement ou free-pour.
- Si `varianceCl ≥ bar.spout_variance_cl` (réglage, défaut 10) → `AuditLogger` action `BAR_SPOUT_DISCREPANCY`.
- Support : `pos/services/KegHydrostaticLossService.ts` (perte hydrostatique fût).

> 📐 Le **paquet binaire hardware** (`struct SpoutTelemetryPacket` : `spout_id`, `timestamp_utc_ms`, `pulses_count`, `volume_milliliters`, `temperature_x10`, `valve_state` — WebSocket 100 Hz / 10 ms) est une **spécification de transport** entre les becs verseurs connectés et le service. Le service applicatif raisonne en **centilitres** (`dispensedCl` / `billedCl`), pas en paquets bruts. La passerelle WebSocket → `SpoutTelemetryEvent` reste à implémenter.

---

## 12. Sécurité alimentaire, HACCP & traçabilité matière

**Pilier** : compliance · **Racine** : `src/modules/compliance/qualite/haccp/`

### 12.1 Traçabilité des enceintes frigorifiques — ✅ Implémenté

- Capteurs IoT : `haccp/iot/IoTSensorService.ts`, monitoring hors-ligne `src/lib/cron/IotOfflineMonitorJob.ts`, `handlers/IotOfflineAlertHandler.ts`.
- Tendance température : `haccp/tempTrend.ts`.
- Événement : `sensor.temperature_anomaly { sensorId, temperature, durationInMinutes }` → `RestaurantVertical` émet `haccp.alert` (severity `CRITICAL` si `durationInMinutes > 30`, sinon `HIGH`) et déclenche `RestaurantMccAdapter.emitFiscalAuditRequired` si > 30 min.
- Déclassement sanitaire automatique (rupture froid nocturne → verrouillage des ingrédients contre la vente) : logique de blocage à relier au `StockEngine` / 86-list.
- Schéma : `compliance/domain/schemas/haccp.ts`. Service : `haccp/HACCPLogService.ts` (test dédié).

> Le transport BLE / LoRa des sondes est un **choix hardware** ; le socle consomme `IoTSensorService`.

### 12.2 DLC secondaires & plan de nettoyage — ✅ Implémenté

- `haccp/components/DLCTracker.tsx` — étiquetage J+n de déconditionnement (produit, date/heure d'ouverture, DLC secondaire, opérateur).
- `src/lib/cron/DLCExpiryJob` → événement `dlc.expired { itemId, quantity, batchNumber }` → `RestaurantVertical` émet `notification.created` (priorité `high`, « lot à retirer »).
- `haccp/components/CleaningPlan.tsx` — plan de nettoyage & désinfection (PND), émargement par shift.
- Non-conformités : `haccp/components/NonConformityForm.tsx`, `NCStatusBadge.tsx`.
- Alertes périssables : `haccp/components/PerishableAlertsTracker.tsx` (branché dynamiquement — cf. `PLAN-CORRECTIF-2026-08-29`).
- Auto-audit NF525 : `haccp/components/NF525SelfAudit.tsx`.
- Gaspillage → coût matière : `haccp/handlers/WasteToFoodCostHandler.ts`, `handlers/WasteDailyAggregatorHandler.ts`.

---

## 13. Fournisseurs, approvisionnement & facturation Factur-X

**Piliers** : logistics + finance · **Racine** : `src/modules/logistics/approvisionnement/`, `src/modules/finance/comptabilite/einvoicing/`

### 13.1 Cycle d'approvisionnement — ✅ Implémenté

- Hub 360° : `approvisionnement/ui/SupplierHubDashboard.tsx` (route `/suppliers`, rôles `admin, directeur, manager, chef_cuisine`), service `logistics/services/SupplierHubService.ts`.
- Onglets branchés sur `SupplierHubService` (microunits, 0 cycle) : `MercurialeTab`, `DisputesTab`, `RfaTab`, `OrdersTab` (cf. session `remédiation-uiux-lot0-lota`).
- Réapprovisionnement automatique : `approvisionnement/procurement/AutoProcurementEngine.ts` (+ test), `approvisionnement/ui/AutoProcurementWizard.tsx`, `services/PredictiveProcurementEngine.ts`.
- Réception & litiges : `approvisionnement/reception/DeliveryDisputeService.ts`.

### 13.2 Rapprochement 3 voies — ✅ Implémenté

`approvisionnement/procurement/ThreeWayMatchEngine.ts` + `finance/tresorerie/ap/ThreeWayMatchService.ts` : Bon de commande ↔ Bon de livraison pointé ↔ Facture fournisseur. Handler d'écart : `handlers/ProcurementMismatchHandler.ts`. Test d'intégration : `src/__tests__/integration/procurement-to-3way-match.test.ts`.

### 13.3 Factur-X / e-invoicing — ✅ Implémenté

- Lecture XML hybride Factur-X / CII : `finance/comptabilite/einvoicing/FacturXParser.ts` (test `__tests__/finance/FacturXParser.test.ts`).
- Génération : `finance/comptabilite/documents/FacturXGenerator.ts`, bouton `finance/components/FacturXDownloadButton.tsx`.
- Cycle de vie facture entrante : `einvoicing/InboundInvoiceLifecycle.ts` (test dédié).
- Pré-remplissage des lignes d'achat + mise à jour des mercuriales de prix depuis le CII.

---

## 14. Ressources humaines & moteur de paie HCR (IDCC 1979)

**Pilier** : human · **Moteur** : `src/modules/human/services/HcrPayrollEngine.ts` · **UI** : `src/app/(client)/(ops)/staff/` (onglet `payroll`)

```
[shift logs pointés]  ──►  computePayroll(members, logs, "YYYY-MM")   (staffUtils.ts, pur)
        ▼
HcrPayrollEngine.computeMonthlyPayroll(user, shifts, month)  ──►  HcrEmployeeMonthlyPayroll
        ▼
PayrollTab  ──►  HcrPayrollEngine.exportToPrepaieCsv(rows[])  ──►  CSV (BOM UTF-8) Silae / PayFit
```

### 14.1 Constantes conventionnelles — ✅ Implémenté

`HCR_CONSTANTS` (`HcrPayrollEngine.ts:18`) :

| Constante | Valeur | Sens |
|---|---|---|
| `LEGAL_WEEKLY_HOURS` | 35 | durée légale hebdo |
| `CONTRACTUAL_39H_WEEKLY` | 39 | contrat 39 h (4 h supp régulières) |
| `LEGAL_MONTHLY_HOURS` | 151.67 | mensualisation |
| `OVERTIME_TIER_1_RATE` | 0.10 | 36ᵉ→39ᵉ h : **+10 %** |
| `OVERTIME_TIER_2_RATE` | 0.20 | 40ᵉ→43ᵉ h : **+20 %** |
| `OVERTIME_TIER_3_RATE` | 0.50 | 44ᵉ h et + : **+50 %** |
| `NIGHT_HOUR_START` / `NIGHT_HOUR_END` | 22 / 7 | plage de nuit 22 h→07 h |
| `REPAS_MINIMUM_GARANTI_EUR` / `_MU` | 4.15 / 4 150 000 | avantage repas (MG) |
| `EXTRA_CONGES_PAYES_RATE` | 0.10 | indemnité CP des extras CDDU |
| `MU_TO_EUR` | 1 000 000 | conversion µ → € |

### 14.2 Algorithmes — ✅ Implémenté

- **`computeNightHours(start, end)`** : parcours **minute par minute**, compte chaque minute où `h ≥ 22 || h < 7`. Précision 0,01 h.
- **`breakdownWeeklyHours(weeklyTotalHours, …)`** : `regular = min(total, 35)` ; tranche 1 = `min(reste, 4)` ; tranche 2 = `min(reste, 4)` ; tranche 3 = reste. *(Test : 46 h → 35 / 4 / 4 / 3.)*
- **`computeMonthlyPayroll(user, shifts, month)`** :
  - taux : `user.hourlyRateInMicrounits / 1e6` (défaut 15 €/h).
  - repas MG : `+1` si shift ≥ 5 h, `+2` si ≥ 9 h.
  - répartition mensuelle sur **base 4,33 semaines** : `weeklyAvg = total / 4.33`, breakdown, puis reprojection `× 4.33`.
  - `overtimeTierN_Pay = heuresN × tauxHoraire × (1 + rateN)`.
  - **majoration de nuit** : `nightHours × tauxHoraire × 0.15` (**+15 %**).
  - **CP extra CDDU** : `isExtraCddu ? (base+heuresSupp+nuit) × 0.10 : 0`.
  - `grossTotal = base+supp+nuit + cpExtra + repas`.
  - `netEstimé = (grossTotal − repas) × 0.78` *(indicatif)* ; `coûtEmployeur = grossTotal × 1.42` *(indicatif)*.
- **`exportToPrepaieCsv(payrolls[])`** : 16 colonnes `;`-séparées : `Matricule_ID;Nom_Employe;Role;Type_Contrat;Mois;Taux_Horaire_EUR;Heures_Totales;Heures_Normales;Heures_Supp_10pct;Heures_Supp_20pct;Heures_Supp_50pct;Heures_Nuit;Repas_MG_Nombre;Brut_Total_EUR;Net_Estime_EUR;Cout_Employeur_Estime_EUR`.

### 14.3 UI — ✅ Implémenté

- Écran : `staff/page.tsx`, onglets `StaffTab = "team" | "planning" | "timesheet" | "leaves" | "recruitment" | "payroll" | "freelance" | "skills"`.
- `staff/_tabs/PayrollTab.tsx` : KPI (brut total, coût employeur, heures, heures supp, heures nuit, repas), export CSV (Blob `﻿` + `text/csv;charset=utf-8`), ouverture `ContractGeneratorModal`.
- Gating : `TabGuard pageKey="staff" tabKey="payroll"` + `useTabAccess("staff","payroll")` — **accès managers uniquement**.
- Types : `staffUtils.ts` → `PayrollRow { user, hours, hourlyRateEur, grossEur, regularHours?, overtimeHours?, nightHours?, mealCount?, hcrPayroll? }`.

### 14.4 Statut & réserves

- ✅ Moteur + UI + export + tests (5 tests dans `HcrPayrollEngine.test.ts`).
- 🟡 Net / coût employeur = **estimations forfaitaires** (× 0,78 / × 1,42) — pas un bulletin de paie. C'est une **pré-paie** (le doc le dit : « ventilation HCR → export expert-comptable »).
- 🟡 `computeNightHours` : `new Date(\`${date}T${startTime}\`)` interprète en heure locale du serveur → sensible au fuseau (cf. `fiscalDate.ts` / `isNightService`). À aligner sur le fuseau tenant.
- 🟡 Majoration de nuit +15 % = valeur forfaitaire retenue (la CCN HCR prévoit une compensation en repos ou majoration selon accord d'entreprise) — paramétrer par tenant.

---

## 15. Prestataires freelances, auto-entrepreneurs & self-billing

**Piliers** : human + finance · **Moteur** : `src/modules/human/services/ContractorSelfBillingService.ts` · **UI** : `staff/_tabs/FreelanceTab.tsx`

### 15.1 Profil prestataire — ✅ Implémenté (schéma)

`ContractorProfileSchema` (`human/domain/schemas/users.ts:27`) sur `User` :

| Champ | Contrainte |
|---|---|
| `siren` | `/^[0-9]{9}$/` (optionnel) |
| `siret` | `/^[0-9]{14}$/` (optionnel) |
| `companyName` | 1–120 |
| `vatRegime` | `franchise_art_293b` \| `vat_standard_20` \| `vat_exempt` (défaut `franchise_art_293b`) |
| `billingRateType` | `hourly` \| `shift_flat_fee` \| `per_cover` |
| `rateInMicrounits` | entier ≥ 0 |
| `selfBillingAgreed` | booléen (défaut `false`) |
| `urssafVigilanceCertificateUrl` / `…ValidUntil` | attestation de vigilance |
| `iban` / `bic` / `address` / `city` / `postalCode` | coordonnées de règlement |

`ContractType` inclut `freelance` et `interim` ; `EmploymentStatus` inclut `contractor` et `agency`.

### 15.2 Validation SIRET (Luhn) — ✅ Implémenté

`ContractorSelfBillingService.validateSiretLuhn(siret)` : nettoie les espaces, exige 14 chiffres, applique Luhn (double des rangs pairs 0-indexés, `−9` si > 9), valide si `Σ % 10 === 0`. *(Test : `73282932000074` → true ; `12345678901234` → false.)*

### 15.3 Mandat d'auto-facturation B2B — ✅ Implémenté

`generateSelfBillingInvoice({ contractor, tenant, shifts, periodMonth, invoiceSequenceNumber? })` → `SelfBillingInvoiceDraft` :

- **Cadre** : art. 242 nonies annexe II CGI (mandat préalable), art. 293 B CGI (franchise), format Factur-X / CII (Chorus Pro, PDP, décret 2026).
- Numéro : `FAC-AUTO-<AAAAMM>-<seq>`. Échéance : **+15 jours**.
- Par vacation : `hours = durée(ms)/3.6e6`, `lineHtMu = round(hours × rateMu)`, `lineVatMu = round(lineHtMu × vatRate/100)` avec `vatRate = 20` si `vat_standard_20`, sinon **0**.
- Totaux µ puis € (`/1e6, toFixed(2)`).
- **Mentions légales** : « Facture émise au nom et pour le compte du prestataire (Mandat d'auto-facturation) », « Dispensé d'immatriculation RCS / RM », + si franchise : « **TVA non applicable, art. 293 B du CGI** ».
- **`xmlFacturX`** : `CrossIndustryInvoice` (CII) minimal — `ExchangedDocument` (ID, `TypeCode` 380, date), `SellerTradeParty` / `BuyerTradeParty` (SIRET `schemeID="0002"`), `SpecifiedTradeSettlementHeaderMonetarySummation` (`LineTotalAmount`, `TaxTotalAmount`, `GrandTotalAmount`).

### 15.4 Écriture comptable — ✅ Implémenté

`generateAccountingEntry(invoice)` → 2 ou 3 lignes :

| Compte | Libellé | Sens | Condition |
|---|---|---|---|
| `611000` | Sous-traitance générale | débit | toujours |
| `445660` | TVA déductible sur autres biens et services | débit | si `totalVat > 0` |
| `401000` | Fournisseurs - Prestataires divers | crédit | toujours (TTC) |

Montants en `amountInCents` **et** `amountInMicrounits`. *(Test : 150 € HT + 30 € TVA → lignes 15000 / 3000 / 18000 cents.)*

### 15.5 UI — ✅ Implémenté

`FreelanceTab.tsx` (managers/direction uniquement) : KPI (HT, TVA, TTC, heures), `vigilanceStatus` (`valid` / `expiring_soon` / `missing`), génération facture + modale d'aperçu, ouverture `ContractGeneratorModal`. Type `ContractorRow` dans `staffUtils.ts`.

### 15.6 Réserves

- 🟡 Attestation de vigilance URSSAF : suivi **semestriel** obligatoire dès **5 000 €** cumulés (art. L.8222-1 / R.8222-1) — le champ `vigilanceStatus` existe, l'automatisation du rappel semestriel reste à câbler.
- 🟡 Numéro de séquence de facture : `Math.random()` en fallback → à remplacer par un compteur transactionnel (comme `generateSequentialReceiptNumber`) pour une vraie séquence sans trou.
- 📐 Émission Chorus Pro / PDP réelle (dépôt du flux) non implémentée — seul le XML est produit.

---

## 16. Générateur juridique de contrats & conventions

**Pilier** : human · **Moteur** : `src/modules/human/services/HcrLegalContractService.ts` · **UI** : `staff/_tabs/ContractGeneratorModal.tsx`

### 16.1 Aiguillage — ✅ Implémenté

`HcrLegalContractService.generateContract(input)` :

```
isFreelance = contractType === 'freelance' || employmentStatus === 'contractor'
  ├─ freelance        → generateFreelanceAgreement()   → CONVENTION_PRESTATION_FREELANCE
  └─ salarié :
       ├─ 'extra_cddu' → generateExtraCdduContract()    → EXTRA_CDDU_HCR
       ├─ 'cdd'        → generateCddContract()          → CDD_HCR
       └─ sinon        → generateCdiContract()          → CDI_HCR
```

Sortie `GeneratedLegalDocument { documentId, type, title, parties, sections[], fullText, generatedAt }`.

### 16.2 Les 4 documents — ✅ Implémenté

| Type | Articles générés |
|---|---|
| **`CONVENTION_PRESTATION_FREELANCE`** | 1. Objet & autonomie (sans lien de subordination) · 2. Rémunération HT/heure, vacations certifiées · 3. **Mandat d'auto-facturation** (art. 242 nonies ann. II CGI) + régime TVA · 4. Obligation de vigilance URSSAF (art. L.8222-1 / R.8222-1, tous les 6 mois) |
| **`CDI_HCR`** | 1. Engagement + CCN HCR **IDCC 1979** · 2. Fonction & classification (`Niveau I Échelon 1` défaut) · 3. Durée du travail (39 h défaut, 4 h supp régulières **+10 %**) · 4. Rémunération + avantages en nature nourriture (MG) · 5. Période d'essai 1 mois renouvelable |
| **`EXTRA_CDDU_HCR`** | 1. Nature (art. L.1242-2 3° C. trav. + art. 14 CCN HCR) · 2. **DPAE** URSSAF avant prise de poste · 3. Rémunération heures réelles + **indemnité CP 10 %** |
| **`CDD_HCR`** | 1. Motif & durée (surcroît temporaire) · 2. Fonction & horaires (35 h défaut) · 3. Indemnités de fin de contrat (10 %) + CP |

Taux par défaut : freelance 25 €/h, CDI 13,50 €/h, extra 15 €/h.

### 16.3 UI — ✅ Implémenté

`ContractGeneratorModal.tsx` : champs `startDate` / `endDate` / `jobTitle` / `classificationLevel`, calcul du taux depuis `hourlyRateInMicrounits`, aperçu du `fullText`, export. Détection freelance identique au service.

### 16.4 Réserves

- 🟡 Documents = **modèles générés** (texte structuré), pas des PDF signés — pas de signature électronique / horodatage qualifié. La route `POST /api/tenant/contracts/[contractId]/sign` existe (gardée, `assertTenant`) mais le flux de signature complet est à confirmer.
- 🟡 Classifications HCR : le référentiel complet (niveaux/échelons × grilles de salaire minimum) n'est pas embarqué — saisie libre.
- 3 tests dans `HcrLegalContractService.test.ts` (freelance, CDI 39 h, extra CDDU).

---

## 17. Pilotes matériels, octets ESC/POS & télémétrie IoT

**Pilier** : ops · **Racine** : `src/modules/ops/service/core/printing/hardware/`

### 17.1 Table des commandes ESC/POS — ✅ Implémenté

`escpos/EscPosCommands.ts` — `ESC = 0x1b`, `GS = 0x1d`, `LF = 0x0a`. Table `CMD` (réelle) :

| Clé `CMD` | Octets | Effet |
|---|---|---|
| `INIT` | `1B 40` | `ESC @` — initialisation matérielle |
| `ALIGN_LEFT / CENTER / RIGHT` | `1B 61 00/01/02` | alignement |
| `BOLD_ON / OFF` | `1B 45 01/00` | gras |
| `DOUBLE_HEIGHT` | `1D 21 01` | double hauteur |
| `DOUBLE_SIZE` | `1D 21 11` | double hauteur + largeur |
| `NORMAL_SIZE` | `1D 21 00` | taille normale |
| `FEED_1…5` | `1B 64 0N` | avance papier N lignes |
| `CUT_FULL` | `1D 56 00` | massicot coupe totale |
| `CUT_PARTIAL` | `1D 56 01` | massicot coupe partielle |
| `OPEN_DRAWER` | `1B 70 00 19 FA` | impulsion tiroir-caisse RJ11/RJ12 (`ESC p 0 25 250`) |

Helpers purs : `microToEuros`, `fmtEur` (`" €"`, remap `€`→`0x80` en CP1252/CP858), `lineWidth(paperWidth)` (58 mm→32, 72 mm→40, autre→42), `encodeText` (hors-BMP → `?`), `padR` / `padL` / `sep`.

Autres fichiers : `escpos/EscPosEncoder.ts`, `escpos/EscPosReceiptFormatter.ts`, `hardware/EscPosBuilder.ts`. Test : `src/__tests__/printers/escpos-builder.test.ts`.

Routage & failover : `pos/services/PrinterFailoverRoutingService.ts`, `handlers/KdsPrintFallbackHandler.ts` (bon cuisine KO → repli passe).

> ⚠️ Le doc historique citait un buzzer `ESC B 3 2` (`1B 42 03 02`). **Absent** de la table `CMD` — le signal sonore cuisine passe par `KDSAudioHardwareService.ts` (audio applicatif), pas par une commande imprimante. À ajouter si un buzzer série est requis.

### 17.2 Télémétrie IoT (frigos, becs) — voir §11.3 & §12.1

- Becs verseurs : `SmartSpoutTelemetryService` (centilitres, tolérance 5 %).
- Sondes frigo : `haccp/iot/IoTSensorService.ts`, `IotOfflineMonitorJob`.
- 📐 Le paquet binaire `SpoutTelemetryPacket` (WebSocket 100 Hz) est une spec de transport hardware (cf. §11.3).

---

## 18. Architecture offline-first, outbox & résilience

**Transverse** · **Fichier** : `src/lib/offline/OutboxService.ts` (+ `offline-store.ts` Dexie, `outboxReplayer.ts`, `offlineQueue.ts`)

### 18.1 Outbox atomique — ✅ Implémenté

`OutboxService.enqueue(params)` / `drain()` / `getPendingCount()` :

- Toute mutation locale enfilée dans `db.syncQueue` (Dexie/IndexedDB) avec un `eventId` (idempotence — ADR-001).
- **Tiers de priorité** `OutboxPriority` (drainé du plus élevé au plus bas) :

| Tier | Valeur | Contenu | Détection auto (`resolvePriority`, tokens du path) |
|---|---|---|---|
| `LEGAL` | 3 | contrôle DGFiP, archive légale, RPI URSSAF | `legal, dgfip, urssaf, inspection, /rpi, personnelinstant` |
| `SANITAIRE` | 2 | alertes HACCP, refroidissement, RappelConso, TIAC | `haccp, chilling, refroidiss, recall, rappelconso, tiac, sanitaire, foodalert, biohazard` |
| `FISCAL` | 1 | sceau NF525, `journalEntries`, Ticket Z, FEC | `fiscal, journal, seal, ticketz, grandtotal, fec` |
| `NORMAL` | 0 | tout le reste | — |

- `drain()` : tri `priorité desc` puis chronologique ; `SET/CREATE` → `Nexus.adapter.set`, `UPDATE` → `update`, `DELETE` → `delete` ; succès → suppression de la file.
- **Backoff** : jusqu'à **5 tentatives**. Au-delà : `status = 'failed'` (DLQ). Si `priority > 0` : `OpsAlertGateway.send({ severity: 'critical', … })` avec le label du tier.
- Tests : `__tests__/infrastructure/OutboxService.test.ts`, `OutboxPriority.test.ts`, `__tests__/offline/offline-queue-resilience.test.ts`, `__tests__/e2e/offline-nf525-resilience.test.ts`.
- Moteur de haut niveau : `src/lib/OfflineMasteryEngine.ts`, résilience : `src/modules/intelligence/ia/resilience/`.

### 18.2 Matrice de résilience — statut par scénario

| # | Scénario | Statut | Mécanisme |
|---|---|---|---|
| 1 | Coupure internet totale | ✅ | Outbox Dexie, `eventId` déterministe, drain idempotent au retour `navigator.onLine` |
| 2 | Crash imprimante cuisine | ✅ | `PrinterFailoverRoutingService` / `KdsPrintFallbackHandler` → repli passe |
| 3 | Panne frigo nocturne | ✅ | `sensor.temperature_anomaly` → `haccp.alert` CRITICAL + audit fiscal ; blocage vente = 🟡 à câbler |
| 4 | No-show client | ✅ | `NoShowDetectorJob` → `NoShowPenaltyHandler` (capture Stripe) + `NoShowTableReleaseHandler` |
| 5 | Concurrence de saisie table | ✅ | `useTableLock.ts` (verrou optimiste `versionTag`) |
| 6 | Coulage / vol bar | ✅ | `SmartSpoutTelemetryService` (rapprochement dose vs ticket) |
| 7 | Rupture ingrédient en rush | ✅ | `EightysixtService` (cascade 86 → grisé temps réel tous terminaux) |
| 8 | Changement de serveur | 🟡 | `HardenedTouchUiHelper` + verrou PIN (inactivité à confirmer) |
| 9 | Panne secteur générale | 📐 | sauvegarde transactionnelle avant extinction onduleur — pas de hook dédié identifié |

---

## 19. Gouvernance RBAC, sécurité & flotte MCC

**Kernel** : `src/kernel/contracts/rbac.ts` · **Dérivation** : `src/verticals/_shared/derivation/RbacDeriver.ts` · **UI** : `src/shared/components/rbac/`

### 19.1 Principe (ADR-019) — ✅

> **Le kernel connaît les niveaux ; la verticale nomme les rôles.** `admin` / `directeur` / `manager` / `comptable` sont structurels (kernel). Les rôles métier vivent dans le `roleMap` du blueprint.

`RESTAURANT_BLUEPRINT.roleMap` (`src/verticals/restaurant/restaurant.blueprint.ts`) :

| Rôle | `level` | `labelKey` |
|---|---|---|
| `chef_rang` | 50 | `role.head_waiter` |
| `chef_cuisinier` | 45 | `role.head_chef` |
| `serveur` | 40 | `role.server` |
| `cuisinier` | 35 | `role.cook` |
| `barman` | 35 | `role.bartender` |
| `hotesse` | 30 | `role.host` |
| `plongeur` | 10 | `role.dishwasher` |

Correspondance indicative avec les privilèges du doc historique :

| Tranche | Rôles | Accès type |
|---|---|---|
| 10 | plongeur / commis | pointage, tâches HACCP |
| 30–40 | hôtesse, serveur, barman, cuisinier | prise de commande, encaissement de son rang, réclames |
| 45–50 | chef cuisinier, chef de rang | KDS, fiches recettes, 86-list, températures / transferts de table, split, réservations |
| structurel | manager / directeur / admin / comptable | remises, offerts, réouvertures, plannings, stocks / clôtures Z, FEC, contrats RH |

### 19.2 Gardes — ✅ Implémenté

- Pages : `withPageGuard` (automatique via layout du groupe `(admin)` / `(ops)`), `DEFAULT_PAGE_ACCESS` (`@/modules/human`).
- Onglets : `TabGuard` + `useTabAccess(page, tab)`, `DEFAULT_TAB_ACCESS`.
- Actions : `shared/components/rbac/ActionGuard.tsx` (`disabledMode="disable"` + `disabledReason` tooltip), `pos/_hooks/useRbacGate.ts`.
- Config tenant : `RestaurantVertical.initialize()` → `context.registerRbacConfig(TenantRBACConfigSchema.parse(...))`.
- Matrice : `shared/components/settings/RBACTenantMatrix.tsx`, API `src/app/api/admin/rbac/`.
- ⚠️ ADR-019 étape (c) non terminée : ~160 fichiers comparent encore des **noms** de rôle au lieu de **niveaux** (cf. `merge-plan-10-items`).

### 19.3 Sécurité & MCC

- **SovereignGuard** : barrière cross-tenant sur toute écriture Nexus (membrane ADR-002). ⚠️ `audit-profondeur-2` : `SovereignGuard` hors du chemin serveur (`registerServerAdapter`) et désactivé sous `NODE_ENV=test` — à durcir.
- **Auth agnostique** : `IServerAuthProvider` / `IClientAuthProvider` (plan `firestore.md` Lots A–D + G.2.1 mergés). ⚠️ `AUDIT-DB-AGNOSTICISME` : 174/216 routes API contournent encore `IServerAuthProvider` via `getAuth().verifyIdToken()`.
- **MCC** (Multi-Cloud-Control) : provisioning, clone tenant de référence, changelog, décommission. **Règle absolue : le MCC ne consomme JAMAIS les events métier tenant** (commandes, RDV, consultations) — cf. `docs` mémoire MCC.
- **AI Scope Isolation** (ADR-008) : tout caller LLM passe par `MCCAIRegistry` ou `TenantAIRegistry.forTenant`, jamais `LLMManager`.

---

## 20. Audit du code source & matrice de couverture

### 20.1 Arborescence réelle (sections citées)

```
src/
├── verticals/restaurant/
│   ├── RestaurantVertical.ts              # plugin : routes /menu-engineering, /floor-plan, /nf525, /suppliers + wiring events
│   ├── restaurant.blueprint.ts            # meta, capabilities, roleMap (7 rôles), tokens table/course
│   ├── adapters/                          # 8 adapters : Finance, Facility, Intelligence, Mcc, Human, Logistics, Commerce, Compliance
│   ├── handlers/FireNextCourseHandler.ts  # « Feu suite ! »
│   └── presentation/MenuEngineeringDashboard.tsx
├── modules/
│   ├── ops/service/restaurant/pos/        # §1-2  : components/ hooks/ services/ domain/ handlers/
│   ├── ops/service/restaurant/kiosk/      # §7
│   ├── ops/service/core/printing/hardware/escpos/   # §17
│   ├── ops/production/kds/                # §3    : KDSCourseSequencingEngine, KDSPacingEngine, EightysixtService…
│   ├── commerce/relation/reservations/    # §6
│   ├── commerce/relation/delivery/aggregators/       # §8
│   ├── finance/comptabilite/fec/          # §10   : FECGenerator, FECMapper, FECExportPage
│   ├── finance/comptabilite/einvoicing/   # §13   : FacturXParser, InboundInvoiceLifecycle
│   ├── finance/fiscalite/                 # §9-10 : FiscalSealer (ré-export), TicketZEnforcementService
│   ├── compliance/qualite/haccp/          # §12   : + iot/IoTSensorService
│   ├── human/services/                    # §14-16 : HcrPayrollEngine, ContractorSelfBillingService, HcrLegalContractService
│   ├── human/domain/schemas/users.ts      # §15   : ContractorProfileSchema, ContractType, EmploymentStatus
│   ├── logistics/services/StockEngine.ts  # §11
│   └── logistics/approvisionnement/procurement/      # §13   : ThreeWayMatchEngine, AutoProcurementEngine
├── lib/
│   ├── mcc/fiscal/FiscalSealer.ts         # §9    : implémentation réelle du scellement
│   ├── offline/OutboxService.ts           # §18
│   └── cron/                              # NoShowDetectorJob, ZReportAutoJob, DLCExpiryJob, IotOfflineMonitorJob…
├── kernel/contracts/rbac.ts               # §19
├── shared/
│   ├── services/SovereignMath.ts          # §2    : splitRemainder, orderTotalMicrounits, fromMicrounits
│   ├── components/rbac/{ActionGuard,TabGuard}.tsx    # §19
│   └── eventBus/handlers/                 # NoShow*, Aggregator*, MenuEngineering*, TicketZ*, FloorPlanCapacity…
└── app/
    ├── (client)/(ops)/{pos,kds,staff,reservations,floor-plan}/    # écrans
    └── api/reservations/card-imprint/route.ts        # §6 : empreinte Stripe scellée
```

### 20.2 Fichiers neufs de la livraison RH/Freelance (session `antigravity-hcr-payroll-freelance`, non commitée au 2026-09-01)

| Fichier | Type |
|---|---|
| `src/modules/human/services/HcrPayrollEngine.ts` | moteur pré-paie |
| `src/modules/human/services/ContractorSelfBillingService.ts` | self-billing B2B |
| `src/modules/human/services/HcrLegalContractService.ts` | contrats |
| `src/app/(client)/(ops)/staff/_tabs/FreelanceTab.tsx` | UI freelances |
| `src/app/(client)/(ops)/staff/_tabs/ContractGeneratorModal.tsx` | UI contrats |
| `src/__tests__/human/{HcrPayrollEngine,ContractorSelfBilling,HcrLegalContractService}.test.ts` | 11 tests |
| modifiés : `staff/page.tsx`, `staff/_tabs/PayrollTab.tsx`, `staff/staffUtils.ts`, `human/domain/schemas/users.ts`, `human/services/index.ts`, `human/services/StaffService.ts`, `StaffMemberForm.tsx`, `useStaffPage.ts`, `i18n/translations.ts` | — |

> ⚠️ **5 violations Barrel Contract** signalées : `@/modules/human/services/{HcrLegalContractService,ContractorSelfBillingService,HcrPayrollEngine}` importés **en profondeur** au lieu du barrel `@/modules/human`. À corriger avant commit (cf. `.claude/sessions.md`). Constaté dans ce document : `PayrollTab.tsx`, `FreelanceTab.tsx`, `ContractGeneratorModal.tsx`, `staffUtils.ts`, et les 3 fichiers de test importent bien `@/modules/human/services/...`.

### 20.3 Matrice de validation

Voir [Annexe B](#annexe-b--matrice-de-couverture-des-20-sections).

---

## Annexe A — Preuves formelles mesurées en session

> Exécutées le 2026-09-01 dans la session `claude-encyclopedie-audit-ultra` (lecture seule sur `src/`).

| # | Commande | Résultat | Exit |
|---|---|---|---|
| 1 | `npx tsc --noEmit` (via `rtk proxy`) | aucune sortie → **0 erreur** | 0 |
| 2 | `rtk proxy npx vitest run src/__tests__/human/` | `Test Files 3 passed (3)` · `Tests 11 passed (11)` · `Duration 1.20s` | 0 |
| 3 | `node scripts/gate-last-mile.mjs` | **14 cliquets** listés, « ✅ Dernier kilomètre : aucun compteur en hausse » (1 cliquet *lâche* signalé non bloquant : `frHardcoded` 777 → seuil 781) | 0 |
| 4 | `node scripts/verify-gate-integrity.mjs` | « ✅ Intégrité des gates OK (**hash=249420b039b90281**) » | 0 |

Les 14 cliquets de la Gate 6 (`CLIQUETS` dans `scripts/gate-last-mile.mjs`, seuils dans `preflight.sh`) :
`orphans` · `unreadSettings` · `missingI18n` · `inertProps` · `nonCanonicalSeal` · `fakeMetrics` · `dsAdoption` · `a11yMuets` · `a11yModales` · `a11yKeyboard` · `verticalStubs` · `verticalScreensUnwired` · `frHardcoded` · `hardcodedHex`.

> Non ré-exécuté ici (coûteux, hors périmètre lecture) : `npm run preflight` complet (Next.js build, ESLint, sentrux, madge, suite Vitest complète). Se référer à `.git/preflight-proof` et `docs/HEALTH.md` pour l'état consolidé.

---

## Annexe B — Matrice de couverture des 20 sections

| § | Domaine | Moteur / service principal | Route / point d'entrée | Tests | Statut global |
|---|---|---|---|---|---|
| 1 | POS | `usePos`, `posOrderSubmit` | `/pos` | `cartDiscounts.test.ts`, `TableLockService.test.ts` | ✅ |
| 2 | Split bill | `SovereignMath.splitRemainder`, `usePosSplit` | `SplitBillDialog` | via SovereignMath | ✅ |
| 3 | KDS / coursing | `KDSCourseSequencingEngine`, `KDSPacingEngine` | `/kds` | `KDSCourseSequencingEngine.*test`, `KDSPacingEngine.test` | ✅ |
| 4 | Plan de salle | `FloorPlanHeatmapService`, `FloorPlanGeometry` | `/floor-plan` | `floor-plan-heatmap.test.ts` | ✅ / 🟡 (3D) |
| 5 | Menu engineering | `MenuEngineeringService.classify` | `/menu-engineering` | — | ✅ (BCG) / 🟡 (food-cost) |
| 6 | Réservations / no-show | `NoShowDetectorJob`, `card-imprint/route.ts` | `/reservations`, `/api/reservations/*` | `useSovereignReservations.test`, `noshow-forecaster.test` | ✅ |
| 7 | Kiosque / QR | module `kiosk/` | `src/app/[slug]/`, `(client)/(public)/` | — | 🟡 |
| 8 | Delivery | `AggregatorBridge`, `UberEatsAdapter`, `DeliverooAdapter` | `/api/webhooks/delivery` | `delivery` | ✅ (UE+Deliveroo) / 📐 (JustEat) |
| 9 | NF525 scellement | `FiscalSealer.sealDataAtomically` | (transverse `order.paid`) | `FiscalSealer.test`, `nf525-fiscal-sealing.test` | ✅ / 🟡 (audit chaîne) |
| 10 | Clôtures X/Z + FEC | `TicketZHandler`, `FECMapper` | `/nf525` | `TicketZHandler.test`, `fec-format.test` | ✅ |
| 11 | Stocks / SmartSpout | `StockEngine`, `SmartSpoutTelemetryService` | (transverse) | — | ✅ (logiciel) / 📐 (transport 100 Hz) |
| 12 | HACCP | `HACCPLogService`, `IoTSensorService` | `/hygiene` | `HACCPLogService.test` | ✅ |
| 13 | Fournisseurs / Factur-X | `ThreeWayMatchEngine`, `FacturXParser` | `/suppliers` | `FacturXParser.test`, `procurement-to-3way-match.test` | ✅ |
| 14 | Paie HCR | `HcrPayrollEngine.computeMonthlyPayroll` | `/staff` → `payroll` | `HcrPayrollEngine.test` (5) | ✅ / 🟡 (pré-paie) |
| 15 | Self-billing | `ContractorSelfBillingService` | `/staff` → `freelance` | `ContractorSelfBilling.test` (3) | ✅ / 📐 (dépôt PDP) |
| 16 | Contrats | `HcrLegalContractService.generateContract` | `ContractGeneratorModal` | `HcrLegalContractService.test` (3) | ✅ / 🟡 (signature) |
| 17 | Drivers ESC/POS | `EscPosCommands` / `EscPosBuilder` | (hardware) | `escpos-builder.test.ts` | ✅ / ⚠️ (buzzer) |
| 18 | Offline / outbox | `OutboxService` | (transverse) | `OutboxService.test`, `OutboxPriority.test` | ✅ (8/9 scénarios) |
| 19 | RBAC / MCC | `rbac.ts`, `ActionGuard`, `RbacDeriver` | (transverse) | `*-rbac.test.ts` | ✅ / ⚠️ (ADR-019c) |
| 20 | Audit code | ce document | — | Annexe A | ✅ |

---

## Annexe C — Dette & angles morts référencés

Ces plans/audits existants portent la dette détaillée ; ce document n'en est que l'index :

| Sujet | Document |
|---|---|
| Golden path restaurant (collections divergentes, split bill ×10 000, events qui ne se rencontrent pas) | `logiquemetier.md` |
| Audit de 2ᵉ niveau (scellement, SovereignGuard, `eventId`, `useLexicon`, M2) — 64 constats | `PLAN-CORRECTIF-2026-08-29.md` |
| Agnosticisme DB (13 fichiers SDK Firebase, 174/216 routes contournent l'auth provider) | `docs/audits/AUDIT-DB-AGNOSTICISME-2026-09-01.md` |
| Résorption couplage Firestore (6 lots A→G) | `firestore.md` |
| i18n (clés manquantes, parité 5 locales) | `docs/audits/AUDIT-I18N-COMPLET-2026-09-01.md` |
| ADR-019 étape (c) — ~160 fichiers comparent des noms de rôle | `merge-plan-10-items` (sessions.md) |
| Violations Barrel de la livraison RH (5) | `.claude/sessions.md` → `antigravity-hcr-payroll-freelance` |
| Bus événementiel (outbox/DLQ/cascades) — 54 items | Plan Opérationnel artifact `42bc755c-…` |

### Écarts entre le doc historique v2.0 et le code réel (corrigés dans cette v3.0)

| Affirmation v2.0 | Réalité |
|---|---|
| « 18 piliers système » | **8 piliers** + domaines universels |
| Scellement WASM `@nexus/fiscal-seal-wasm` | `FiscalSealer` + `CryptoService` (SHA-256, **pas de WASM**) ; `FiscalSealWasm.ts` supprimé |
| Buzzer cuisine `ESC B 3 2` | absent de `CMD` ; audio via `KDSAudioHardwareService` |
| SmartSpout « paquet 100 Hz » comme feature | **spec de transport hardware** ; le service raisonne en centilitres |
| 4 statuts coursing (`HOLD/FIRED/READY/SERVED`) | **5** (`+ COOKING`) |
| « 32 composants » | comptage non reproductible — voir `.measures/` |
| `--table-dirty #f43f5e` | absent du blueprint (à ajouter si besoin) |
| Statuts « 11/11 tests / Gate 6 14/14 / hash scellé » | **vérifiés en session** (Annexe A) ✅ |

---

*Document maintenu par la session `claude-encyclopedie-audit-ultra`. Toute mise à jour d'un chiffre d'état doit passer par `npm run measure` et non par une édition manuelle ici (Loi 7).*
