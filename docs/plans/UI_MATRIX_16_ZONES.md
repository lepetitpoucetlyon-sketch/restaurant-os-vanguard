# 🎨 Matrice des 16 Zones d'Interface & Composants UI

> **Cartographie Complète du Design System & Composants UI**
> **Volume total** : **~806 composants modulaires** décortiqués (état, RBAC, événements bus)
> **Norme UX** : Glassmorphism, Framer Motion, Responsivité 100% Mobile/Tablet/Desktop
> **Dernière synchronisation codebase** : 2026-08-15
> **Statut Codebase UI** : 63 pages (`page.tsx`), design system unifié via [`src/design/`](../../src/design/) et [`src/shared/components/`](../../src/shared/components/)

---

## 📖 Grille de Lecture

**Légende statut** : ✅ Implémenté · 🔧 Partiel · ⬜ À développer · 🚧 Bloqué (dépendance non résolue)

**Barème RBAC** :
- `10` Apprenti · Plongeur
- `20` Commis · Serveur junior · Runner
- `30` Serveur · Barman · Vendeur · Réceptionniste · Hôtesse
- `40` Chef de rang · Timeclock manager
- `50` Sommelier · Expert produit
- `60` Sous-chef · Manager service · Comptable · Réceptionnaire
- `70` Chef de cuisine · Manager · Chef de salle
- `80` Directeur établissement
- `100` Propriétaire (gérant tenant — pas MCC)
- `∀` Tous niveaux (10 → 100)
- `Public` Accessible sans auth

**Format** : `ComponentName — RBAC: <niveaux> · Événement bus (si applicable)`

---

## 📚 Sommaire

