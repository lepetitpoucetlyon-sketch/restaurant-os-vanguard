# 🍽️ COMPOSANTS UI — Verticale Restaurant
> Décomposition exhaustive des écrans, composants et interactions.
> ✅ Fait · 🔧 À finir · ⚫ À faire · RBAC: niveaux d'accès en fin de ligne

---

## 📖 Grille de lecture

Chaque composant a le format : `ComponentName — RBAC: 30 · 60 · 100`

Les nombres = **niveaux RBAC** qui peuvent VOIR/UTILISER le composant.

**Barème des niveaux** :
- `10` Apprenti · Plongeur
- `20` Commis · Serveur junior · Runner
- `30` Serveur · Barman · Vendeur · Réceptionniste
- `40` Chef de rang · Timeclock manager
- `50` Sommelier · Expert produit
- `60` Sous-chef · Manager service · Chef d'équipe
- `70` Chef de cuisine · Chef de salle
- `80` Directeur établissement
- `100` Propriétaire · Super admin
- `∀` = tous niveaux (10 → 100)

---

# 🖥️ Zone 1 — SERVICE

## 🖼️ Écran 1.1 — POS (`/pos`)

### 🧩 Composants principaux

- ✅ `HeaderBar` — RBAC: ∀
- ✅ `CategoryTabs` — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ✅ `ProductGrid` — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ✅ `ProductCard` (item dans grid) — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ✅ `ProductDetailsDialog` (modal options) — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ✅ `ModifierPicker` (radio/checkbox options) — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ✅ `QuantitySelector` — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ✅ `NotesTextarea` (note libre par plat) — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ⚫ `NotesAutocomplete` (suggestions notes fréquentes) — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ⚫ `AllergenTagPicker` (tag allergie inline) — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ⚫ `WinePairingSuggestion` (IA suggère vin par plat) — RBAC: 30 · 40 · 50 · 60 · 70 · 80 · 100
- ⚫ `ProductFavoritesGrid` (mode flux rapide) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `RecentlyUsedItemsBar` (5 derniers plats servis) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ProductSearchOverlay` (Cmd+K style recherche produit) — RBAC: 20 · 30 · 40 · 50 · 60 · 70 · 80 · 100
- ⚫ `BarcodeScanner` (scan code-barres carte cadeau/produit) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `VoiceOrderInput` (dictée vocale commande) — RBAC: 30 · 40 · 60 · 70 · 80 · 100

### 🧩 Panier & addition

- ✅ `CartHeader` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CartLines` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CartLineItem` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CartFooter` (totaux + TVA) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CartActions` (envoyer/encaisser/split) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `PartialSendButton` (envoyer entrées seulement) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `GuestGroupingPanel` (siège 1/2/3 par convive) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `CourseSequencer` (ordre entrée→plat→dessert) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `TableTransferDialog` (transférer commande table→table) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `CartHoldMenu` (mise en attente panier) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `HoldingCartsListDrawer` (paniers en attente) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ServiceChargeToggle` (frais de service groupe > 8) — RBAC: 60 · 70 · 80 · 100
- ⚫ `CoverCountSelector` (déclaration nb couverts) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `CartTimeline` (historique modif panier) — RBAC: 60 · 70 · 80 · 100

### 🧩 Modales encaissement

- ✅ `PaymentDialog` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `PaymentMethodPicker` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `AmountInput` (pad numérique tactile) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ChangeCalculator` (rendu monnaie espèces) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TipInput` (montant / % / arrondi) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `SplitBillDialog` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `SplitByItem` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `SplitByGuest` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `SplitCustom` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DiscountDialog` (< 10%) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DiscountDialog` (> 10%) — RBAC: 60 · 70 · 80 · 100
- ✅ `RefundDialog` (avoir) — RBAC: 60 · 70 · 80 · 100
- ⚫ `PreAuthDialog` (pré-autorisation CB Stripe Terminal) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `GiftCardRedeemModal` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `GiftCardIssuanceModal` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `LoyaltyPointsRedeemDialog` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `AgeVerificationModal` — RBAC: 60 · 70 · 80 · 100
- ⚫ `AllergenAlertBanner` (bandeau rouge table allergique) — RBAC: ∀
- ⚫ `TenderInsertionOverlay` (attente TPE Stripe Terminal) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ReceiptDeliveryDialog` (imprimer/email/SMS/QR) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `PaymentReceiptSummary` (récap post-encaissement) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MealVoucherValidator` (validation carte titre-restaurant) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `InvoiceRequestModal` (client demande facture) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100

### 🧩 Table selector

- ✅ `TableSelector` (drawer bas) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `MiniFloorPlan` (mini-carte tables) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TablesListView` (vue alternative liste) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TableSearchInput` (recherche par numéro) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `WalkInFlashCreateButton` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `TakeawayModeToggle` (mode à emporter sans table) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `DeliveryModeToggle` (mode livraison) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100

### 🧩 Impression

- ✅ `TicketPrinterService` (service ESC/POS) — RBAC: — (service)
- ✅ `KitchenPrinterService` (fallback KDS) — RBAC: — (service)
- 🔧 `DigitalReceiptQR` (QR ticket dématérialisé) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `PrinterConfigModal` (paramètres imprimantes) — RBAC: 80 · 100
- ⚫ `PrinterStatusIndicator` (statut imprimante header) — RBAC: 30 · 40 · 60 · 70 · 80 · 100

---

## 🖼️ Écran 1.2 — KDS (`/kds`)

### 🧩 Composants principaux

- ✅ `KdsHeader` — RBAC: 20 · 60 · 70 · 100
- ✅ `TicketGrid` — RBAC: 20 · 60 · 70 · 100
- ✅ `TicketCard` — RBAC: 20 · 60 · 70 · 100
- ✅ `TicketHeader` (table + timer) — RBAC: 20 · 60 · 70 · 100
- ✅ `TicketItems` (liste plats) — RBAC: 20 · 60 · 70 · 100
- ✅ `TicketFooter` (bump/recall) — RBAC: 20 · 60 · 70 · 100
- ✅ `BumpButton` — RBAC: 20 · 60 · 70 · 100
- ✅ `RecallButton` (long-press) — RBAC: 60 · 70 · 100
- 🔧 `BumpBarUsbListener` (bump bar physique) — RBAC: — (service)
- ⚫ `StationFilterTabs` (filtrer par station) — RBAC: 60 · 70 · 100
- ⚫ `ViewByPlateToggle` (vue par plat vs table) — RBAC: 60 · 70 · 100
- ⚫ `ViewByServiceToggle` (sur place/emporter/livraison) — RBAC: 60 · 70 · 100
- ⚫ `AllergenBadge` (badge critique) — RBAC: 20 · 60 · 70 · 100
- ⚫ `SpecialRequestHighlight` (surlignage "sans oignon") — RBAC: 20 · 60 · 70 · 100
- ⚫ `TicketExpandOverlay` (zoom ticket tactile) — RBAC: 20 · 60 · 70 · 100

### 🧩 Coordination

- ⚫ `ExpeditorView` (chef expeditor global) — RBAC: 60 · 70 · 100
- ⚫ `TableSyncPanel` (synchro sortie plats table) — RBAC: 60 · 70 · 100
- ⚫ `AllPlatesForTableGrouping` — RBAC: 60 · 70 · 100
- ⚫ `ServiceCallButton` (appeler serveur "plat prêt") — RBAC: 20 · 60 · 70 · 100
- ⚫ `PrepTimeEstimator` (IA temps préparation) — RBAC: 60 · 70 · 100
- ⚫ `KitchenIntercomWidget` (chat voice push-to-talk) — RBAC: 20 · 30 · 60 · 70 · 100
- ⚫ `StationCapacityBar` (charge par station) — RBAC: 60 · 70 · 100

### 🧩 Stats & alertes

- 🔧 `KdsFooter` (stats jour) — RBAC: 60 · 70 · 100
- ⚫ `AverageCookTimeWidget` — RBAC: 60 · 70 · 80 · 100
- ⚫ `PeakLoadIndicator` (pic de charge) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LateTicketAlarm` (alerte sonore ticket rouge) — RBAC: — (service)
- ⚫ `KdsShiftHandoverSummary` (récap fin shift) — RBAC: 60 · 70 · 100

### 🧩 Modes spéciaux

- ⚫ `KdsPrepListMode` (mode liste préparation matin) — RBAC: 60 · 70 · 100
- ⚫ `KdsInventoryCheckMode` (revue stock cuisine) — RBAC: 60 · 70 · 100
- ⚫ `KdsBrigadeChatMode` (chat cuisine interne) — RBAC: 20 · 60 · 70 · 100
- ⚫ `KdsRecipeQuickView` (accès rapide fiche recette) — RBAC: 20 · 60 · 70 · 100

---

## 🖼️ Écran 1.3 — Plan de salle (`/floor-plan`)

### 🧩 Composants vue service

- ✅ `FloorPlanHeader` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `FloorCanvas` (SVG interactif) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TableRenderer` (SVG shape) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TableChairs` (chaises visibles) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ZoneRenderer` (zones terrasse/salon) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TableActionsMenu` (popup contextuel) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReservationsQueue` (bas de page) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `TableStatusIndicator` (couleur selon durée) — RBAC: ∀
- ⚫ `CapacityIndicator` (jauge visuelle) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `TableDelayAlert` (table qui attend > X min) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `TableGuestInfoPopover` (hover client info) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ZoomFitControls` (zoom in/out/fit) — RBAC: ∀

### 🧩 Composants édition (RBAC 60+)

- ✅ `EditPanel` (drawer palette outils) — RBAC: 60 · 70 · 80 · 100
- ✅ `TableAddDialog` (ajouter table forme+capa) — RBAC: 60 · 70 · 80 · 100
- ✅ `ZoneAddDialog` — RBAC: 60 · 70 · 80 · 100
- ✅ `EditPanel > DeleteButton` — RBAC: 60 · 70 · 80 · 100
- ✅ `EditPanel > ZoneLockToggle` — RBAC: 60 · 70 · 80 · 100
- ✅ `FloorPlanSaveButton` — RBAC: 60 · 70 · 80 · 100
- ⚫ `PlanTemplateGallery` (templates bistrot/gastro/brasserie) — RBAC: 60 · 70 · 80 · 100
- ⚫ `PlanImportWizard` (import DWG/PDF architecte) — RBAC: 80 · 100
- ⚫ `FloorPlanVersionHistory` (versions sauvegardées) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MultiFloorSelector` (étages 1/2/terrasse) — RBAC: 60 · 70 · 80 · 100
- ⚫ `TableCombineTool` (fusionner 2 tables adjacentes) — RBAC: 60 · 70 · 80 · 100
- ⚫ `TableSplitTool` (séparer table double) — RBAC: 60 · 70 · 80 · 100

---

## 🖼️ Écran 1.4 — Bar (`/bar`)

### 🧩 Nouveaux composants dédiés bar

- 🔧 `WineDetailPanel` (fiche vin détaillée) — RBAC: 30 · 50 · 60 · 70 · 80 · 100
- ✅ `KdsBarTab` (KDS bar spécifique) — RBAC: 30 · 60 · 70 · 100
- ⚫ `CocktailRecipeCard` (fiche cocktail avec dosages) — RBAC: 30 · 50 · 60 · 70 · 100
- ⚫ `WineListFilterPanel` (filtres cépage/région/prix) — RBAC: 30 · 50 · 60 · 70 · 80 · 100
- ⚫ `VintageStockTracker` (millésimes en stock) — RBAC: 30 · 50 · 60 · 70 · 80 · 100
- ⚫ `SommelierRecommendationEngine` (IA suggère vin) — RBAC: 30 · 50 · 60 · 70 · 80 · 100
- ⚫ `HappyHourActivator` (activer/désactiver happy hour) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `BarInventoryFastCount` (compte rapide bouteilles) — RBAC: 30 · 60 · 70 · 100

---

## 🖼️ Écran 1.5 — POS Mobile serveur (`/pos-mobile`)

### 🧩 Composants mobile-first

- 🔧 `MobilePosLayout` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `MobileCartSheet` (bottom sheet panier) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MobileMenuCarousel` (swipe catégories) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MobileProductBottomSheet` (options plat) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MobileTableSelectorSheet` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MobileQuickTipButtons` (tips arrondi) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `HapticFeedbackController` (vibrations validation) — RBAC: — (service)

---

# 🖥️ Zone 2 — RÉSERVATIONS & ACCUEIL

## 🖼️ Écran 2.1 — Liste réservations (`/reservations`)

### 🧩 Composants principaux

- ✅ `ReservationsHeader` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReservationDatePicker` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReservationsFilters` (statut/service/canal) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReservationsTable` (chronologique) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReservationsListView` (vue alternative liste) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReservationsCalendarView` (vue calendrier mois) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReservationCard` (item liste) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `ReservationsExportCSV` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ReservationsBulkActions` (bulk annuler/rappeler) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AdvancedFilterDrawer` (nb couverts/allergies/VIP) — RBAC: 30 · 40 · 60 · 70 · 80 · 100

### 🧩 Création & édition résa