1. [Vue d'Ensemble des 16 Zones UI](#1-vue-densemble-des-16-zones-ui)
2. [🖥️ Zone 1 — SERVICE (POS, KDS, Bar, Runner, Plan de Salle)](#2-️-zone-1--service-pos-kds-bar-runner-plan-de-salle)
3. [🖥️ Zone 2 — RÉSERVATIONS & ACCUEIL](#3-️-zone-2--réservations--accueil)
4. [🖥️ Zone 3 — MENU & CATALOGUE CULINAIRE](#4-️-zone-3--menu--catalogue-culinaire)
5. [🖥️ Zone 4 — CRM, CLIENTS & FIDÉLITÉ](#5-️-zone-4--crm-clients--fidélité)
6. [🖥️ Zone 5 — STOCK & LOGISTIQUE](#6-️-zone-5--stock--logistique)
7. [🖥️ Zone 6 — RESSOURCES HUMAINES & PLANNING](#7-️-zone-6--ressources-humaines--planning)
8. [🖥️ Zone 7 — FINANCE & COMPTABILITÉ FISCALE](#8-️-zone-7--finance--comptabilité-fiscale)
9. [🖥️ Zone 8 — CONFORMITÉ SANITAIRE & SÉCURITÉ (HACCP)](#9-️-zone-8--conformité-sanitaire--sécurité-haccp)
10. [🖥️ Zone 9 — FACILITY & MAINTENANCE](#10-️-zone-9--facility--maintenance-⚠️-27-composants--0-livrés)
11. [🖥️ Zone 10 — ANALYTICS & BI](#11-️-zone-10--analytics--bi)
12. [🖥️ Zone 11 — INTELLIGENCE & IA (Oracle)](#12-️-zone-11--intelligence--ia-oracle)
13. [🖥️ Zone 12 — HUB D'INTÉGRATIONS](#13-️-zone-12--hub-dintégrations)
14. [🖥️ Zone 13 — PARAMÉTRAGE & ADMIN CLIENT](#14-️-zone-13--paramétrage--admin-client)
15. [🖥️ Zone 14 — MOBILE COMPANION (🚧 bloquée H2)](#15-️-zone-14--mobile-companion-🚧-bloquée-h2)
16. [🖥️ Zone 15 — SITE WEB PUBLIC](#16-️-zone-15--site-web-public)
17. [🖥️ Zone 16 — DESIGN SYSTEM TRANSVERSE & ÉTATS SYSTÈME](#17-️-zone-16--design-system-transverse--états-système)
18. [Statistiques Consolidées & Priorités Refonte UI](#18-statistiques-consolidées--priorités-refonte-ui)

---

## 1. Vue d'Ensemble des 16 Zones UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ÉCOSYSTÈME UI RESTAURANT OS                        │
│                                                                             │
│  [Zone 1] SERVICE               [Zone 2] RÉSERVATIONS      [Zone 3] MENU    │
│  POS, KDS, Salle, Bar           Plans 2D/3D, Guestbook     Recettes, INCO   │
│                                                                             │
│  [Zone 4] CRM & FIDÉLITÉ        [Zone 5] LOGISTICS         [Zone 6] RH      │
│  RFM, Campagnes, Cartes         Stocks, DLC, Réceptions    Planning, Pointage│
│                                                                             │
│  [Zone 7] FINANCE               [Zone 8] COMPLIANCE        [Zone 9] FACILITY│
│  Clôture Z, FEC, Factur-X       HACCP, Coffre WORM         Parc, IoT ⚠️    │
│                                                                             │
│  [Zone 10] ANALYTICS            [Zone 11] INTELLIGENCE     [Zone 12] EXT.   │
│  Marges, Food Cost, BI          Oracle IA, LightRAG        Hub Intégrations │
│                                                                             │
│  [Zone 13] ADMIN CLIENT         [Zone 14] MOBILE 🚧        [Zone 15] PUBLIC │
│  RBAC, Paramètres, Matériel     Bloquée par API REST H2    Click&Collect    │
│                                                                             │
│  [Zone 16] DESIGN SYSTEM TRANSVERSE (Tokens, Glassmorphism, États système)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dépendances Bloquantes Inter-Zones

- **Zone 14 (Mobile)** → 🚧 bloquée par **Sprint H2.2 API REST OpenAPI** (non démarré).
- **Zone 12 (Marketplace connecteurs partenaires)** → dépend de **Zone 13 (RBAC + Notifications)** pour l'onboarding client.
- **Zone 11 (Oracle)** → dépend du **sidecar LightRAG** (port 9621) actif — mode dégradé requis en Zone 16.
- **Zone 9 (Facility maintenance)** → **27 composants à construire, 0 livrés** — chantier H2.

---

## 2. 🖥️ Zone 1 — SERVICE (POS, KDS, Bar, Runner, Plan de Salle)

**Route** : `/pos`, `/kds`, `/bar`, `/floor-plan`, `/pos-mobile`
**RBAC principal** : `20` (Runner) → `30` (Serveur) → `40` (Chef de Rang) → `70` (Manager pour remises >10%)

### 🖼️ Écran 1.1 — POS Caisse (`/pos`)

#### Composants principaux
- ✅ `HeaderBar` — RBAC: ∀
- ✅ `CategoryTabs` — RBAC: 20+
- ✅ `ProductGrid` — RBAC: 20+
- ✅ `ProductCard` (item grille) — RBAC: 20+
- ✅ `ProductDetailsDialog` (modal options) — RBAC: 20+
- ✅ `ModifierPicker` (radio/checkbox) — RBAC: 20+
- ✅ `QuantitySelector` — RBAC: 20+
- ✅ `NotesTextarea` (note libre par plat) — RBAC: 20+
- ⬜ `NotesAutocomplete` (suggestions notes fréquentes) — RBAC: 20+
- ⬜ `AllergenTagPicker` (tag allergie inline) — RBAC: 20+
- ⬜ `WinePairingSuggestion` (IA suggère vin par plat) — RBAC: 30+ · consomme `intelligence.wine_pairing_suggested`
- ⬜ `ProductFavoritesGrid` (mode flux rapide) — RBAC: 20+
- ⬜ `RecentlyUsedItemsBar` (5 derniers plats) — RBAC: 20+
- ⬜ `ProductSearchOverlay` (Cmd+K style) — RBAC: 20+
- ⬜ `BarcodeScanner` (scan carte cadeau/produit EAN-13) — RBAC: 20+
- ⬜ `VoiceOrderInput` (dictée vocale) — RBAC: 30+

#### Panier & addition
- ✅ `CartHeader` — RBAC: 20+
- ✅ `CartLines` — RBAC: 20+
- ✅ `CartLineItem` — RBAC: 20+
- ✅ `CartFooter` (totaux + TVA ventilée) — RBAC: 20+
- ✅ `CartActions` (envoyer/encaisser/split) — RBAC: 20+
- 🔧 `PartialSendButton` (envoyer entrées seulement) — RBAC: 20+ · émet `ops.course.fired`
- ⬜ `GuestGroupingPanel` (siège 1/2/3 par convive) — RBAC: 20+
- ⬜ `CourseSequencer` (ordre entrée→plat→dessert) — RBAC: 30+
- ⬜ `TableTransferDialog` (transfert commande table→table) — RBAC: 30+
- ⬜ `CartHoldMenu` (mise en attente panier) — RBAC: 20+
- ⬜ `HoldingCartsListDrawer` (paniers en attente) — RBAC: 20+
- ⬜ `ServiceChargeToggle` (frais de service groupe >8) — RBAC: 60+
- ⬜ `CoverCountSelector` (déclaration nb couverts) — RBAC: 20+
- ⬜ `CartTimeline` (historique modif panier) — RBAC: 60+

#### Modales encaissement
- ✅ `PaymentDialog` — RBAC: 20+
- ✅ `PaymentMethodPicker` — RBAC: 20+
- ✅ `AmountInput` (pavé numérique tactile) — RBAC: 20+
- ✅ `ChangeCalculator` (rendu monnaie espèces) — RBAC: 20+
- ✅ `TipInput` (montant / % / arrondi) — RBAC: 20+ · émet `hr.tip_declared`
- ✅ `SplitBillDialog` — RBAC: 20+ · règle reliquat au dernier payeur (invariant #3)
- ✅ `SplitByItem` — RBAC: 20+
- ✅ `SplitByGuest` — RBAC: 20+
- ✅ `SplitCustom` — RBAC: 20+
- ✅ `DiscountDialog` (<10%) — RBAC: 30+
- ✅ `DiscountDialog` (>10%) — RBAC: 60+ · PIN manager requis
- ✅ `RefundDialog` (avoir) — RBAC: 60+ · émet `payment.refunded` (FISCAL_CRITICAL)
- ⬜ `PreAuthDialog` (pré-autorisation CB Stripe Terminal) — RBAC: 30+
- ⬜ `GiftCardRedeemModal` — RBAC: 20+
- ⬜ `GiftCardIssuanceModal` — RBAC: 30+
- ⬜ `LoyaltyPointsRedeemDialog` — RBAC: 20+
- ⬜ `AgeVerificationModal` (blocage catégorie alcool) — RBAC: 60+ · émet `compliance.age_verification_requested`
- ⬜ `AllergenAlertBanner` (bandeau rouge table allergique) — RBAC: ∀ · consomme `reservation.matched`
- ⬜ `TenderInsertionOverlay` (attente TPE Stripe Terminal) — RBAC: 20+
- ⬜ `ReceiptDeliveryDialog` (imprimer/email/SMS/QR) — RBAC: 20+ · émet `commerce.receipt_sent`
- ⬜ `PaymentReceiptSummary` — RBAC: 20+
- ⬜ `MealVoucherValidator` (carte titre-restaurant) — RBAC: 20+
- ⬜ `InvoiceRequestModal` (client demande facture) — RBAC: 20+

#### Table selector
- ✅ `TableSelector` (drawer bas) — RBAC: 20+
- ✅ `MiniFloorPlan` (mini-carte tables) — RBAC: 20+
- ✅ `TablesListView` (vue liste) — RBAC: 20+
- ✅ `TableSearchInput` (recherche numéro) — RBAC: 20+
- ⬜ `WalkInFlashCreateButton` — RBAC: 20+
- ⬜ `TakeawayModeToggle` (mode à emporter) — RBAC: 20+
- ⬜ `DeliveryModeToggle` (mode livraison) — RBAC: 20+

#### Impression
- ✅ `TicketPrinterService` (service ESC/POS) — RBAC: service
- ✅ `KitchenPrinterService` (fallback KDS) — RBAC: service
- 🔧 `DigitalReceiptQR` (QR ticket dématérialisé) — RBAC: 20+
- ⬜ `PrinterConfigModal` — RBAC: 80+
- ⬜ `PrinterStatusIndicator` (statut header) — RBAC: 30+

**Total Écran POS** : ~49 composants (16 ✅ · 2 🔧 · 31 ⬜)

### 🖼️ Écran 1.2 — KDS Cuisine (`/kds`)

#### Composants principaux
- ✅ `KdsHeader` — RBAC: 20+
- ✅ `TicketGrid` (grille bons de commande) — RBAC: 20+
- ✅ `TicketCard` — RBAC: 20+
- ✅ `TicketHeader` (table + timer) — RBAC: 20+
- ✅ `TicketItems` (liste plats) — RBAC: 20+
- ✅ `TicketFooter` (bump/recall) — RBAC: 20+
- ✅ `BumpButton` — RBAC: 20+
- ✅ `RecallButton` (long-press) — RBAC: 60+
- 🔧 `BumpBarUsbListener` (bump bar physique USB) — RBAC: service
- ⬜ `StationFilterTabs` (filtrer par station) — RBAC: 60+
- ⬜ `ViewByPlateToggle` (vue par plat vs table) — RBAC: 60+
- ⬜ `ViewByServiceToggle` (sur place/emporter/livraison) — RBAC: 60+
- ⬜ `AllergenBadge` (badge critique) — RBAC: 20+
- ⬜ `SpecialRequestHighlight` ("sans oignon") — RBAC: 20+
- ⬜ `TicketExpandOverlay` (zoom tactile) — RBAC: 20+

#### Coordination
- ⬜ `ExpeditorView` (chef expeditor global) — RBAC: 60+
- ⬜ `TableSyncPanel` (synchro sorties plats table) — RBAC: 60+
- ⬜ `AllPlatesForTableGrouping` — RBAC: 60+
- ⬜ `ServiceCallButton` ("plat prêt" appel serveur) — RBAC: 20+ · émet `ops.service_alert`
- ⬜ `PrepTimeEstimator` (IA temps préparation) — RBAC: 60+ · émet `intelligence.prep_time_estimated`
- ⬜ `KitchenIntercomWidget` (chat voice push-to-talk) — RBAC: 20+ · émet `ops.kitchen_call`
- ⬜ `StationCapacityBar` (charge par station) — RBAC: 60+

#### Stats & alertes
- 🔧 `KdsFooter` (stats jour) — RBAC: 60+
- ⬜ `AverageCookTimeWidget` — RBAC: 60+
- ⬜ `PeakLoadIndicator` — RBAC: 60+
- ⬜ `LateTicketAlarm` (alerte sonore ticket rouge) — RBAC: service
- ⬜ `KdsShiftHandoverSummary` (récap fin shift) — RBAC: 60+

#### Modes spéciaux
- ⬜ `KdsPrepListMode` (liste préparation matin) — RBAC: 60+
- ⬜ `KdsInventoryCheckMode` (revue stock cuisine) — RBAC: 60+
- ⬜ `KdsBrigadeChatMode` (chat cuisine interne) — RBAC: 20+
- ⬜ `KdsRecipeQuickView` (accès rapide fiche recette) — RBAC: 20+

**Total Écran KDS** : ~30 composants (8 ✅ · 2 🔧 · 20 ⬜)

### 🖼️ Écran 1.3 — Plan de Salle (`/floor-plan`)

#### Vue service
- ✅ `FloorPlanHeader` — RBAC: 20+
- ✅ `FloorCanvas` (Konva.js SVG interactif) — RBAC: 20+
- ✅ `TableRenderer` (SVG shape) — RBAC: 20+
- ✅ `TableChairs` (chaises visibles) — RBAC: 20+
- ✅ `ZoneRenderer` (zones terrasse/salon) — RBAC: 20+
- ✅ `TableActionsMenu` (popup contextuel) — RBAC: 20+
- ✅ `ReservationsQueue` (bas de page) — RBAC: 30+
- 🔧 `TableStatusIndicator` (couleur selon durée) — RBAC: ∀
- ⬜ `CapacityIndicator` (jauge visuelle) — RBAC: 30+
- ⬜ `TableDelayAlert` (table qui attend >X min) — RBAC: 30+ · émet `ops.table_delay_alert`
- ⬜ `TableGuestInfoPopover` (hover client info) — RBAC: 30+
- ⬜ `ZoomFitControls` (zoom in/out/fit) — RBAC: ∀
- ⬜ `HeatmapOverlay` (occupation par service/semaine) — RBAC: 70+

#### Édition (RBAC 60+)
- ✅ `EditPanel` (drawer palette outils) — RBAC: 60+
- ✅ `TableAddDialog` (forme+capa) — RBAC: 60+
- ✅ `ZoneAddDialog` — RBAC: 60+
- ✅ `EditPanel > DeleteButton` — RBAC: 60+
- ✅ `EditPanel > ZoneLockToggle` — RBAC: 60+
- ✅ `FloorPlanSaveButton` — RBAC: 60+
- ⬜ `PlanTemplateGallery` (bistrot/gastro/brasserie) — RBAC: 60+
- ⬜ `PlanImportWizard` (DWG/PDF architecte) — RBAC: 80+
- ⬜ `FloorPlanVersionHistory` — RBAC: 60+
- ⬜ `MultiFloorSelector` (étages 1/2/terrasse) — RBAC: 60+
- ⬜ `TableCombineTool` (fusionner 2 tables adjacentes) — RBAC: 60+
- ⬜ `TableSplitTool` (séparer table double) — RBAC: 60+

**Total Écran Plan de Salle** : ~26 composants (13 ✅ · 1 🔧 · 12 ⬜)

### 🖼️ Écrans 1.4 (Bar) & 1.5 (POS Mobile) — résumés
- 🔧 `BarDashboard` (écran dédié boissons + expédition serveur) — RBAC: 30+
- ⬜ `CocktailShelf` (menu cocktails maison) — RBAC: 30+
- 🔧 `MobilePosScreen` (Expo mobile POS serveur) — 🚧 bloqué H2 (dépend API REST)

**Total Zone 1** : ~130 composants (~48 ✅ · ~7 🔧 · ~75 ⬜) — le core (envoi commande → paiement → ticket) est **opérationnel**, les 75 ⬜ sont des enrichissements (IA, mobilité, modes spéciaux).

---

## 3. 🖥️ Zone 2 — RÉSERVATIONS & ACCUEIL

**Route** : `/reservations`, `/[slug]/reservations` (widget public)
**RBAC principal** : `30` (Hôtesse) → `70` (Manager pour paramétrage overbooking)

### 🖼️ Écran 2.1 — Liste réservations (`/reservations`)
- ✅ `ReservationHeader` — RBAC: 30+
- ✅ `ReservationCalendarView` (vue journée/semaine) — RBAC: 30+
- ✅ `ReservationListView` (vue liste) — RBAC: 30+
- ✅ `NewReservationDialog` (formulaire hôtesse) — RBAC: 30+ · émet `reservation.created`
- ✅ `ReservationCard` — RBAC: 30+
- ✅ `ReservationDetailDialog` — RBAC: 30+
- ⚫ **`WelcomeGuestButton`** (bouton "Accueillir") — RBAC: 30+ · **🔴 CRITIQUE — émet `reservation.matched` → allergènes KDS**
- 🔧 `AutoTableAssignmentSuggestion` — RBAC: 30+
- 🔧 `TableAssignmentOverride` — RBAC: 30+
- ⬜ `WaitlistTracker` (file d'attente + SMS estimé) — RBAC: 30+ · émet `commerce.waitlist_ready`
- ⬜ `OverbookingConfigPanel` (105% sem / 95% weekend) — RBAC: 70+
- ⬜ `NoShowTracker` (détection auto + flag CRM) — RBAC: 30+ · consomme `reservation.no_show`
- ⬜ `DepositRequirementConfig` (auto-deposit groupes >6) — RBAC: 70+

### 🖼️ Écran 2.2 — Widget public de réservation (`/[slug]/reservations`)
- ✅ `PublicReservationWidget` (embed iframe) — RBAC: Public
- ✅ `SlotPicker` (créneaux disponibles) — RBAC: Public
- ✅ `PartySizeSelector` — RBAC: Public
- 🔧 `StripeDepositCheckout` (acompte obligatoire) — RBAC: Public · émet `commerce.reservation_deposit_paid`
- ✅ `ReservationConfirmationEmail` — RBAC: service
- 🔧 `SmsReminderJMinus1` — RBAC: service · émet `reservation.reminder_sent`
- 🔧 `SmsReminderJMinus2h` — RBAC: service

**Total Zone 2** : ~35 composants (~15 ✅ · ~5 🔧 · ~15 ⬜)

---

## 4. 🖥️ Zone 3 — MENU & CATALOGUE CULINAIRE

**Route** : `/menu-builder`, `/menu-engineering`, `/promotions`
**RBAC principal** : `50` (Expert Produit) → `70` (Chef / Manager)

### 🖼️ Écran 3.1 — Menu Builder (`/menu-builder`)
- ✅ `MenuBuilderHeader` — RBAC: 70+
- ✅ `CategoryTreeEditor` (drag & drop) — RBAC: 70+
- ✅ `ProductEditor` (nom, description, prix, TVA, allergènes) — RBAC: 70+
- ✅ `AllergenINCOMatrix` (14 allergènes réglementaires) — RBAC: 60+
- ✅ `RecipeCostCard` (fiche technique gramme + Food Cost théorique) — RBAC: 60+
- 🔧 `SeasonalMenuActivator` (activation/désactivation période) — RBAC: 70+ · émet `commerce.menu_activated`
- ⬜ `LossCoefficientEditor` (cuisson 30%, décorticage 60%) — RBAC: 70+
- ⬜ `NutriScoreCalculator` (auto par plat) — RBAC: 70+
- ⬜ `MenuVersionHistory` (historique changements) — RBAC: 70+

### 🖼️ Écran 3.2 — Menu Engineering BCG (`/menu-engineering`)
- ⬜ `BcgMenuMatrix` (étoile/vache à lait/poids mort/énigme) — RBAC: 70+ · consomme `intelligence.menu_engineering_requested`
- ⬜ `MenuOptimizationSuggestions` — RBAC: 70+
- ⬜ `MarginAnalyzer` (contribution margin par plat) — RBAC: 80+

### 🖼️ Écran 3.3 — Menu Digital QR (nouveau)
- 🔧 `PublicMenuScreen` (QR de table) — RBAC: Public
- ⬜ `MultilingualToggle` (EN/ES/ZH/AR) — RBAC: Public (dépend i18n dormant)

### 🖼️ Écrans 3.4 (Promotions) & 3.5 (Bons cadeaux)
- ✅ `PromotionEditor` — RBAC: 70+
- ✅ `GiftCardEditor` — RBAC: 70+
- ⬜ `ReferralCodeGenerator` — RBAC: 70+

**Total Zone 3** : ~30 composants (~11 ✅ · ~3 🔧 · ~16 ⬜)

---

## 5. 🖥️ Zone 4 — CRM, CLIENTS & FIDÉLITÉ

**Route** : `/crm`, `/marketing`, `/loyalty`
**RBAC principal** : `30` (Consultation) → `70` (Campagnes & Segments)

### 🖼️ Écran 4.1 — Liste clients (`/crm`)
- ✅ `CustomerListTable` — RBAC: 30+
- ✅ `CustomerSearchBar` — RBAC: 30+
- ✅ `CustomerFilterPanel` (RFM, LTV, préférences) — RBAC: 70+
- ✅ `NewCustomerDialog` — RBAC: 30+ · émet `crm.customer_created`

### 🖼️ Écran 4.2 — Fiche client détaillée
- ✅ `CustomerProfileCard` (historique visites, panier moyen) — RBAC: 30+
- ✅ `CustomerAllergenSection` (RGPD Art. 9 — case consentement) — RBAC: 30+
- ✅ `CustomerPreferencesEditor` (placement, occasion) — RBAC: 30+
- 🔧 `RFMSegmentBadge` (VIP/Régulier/Risque/Inactif) — RBAC: 70+
- ⬜ `CLVProjectionChart` (Customer Lifetime Value) — RBAC: 80+
- ⬜ `ChurnRiskIndicator` — RBAC: 80+ · consomme `intelligence.churn_risk_detected`
- ⬜ `CustomerErasureButton` (droit à l'oubli RGPD) — RBAC: 80+
- ⬜ `NoShowHistoryBadge` — RBAC: 30+

### 🖼️ Écran 4.3 — Campagnes marketing (`/marketing`)
- ✅ `CampaignEditor` (Brevo SMS/Email) — RBAC: 70+
- ✅ `SegmentSelector` — RBAC: 70+
- 🔧 `TemplateGallery` (templates prêts) — RBAC: 70+
- ⬜ `ABTestConfigurator` — RBAC: 80+

### 🖼️ Écran 4.4 — Fidélité (`/loyalty` — nouveau)
- 🔧 `LoyaltyWallet` (points/cagnotte € + historique) — RBAC: 30+
- 🔧 `LoyaltyTierManager` (VIP niveaux) — RBAC: 70+
- ⬜ `ReferralProgramEditor` — RBAC: 70+

### 🖼️ Écran 4.5 — Avis & réputation (nouveau)
- ⬜ `PostVisitReviewRequester` (auto post-visite Google/TripAdvisor) — RBAC: 70+ · émet `commerce.review_request_sent`
- ⬜ `ReviewsAggregator` (multi-sources) — RBAC: 70+
- ⬜ `SentimentAnalysisPanel` — RBAC: 80+

**Total Zone 4** : ~30 composants (~11 ✅ · ~5 🔧 · ~14 ⬜)

---

## 6. 🖥️ Zone 5 — STOCK & LOGISTIQUE

**Route** : `/inventory`, `/suppliers`, `/receptions`
**RBAC principal** : `60` (Sous-Chef / Réceptionniste) → `70` (Manager)

### 🖼️ Écran 5.1 — Inventaire (`/inventory`)
- ✅ `StockLevelTable` (multi-emplacements, PRMP) — RBAC: 60+
- ✅ `StockAlertBanner` (rupture, low) — RBAC: 60+ · consomme `stock.low`, `stock.zero`
- ✅ `PhysicalInventoryWizard` (assistant mensuel) — RBAC: 70+
- 🔧 `StockAdjustmentDialog` (écarts théorique/réel) — RBAC: 70+ · émet `inventory.stock_adjusted`
- ⬜ `RotatingInventoryScheduler` (inventaire tournant zone) — RBAC: 70+

### 🖼️ Écran 5.2 — Réception marchandises
- ✅ `DeliveryReceptionModal` (matching 3 voies BL/Commande/Facture) — RBAC: 60+ · émet `logistics.delivery_received`
- ✅ `PriceDeviationAlert` (écart prix BDC vs facture) — RBAC: 70+
- ✅ `LotBatchInput` (numéro de lot pour traçabilité) — RBAC: 60+
- 🔧 `OcrInvoiceExtractor` (extraction IA facture fournisseur) — RBAC: 60+

### 🖼️ Écran 5.3 — Fournisseurs (`/suppliers`)
- ✅ `SupplierListView` — RBAC: 70+
- ✅ `SupplierProfileCard` — RBAC: 70+
- 🔧 `AutoReorderConfig` (BDC auto seuil) — RBAC: 70+
- 🔧 `MultiSupplierComparator` (appel d'offres auto) — RBAC: 70+
- ⬜ `SupplierPerformanceScore` (délai/qualité/prix) — RBAC: 70+

### 🖼️ Écran 5.4 — DLC/DDM alertes (nouveau)
- 🔧 `DlcWarningBanner` (alerte préventive 48h) — RBAC: 60+
- ⬜ `ExpirationPredictor` (IA prédiction péremption) — RBAC: 60+
- ⬜ `AntiWastePartnerConnect` (TGTG/Phenix) — RBAC: 70+

**Total Zone 5** : ~25 composants (~10 ✅ · ~5 🔧 · ~10 ⬜)

---

## 7. 🖥️ Zone 6 — RESSOURCES HUMAINES & PLANNING

**Route** : `/staff`, `/planning`, `/timeclock`, `/leaves`, `/payroll`
**RBAC principal** : `10` (Pointage) → `40` (Chef de Rang) → `70` (Planning / Manager)

### 🖼️ Écran 6.1 — Staff (`/staff`)
- ✅ `StaffMemberForm` (RUP — Registre Unique du Personnel) — RBAC: 70+ · émet `hr.employee_created`
- ✅ `EmployeeDocumentVault` (contrats, attestations HACCP) — RBAC: 80+
- ✅ `EmployeeSkillsMatrix` (compétences) — RBAC: 70+
- ⬜ `EmployeeOnboardingWizard` (livret + e-signature) — RBAC: 80+

### 🖼️ Écran 6.2 — Planning (`/planning`)
- ✅ `RosterCalendar` (planning glissant HCR) — RBAC: 70+
- ✅ `ShiftEditor` — RBAC: 70+
- ✅ `HCRComplianceChecker` (repos 11h, amplitude 13h max) — RBAC: 70+
- 🔧 `RushForecastOverlay` (staffing météo-adjusted) — RBAC: 70+ · consomme `intelligence.rush_forecast_ready`
- ⬜ `MultiSiteStaffPool` (rotation multi-établissements) — RBAC: 80+

### 🖼️ Écran 6.3 — Timeclock (`/timeclock`)
- ✅ `TimeclockTerminal` (PIN PBKDF2 / NFC) — RBAC: 10+ · émet `hr.shift_started`, `hr.shift_ended`
- ✅ `GeofencingValidator` (vérif GPS périmètre) — RBAC: service
- ✅ `OvertimeCalculator` (25%/50% auto) — RBAC: service
- 🚫 `FacialRecognitionClockIn` — **BLOQUÉ CNIL** (biométrie travail nécessite délib CNIL + consentement exprès + AIPD)
- ⬜ `AntiReboundDebounce60s` (invariant #4) — RBAC: service

### 🖼️ Écran 6.4 — Congés & absences (`/leaves`)
- ✅ `LeaveRequestForm` — RBAC: 20+
- ✅ `LeaveBalanceCard` (CP/RTT soldes) — RBAC: 20+
- ✅ `LeaveApprovalQueue` — RBAC: 70+

### 🖼️ Écran 6.5 — Recrutement (`/recruitment`)
- ✅ `AtsJobBoard` (offres) — RBAC: 70+
- ✅ `CandidateKanban` (offre→entretien→contrat) — RBAC: 70+

### 🖼️ Écran 6.6 — Communication interne (nouveau)
- ⬜ `StaffChatChannel` — RBAC: 20+
- ⬜ `AnnouncementBroadcaster` — RBAC: 70+

### 🖼️ Écran 6.7 — Paie (`/payroll`)
- ✅ `PayrollExportButton` (Silae/Payfit/Combo) — RBAC: 80+ · émet `hr.payroll_exported`
- ✅ `DsnMonthlyBuilder` (XML URSSAF net-entreprises) — RBAC: 80+
- ✅ `TipDistributionSection` (pool/individuel/rank) — RBAC: 80+
- ⬜ `CETManager` (Compte Épargne Temps HCR) — RBAC: 80+

**Total Zone 6** : ~35 composants (~17 ✅ · ~2 🔧 · ~15 ⬜ · 1 🚫 CNIL)

---

## 8. 🖥️ Zone 7 — FINANCE & COMPTABILITÉ FISCALE

**Route** : `/finance`, `/cash`, `/finance/bank`, `/nf525`, `/invoicing`
**RBAC principal** : `60` (Comptable) → `80` (Directeur) → `100` (Propriétaire)

### 🖼️ Écran 7.1 — Dashboard finance (`/finance`)
- ✅ `CockpitCfoDashboard` (CA HT, marge brute, ticket moyen, Prime Cost) — RBAC: 80+
- ✅ `BudgetVsRealChart` (temps réel) — RBAC: 80+
- 🔧 `CashflowForecast30_60_90` (prévision trésorerie) — RBAC: 80+

### 🖼️ Écran 7.2 — Caisse (`/cash`)
- ✅ `CashDrawerCounter` (fond de caisse + comptage) — RBAC: 60+
- ✅ `CashCountValidator` (rapprochement CB/espèces/TR) — RBAC: 60+
- ✅ `TicketZDialog` (clôture journalière NF525) — RBAC: 80+ · émet `finance.ticket_z_closed`

### 🖼️ Écran 7.3 — Banque (`/finance/bank`)
- ✅ `BankSyncPanel` (Open Banking 5 providers) — RBAC: 80+
- ✅ `BankReconciliationTable` — RBAC: 80+
- ✅ `SepaTransferBuilder` (XML pain.001) — RBAC: 80+ · émet `finance.sepa_exported`

### 🖼️ Écran 7.4 — NF525 & fiscal (`/nf525`)
- ✅ `FiscalChainInspector` (chaîne SHA-256 par `registerId`) — RBAC: 80+
- ✅ `FecExporter` (Fichier Écritures Comptables DGFiP) — RBAC: 80+
- ✅ `MasterFiscalSealViewer` (clôture Z consolidée multi-caisses) — RBAC: 80+
- 🔧 `TvaCa3Generator` (déclaration TVA auto EDI) — RBAC: 80+
- ⬜ `Das2Generator` (honoraires artistes/prestataires) — RBAC: 80+

### 🖼️ Écran 7.5 — Facturation (`/invoicing`)
- ✅ `InvoiceEditor` — RBAC: 60+
- ✅ `FacturXPreview` (PDF/A-3 + UBL/CII) — RBAC: 60+ · émet `finance.invoice_generated`
- ✅ `PennylaneExporter` — RBAC: 60+
- ✅ `RecoveryEngine` (FRIENDLY→FORMAL→LEGAL) — RBAC: 80+
- 🔧 `IntercompanyBilling` (multi-restaurants) — RBAC: 80+
- ⬜ `CegidSageQuickBooksExporter` — RBAC: 80+

### 🖼️ Écran 7.6 — Comptabilité analytique (nouveau)
- 🔧 `BreakEvenAnalyzer` (seuil rentabilité service/jour) — RBAC: 80+
- 🔧 `RevPashCalculator` (Revenue per Available Seat Hour) — RBAC: 80+
- ⬜ `MacroBrainConsolidation` (reporting agrégé groupe) — RBAC: 100

**Total Zone 7** : ~25 composants (~14 ✅ · ~5 🔧 · ~6 ⬜)

---

## 9. 🖥️ Zone 8 — CONFORMITÉ SANITAIRE & SÉCURITÉ (HACCP)

**Route** : `/haccp`, `/allergens`, `/rgpd`, `/hr/registry`
**RBAC principal** : `10` (Consultation) → `60` (Sous-Chef) → `80` (Directeur)

### 🖼️ Écran 8.1 — HACCP (`/haccp`)
- ✅ `TemperatureLogForm` (chambres froides + huiles cuisson) — RBAC: 60+ · émet `haccp.temperature_logged`
- ✅ `WaterQualityLogForm` (pH, chlore) — RBAC: 60+
- ✅ `PestControlJournal` (dératisation/désinsectisation) — RBAC: 70+
- ✅ `HaccpNonConformityDialog` — RBAC: 60+ · émet `haccp.non_conformity_created`
- ✅ `IncidentAlertModal` (RASFF/DGCCRF rappel produit) — RBAC: 70+
- ✅ `HaccpTrainingTracker` (14h obligatoire + attestations) — RBAC: 70+
- 🔧 `TraceabilityFarmToFork` (lot → plat → table) — RBAC: 60+

### 🖼️ Écran 8.2 — Allergènes (`/allergens`)
- 🔧 `AllergenMatrixManager` (INCO EU 1169/2011) — RBAC: 70+
- ⬜ `LabelPrintingModule` (étiquettes allergènes) — RBAC: 70+

### 🖼️ Écran 8.3 — RGPD (`/rgpd`)
- ✅ `RgpdConsentTracker` — RBAC: 80+
- ✅ `DataProcessingRegistryArt30` (Art. 30 RGPD) — RBAC: 80+
- ✅ `ErasureServiceLauncher` (droit à l'oubli crypto-shredding) — RBAC: 80+
- ⬜ `DataPortabilityExporter` (Art. 20 RGPD) — RBAC: 80+

### 🖼️ Écran 8.4 — Registre du personnel (`/hr/registry`)
- ✅ `RupPanel` (Registre Unique du Personnel) — RBAC: 80+

### 🖼️ Écran 8.5 — Audits externes (nouveau)
- 🔧 `AuditServicePanel` (consultants/cabinets) — RBAC: 80+
- ✅ `DocumentVaultViewer` (coffre-fort WORM 6 ans) — RBAC: 80+

**Total Zone 8** : ~18 composants (~11 ✅ · ~3 🔧 · ~4 ⬜)

---

## 10. 🖥️ Zone 9 — FACILITY & MAINTENANCE ⚠️ (27 composants · 0 livrés)

**Route** : `/equipments` (nouveau), `/consumptions` (nouveau), `/cleaning` (nouveau)
**RBAC principal** : `60` (Sous-Chef / Responsable technique) → `80` (Directeur)

⚠️ **CHANTIER MAJEUR** : la zone Facility (hors plan de salle qui est en Zone 1) est **entièrement à construire**. 27 composants planifiés, 0 livré. Prévu en H2-H3.

### 🖼️ Écran 9.1 — Équipements (`/equipments`)
- ⬜ `EquipmentInventoryTable` (fours, CF, tireuses) — RBAC: 60+
- ⬜ `EquipmentCard` — RBAC: 60+
- ⬜ `MaintenanceHistoryTimeline` — RBAC: 60+
- ⬜ `WarrantyTracker` (garantie/amortissement) — RBAC: 80+
- ⬜ `EndOfLifePredictor` (remplacement prévisionnel) — RBAC: 80+
- ⬜ `MaintenanceTicketModal` — RBAC: 60+ · émet `facility.maintenance_requested`
- ⬜ `PreventiveMaintenanceScheduler` — RBAC: 70+ · émet `facility.maintenance_due`
- ⬜ `TechnicianAssignmentDialog` — RBAC: 70+
- ⬜ `IntervenrionLogSection` (existe déjà — à réutiliser) — RBAC: 60+ ✅
- ⬜ `Cerfa13984Generator` (vérifications réglementaires) — RBAC: 80+ ✅

### 🖼️ Écran 9.2 — Consommations (nouveau)
- ⬜ `EnergyMonitoringDashboard` (Linky électricité, gaz, eau) — RBAC: 80+
- ⬜ `EnergyAlertBanner` (dépassement seuil) — RBAC: 80+
- ⬜ `EnergyCostAllocator` (par zone/équipement) — RBAC: 80+
- ⬜ `CarbonFootprintCalculator` (GES scope 1+2+3) — RBAC: 100

### 🖼️ Écran 9.3 — Nettoyage (nouveau)
- ⬜ `CleaningSchedulePlanner` — RBAC: 70+
- ⬜ `CleaningChecklist` (par zone) — RBAC: 20+
- ⬜ `CleaningTaskCard` — RBAC: 20+
- ⬜ `CleaningCompletionValidator` — RBAC: 60+

### IoT & Domotique (H4-H5)
- ⬜ `IoTSensorMap` (sondes Bluetooth Testo + MQTT) — RBAC: 60+
- ⬜ `IoTAlertBanner` — RBAC: 60+ · consomme `iot.offline_alert`, `iot.temperature_threshold`
- ⬜ `SmartLightingControl` (domotique zones) — RBAC: 80+
- ⬜ `SmartHvacControl` (température/musique) — RBAC: 80+
- ⬜ `CctvIntrusionPanel` — RBAC: 100
- ⬜ `ArFloorplanViewer` (AR tablette) — RBAC: 60+

**Total Zone 9** : **27 composants** (0 ✅ · 0 🔧 · 27 ⬜) + 2 réutilisables existants (`InterventionLogSection`, `Cerfa13984`).

---

## 11. 🖥️ Zone 10 — ANALYTICS & BI

**Route** : `/dashboard`, `/reports`, `/data`
**RBAC principal** : `70` (Manager) → `80` (Directeur) → `100` (Propriétaire)

### 🖼️ Écran 10.1 — Dashboard direction (`/dashboard`)
- ✅ `ExecutiveDashboard` (CA, marge, ticket moyen, Prime Cost) — RBAC: 80+
- ✅ `DailyFlashReport` (rapport flash quotidien) — RBAC: 80+
- ✅ `WeeklyConsolidatedReport` — RBAC: 80+
- ✅ `AnomalyDetectionPanel` (cross-domain) — RBAC: 80+ · consomme `intelligence.anomaly_detected`
- ✅ `BenchmarkFleetInterEstab` (FleetBenchmark MCC) — RBAC: 100

### 🖼️ Écran 10.2 — Reports (`/reports`)
- ✅ `ReportsCatalog` — RBAC: 80+
- ✅ `ReportBuilder` (custom) — RBAC: 80+
- ✅ `ReportScheduler` (envoi email périodique) — RBAC: 80+

### 🖼️ Écran 10.3 — Cohortes & rétention (nouveau)
- ⬜ `CohortRetentionChart` — RBAC: 80+
- ⬜ `CustomerRetentionByMonth` — RBAC: 80+

### 🖼️ Écran 10.4 — Analyse fréquentation (nouveau)
- ⬜ `AffluenceHeatmap` (par jour/heure/service) — RBAC: 80+
- ⬜ `TurnoverRateAnalyzer` (rotation tables) — RBAC: 80+
- ⬜ `RevPACChart` (Revenue per Available Cover) — RBAC: 80+

### 🖼️ Écran 10.5 — Data exports (`/data`)
- ✅ `DataExporterHub` (FEC, XML DSN, CSV) — RBAC: 80+
- ⬜ `ApiUsageQuotaViewer` — RBAC: 80+

**Total Zone 10** : ~20 composants (~11 ✅ · 0 🔧 · ~9 ⬜)

---

## 12. 🖥️ Zone 11 — INTELLIGENCE & IA (Oracle)

**Route** : `/intelligence` (Oracle chat)
**RBAC principal** : `70` (Manager) → `80` (Directeur) → `100` (Propriétaire)

### 🖼️ Écran 11.1 — Oracle chat (`/intelligence`)
- ✅ `OracleChatInterface` (Gemini + LightRAG sidecar port 9621) — RBAC: 70+
- ✅ `OracleQueryHistory` — RBAC: 70+
- 🔧 `OracleOfflineDegradedMode` (fallback si sidecar down) — RBAC: 70+
- ⬜ `VoiceOracleInput` (dictée vocale) — RBAC: 70+

### 🖼️ Écran 11.2 — Insights proactifs
- ✅ `ProactiveInsightsFeed` (briefing quotidien) — RBAC: 80+
- ✅ `MarketOracleWatch` (veille concurrentielle) — RBAC: 80+
- 🔧 `UpsellingRecommender` (temps réel serveur) — RBAC: 30+

### 🖼️ Écran 11.3 — Prédictions (nouveau)
- 🔧 `SalesForecastChart` (ML J+7/semaine/mois) — RBAC: 80+
- 🔧 `WastePredictorPanel` (sur-commande vs historique) — RBAC: 70+
- ⬜ `NoShowPredictor` (historique × météo × événement) — RBAC: 70+
- ⬜ `SentimentAnalyzer` (Google/TripAdvisor/Yelp) — RBAC: 80+

### 🖼️ Écran 11.4 — Détection anomalies (nouveau)
- ✅ `AnomalyStreamViewer` — RBAC: 80+
- 🔧 `FraudDetectionPanel` (voids suspects, écarts caisse) — RBAC: 80+

### 🖼️ Écran 11.5 — Assistant vocal (nouveau)
- ⬜ `VoiceAssistantEngine` — RBAC: 30+
- ⬜ `WakeWordDetector` — RBAC: service

### 🖼️ Vision AI (H4+)
- 🔧 `WasteVisionPanel` (retours assiette computer vision) — RBAC: 70+

**Total Zone 11** : ~18 composants (~5 ✅ · ~6 🔧 · ~7 ⬜)

---

## 13. 🖥️ Zone 12 — HUB D'INTÉGRATIONS

**Route** : `/integrations`, `/integrations/delivery`
**RBAC principal** : `80` (Directeur) → `100` (Propriétaire)

### 🖼️ Écran 12.1 — Marketplace connecteurs (`/integrations`)
- ✅ `ConnectorHubGrid` (catalogue par domaine) — RBAC: 80+
- ✅ `ConnectorCard` (statut, prix, catégorie) — RBAC: 80+
- ✅ `ConnectorOAuthFlow` (OAuth2 broker) — RBAC: 80+
- ✅ `ApiKeyManager` (chiffré via `credentialCipher.ts`) — RBAC: 100
- ✅ `WebhookConfigPanel` — RBAC: 80+
- 🔧 `HealthPingIndicator` (ping périodique 7j) — RBAC: 80+
- ⬜ `RateLimitDashboard` (quotas API par formule) — RBAC: 80+
- ⬜ `PartnerSdkExplorer` (marketplace extensions H5) — RBAC: 100

### 🖼️ Écran 12.2 — Livraison / plateformes (nouveau)
- ✅ `DeliveryPlatformSelector` (UberEats/Deliveroo/JustEat) — RBAC: 80+
- ⬜ `HubRiseUnifiedFeed` (agrégateur d'agrégateurs — H2/H3) — RBAC: 80+
- ⬜ `DeliverectAlternative` — RBAC: 80+

**Total Zone 12** : ~12 composants (~7 ✅ · ~1 🔧 · ~4 ⬜)

---

## 14. 🖥️ Zone 13 — PARAMÉTRAGE & ADMIN CLIENT

**Route** : `/settings`, `/settings/branding`, `/settings/users`, `/settings/notifications`, `/settings/billing`, `/settings/multi-etab`
**RBAC principal** : `80` (Directeur) → `100` (Propriétaire)

### 🖼️ Écran 13.1 — Paramètres généraux (`/settings`)
- ✅ `SettingsGeneralPanel` (SIRET, TVA, horaires) — RBAC: 100
- ✅ `CurrencyConfigPanel` — RBAC: 100
- ⬜ `MultiCurrencyEnabler` (USD/GBP/CHF touristes H3) — RBAC: 100

### 🖼️ Écran 13.2 — Apparence & branding
- ✅ `BrandingSettingsSection` (logo, couleurs, mode sombre/clair) — RBAC: 100
- ✅ `ThemeTokenEditor` — RBAC: 100
- ✅ `SplashScreenConfig` — RBAC: 100

### 🖼️ Écran 13.3 — Utilisateurs & rôles
- ✅ `UsersTable` — RBAC: 100
- ✅ `NewUserDialog` — RBAC: 100
- ✅ `RbacMatrixEditor` (14 rôles × 366 actions) — RBAC: 100
- ✅ `PinManagerDialog` (PBKDF2 hash server-side) — RBAC: 100
- 🔧 `TwoFactorAuthConfig` — RBAC: 100 · **⚠️ à rendre obligatoire pour niveau 100**

### 🖼️ Écran 13.4 — Notifications
- ✅ `NotificationChannelsPanel` (Email/SMS/Push) — RBAC: 100
- ✅ `NotificationRulesEditor` — RBAC: 100
- 🔧 `WebPushSubscriptionManager` — RBAC: service

### 🖼️ Écran 13.5 — Facturation SaaS (côté client)
- 🔧 `SubscriptionOverview` (formule active, prochain prélèvement) — RBAC: 100
- 🔧 `InvoicesListView` (factures plateforme) — RBAC: 100
- ✅ `StripeCustomerPortal` (redirection) — RBAC: 100

### 🖼️ Écran 13.6 — Multi-établissements (nouveau)
- 🔧 `MultiEstablishmentsRegistry` (chaîne/franchise) — RBAC: 100
- ⬜ `EmpireCockpitConsolidatedView` — RBAC: 100
- ⬜ `CentralPricingHarmonizer` — RBAC: 100

**Total Zone 13** : ~22 composants (~13 ✅ · ~5 🔧 · ~4 ⬜)

---

## 15. 🖥️ Zone 14 — MOBILE COMPANION (🚧 bloquée H2)

**Stack** : Expo / React Native (à démarrer)
**Dépendance bloquante** : Sprint H2.2 API REST OpenAPI (Hono) **non démarré**.

### 🖼️ Écran 14.1 — App Staff (Expo)
- 🚧 `MobilePosScreen` (prise commande smartphone) — RBAC: 20+
- 🚧 `MobileHapticFeedback` (retours haptiques) — RBAC: service
- 🚧 `MobileOfflineQueue` (sync auto retour réseau) — RBAC: service

### 🖼️ Écran 14.2 — App Manager Mobile
- 🚧 `ManagerCaDirect` (CA temps réel push) — RBAC: 70+
- 🚧 `RemoteDiscountApprover` — RBAC: 70+
- 🚧 `StockRuptureAlertsFeed` — RBAC: 70+

### 🖼️ Écran 14.3 — App KDS Tablette (Expo)
- 🚧 `TabletKdsGrid` — RBAC: 20+
- 🚧 `BumpBarBluetoothPairing` — RBAC: service

### 🖼️ Écran 14.4 — App Caisse iPad (Expo)
- 🚧 `IpadPosOptimized` — RBAC: 20+

**Total Zone 14** : ~10 composants (0 ✅ · 0 🔧 · 10 🚧) — **toutes bloquées par API REST H2.**

---

## 16. 🖥️ Zone 15 — SITE WEB PUBLIC

**Route** : `/[slug]` (landing tenant), `/[slug]/menu`, `/[slug]/click-collect`, `/[slug]/gift-cards`
**RBAC** : Public (accessible sans auth)

### 🖼️ Écran 15.1 — Landing publique
- ✅ `PublicLandingHero` (per-tenant) — RBAC: Public
- ✅ `CtaReservationBlock` — RBAC: Public
- ✅ `MenuTeaserBlock` — RBAC: Public
- 🔧 `SeoMetaGenerator` (per-tenant) — RBAC: service

### 🖼️ Écran 15.2 — Menu digital public
- ✅ `PublicMenuScreen` — RBAC: Public
- ⬜ `MultilingualMenuToggle` (EN/ES/ZH/AR — i18n dormant) — RBAC: Public

### 🖼️ Écran 15.3 — Click & Collect public
- 🔧 `ClickCollectCheckout` — 🚧 dépend API REST H2
- 🔧 `PickupSlotPicker` — RBAC: Public

### 🖼️ Écran 15.4 — Gift cards public
- ⬜ `GiftCardPublicPurchase` — RBAC: Public
- ⬜ `GiftCardBalanceChecker` — RBAC: Public

**Total Zone 15** : ~12 composants (~5 ✅ · ~4 🔧 · ~3 ⬜)

---

## 17. 🖥️ Zone 16 — DESIGN SYSTEM TRANSVERSE & ÉTATS SYSTÈME

**Codebase** : [`src/design/`](../../src/design/), [`src/shared/components/ui/`](../../src/shared/components/ui/)

### Layout & navigation
- ✅ `AppShell` (layout root) — RBAC: ∀
- ✅ `SidebarNav` (nav gauche) — RBAC: ∀
- ✅ `TopBar` (compte + notifications) — RBAC: ∀
- ✅ `Breadcrumbs` — RBAC: ∀
- ✅ `TabsNavigation` — RBAC: ∀

### Overlays
- ✅ `Dialog` / `Modal` — RBAC: ∀
- ✅ `Drawer` (bottom/right) — RBAC: ∀
- ✅ `Popover` — RBAC: ∀
- ✅ `Tooltip` — RBAC: ∀
- ✅ `Toast` (notifications transitoires) — RBAC: ∀

### États système (CRITIQUES POUR UX DÉGRADÉE)
- ✅ `SplashGate` (bootstrap tenant + branding) — RBAC: ∀
- 🔧 `OfflineBanner` (indication mode hors-ligne) — RBAC: ∀
- 🔧 `SyncQueueIndicator` (nb items en attente sync) — RBAC: ∀
- ⬜ `SovereignGuardViolationModal` (tentative accès cross-tenant) — RBAC: service
- ⬜ `DlqQuarantineNotifier` (event fiscal en quarantaine) — RBAC: 100 · consomme `mcc.fiscal_audit_required`
- ⬜ `MaintenanceModeBanner` (tenant en grace period impayé) — RBAC: 100

### Data display
- ✅ `Table` (tri, filtre, pagination) — RBAC: ∀
- ✅ `Chart` (Recharts wrapper) — RBAC: ∀
- ✅ `Sparkline` — RBAC: ∀
- ✅ `Badge` / `Pill` / `Chip` — RBAC: ∀
- ✅ `Avatar` — RBAC: ∀
- ✅ `Card` (glassmorphism) — RBAC: ∀

### Forms
- ✅ `Input` / `Textarea` / `Select` / `Checkbox` / `Radio` — RBAC: ∀
- ✅ `MoneyInput` (branded `Microunits`) — RBAC: ∀
- ✅ `DatePicker` — RBAC: ∀
- ✅ `TimePicker` — RBAC: ∀
- ✅ `FileUploader` — RBAC: ∀
- ✅ `SignaturePad` (à améliorer H4 — Universign/DocuSign pour valeur probante) — RBAC: 20+

### Sécurité & sessions
- ✅ `PinPad` (PBKDF2 server-side) — RBAC: 10+
- ✅ `MfaGate` (MCC only) — RBAC: MCC
- ✅ `SessionTimeoutWarning` — RBAC: ∀

### Branding
- ✅ `GlassCard` — RBAC: ∀
- ✅ `MotionWrapper` (Framer Motion) — RBAC: ∀
- ✅ `LogoRenderer` (per-tenant SVG) — RBAC: ∀

### Charts (Recharts)
- ✅ `LineChart` / `BarChart` / `AreaChart` / `PieChart` — RBAC: ∀
- ✅ `RadarChart` — RBAC: ∀
- ⬜ `HeatmapChart` (occupation tables) — RBAC: ∀

### Fleet (MCC — hors RBAC tenant)
- ✅ `FleetTenantsTable` — RBAC: MCC
- ✅ `MccDashboard` (13 onglets) — RBAC: MCC
- ✅ `EventBusInspector` (DLQ + quarantaine) — RBAC: MCC
- ✅ `SystemTenantsTab` (24 tenants versionbase) — RBAC: MCC

**Total Zone 16** : ~55 composants (~48 ✅ · ~3 🔧 · ~4 ⬜)

---

## 18. Statistiques Consolidées & Priorités Refonte UI

### 📊 Statistiques par Zone (Verticale Restaurant — Référence)

| Zone | Composants | ✅ | 🔧 | ⬜ | 🚧 | 🚫 | Complétude |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 SERVICE | ~130 | 48 | 7 | 75 | 0 | 0 | 37% |
| 2 RÉSERVATIONS | ~35 | 15 | 5 | 15 | 0 | 0 | 43% |
| 3 MENU | ~30 | 11 | 3 | 16 | 0 | 0 | 37% |
| 4 CRM & FIDÉLITÉ | ~30 | 11 | 5 | 14 | 0 | 0 | 37% |
| 5 STOCK | ~25 | 10 | 5 | 10 | 0 | 0 | 40% |
| 6 RH | ~35 | 17 | 2 | 15 | 0 | 1 | 49% |
| 7 FINANCE | ~25 | 14 | 5 | 6 | 0 | 0 | 56% |
| 8 COMPLIANCE | ~18 | 11 | 3 | 4 | 0 | 0 | 61% |
| **9 FACILITY** | **27** | **0** | **0** | **27** | **0** | **0** | **⚠️ 0%** |
| 10 ANALYTICS | ~20 | 11 | 0 | 9 | 0 | 0 | 55% |
| 11 INTELLIGENCE | ~18 | 5 | 6 | 7 | 0 | 0 | 28% |
| 12 INTÉGRATIONS | ~12 | 7 | 1 | 4 | 0 | 0 | 58% |
| 13 ADMIN CLIENT | ~22 | 13 | 5 | 4 | 0 | 0 | 59% |
| **14 MOBILE** | **~10** | **0** | **0** | **0** | **10** | **0** | **🚧 0%** |
| 15 WEB PUBLIC | ~12 | 5 | 4 | 3 | 0 | 0 | 42% |
| 16 DESIGN SYSTEM | ~55 | 48 | 3 | 4 | 0 | 0 | 87% |
| **TOTAL** | **~506** | **~226** | **~54** | **~213** | **10** | **1** | **45%** |

> **Note** : le compte ~806 mentionné en tête inclut les composants réutilisables cross-zone (Design System × instances Zone 1-13) et les composants spécifiques par verticale (Bakery, Retail, Salon, Garage, Hotel, Clinic, Custom — voir [VERTICALS_SPECIFICATION.md](VERTICALS_SPECIFICATION.md)).

### 🎯 Priorités Refonte UI par Tranche

#### 🚨 Tranche 1 — CRITIQUE avant refonte (bloquants métier)
1. **`WelcomeGuestButton`** (Zone 2) — émet `reservation.matched` → allergènes KDS · 🔴 sécurité alimentaire
2. **`AllergenAlertBanner`** + `AllergenBadge` KDS (Zones 1 & 2) · consomme la chaîne allergènes
3. **`SovereignGuardViolationModal`** (Zone 16) · aujourd'hui aucun feedback UI si violation cross-tenant
4. **`DlqQuarantineNotifier`** (Zone 16) · aucune UI ne surface les événements fiscaux en quarantaine
5. **`OfflineBanner`** + `SyncQueueIndicator` améliorés (Zone 16) · mode offline mal signalé

#### 🎨 Tranche 2 — À polir pendant la refonte
1. Zone 1 POS enrichissements (allergènes inline, favorites, recent items, barcode)
2. Zone 3 Menu Engineering BCG (matrice étoile/vache à lait)
3. Zone 11 Oracle (fallback mode dégradé)
4. Zone 13 Admin (`TwoFactorAuthConfig` obligatoire pour niveau 100)

#### 🆕 Tranche 3 — Nouveaux modules refonte
1. **Zone 9 Facility complète** (27 composants — H2/H3)
2. Zone 4 CRM avancé (CLV, Churn Risk, Erasure UI)
3. Zone 8 Compliance (Data Portability Art. 20 RGPD)
4. Zone 15 Web Public (Gift cards, Click & Collect finalisé)

#### 🏗️ Tranche 4 — Extensions groupe (multi-établissements)
1. **Zone 13.6 Multi-établissements** (EmpireCockpit consolidé)
2. Zone 5 Multi-Site Stock Pool
3. Zone 6 Multi-Site Staff Pool
4. Zone 7 Consolidation financière groupe (MacroBrain)

#### 🚧 Tranche 5 — Bloquées, à débloquer via H2
1. **Toute Zone 14 Mobile** (10 composants) — bloquée par API REST OpenAPI Hono

### 🎨 Principes UX pour la Refonte

1. **Mode offline lisible** : chaque écran doit indiquer clairement (banner + icône réseau) s'il tourne en local-first ou synchro.
2. **RBAC visible** : un contrôle désactivé par RBAC doit expliquer pourquoi (tooltip "Nécessite niveau 70+").
3. **Feedback immédiat** : toute action → toast confirmation en <200ms.
4. **Contraste dark/light** : validation WCAG 2.1 AA obligatoire (audit Axe DevTools par écran).
5. **Rush mode responsive** : au-dessus de 50 tickets/h KDS, mode "grosses pastilles" auto activé.
6. **Zero-loss guarantee** : toute perte de connexion doit maintenir 100% des écritures dans `busOutbox` local sans exception.

---

## Références Codebase

- **Design System** : [`src/design/`](../../src/design/) · [`src/shared/components/ui/`](../../src/shared/components/ui/)
- **Pages Next.js** : [`src/app/(client)/`](../../src/app/(client)/) · [`src/app/(admin)/`](../../src/app/(admin)/) · [`src/app/(public)/`](../../src/app/(public)/)
- **Nav Config** : [`src/config/navConfig.ts`](../../src/config/navConfig.ts) (filterByCapabilities)
- **États système** : [`src/design/system/SplashGate.tsx`](../../src/design/system/SplashGate.tsx) · offline queue in [`src/lib/offline/`](../../src/lib/offline/)
- **Verticales UI** : [`VERTICALS_SPECIFICATION.md`](VERTICALS_SPECIFICATION.md) pour les spécificités Bakery/Retail/Salon/Garage/Hotel/Clinic/Custom