- 🔧 `NewReservationDialog` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ClientSearchInput` (autocomplete CRM) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ClientQuickCreateForm` (créer client à la volée) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DateTimePicker` (créneaux libres) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `PartySizeSelector` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TableAssignmentPicker` (auto/manuel) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `AllergyChecklistInput` (14 INCO) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `InternalNotesTextarea` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DepositToggle` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DepositAmountConfig` — RBAC: 60 · 70 · 80 · 100
- ⚫ `VipTagPicker` (tag client VIP) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `OccasionSelector` (anniversaire/mariage/repas d'affaires) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `SeatingPreferenceInput` (préférence table cheminée) — RBAC: 30 · 40 · 60 · 70 · 80 · 100

### 🧩 Édition résa existante

- 🔧 `ReservationDetailsDialog` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `ReservationInfoTab` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `ReservationClientHistoryTab` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `ReservationAllergiesTab` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `ReservationCommunicationsTab` (SMS/email envoyés) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ **`WelcomeGuestButton` (bouton "Accueillir client" — CRITIQUE R2 bus)** — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ReservationCancelDialog` (annuler + gérer acompte) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ReservationRescheduleDialog` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `SendManualReminderButton` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `NoShowMarkButton` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ReservationLogTimeline` (audit trail modifs) — RBAC: 60 · 70 · 80 · 100

### 🧩 Walk-in & liste d'attente

- 🔧 `WalkInFlashDialog` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `WaitlistQueue` (file d'attente sans table) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `WaitlistEntryCard` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `WaitEstimateCalculator` (temps attente estimé) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `SmsCallReadyButton` (SMS "on vous attend") — RBAC: 30 · 40 · 60 · 70 · 80 · 100

### 🧩 Groupes & privatisations

- ⚫ `GroupReservationWizard` (résa > 8 pers) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `SetMenuBuilder` (formule prépayée groupe) — RBAC: 60 · 70 · 80 · 100
- ⚫ `PrivatizationCalendar` (bloquer salle privée) — RBAC: 60 · 70 · 80 · 100
- ⚫ `GroupInvoicePreview` — RBAC: 60 · 70 · 80 · 100
- ⚫ `GroupPaymentTracker` (acompte/solde) — RBAC: 60 · 70 · 80 · 100

### 🧩 Rappels & no-show

- 🔧 `SmsReminderScheduler` — RBAC: — (service)
- 🔧 `EmailReminderScheduler` — RBAC: — (service)
- ⚫ `RemindersConfigPanel` (J-2 / J-1 / heures) — RBAC: 60 · 70 · 80 · 100
- ⚫ `NoShowRiskDashboard` (clients à risque) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AutoDepositRuleEditor` (règles acompte auto) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 2.2 — Booking widget public (`/[slug]/reservations`)

### 🧩 Composants publics (sans RBAC — public)

- ✅ `PublicBookingHeader` — RBAC: — (public)
- ✅ `AvailabilityCalendar` — RBAC: — (public)
- ✅ `PartyDetailsForm` — RBAC: — (public)
- ✅ `DepositCheckout` (Stripe Elements) — RBAC: — (public)
- ✅ `ConfirmationScreen` — RBAC: — (public)
- ⚫ `LanguageSwitcher` (FR/EN/DE/ES/IT) — RBAC: — (public)
- ⚫ `MenuPreviewSection` (aperçu menu du jour) — RBAC: — (public)
- ⚫ `RestaurantPhotosGallery` — RBAC: — (public)
- ⚫ `ReviewsWidget` (avis Google intégrés) — RBAC: — (public)
- ⚫ `AllergenPreDeclarationForm` — RBAC: — (public)
- ⚫ `AddToCalendarButton` (Apple/Google) — RBAC: — (public)
- ⚫ `ChangeOrCancelSelfService` (client change sa résa) — RBAC: — (public + token)
- ⚫ `WhatsappConfirmationOptIn` — RBAC: — (public)

---

# 🖥️ Zone 3 — MENU & CATALOGUE

## 🖼️ Écran 3.1 — Menu Builder (`/menu-builder`)

### 🧩 Composants édition

- ✅ `MenuBuilderHeader` — RBAC: 60 · 70 · 80 · 100
- ✅ `CategorySidebar` — RBAC: 60 · 70 · 80 · 100
- ✅ `CategoryDragDropList` — RBAC: 60 · 70 · 80 · 100
- ✅ `CategoryRenameInline` — RBAC: 60 · 70 · 80 · 100
- ✅ `CategoryAddButton` — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductListPanel` — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductRow` (ligne tableau) — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductAvailabilityToggle` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `ProductDuplicateButton` — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductArchiveButton` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ProductBulkActions` (bulk publish/archive) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ProductSearchInput` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ProductImportCSV` — RBAC: 80 · 100
- ⚫ `ProductExportCSV` — RBAC: 60 · 70 · 80 · 100

### 🧩 Édition produit (fragmenté)

- ✅ `ProductEditDialog` — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductEditDialog > GeneralTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductPhotoUploader` (crop + optim) — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductEditDialog > PricingTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `MultiPricingEditor` (heure creuse/pleine) — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductEditDialog > ModifiersTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `ModifierGroupBuilder` — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductEditDialog > RecipeTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `RecipeComposer` — RBAC: 60 · 70 · 80 · 100
- ✅ `IngredientSearchInput` — RBAC: 60 · 70 · 80 · 100
- ✅ `IngredientLine` (qté/unité/coût) — RBAC: 60 · 70 · 80 · 100
- ✅ `RecipeSummary` (coût/marge %) — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductEditDialog > AllergensTab` (14 INCO) — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductEditDialog > AvailabilityTab` — RBAC: 60 · 70 · 80 · 100
- ⚫ `AvailabilityScheduleGrid` (par jour × créneau) — RBAC: 60 · 70 · 80 · 100
- ⚫ `NutritionalValuesEditor` (kcal/protéines/glucides) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AiDescriptionGenerator` (rédiger description IA) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ProductTranslationsPanel` (traductions FR/EN/DE) — RBAC: 60 · 70 · 80 · 100
- ⚫ `SeasonalToggle` (produit saisonnier avec période) — RBAC: 60 · 70 · 80 · 100
- ⚫ `WinePairingSuggestionsEditor` — RBAC: 50 · 60 · 70 · 80 · 100

### 🧩 Historique & versioning

- 🔧 `MenuVersionHistory` — RBAC: 60 · 70 · 80 · 100
- ⚫ `MenuVersionDiffViewer` (comparaison entre versions) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MenuRollbackButton` (restaurer version antérieure) — RBAC: 80 · 100
- ⚫ `MenuScheduleActivator` (publier menu automatiquement à date) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 3.2 — Menu Engineering (`/menu-engineering`)

- ✅ `EngineeringMatrix` (heatmap 4 quadrants) — RBAC: 60 · 70 · 80 · 100
- ✅ `ProductClassification` (Star/Puzzle/Plowhorse/Dog) — RBAC: 60 · 70 · 80 · 100
- 🔧 `AISuggestionsPanel` (repositionnement) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MonthlyReport` (export PDF) — RBAC: 60 · 70 · 80 · 100
- ⚫ `HistoricalEvolutionChart` (évolution mensuelle par plat) — RBAC: 60 · 70 · 80 · 100
- ⚫ `RepricingSimulator` (impact prix simulé) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MenuMixAnalysis` (mix ventes par catégorie) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ContributionMarginChart` (marge contribution) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 3.3 — Menu digital (QR) — nouveau

- ⚫ `DigitalMenuEditor` — RBAC: 60 · 70 · 80 · 100
- ⚫ `QRCodeGenerator` (QR par table) — RBAC: 60 · 70 · 80 · 100
- ⚫ `DigitalMenuPreview` (aperçu mobile) — RBAC: 60 · 70 · 80 · 100
- ⚫ `DigitalMenuThemePicker` (couleurs/fonts client) — RBAC: 60 · 70 · 80 · 100
- ⚫ `PhotoGalleryPerDish` (photos multiples par plat) — RBAC: 60 · 70 · 80 · 100
- ⚫ `DietaryFilterConfig` (végé/vegan/sans gluten) — RBAC: 60 · 70 · 80 · 100
- ⚫ `OrderFromQrToggle` (activer commande depuis QR) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 3.4 — Promotions

- ✅ `PromotionsList` — RBAC: 60 · 70 · 80 · 100
- ✅ `PromotionEditor` — RBAC: 60 · 70 · 80 · 100
- ✅ `HappyHourScheduleEditor` — RBAC: 60 · 70 · 80 · 100
- ✅ `MenuDayFormulaBuilder` — RBAC: 60 · 70 · 80 · 100
- 🔧 `PromoCodeGenerator` — RBAC: 60 · 70 · 80 · 100
- ⚫ `PromoCodeUsageStats` — RBAC: 60 · 70 · 80 · 100
- ⚫ `BOGOBuilder` (Buy One Get One) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LoyaltyOnlyPromoBuilder` (promo fidèles) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 3.5 — Bons cadeaux (nouveau)

- ⚫ `GiftCardsList` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `GiftCardIssuanceForm` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `GiftCardStatsWidget` (émis/utilisés/valeur) — RBAC: 60 · 70 · 80 · 100
- ⚫ `GiftCardExpiryConfig` — RBAC: 80 · 100
- ⚫ `GiftCardPublicPurchasePage` — RBAC: — (public)

---

# 🖥️ Zone 4 — CLIENTS & FIDÉLITÉ (CRM)

## 🖼️ Écran 4.1 — Liste clients (`/crm`)

- ✅ `CRMHeader` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMSearchInput` (fulltext) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `SegmentsSidebar` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMList` (table paginée) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMRow` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMBulkActions` — RBAC: 60 · 70 · 80 · 100
- ✅ `CRMImportCSVDialog` — RBAC: 80 · 100
- 🔧 `CRMExportDialog` (CSV/JSON) — RBAC: 80 · 100
- ⚫ `AdvancedSegmentBuilder` (règles dynamiques) — RBAC: 60 · 70 · 80 · 100
- ⚫ `CustomerScoringWidget` (score fidélité IA) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MergeDuplicatesDialog` (fusionner doublons) — RBAC: 80 · 100

## 🖼️ Écran 4.2 — Fiche client détaillée

- ✅ `CRMDetailView` (drawer/route) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMDetailView > InfoTab` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMDetailView > PreferencesTab` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMDetailView > HistoryTab` (timeline visites) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CRMDetailView > LoyaltyTab` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `CRMDetailView > CommunicationsTab` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `ClientAvatarUpload` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ClientNotesFeed` (fil de notes datées équipe) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ClientTagsPicker` (tags custom : "gastronome", "difficile") — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ClientCLVWidget` (Customer Lifetime Value) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ClientTimelineExport` (export historique complet) — RBAC: 80 · 100
- ⚫ `ClientBirthdayReminderBadge` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ClientPreferredServerAssignment` — RBAC: 60 · 70 · 80 · 100
- ⚫ `LinkedFamilyGuestsPanel` (conjoint/enfants) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ClientDocumentsUploader` (allergène doc médical) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 4.3 — Campagnes marketing (`/marketing`)

- ✅ `CampaignsList` — RBAC: 60 · 70 · 80 · 100
- ✅ `CampaignBuilder` — RBAC: 60 · 70 · 80 · 100
- ✅ `CampaignTemplatePicker` — RBAC: 60 · 70 · 80 · 100
- ✅ `EmailWYSIWYGEditor` — RBAC: 60 · 70 · 80 · 100
- ✅ `CampaignAudienceSelector` — RBAC: 60 · 70 · 80 · 100
- ✅ `CampaignSchedulerPicker` — RBAC: 60 · 70 · 80 · 100
- ✅ `CampaignResultsPanel` — RBAC: 60 · 70 · 80 · 100
- 🔧 `SMSCampaignBuilder` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ABTestConfigurator` — RBAC: 60 · 70 · 80 · 100
- ⚫ `CampaignPerformanceComparison` — RBAC: 60 · 70 · 80 · 100
- ⚫ `AutomationsPanel` (workflows auto) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AutomationTriggerPicker` (bus events) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AutomationStepsBuilder` (SMS J+1 → email J+30) — RBAC: 60 · 70 · 80 · 100
- ⚫ `BirthdayAutomationTemplate` — RBAC: 60 · 70 · 80 · 100
- ⚫ `WinbackAutomationTemplate` (client dormant) — RBAC: 60 · 70 · 80 · 100
- ⚫ `UnsubscribesList` (opt-out RGPD) — RBAC: 60 · 70 · 80 · 100
- ⚫ `WhatsappBusinessConnector` — RBAC: 80 · 100
- ⚫ `EmailDeliverabilityMonitor` (bounce/spam) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 4.4 — Fidélité (nouveau `/loyalty`)

- 🔧 `LoyaltyProgramSettings` — RBAC: 80 · 100
- 🔧 `LoyaltyTierBuilder` (Bronze/Argent/Or/Platine) — RBAC: 80 · 100
- 🔧 `RewardsCatalog` — RBAC: 60 · 70 · 80 · 100
- ⚫ `RewardEditor` (créer récompense) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LoyaltyDashboard` (KPIs programme) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LoyaltyMembersList` — RBAC: 60 · 70 · 80 · 100
- ⚫ `LoyaltyPointsAdjustmentTool` (ajustement manuel) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LoyaltyDigitalCard` (vue client QR) — RBAC: — (public)
- ⚫ `LoyaltyReferralProgram` (parrainage) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LoyaltyExpiryConfig` (expiration points) — RBAC: 80 · 100
- ⚫ `LoyaltyRedemptionHistory` — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 4.5 — Avis & réputation (nouveau)

- ⚫ `ReviewsFeedGoogle` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ReviewsFeedTheFork` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ReviewsAggregatedDashboard` (Google + TF + Trip) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AIResponseGenerator` (rép. avis assistée IA) — RBAC: 60 · 70 · 80 · 100
- ⚫ `NegativeReviewAlertPanel` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ReviewInviteEmailAutomation` (SMS post-visite) — RBAC: 60 · 70 · 80 · 100
- ⚫ `SentimentAnalysisChart` — RBAC: 60 · 70 · 80 · 100

---

# 🖥️ Zone 5 — STOCK & APPROVISIONNEMENT

## 🖼️ Écran 5.1 — Inventaire (`/inventory`)

- ✅ `InventoryHeader` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `InventoryTable` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `InventoryRow` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `StockStatusBadge` (normal/alerte/rupture) — RBAC: ∀
- ✅ `InventoryFilters` (catégorie/rupture/DLC) — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `StockAdjustmentDialog` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `ProductStockCard` (détail) — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `StockMovementsHistory` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `LotsActiveList` (traçabilité lots) — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `PhysicalInventoryWizard` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `PhysicalInventoryWizard > CountStep` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `PhysicalInventoryWizard > DiscrepancyStep` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `BarcodeInput` (scan EAN) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MultiLocationStockPanel` (chambre froide/bar/réserve) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `StockTransferDialog` (transfert entre emplacements) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `InventoryHistoryChart` (évolution stock produit) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LowStockDashboard` (produits à commander) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `OverstockDashboard` (surstock à écouler) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ExpiringBatchesBoard` (lots à consommer) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `WasteRecordingForm` (déchet + raison) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `WasteAnalyticsDashboard` — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 5.2 — Réception marchandises

- ✅ `ReceptionDashboard` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DeliveryNotesQueue` (BL en attente) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DeliveryNoteEditor` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `LinesEditorGrid` (produits reçus) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `LotAssignmentInput` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DiscrepancyPanel` (auto-calc manquants) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `PhotoBLUploader` (photo BL obligatoire) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `SignaturePad` (signature réceptionniste) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TraceabilityLabelPrinter` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `TemperatureCheckAtReception` (temp produits froids) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `QualityInspectionChecklist` (contrôle qualité) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `RejectDeliveryDialog` (refus livraison) — RBAC: 40 · 60 · 70 · 80 · 100

## 🖼️ Écran 5.3 — Fournisseurs (`/suppliers`)

- ✅ `SuppliersList` — RBAC: 60 · 70 · 80 · 100
- ✅ `SupplierEditor` — RBAC: 60 · 70 · 80 · 100
- 🔧 `SupplierCatalogViewer` — RBAC: 60 · 70 · 80 · 100
- 🔧 `PurchaseOrderBuilder` — RBAC: 60 · 70 · 80 · 100
- 🔧 `SuggestedOrderPanel` (basé sur prévisions) — RBAC: 60 · 70 · 80 · 100
- ✅ `LineItemEditor` — RBAC: 60 · 70 · 80 · 100
- ✅ `OrderTotalSummary` — RBAC: 60 · 70 · 80 · 100
- ✅ `PoSendEmailDialog` — RBAC: 60 · 70 · 80 · 100
- 🔧 `MetroCatalogConnector` — RBAC: — (service)
- ⚫ `TransgourmetCatalogConnector` — RBAC: — (service)
- ⚫ `PomonaCatalogConnector` — RBAC: — (service)
- ⚫ `SysCoCatalogConnector` — RBAC: — (service)
- ⚫ `PriceComparisonTable` (multi-fournisseurs par produit) — RBAC: 60 · 70 · 80 · 100
- ⚫ `SupplierPerformanceCard` (délai livraison, écarts) — RBAC: 60 · 70 · 80 · 100
- ⚫ `SupplierNegotiationLog` (traces négos) — RBAC: 80 · 100
- ⚫ `RecurringOrdersEditor` (commandes récurrentes) — RBAC: 60 · 70 · 80 · 100
- ⚫ `SupplierInvoicesInbox` (factures fournisseurs reçues) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 5.4 — DLC/DDM alertes (nouveau)

- ⚫ `ExpiryDashboard` (vue centralisée DLC) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `ExpiryCalendarView` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `SuggestMenuDayFromExpiring` (IA suggestion) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MarkAsWastedWizard` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `DonationOfferToTGTG` (Too Good To Go) — RBAC: 60 · 70 · 80 · 100

---

# 🖥️ Zone 6 — RESSOURCES HUMAINES

## 🖼️ Écran 6.1 — Staff (`/staff`)

- ✅ `StaffList` — RBAC: 60 · 70 · 80 · 100
- ✅ `StaffRow` — RBAC: 60 · 70 · 80 · 100
- ✅ `StaffAvatar` — RBAC: ∀
- ✅ `StaffMemberDetail` (drawer) — RBAC: 60 · 70 · 80 · 100
- ✅ `StaffDetail > PersonalTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `StaffDetail > ContractTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `StaffDetail > CompetenciesTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `StaffDetail > TrainingsTab` — RBAC: 60 · 70 · 80 · 100
- ✅ `StaffDetail > PayrollHistoryTab` — RBAC: 80 · 100
- ✅ `InviteEmployeeDialog` — RBAC: 80 · 100
- ✅ `StaffBulkImportCSV` — RBAC: 80 · 100
- 🔧 `EmployeeContractGenerator` — RBAC: 80 · 100
- 🔧 `ContractTemplatePicker` — RBAC: 80 · 100
- ⚫ `EmployeeContractSignYouSign` — RBAC: 80 · 100
- ⚫ `DPAEModal` (Déclaration Préalable Embauche) — RBAC: 80 · 100
- ⚫ `EmployeeIdCardGenerator` (carte pro PDF) — RBAC: 60 · 70 · 80 · 100
- ⚫ `EmployeeTrainingsScheduler` (formations obligatoires) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MedicalVisitTracker` (visites médicales) — RBAC: 60 · 70 · 80 · 100
- ⚫ `WorkAccidentRecordForm` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ExitInterviewForm` (départ salarié) — RBAC: 80 · 100

## 🖼️ Écran 6.2 — Planning (`/planning`)

- ✅ `WeekPlanningGrid` — RBAC: 60 · 70 · 80 · 100
- ✅ `PlanningDayColumn` — RBAC: 60 · 70 · 80 · 100
- ✅ `ShiftBlock` (bloc shift dans cellule) — RBAC: 60 · 70 · 80 · 100
- ✅ `ShiftEditorDialog` — RBAC: 60 · 70 · 80 · 100
- ✅ `CopyWeekButton` — RBAC: 60 · 70 · 80 · 100
- ✅ `LegalConstraintsChecker` (11h repos, 35h/sem) — RBAC: — (service)
- 🔧 `AIScheduleSuggestion` — RBAC: 60 · 70 · 80 · 100
- 🔧 `ShiftSwapRequestDialog` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `ShiftSwapApprovalQueue` — RBAC: 60 · 70 · 80 · 100
- ✅ `PublishScheduleDialog` — RBAC: 60 · 70 · 80 · 100
- ⚫ `MonthlyPlanningView` — RBAC: 60 · 70 · 80 · 100
- ⚫ `IndividualSchedulePrintout` (planning perso PDF) — RBAC: 60 · 70 · 80 · 100
- ⚫ `EmployeeAvailabilityInput` (dispos employé) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `HolidaysCalendarBlocker` — RBAC: 80 · 100
- ⚫ `ShiftTemplatesLibrary` — RBAC: 60 · 70 · 80 · 100
- ⚫ `PlanningCostCalculator` (masse salariale du planning) — RBAC: 80 · 100
- ⚫ `AttendanceForecastOverlay` (superposition affluence prévue) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 6.3 — Timeclock (`/timeclock`)

- ✅ `ClockInScreen` (borne dédiée) — RBAC: — (auth PIN/NFC)
- ✅ `PinKeypad` — RBAC: — (auth)
- ✅ `NFCReaderListener` — RBAC: — (service)
- ✅ `TimeclockDashboard` (vue manager) — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `TimeclockDailyTable` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `TimeclockCorrectDialog` — RBAC: 60 · 70 · 80 · 100
- ✅ `PinResetModal` — RBAC: 60 · 70 · 80 · 100
- ⚫ `QRClockInMobile` (pointage QR téléphone) — RBAC: — (auth)
- ⚫ `FacialRecognitionClockIn` (optionnel) — RBAC: — (auth)
- ⚫ `GeoFencedClockIn` (vérif géolocalisation) — RBAC: — (service)
- ⚫ `BreakTracker` (pause déjeuner obligatoire) — RBAC: — (service)
- ⚫ `OvertimeAlert` (heures sup atteintes) — RBAC: 60 · 70 · 80 · 100
- ⚫ `TimeclockWeeklyReport` — RBAC: 80 · 100

## 🖼️ Écran 6.4 — Congés & absences (`/leaves`)

- ✅ `LeavesHeader` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `LeaveRequestForm` (employé) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `LeaveTypePicker` (CP/RTT/maladie/enfant malade) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `JustificatifUpload` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- 🔧 `LeavesApprovalQueue` (manager) — RBAC: 60 · 70 · 80 · 100
- 🔧 `LeavesCalendar` (vue équipe) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LeaveBalanceWidget` (compteur CP/RTT) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `AbsenceReplacementSuggestion` (qui remplacer) — RBAC: 60 · 70 · 80 · 100
- ⚫ `UnderStaffingAlertBanner` — RBAC: 60 · 70 · 80 · 100
- ⚫ `AbsenceStatsPerEmployee` (taux absentéisme) — RBAC: 80 · 100

## 🖼️ Écran 6.5 — Recrutement (`/recruitment`)

- ✅ `CandidatesList` — RBAC: 60 · 70 · 80 · 100
- ✅ `CandidateDetailModal` — RBAC: 60 · 70 · 80 · 100
- ✅ `CandidateCVUpload` — RBAC: 60 · 70 · 80 · 100
- ✅ `InterviewNotesEditor` — RBAC: 60 · 70 · 80 · 100
- ✅ `EvaluationScoreCard` — RBAC: 60 · 70 · 80 · 100
- 🔧 `PipelineKanban` — RBAC: 60 · 70 · 80 · 100
- ⚫ `JobPostingEditor` — RBAC: 80 · 100
- ⚫ `IndeedConnector` — RBAC: — (service)
- ⚫ `HelloWorkConnector` — RBAC: — (service)
- ⚫ `LinkedInJobsConnector` — RBAC: — (service)
- ⚫ `SchoolPartnersPortal` (écoles hôtelières) — RBAC: 80 · 100
- ⚫ `HireDecisionDialog` (embauche → génère contrat) — RBAC: 80 · 100
- ⚫ `RejectionEmailTemplate` — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 6.6 — Communication interne (nouveau)

- ⚫ `TeamChatInterface` (chat équipe temps réel) — RBAC: ∀
- ⚫ `AnnouncementBoard` (annonces manager → équipe) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AcknowledgmentTracker` (lu par tous) — RBAC: 60 · 70 · 80 · 100
- ⚫ `PollsCreator` (sondage équipe) — RBAC: 60 · 70 · 80 · 100
- ⚫ `EmployeeFeedbackInbox` — RBAC: 80 · 100

## 🖼️ Écran 6.7 — Paie (`/payroll`)

- 🔧 `PayrollDashboard` — RBAC: 80 · 100
- 🔧 `PayrollGenerationMonthWizard` — RBAC: 80 · 100
- 🔧 `TipDistributionPanel` (pool tips) — RBAC: 60 · 70 · 80 · 100
- 🔧 `PayfitConnector` — RBAC: — (service)
- 🔧 `SilaeConnector` — RBAC: — (service)
- ⚫ `PayslipViewer` (bulletin PDF) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100 (le sien)
- ⚫ `PayrollDsnGeneration` — RBAC: 80 · 100
- ⚫ `PayrollJournalPreview` (avant validation) — RBAC: 80 · 100
- ⚫ `PayrollAdjustmentDialog` (prime/retenue) — RBAC: 80 · 100

---

# 🖥️ Zone 7 — FINANCE & COMPTABILITÉ

## 🖼️ Écran 7.1 — Dashboard finance (`/finance`)

- ✅ `FinanceOverview` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > CaDay` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > CaMonth` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > GrossMargin` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > CashInDrawer` — RBAC: 60 · 70 · 80 · 100
- ✅ `RevenueChart` (line) — RBAC: 60 · 70 · 80 · 100
- ✅ `VATBreakdown` (ventilation 5.5/10/20) — RBAC: 60 · 70 · 80 · 100
- 🔧 `PeriodPicker` (day/week/month/year/custom) — RBAC: 60 · 70 · 80 · 100
- 🔧 `ComparisonToggle` (vs N-1) — RBAC: 60 · 70 · 80 · 100
- ⚫ `CashFlowForecast` (J+7/J+30) — RBAC: 80 · 100
- ⚫ `ChargesVsBudgetChart` — RBAC: 80 · 100
- ⚫ `AnomalyAlertsWidget` (CA en baisse anormale) — RBAC: 80 · 100
- ⚫ `EBITDACalculator` — RBAC: 80 · 100
- ⚫ `BreakEvenAnalysisChart` (seuil rentabilité) — RBAC: 80 · 100

## 🖼️ Écran 7.2 — Caisse (`/cash`)

- ✅ `CashDrawerOpenDialog` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `DenominationBreakdownInput` (billets/pièces) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `CashCountModal` (fermeture) — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `DiscrepancyDisplay` (écart) — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `CashMovementsLog` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ManualCashMovementDialog` (retrait/apport) — RBAC: 60 · 70 · 80 · 100
- ⚫ `SafeDepositTracker` (coffre) — RBAC: 80 · 100
- ⚫ `CashDropDialog` (dépôt banque) — RBAC: 60 · 70 · 80 · 100
- ⚫ `CashierPerformanceReport` (écarts par caissier) — RBAC: 80 · 100

## 🖼️ Écran 7.3 — Banque (`/finance/bank`)

- ✅ `BankAccountsList` — RBAC: 80 · 100
- ✅ `BankConnectionCard` — RBAC: 80 · 100
- ✅ `BankConnectionStatusBadge` — RBAC: 80 · 100
- ✅ `BankReconnectButton` (OAuth) — RBAC: 80 · 100
- ✅ `TransactionsList` — RBAC: 80 · 100
- ✅ `TransactionReconciliationRow` — RBAC: 80 · 100
- 🔧 `ReconciliationAssistant` (matching auto) — RBAC: 80 · 100
- ⚫ `MultiBankAccountToggle` — RBAC: 80 · 100
- ⚫ `BankConnectionExpiryAlert` — RBAC: 80 · 100
- ⚫ `TransactionCategorizationRules` — RBAC: 80 · 100
- ⚫ `BankStatementImportOFX` — RBAC: 80 · 100

## 🖼️ Écran 7.4 — NF525 & fiscal (`/nf525`)

- ✅ `TicketZViewer` — RBAC: 60 · 70 · 80 · 100
- ✅ `TicketZDailyList` — RBAC: 60 · 70 · 80 · 100
- ✅ `FiscalChainAudit` — RBAC: 80 · 100
- ✅ `SealChainVisualizer` (chaîne SHA-256) — RBAC: 80 · 100
- ✅ `FECExportDialog` — RBAC: 80 · 100
- ✅ `FECPeriodPicker` — RBAC: 80 · 100
- 🔧 `PennylaneSyncPanel` — RBAC: 80 · 100
- ⚫ `CegidExportPanel` — RBAC: 80 · 100
- ⚫ `Sage100ExportPanel` — RBAC: 80 · 100
- ⚫ `QuickBooksSyncPanel` — RBAC: 80 · 100
- ⚫ `NF525CertificateViewer` (attestation) — RBAC: 80 · 100
- ⚫ `AnnualFiscalReportPDF` — RBAC: 80 · 100
- ⚫ `TicketZReprintDialog` — RBAC: 80 · 100

## 🖼️ Écran 7.5 — Facturation (`/invoicing`)

- ✅ `InvoicesList` — RBAC: 60 · 70 · 80 · 100
- ✅ `InvoiceEditor` — RBAC: 60 · 70 · 80 · 100
- ✅ `InvoiceLinesGrid` — RBAC: 60 · 70 · 80 · 100
- ✅ `InvoiceLegalMentionsPreview` — RBAC: 60 · 70 · 80 · 100
- ✅ `InvoicePDFPreview` — RBAC: 60 · 70 · 80 · 100
- ✅ `EInvoicingPanel` — RBAC: 60 · 70 · 80 · 100
- ✅ `InboundInvoicesList` — RBAC: 60 · 70 · 80 · 100
- ✅ `OutboundInvoicesList` — RBAC: 60 · 70 · 80 · 100
- ✅ `LifecycleTracker` (émise→envoyée→reçue→validée→payée) — RBAC: 60 · 70 · 80 · 100
- ✅ `FormatSelector` (Factur-X/UBL/CII) — RBAC: 60 · 70 · 80 · 100
- 🔧 `ChorusProConnector` — RBAC: 80 · 100
- ⚫ `DunningQueue` (relances impayés) — RBAC: 60 · 70 · 80 · 100
- ⚫ `DunningTemplateEditor` (templates relance) — RBAC: 80 · 100
- ⚫ `CreditNoteGenerator` (avoir) — RBAC: 60 · 70 · 80 · 100
- ⚫ `RefundIssuanceDialog` — RBAC: 60 · 70 · 80 · 100
- ⚫ `PaymentReceivedNotifier` (marquer payée) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 7.6 — Comptabilité analytique (nouveau)

- ⚫ `CostCentersEditor` (centres de coûts) — RBAC: 80 · 100
- ⚫ `AnalyticalPnLReport` (P&L par centre) — RBAC: 80 · 100
- ⚫ `BudgetPlanningWizard` (budget annuel) — RBAC: 100
- ⚫ `BudgetVsActualChart` — RBAC: 80 · 100
- ⚫ `MonthlyClosureChecklist` (fermeture mois) — RBAC: 80 · 100
- ⚫ `ProvisionsAutoCalculator` (URSSAF/TVA/IS) — RBAC: 80 · 100

---

# 🖥️ Zone 8 — CONFORMITÉ & SÉCURITÉ

## 🖼️ Écran 8.1 — HACCP (`/haccp`)

- ✅ `HaccpDashboard` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `HaccpKPITiles` (temp OK, NC ouvertes, tâches à faire) — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `TemperatureLogForm` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `PhotoRequiredUploader` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TemperatureZonePicker` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `TemperatureHistoryChart` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `TemperatureThresholdConfig` — RBAC: 60 · 70 · 80 · 100
- 🔧 `IoTSensorsPanel` — RBAC: 60 · 70 · 80 · 100
- 🔧 `TestoSensorConnector` — RBAC: — (service)
- ⚫ `SwissAvantSensorConnector` — RBAC: — (service)
- ⚫ `SensorBatteryLowAlert` — RBAC: 60 · 70 · 80 · 100
- ⚫ `SensorCalibrationTracker` — RBAC: 60 · 70 · 80 · 100
- ✅ `NonConformityForm` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `NonConformityList` — RBAC: 40 · 60 · 70 · 80 · 100
- ✅ `NonConformityStatusChip` — RBAC: ∀
- ⚫ `NonConformityCloseDialog` — RBAC: 60 · 70 · 80 · 100
- ⚫ `RootCauseAnalysisEditor` — RBAC: 60 · 70 · 80 · 100
- ⚫ `CorrectiveActionTracker` — RBAC: 60 · 70 · 80 · 100
- ✅ `TracabiliteEtiquettes` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ✅ `EtiquetteEditor` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `EtiquettePrintQueue` — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ✅ `ReceptionMarchandises` (aussi zone 5) — RBAC: 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `HaccpMonthlyReport` — RBAC: 60 · 70 · 80 · 100
- ⚫ `HaccpAuditPrepDashboard` (avant contrôle DDCCRF) — RBAC: 80 · 100
- ⚫ `HaccpChecklistLibrary` — RBAC: 60 · 70 · 80 · 100
- ⚫ `HaccpTasksScheduler` (nettoyage, calibrage récurrents) — RBAC: 60 · 70 · 80 · 100
- ⚫ `HaccpTaskCard` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100

## 🖼️ Écran 8.2 — Allergènes (`/allergens`)

- ✅ `AllergenMatrix` — RBAC: 60 · 70 · 80 · 100
- ✅ `AllergenChecklistPerProduct` — RBAC: 60 · 70 · 80 · 100
- 🔧 `AllergenPublicSheet` (PDF vitrine) — RBAC: 60 · 70 · 80 · 100
- ⚫ `AllergenAlertConfig` (config alertes) — RBAC: 60 · 70 · 80 · 100
- ⚫ `CrossContaminationWarnings` — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 8.3 — RGPD (`/rgpd`)

- ✅ `TreatmentsRegister` — RBAC: 80 · 100
- ✅ `RightToBeForgottenModal` — RBAC: 80 · 100
- ✅ `DataExportRequestModal` — RBAC: 80 · 100
- ✅ `ConsentTrackerPerClient` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `CookieBannerConfig` — RBAC: 80 · 100
- ⚫ `GDPRRequestsInbox` (demandes clients) — RBAC: 80 · 100
- ⚫ `DPOContactPanel` — RBAC: 80 · 100
- ⚫ `DataBreachIncidentForm` (déclaration violation) — RBAC: 100
- ⚫ `PrivacyPolicyEditor` — RBAC: 100

## 🖼️ Écran 8.4 — Registre du personnel (`/hr/registry`)

- 🔧 `PersonnelRegistryView` — RBAC: 80 · 100
- 🔧 `PersonnelRegistryPDFExport` — RBAC: 80 · 100
- ⚫ `PersonnelRegistryChangesHistory` (immuable) — RBAC: 80 · 100

## 🖼️ Écran 8.5 — Audits externes (nouveau)

- ⚫ `ExternalAuditsPlanning` (calendrier audits DDCCRF/URSSAF) — RBAC: 80 · 100
- ⚫ `AuditDocumentsRepository` — RBAC: 80 · 100
- ⚫ `AuditReportUpload` — RBAC: 80 · 100
- ⚫ `ComplianceScoreDashboard` — RBAC: 80 · 100
- ⚫ `ISO22000PrepChecklist` (option premium) — RBAC: 80 · 100

---

# 🖥️ Zone 9 — FACILITY & MAINTENANCE

## 🖼️ Écran 9.1 — Équipements (nouveau `/equipments`)

- ⚫ `EquipmentsList` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `EquipmentCard` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `EquipmentDetail` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `EquipmentPhotoGallery` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `EquipmentWarrantyTracker` — RBAC: 80 · 100
- ⚫ `EquipmentQRCodeGenerator` (QR physique à coller) — RBAC: 60 · 70 · 80 · 100
- ⚫ `EquipmentSuppliersDirectory` — RBAC: 80 · 100
- ⚫ `EquipmentDocumentsUploader` (factures/garanties) — RBAC: 80 · 100
- ⚫ `MaintenanceScheduler` (préventive) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MaintenanceCalendar` — RBAC: 60 · 70 · 80 · 100
- 🔧 `MaintenanceRequestForm` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MaintenanceRequestsList` — RBAC: 60 · 70 · 80 · 100
- ⚫ `MaintenanceRequestDetail` (statut/photos/coût) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MaintenanceProviderContactPanel` — RBAC: 60 · 70 · 80 · 100
- ⚫ `PreventiveMaintenanceReminders` — RBAC: 60 · 70 · 80 · 100
- ⚫ `EquipmentCostHistoryChart` — RBAC: 80 · 100

## 🖼️ Écran 9.2 — Consommations (nouveau)

- ⚫ `EnergyDashboard` (Linky/Enedis) — RBAC: 80 · 100
- ⚫ `WaterConsumptionTracker` — RBAC: 80 · 100
- ⚫ `GasConsumptionTracker` — RBAC: 80 · 100
- ⚫ `EnergyAnomalyDetector` — RBAC: 80 · 100
- ⚫ `MonthlyEnergyReport` — RBAC: 80 · 100

## 🖼️ Écran 9.3 — Nettoyage (nouveau)

- ⚫ `CleaningSchedulesDashboard` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `CleaningChecklistTemplates` — RBAC: 60 · 70 · 80 · 100
- ⚫ `CleaningOpeningChecklist` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `CleaningClosingChecklist` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `PhotoProofRequired` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `CleaningComplianceScore` — RBAC: 60 · 70 · 80 · 100

---

# 🖥️ Zone 10 — ANALYTICS & BI

## 🖼️ Écran 10.1 — Dashboard direction (`/dashboard`)

- ✅ `KPIStripHeader` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > CaDay` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > CoverCount` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > AverageCheck` — RBAC: 60 · 70 · 80 · 100
- ✅ `KpiTile > GrossMargin` — RBAC: 80 · 100
- ✅ `RevenueEvolutionChart` (Area) — RBAC: 60 · 70 · 80 · 100
- ✅ `TopProductsChart` (Horizontal bar) — RBAC: 60 · 70 · 80 · 100
- 🔧 `OccupancyHeatmap` (jours × créneaux) — RBAC: 60 · 70 · 80 · 100
- 🔧 `StaffPerformancePanel` — RBAC: 60 · 70 · 80 · 100
- ⚫ `CategoryMixDoughnut` — RBAC: 60 · 70 · 80 · 100
- ⚫ `PaymentMethodsBreakdown` — RBAC: 60 · 70 · 80 · 100
- ⚫ `NewVsReturningCustomers` — RBAC: 60 · 70 · 80 · 100
- ⚫ `WasteRateWidget` — RBAC: 60 · 70 · 80 · 100
- ⚫ `AverageServiceTimeWidget` — RBAC: 60 · 70 · 80 · 100
- ⚫ `MultiEstablishmentToggle` (groupe) — RBAC: 80 · 100
- ⚫ `MultiEstablishmentComparison` — RBAC: 80 · 100
- ⚫ `GroupConsolidatedPnL` — RBAC: 80 · 100

## 🖼️ Écran 10.2 — Reports (`/reports`)

- 🔧 `ReportsCatalog` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ReportCard` (item catalogue) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ScheduledReportsSetup` — RBAC: 80 · 100
- ⚫ `DailyReportEmailAutoSender` — RBAC: — (service)
- ⚫ `MonthlyReportPDFBuilder` — RBAC: 80 · 100
- ⚫ `CustomReportBuilder` (drag & drop widgets) — RBAC: 80 · 100
- ⚫ `ReportSharingSettings` (envoyer au comptable) — RBAC: 80 · 100

## 🖼️ Écran 10.3 — Cohortes & rétention (nouveau)

- ⚫ `CohortsTable` (acquisition par mois × rétention M+1/M+3/M+6) — RBAC: 80 · 100
- ⚫ `RetentionCurveChart` — RBAC: 80 · 100
- ⚫ `ChurnAnalysisPanel` — RBAC: 80 · 100
- ⚫ `CLVBySegmentChart` — RBAC: 80 · 100

## 🖼️ Écran 10.4 — Analyse fréquentation (nouveau)

- ⚫ `HourlyOccupancyHeatmap` — RBAC: 60 · 70 · 80 · 100
- ⚫ `WeatherImpactChart` — RBAC: 60 · 70 · 80 · 100
- ⚫ `EventsImpactCorrelation` (match/concert) — RBAC: 60 · 70 · 80 · 100
- ⚫ `SeasonalityChart` (année N vs N-1) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 10.5 — Data exports (`/data`)

- ✅ `OrdersCSVExport` — RBAC: 80 · 100
- ✅ `ClientsCSVExport` — RBAC: 80 · 100
- 🔧 `InventoryCSVExport` — RBAC: 80 · 100
- ⚫ `GraphQLAPIExplorer` (BI externe Metabase) — RBAC: 80 · 100
- ⚫ `APIKeysManager` — RBAC: 100

---

# 🖥️ Zone 11 — INTELLIGENCE & IA (Oracle)

## 🖼️ Écran 11.1 — Oracle chat (`/intelligence`)

- 🔧 `OracleChatWindow` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `MessageThread` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `UserMessageBubble` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `AssistantMessageBubble` — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `MessageInput` (textarea + micro dictée) — RBAC: 40 · 60 · 70 · 80 · 100
- 🔧 `SourcesPanel` (citations) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `QuickSuggestionsBar` (prompts fréquents) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `ConversationsHistorySidebar` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `ConversationExportButton` (PDF/copy) — RBAC: 60 · 70 · 80 · 100
- ⚫ `VoiceInputController` (dictée vocale) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `ChatContextSelector` (scope : ventes / stocks / RH) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ChatFileUploader` (analyser doc uploadé) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 11.2 — Insights proactifs

- ⚫ `ProactiveInsightsPanel` (side dashboard) — RBAC: 60 · 70 · 80 · 100
- ⚫ `InsightCard` — RBAC: 60 · 70 · 80 · 100
- ⚫ `InsightDismissAction` — RBAC: 60 · 70 · 80 · 100
- ⚫ `InsightDeepDiveModal` — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 11.3 — Prédictions (nouveau)

- ⚫ `ForecastingDashboard` — RBAC: 60 · 70 · 80 · 100
- ⚫ `AttendanceForecastChart` (J+7) — RBAC: 60 · 70 · 80 · 100
- ⚫ `CategorySalesForecast` — RBAC: 60 · 70 · 80 · 100
- ⚫ `StockRuptureForecast` — RBAC: 60 · 70 · 80 · 100
- ⚫ `WeatherWidget` (impact météo) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MenuDaySuggestion` (IA suggère menu jour) — RBAC: 60 · 70 · 80 · 100
- ⚫ `ChurnRiskCustomersList` — RBAC: 60 · 70 · 80 · 100
- ⚫ `RelanceTargetingWizard` — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 11.4 — Détection anomalies (nouveau)

- 🔧 `AnomalyFeedDashboard` — RBAC: 80 · 100
- ⚫ `AnomalyCard` (IoT hors seuil, CA baisse, void abusifs) — RBAC: 80 · 100
- ⚫ `FraudDetectionAlerts` (annulations excessives) — RBAC: 80 · 100
- ⚫ `AnomalyRulesEditor` — RBAC: 100

## 🖼️ Écran 11.5 — Assistant vocal (nouveau)

- ⚫ `VoiceAssistantOverlay` (déjà scaffolded) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `VoicePushToTalkButton` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `VoiceCommandsDictionary` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `VoiceReceiverKitchen` (cuisine reçoit ordre vocal) — RBAC: 20 · 60 · 70 · 100

---

# 🖥️ Zone 12 — INTÉGRATIONS

## 🖼️ Écran 12.1 — Marketplace connecteurs (`/integrations`)

- 🔧 `ConnectorsMarketplace` — RBAC: 80 · 100
- 🔧 `ConnectorCategoryTabs` — RBAC: 80 · 100
- ✅ `ConnectorCard` — RBAC: 80 · 100
- ✅ `ConnectorStatusBadge` — RBAC: 80 · 100
- 🔧 `ConnectorSetupWizard` — RBAC: 80 · 100
- 🔧 `ConnectorOAuthStep` — RBAC: 80 · 100
- 🔧 `ConnectorConfigStep` — RBAC: 80 · 100
- 🔧 `ConnectorTestConnectionStep` — RBAC: 80 · 100
- 🔧 `ConnectorActivationStep` — RBAC: 80 · 100
- ⚫ `ConnectorHealthMonitor` — RBAC: 80 · 100
- ⚫ `ConnectorLogsViewer` — RBAC: 80 · 100
- ⚫ `ConnectorRetryFailedSync` — RBAC: 80 · 100
- ⚫ `ConnectorDisconnectDialog` — RBAC: 80 · 100
- ⚫ `WebhookBuilder` (créer webhook custom) — RBAC: 100
- ⚫ `APIKeysManager` — RBAC: 100
- ⚫ `SandboxModeToggle` (test connecteur) — RBAC: 80 · 100

## 🖼️ Écran 12.2 — Livraison / plateformes (nouveau)

- ⚫ `DeliveryOrdersInbox` (Deliveroo/UberEats commandes) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `DeliveryOrderCard` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `AcceptRejectDeliveryOrderButtons` — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `DeliveryPlatformStatusPanel` (temps livraison réel) — RBAC: 40 · 60 · 70 · 80 · 100
- ⚫ `DeliveryMenusSyncPanel` — RBAC: 60 · 70 · 80 · 100
- ⚫ `DeliveryCommissionsSummary` — RBAC: 80 · 100

---

# 🖥️ Zone 13 — PARAMÉTRAGE & ADMIN CLIENT

## 🖼️ Écran 13.1 — Paramètres généraux (`/settings`)

- ✅ `SettingsNavigation` — RBAC: 80 · 100
- ✅ `EstablishmentForm` — RBAC: 80 · 100
- ✅ `SiretAutoLookupInput` (INSEE) — RBAC: 80 · 100
- ✅ `OpeningHoursEditor` — RBAC: 80 · 100
- ✅ `HolidayCalendarEditor` — RBAC: 80 · 100
- ✅ `FiscalConfigPanel` — RBAC: 80 · 100
- ⚫ `SpecialEventsCalendar` (privatisations récurrentes) — RBAC: 80 · 100
- ⚫ `TimezoneSelector` — RBAC: 100
- ⚫ `LanguageDefaultPicker` — RBAC: 80 · 100
- ⚫ `CurrencyConfigPanel` (multi-devise groupes) — RBAC: 100

## 🖼️ Écran 13.2 — Apparence & branding

- ✅ `BrandingPanel` — RBAC: 80 · 100
- ✅ `LogoUploader` — RBAC: 80 · 100
- ✅ `ColorPicker > PrimaryColor` — RBAC: 80 · 100
- ✅ `ColorPicker > AccentColor` — RBAC: 80 · 100
- ✅ `ColorPicker > DarkBackgroundColor` — RBAC: 80 · 100
- ✅ `FontPicker > BrandFont` — RBAC: 80 · 100
- ✅ `FontPicker > UiFont` — RBAC: 80 · 100
- ✅ `LivePreviewPanel` (splash/POS/factures) — RBAC: 80 · 100
- ✅ `SplashScreenToggle` — RBAC: 80 · 100
- ✅ `BrandImportWizard` (extraction URL site) — RBAC: 80 · 100
- ⚫ `CustomCssEditor` (avancé — code CSS) — RBAC: 100
- ⚫ `EmailTemplatesEditor` — RBAC: 80 · 100
- ⚫ `PrintTemplatesEditor` (tickets/factures) — RBAC: 80 · 100
- ⚫ `WhiteLabelDomainWizard` (pos.monresto.fr) — RBAC: 100
- ⚫ `BrandGuidelinesExport` (PDF charte) — RBAC: 80 · 100

## 🖼️ Écran 13.3 — Utilisateurs & rôles

- ✅ `UsersList` — RBAC: 80 · 100
- ✅ `UserRow` — RBAC: 80 · 100
- ✅ `UserStatusBadge` — RBAC: 80 · 100
- ✅ `InviteUserDialog` — RBAC: 80 · 100
- ✅ `UserDeactivateDialog` — RBAC: 80 · 100
- ✅ `UserPinResetDialog` — RBAC: 80 · 100
- ✅ `RolesPermissionsPanel` — RBAC: 100
- ✅ `RolesList` — RBAC: 100
- ✅ `PermissionsMatrix` (rôles × actions) — RBAC: 100
- ✅ `RoleLabelsCustomizer` (renommer libellés) — RBAC: 100
- 🔧 `PermissionOverrideDialog` (autoriser action à un rôle) — RBAC: 100
- ⚫ `CustomRoleBuilder` (créer rôle sur-mesure) — RBAC: 100
- ⚫ `RoleClonerButton` — RBAC: 100
- ⚫ `RBACAuditTrail` (qui a changé quoi) — RBAC: 100
- ⚫ `RBACPresetTemplates` (bistrot/gastro/brasserie) — RBAC: 100
- ⚫ `AccessTestSimulator` ("Si je suis serveur, puis-je annuler ?") — RBAC: 80 · 100
- ⚫ `TwoFactorAuthConfig` (par utilisateur) — RBAC: 80 · 100

## 🖼️ Écran 13.4 — Notifications

- 🔧 `NotificationChannelsConfig` — RBAC: 80 · 100
- ✅ `PushSubscriptionManager` — RBAC: ∀
- 🔧 `NotificationRulesByRole` — RBAC: 80 · 100
- 🔧 `NotificationRulesByEvent` — RBAC: 80 · 100
- ⚫ `QuietHoursConfig` — RBAC: ∀
- ⚫ `NotificationHistoryLog` — RBAC: 80 · 100
- ⚫ `TestNotificationSender` — RBAC: 80 · 100
- ⚫ `SlackIntegrationConfig` — RBAC: 80 · 100
- ⚫ `TeamsIntegrationConfig` — RBAC: 80 · 100

## 🖼️ Écran 13.5 — Facturation SaaS (côté client)

- ✅ `SubscriptionSummary` — RBAC: 80 · 100
- ✅ `PlanBadge` — RBAC: 80 · 100
- ✅ `NextRenewalCard` — RBAC: 80 · 100
- ✅ `InvoicesHistory` — RBAC: 80 · 100
- ✅ `InvoiceDownloadButton` — RBAC: 80 · 100
- ⚫ `PlanChangeDialog` (upgrade/downgrade) — RBAC: 100
- ⚫ `StripePortalRedirect` — RBAC: 100
- ⚫ `SeatsUsageWidget` (X/Y utilisateurs) — RBAC: 80 · 100
- ⚫ `AddonsMarketplace` (fonctions premium) — RBAC: 100
- ⚫ `UsageAnalyticsPanel` (utilisation modules) — RBAC: 80 · 100

## 🖼️ Écran 13.6 — Multi-établissements (nouveau)

- ⚫ `EstablishmentsSwitcher` — RBAC: 80 · 100
- ⚫ `GroupConsolidatedDashboard` — RBAC: 100
- ⚫ `EstablishmentComparisonChart` — RBAC: 100
- ⚫ `SharedStaffPoolManager` (staff partagé) — RBAC: 100
- ⚫ `SharedSuppliersManager` — RBAC: 100
- ⚫ `IntercompanyTransfersLog` — RBAC: 100
- ⚫ `GroupBillingCentralization` — RBAC: 100
- ⚫ `HierarchicalRolesConfig` (directeur groupe > directeur étab) — RBAC: 100

---

# 🖥️ Zone 14 — MOBILE COMPANION (nouveau)

## 🖼️ Écran 14.1 — App staff (Expo)

- ⚫ `StaffMobileHome` (dashboard perso) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MyScheduleWeekView` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MyClockInWidget` (pointage NFC/QR) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MyTipsWidget` (pool + individuel) — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MyLeaveBalanceCard` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `MyPayslipsList` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `ShiftSwapRequestMobile` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `TeamChatMobile` — RBAC: ∀
- ⚫ `AnnouncementsInboxMobile` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100

## 🖼️ Écran 14.2 — App manager mobile

- ⚫ `ManagerMobileHome` (KPIs jour) — RBAC: 60 · 70 · 80 · 100
- ⚫ `LiveOccupancyWidget` — RBAC: 60 · 70 · 80 · 100
- ⚫ `NotificationsCenterMobile` — RBAC: 60 · 70 · 80 · 100
- ⚫ `AlertsInboxMobile` — RBAC: 60 · 70 · 80 · 100
- ⚫ `ApprovalsInboxMobile` (leaves/swaps) — RBAC: 60 · 70 · 80 · 100
- ⚫ `MobileVoidsAuthDialog` (autoriser void à distance) — RBAC: 60 · 70 · 80 · 100

## 🖼️ Écran 14.3 — App KDS tablette (Expo)

- ⚫ `KdsTabletApp` — RBAC: 20 · 60 · 70 · 100
- ⚫ `KdsTabletTicketCard` (optimisée touch) — RBAC: 20 · 60 · 70 · 100
- ⚫ `KdsSwipeGestures` (swipe → bump) — RBAC: 20 · 60 · 70 · 100
- ⚫ `KdsAudioAlertsNative` — RBAC: — (service)

## 🖼️ Écran 14.4 — App caisse iPad (Expo)

- ⚫ `PosIpadApp` — RBAC: 20 · 30 · 40 · 60 · 70 · 80 · 100
- ⚫ `PosIpadOfflineIndicator` — RBAC: ∀
- ⚫ `PosIpadPrinterBluetoothManager` — RBAC: — (service)
- ⚫ `PosIpadStripeReaderNative` — RBAC: — (service)

---

# 🖥️ Zone 15 — SITE WEB PUBLIC (nouveau)

## 🖼️ Écran 15.1 — Landing publique

- ⚫ `PublicLandingHero` — RBAC: — (public)
- ⚫ `PublicMenuPreview` — RBAC: — (public)
- ⚫ `PublicPhotosGallery` — RBAC: — (public)
- ⚫ `PublicReviewsWidget` — RBAC: — (public)
- ⚫ `PublicOpeningHoursWidget` — RBAC: — (public)
- ⚫ `PublicMapEmbed` — RBAC: — (public)
- ⚫ `PublicBookingCTA` — RBAC: — (public)
- ⚫ `PublicSocialMediaLinks` — RBAC: — (public)

## 🖼️ Écran 15.2 — Menu digital public

- ⚫ `PublicMenuHeader` — RBAC: — (public)
- ⚫ `PublicMenuCategoryNav` — RBAC: — (public)
- ⚫ `PublicMenuDishCard` — RBAC: — (public)
- ⚫ `PublicMenuAllergenFilter` — RBAC: — (public)
- ⚫ `PublicMenuDietaryFilter` — RBAC: — (public)
- ⚫ `PublicMenuLanguageSwitcher` — RBAC: — (public)
- ⚫ `PublicMenuAllergenDisclaimer` — RBAC: — (public)

## 🖼️ Écran 15.3 — Click & Collect public

- ⚫ `CollectMenuList` — RBAC: — (public)
- ⚫ `CollectCartDrawer` — RBAC: — (public)
- ⚫ `CollectSlotPicker` (créneaux retrait) — RBAC: — (public)
- ⚫ `CollectPaymentStripe` — RBAC: — (public)
- ⚫ `CollectConfirmationScreen` — RBAC: — (public)
- ⚫ `CollectStatusTracking` (préparation/prêt) — RBAC: — (public)

## 🖼️ Écran 15.4 — Gift cards public

- ⚫ `GiftCardPurchasePage` — RBAC: — (public)
- ⚫ `GiftCardAmountPicker` — RBAC: — (public)
- ⚫ `GiftCardRecipientForm` (email destinataire) — RBAC: — (public)
- ⚫ `GiftCardPaymentStripe` — RBAC: — (public)
- ⚫ `GiftCardDeliveryConfirmation` — RBAC: — (public)

---

# 🖥️ Zone 16 — TRANSVERSES / DESIGN SYSTEM

## 🧩 Layout & navigation

- ✅ `PageLayout` — RBAC: — (structural)
- ✅ `PageHeader` — RBAC: — (structural)
- ✅ `DashboardLayout` — RBAC: — (structural)
- ✅ `SplitLayout` — RBAC: — (structural)
- ✅ `GridLayout` — RBAC: — (structural)
- ✅ `Sidebar` — RBAC: — (structural)
- ✅ `DesktopSidebar` — RBAC: — (structural)
- ✅ `DesktopTopbar` — RBAC: — (structural)
- ✅ `SidebarBranding` — RBAC: — (structural)
- ✅ `SidebarNavigation` — RBAC: filtré par level user
- ✅ `SidebarQuickActions` — RBAC: filtré par level user
- ✅ `SidebarProfile` — RBAC: ∀
- ✅ `MobileHeader` — RBAC: — (structural)
- ✅ `MobileNavBar` — RBAC: — (structural)
- ✅ `Header` — RBAC: — (structural)

## 🧩 Overlays

- ✅ `Modal` — RBAC: — (structural)
- ✅ `Dialog` — RBAC: — (structural)
- ✅ `BottomSheet` (drawer mobile) — RBAC: — (structural)
- ✅ `Toast` — RBAC: — (structural)
- ✅ `NotificationPanel` — RBAC: ∀
- ✅ `CommandModal` (Cmd+K) — RBAC: ∀
- ✅ `TutorialOverlay` — RBAC: ∀
- ✅ `TutorialBubble` — RBAC: ∀
- ✅ `TrainingOverlay` — RBAC: ∀

## 🧩 États

- ✅ `EmptyState` — RBAC: — (structural)
- ✅ `Skeleton` — RBAC: — (structural)
- ✅ `LoadingState` — RBAC: — (structural)
- ✅ `Spinner` — RBAC: — (structural)
- ✅ `ErrorBoundary` — RBAC: — (structural)
- ⚫ `NetworkOfflineState` (message pas de réseau) — RBAC: ∀

## 🧩 Data display

- ✅ `StatCard` — RBAC: dépend du contenu
- ✅ `PremiumCard` — RBAC: dépend du contenu
- ✅ `GlassCard` — RBAC: dépend du contenu
- ✅ `ContentSection` — RBAC: — (structural)
- ✅ `SectionHeader` — RBAC: — (structural)
- ✅ `PageHeaderWithDocs` — RBAC: — (structural)
- ✅ `StatusBadge` — RBAC: ∀
- ✅ `Chip` — RBAC: ∀
- ✅ `Badge` — RBAC: ∀
- ✅ `Avatar` — RBAC: ∀

## 🧩 Forms

- ✅ `Input` — RBAC: — (structural)
- ✅ `Select` — RBAC: — (structural)
- ✅ `PremiumSelect` — RBAC: — (structural)
- ✅ `SearchInput` — RBAC: — (structural)
- ✅ `QuantitySelector` — RBAC: — (structural)
- ✅ `DateNavigator` — RBAC: — (structural)
- ✅ `TimePicker` — RBAC: — (structural)
- ✅ `FilterBar` — RBAC: — (structural)
- ✅ `ToolbarTabs` — RBAC: — (structural)
- ✅ `Button` — RBAC: — (structural)
- ✅ `ActionToolbar` — RBAC: — (structural)
- ✅ `Feedback` (like/dislike) — RBAC: ∀
- ⚫ `AutocompleteInput` (générique) — RBAC: — (structural)
- ⚫ `RichTextEditor` (générique) — RBAC: — (structural)
- ⚫ `MultiFileUploader` — RBAC: — (structural)

## 🧩 Sécurité & sessions

- ✅ `SovereignShield` — RBAC: — (service)
- ✅ `SovereignLock` — RBAC: — (service)
- ✅ `SovereignLockout` — RBAC: — (service)
- ✅ `SecurityPinModal` — RBAC: — (auth)
- ✅ `ImpersonationBanner` — RBAC: — (superadmin)
- ✅ `ConnectivityBanner` — RBAC: ∀
- ✅ `AlertSync` (sync IoT) — RBAC: — (service)
- ✅ `NeuralShield` — RBAC: — (service)

## 🧩 Branding

- ✅ `SplashScreen` — RBAC: ∀
- ✅ `SplashGate` — RBAC: — (service)
- ✅ `ThemeApplicator` — RBAC: — (service)
- ⚫ `LogoRenderer` (générique svg/png) — RBAC: — (structural)

## 🧩 Launchpad

- ✅ `AppLaunchpad` — RBAC: filtré par level
- ✅ `LaunchpadStatusHub` — RBAC: filtré par level
- ✅ `GlobalFAB` — RBAC: filtré par level

## 🧩 Media

- ✅ `CameraCapture` — RBAC: — (structural)
- ✅ `VisionScanner` — RBAC: — (service IA)
- ✅ `AmbientAudio` — RBAC: — (service)
- ⚫ `AudioRecorder` (dictée) — RBAC: — (structural)
- ⚫ `VideoPlayer` (tutos in-app) — RBAC: — (structural)

## 🧩 Charts (Recharts)

- ⚫ `LineChartComponent` — RBAC: — (structural)
- ⚫ `BarChartComponent` — RBAC: — (structural)
- ⚫ `AreaChartComponent` — RBAC: — (structural)
- ⚫ `PieChartComponent` — RBAC: — (structural)
- ⚫ `HeatmapComponent` — RBAC: — (structural)
- ⚫ `SparklineComponent` — RBAC: — (structural)
- ⚫ `RadarChartComponent` — RBAC: — (structural)

## 🧩 Fleet (superadmin MCC)

- ✅ `FleetContext` — RBAC: 100 (super admin)
- ✅ `AppLaunchpad` (variante MCC) — RBAC: 100
- ✅ `DocumentationPortal` — RBAC: 100

---

# 📊 Statistiques composants restaurant

| Zone | Écrans | ✅ | 🔧 | ⚫ | Total |
|------|:------:|:--:|:--:|:-:|:-----:|
| 1. Service (POS/KDS/Floor/Bar/Mobile) | 5 | 42 | 8 | 47 | **97** |
| 2. Réservations & Accueil | 2 | 20 | 8 | 25 | **53** |
| 3. Menu & Catalogue | 5 | 24 | 5 | 30 | **59** |
| 4. Clients & Fidélité | 5 | 21 | 5 | 45 | **71** |
| 5. Stock & Approvisionnement | 4 | 24 | 6 | 30 | **60** |
| 6. RH | 7 | 24 | 12 | 45 | **81** |
| 7. Finance | 6 | 30 | 5 | 33 | **68** |
| 8. Conformité | 5 | 15 | 3 | 25 | **43** |
| 9. Facility | 3 | 0 | 1 | 26 | **27** |
| 10. Analytics & BI | 5 | 5 | 3 | 30 | **38** |
| 11. Intelligence & IA | 5 | 0 | 6 | 26 | **32** |
| 12. Intégrations | 2 | 2 | 6 | 14 | **22** |
| 13. Paramétrage | 6 | 25 | 4 | 24 | **53** |
| 14. Mobile companion | 4 | 0 | 0 | 21 | **21** |
| 15. Site web public | 4 | 0 | 0 | 24 | **24** |
| 16. Transverses (design system) | — | 45 | 0 | 12 | **57** |
| **TOTAL** | **68 écrans** | **277** | **72** | **457** | **806** |

---

# 🎯 Priorités refonte UI par tranche

## 🚨 Tranche 1 — CRITIQUES avant refonte (bloquants métier)

1. ⚫ **`WelcomeGuestButton`** (bus R2 — allergènes) — RBAC: 20+
2. ⚫ **`AllergenAlertBanner`** (POS) — RBAC: ∀
3. ⚫ **`AgeVerificationModal`** — RBAC: 60+
4. 🔧 **`PhysicalInventoryWizard`** (inventaires physiques) — RBAC: 40+
5. ⚫ **`CashFlowForecast`** — RBAC: 80+
6. ⚫ **`WasteRecordingForm`** — RBAC: 20+

## 🎨 Tranche 2 — À polir pendant la refonte

1. `GuestGroupingPanel` (POS — siège 1/2/3)
2. `ViewByPlateToggle` (KDS)
3. `CRMDetailView > CommunicationsTab`
4. `CustomRoleBuilder` (settings RBAC)
5. `AutomationsPanel` (marketing workflows)
6. `ExpiryDashboard` (DLC alertes)

## 🆕 Tranche 3 — Nouveaux modules refonte

1. **Zone 11 IA** : `OracleChatWindow` + `ProactiveInsightsPanel` + `ForecastingDashboard`
2. **Zone 12 Livraison** : `DeliveryOrdersInbox` + Deliveroo/UberEats connecteurs
3. **Zone 14 Mobile** : app Expo staff + manager + KDS tablette
4. **Zone 15 Public** : landing + menu digital + click & collect

## 🏗️ Tranche 4 — Extensions groupe (multi-établissements)

1. Zone 13.6 — `EstablishmentsSwitcher` + `GroupConsolidatedDashboard`
2. `SharedStaffPoolManager` · `SharedSuppliersManager`
3. `HierarchicalRolesConfig`

---

## 🎨 Principes UX pour la refonte

### Cohérence design tokens
- Toutes les couleurs via `var(--surface-*)`, `var(--action-*)`, `var(--text-*)`
- Dark mode via `[data-theme="dark"]` + `prefers-color-scheme`
- Fonts `next/font/google` (Inter + Cormorant + JetBrains Mono)
- Framer Motion pour animations riches, CSS pour micro-transitions

### Priorités device
1. **iPad landscape** — cible principale (POS, KDS, plan de salle, réservations)
2. **Desktop 1440+** — cible secondaire (analytics, admin, RH, compta)
3. **Mobile 375+** — cible tertiaire (dashboards, notifications, staff app)
4. **TV 32-55"** — cible KDS uniquement

### Ergonomie tactile
- Touch target min 44×44 pt
- Gestures : swipe (delete/mark), long-press (recall), pinch (zoom)
- Feedback haptique iOS via Web Vibration API
- Support bump bar physique USB (KDS)

### Accessibilité WCAG 2.1 AA
- Contraste ≥ 4.5:1 texte / fond
- Navigation clavier complète (Tab / Enter / Esc)
- Aria-labels sur tous les composants interactifs
- Support VoiceOver / TalkBack (mobile companion)
- Respect `prefers-reduced-motion`

### RBAC visuel
- Composants non-accessibles masqués (pas grisés)
- Actions non-autorisées : bouton absent (pas d'error message)
- Sauf actions rares : bouton avec badge cadenas + tooltip "Requiert manager"
