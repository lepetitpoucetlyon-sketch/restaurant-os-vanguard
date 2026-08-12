# Plan d'Implémentation UI — Restaurant OS Core
> Audit ultra-complet · Généré le 2026-08-09
> **Objectif** : connecter chaque feature backend à une surface client visible.

---

## ÉTAT DES LIEUX — RÉSUMÉ EXÉCUTIF

| Catégorie | Dénombrement |
|-----------|-------------|
| Composants TSX construits mais jamais affichés | **127 composants** |
| Pages existant hors navConfig (inaccessibles) | **13 routes** |
| Pages partiellement câblées (fonctions cachées) | **11 pages** |
| Handlers d'événements sans feedback UI | **165 handlers** |
| Engines métier sans écran | **31 engines** |
| Cron jobs sans monitoring UI | **15 jobs** |
| Verticales SaaS sans route Next.js | **7 verticales** |

---

## PARTIE 1 — PAGES EXISTANTES MAIS SOUS-EXPLOITÉES

Ces pages sont dans la nav et se chargent, mais n'exposent qu'une fraction des composants construits.

---

### 1.1 HACCP / Qualité (`/haccp`)

**Ce qui est affiché aujourd'hui** (9 onglets) :
- ReleveTemperatures, GestionHuiles, PlanNettoyage, GestionAnomalies
- ProductControlList, SanitaryReport, CleaningPlan, DLCTracker, NonConformityForm

**Ce qui est construit mais invisible** :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `TracabiliteEtiquettes` | `qualite/haccp/components/TracabiliteEtiquettes.tsx` | Impression étiquettes DLC directement depuis HACCP |
| `WasteManagementHACCP` | `qualite/haccp/components/WasteManagementHACCP.tsx` | Tableau de bord gaspillage alimentaire (AGEC) |
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
| `QualityDashboardHeader` | `qualite/haccp/components/quality/QualityDashboardHeader.tsx` | Header dashboard qualité avec KPIs |
| `ReceptionMarchandises` | `qualite/haccp/components/quality/ReceptionMarchandises.tsx` | Wizard réception marchandises complet |
| `ReceptionSummary` | `qualite/haccp/components/quality/ReceptionSummary.tsx` | Récap réception (scores, alertes) |
| `ReceptionWizard` | `qualite/haccp/components/quality/ReceptionWizard.tsx` | Wizard étape-par-étape réception |
| `SupplierAuditForm` | `qualite/haccp/components/quality/SupplierAuditForm.tsx` | Audit fournisseur complet |
| `TemperatureCard` | `qualite/haccp/components/quality/TemperatureCard.tsx` | Carte température sonde IoT |
| `TemperatureGauge` | `qualite/haccp/components/quality/TemperatureGauge.tsx` | Jauge température visuelle |
| `TraceabilityLog` | `qualite/haccp/components/quality/TraceabilityLog.tsx` | Journal traçabilité lot → assiette |
| `VisualCheckGrid` | `qualite/haccp/components/quality/VisualCheckGrid.tsx` | Grille de contrôle visuel (photos) |
| `VisualInspection` | `qualite/haccp/components/quality/VisualInspection.tsx` | Module inspection visuelle avec IA |
| `ComplianceCalendar` | `qualite/calendar/ComplianceCalendar.tsx` | Calendrier plannings conformité |
| `RecallView` | `qualite/recall/RecallView.tsx` | Vue rappels produits (DGCCRF) |
| `ElevationPrompt` | `securite/audit/ElevationPrompt.tsx` | Demande élévation de droits contextuelle |
| `OverrideLogView` | `securite/audit/OverrideLogView.tsx` | Journal des overrides sécurité |

**Plan d'action HACCP** → voir Partie 3, Sprint 1.

---

### 1.2 Plan de Salle (`/floor-plan`)

**Ce qui est affiché** : FloorPlanEditor de base (drag tables)

**Ce qui est construit mais invisible** :

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
| `ZoneService` | `facility/spaces/settings/ZoneService.tsx` | CRUD zones (pas un composant React, service) |
| `useFloorPlan` | `facility/spaces/hooks/useFloorPlan.tsx` | Hook état plan de salle (sélection, drag) |

---

### 1.3 Réservations (`/reservations`)

**Ce qui est affiché** : calendrier principal + liste réservations

**Ce qui est construit mais invisible** :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `CustomerListView` | `commerce/relation/reservations/components/CustomerListView.tsx` | Vue clients avec historique réservations |
| `FloorPlanView` | `commerce/relation/reservations/components/FloorPlanView.tsx` | Plan de salle dans réservations (placement) |
| `NewReservationDialog` | `commerce/relation/reservations/components/NewReservationDialog.tsx` | Dialog création réservation complète |
| `ReservationCalendarPopup` | `commerce/relation/reservations/components/ReservationCalendarPopup.tsx` | Popover calendrier inline |
| `ReservationToolbar` | `commerce/relation/reservations/components/ReservationToolbar.tsx` | Barre d'outils filtres/actions |
| Event Quote sections | `reservations/event-quote/` (3 sections) | Devis événements privatisation |
| Settings sections | `reservations/settings/` (4 sections) | Config rappels, canaux, politiques |

---

### 1.4 Finance (`/finance`)

**Ce qui est affiché** : 5 onglets (Comptabilité, Facturation, Banque, Trésorerie, Audit)

**Ce qui est construit mais invisible dans les onglets** :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `BalanceSheetView` | `finance/components/accounting/views/BalanceSheetView.tsx` | Bilan comptable (Actif/Passif) |
| `GeneralLedgerView` | `finance/components/accounting/views/GeneralLedgerView.tsx` | Grand-livre comptable |
| `JournalEntriesView` | `finance/components/accounting/views/JournalEntriesView.tsx` | Vue journal comptable filtrée |
| `ProfitLossView` | `finance/components/accounting/views/ProfitLossView.tsx` | Compte de résultat |
| `FiscalAuditView` | `finance/components/accounting/FiscalAuditView.tsx` | Vue audit fiscal NF525 détaillé |
| `TreasuryDashboard` | `finance/components/accounting/TreasuryDashboard.tsx` | Dashboard trésorerie (flux, prévisions) |
| `ExpenseClaimDialog` | `finance/components/accounting/ExpenseClaimDialog.tsx` | Note de frais (accessible via bouton) |
| `FacturXDownloadButton` | `finance/components/FacturXDownloadButton.tsx` | Téléchargement Factur-X (XML structuré) |
| `NexusFiscalProvider` | `finance/providers/NexusFiscalProvider.tsx` | Context fiscal (non monté dans l'arbre) |

**Note** : `AccountingTab`, `BillingTab`, `AuditTab`, `BankTab` sont chargés dynamiquement depuis `FinanceDashboard.tsx` — ils sont techniquement connectés mais leurs sous-vues internes (`BalanceSheetView`, etc.) ne sont pas câblées.

---

### 1.5 Cuisine / KDS (`/kds` + `/kitchen`)

**Ce qui est affiché** : `KDSDashboard` + `KitchenDashboard` (état actuel des commandes)

**Ce qui est construit mais invisible** :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `KDSEmptyState` | `ops/production/kds/components/KDSEmptyState.tsx` | État vide KDS (ticket d'attente 0) |
| `KDSHeader` | `ops/production/kds/components/KDSHeader.tsx` | Header KDS avec compteurs |
| `KDSTicket` | `ops/production/kds/components/KDSTicket.tsx` | Ticket commande KDS (remplace le card actuel) |
| `KDSContextDrawer` | `ops/production/kds/components/kds-ticket/KDSContextDrawer.tsx` | Drawer contexte commande (historique table) |
| `KDSItemCard` | `ops/production/kds/components/kds-ticket/KDSItemCard.tsx` | Carte item KDS (avec modifs, allergènes) |
| `KDSSortableItem` | `ops/production/kds/components/kds-ticket/KDSSortableItem.tsx` | Item drag-to-reorder (DnD Kit) |
| `ModificationAlerts` | `ops/production/kitchen/components/ModificationAlerts.tsx` | Alertes modifications commande en cours |
| `PlateAuditWizard` | `ops/production/kitchen/components/PlateAuditWizard.tsx` | Wizard audit assiette (photo + IA) |
| `PrepTaskDetailDialog` | `ops/production/kitchen/components/PrepTaskDetailDialog.tsx` | Détail tâche de préparation |
| `RecipeTechnicalSheet` | `ops/production/kitchen/components/RecipeTechnicalSheet.tsx` | Fiche technique recette (impression) |
| `RecipeAnalyticTab` | `ops/production/kitchen/components/recipe-editor/RecipeAnalyticTab.tsx` | Analytics recette (marge, popularité) |
| `RecipeBasicsTab` | `ops/production/kitchen/components/recipe-editor/RecipeBasicsTab.tsx` | Infos de base recette |
| `RecipeCompositionTab` | `ops/production/kitchen/components/recipe-editor/RecipeCompositionTab.tsx` | Composition ingrédients |
| `RecipeProtocolTab` | `ops/production/kitchen/components/recipe-editor/RecipeProtocolTab.tsx` | Protocole préparation étape-par-étape |
| `AllergensTab` | `ops/production/kitchen/components/tabs/AllergensTab.tsx` | Gestionnaire allergènes recette |
| `CookingTimesTab` | `ops/production/kitchen/components/tabs/CookingTimesTab.tsx` | Temps de cuisson par poste |
| `IngredientsTab` | `ops/production/kitchen/components/tabs/IngredientsTab.tsx` | Liste ingrédients avec coûts |
| `MarginsTab` | `ops/production/kitchen/components/tabs/MarginsTab.tsx` | Analyse marge recette |
| `MiseEnPlaceTab` | `ops/production/kitchen/components/tabs/MiseEnPlaceTab.tsx` | Planning mise en place |
| `RecipesTab` | `ops/production/kitchen/components/tabs/RecipesTab.tsx` | Liste recettes du poste |
| `SuppliersTab` | `ops/production/kitchen/components/tabs/SuppliersTab.tsx` | Fournisseurs par ingrédient |
| `WasteTab` | `ops/production/kitchen/components/tabs/WasteTab.tsx` | Gaspillage par recette |
| `BarRecipeCard` | `ops/production/recipes/BarRecipeCard.tsx` | Carte recette bar (cocktail) |
| `DailyPrepList` | `ops/production/recipes/DailyPrepList.tsx` | Liste prépa quotidienne |
| `RecipeCostBadge` | `ops/production/recipes/RecipeCostBadge.tsx` | Badge coût matière recette |

---

### 1.6 POS (`/pos`)

**Ce qui est affiché** : grille produits, panier, paiement, tables

**Ce qui est construit mais invisible** :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `CashCounterModal` | `ops/service/pos/components/CashCounterModal.tsx` | Comptage caisse (espèces) |
| `CategoryList` | `ops/service/pos/components/CategoryList.tsx` | Liste catégories sidebar (alternative à la grille) |
| `ProductDetailsDialog` | `ops/service/pos/components/ProductDetailsDialog.tsx` | Détail produit (photo, allergènes, modifs) |
| `ProductBarFields` | `ops/service/pos/components/product-form/ProductBarFields.tsx` | Champs bar (alcool, température) |
| `ProductBasicDetails` | `ops/service/pos/components/product-form/ProductBasicDetails.tsx` | Détails de base produit (édition) |
| `ProductFinancials` | `ops/service/pos/components/product-form/ProductFinancials.tsx` | Prix, TVA, coût matière |
| `ProductIngredients` | `ops/service/pos/components/product-form/ProductIngredients.tsx` | Ingrédients produit (lien recette) |
| `ProductSteps` | `ops/service/pos/components/product-form/ProductSteps.tsx` | Étapes de préparation produit |

---

### 1.7 Intelligence / Analytics (`/intelligence` + `/analytics`)

**Ce qui est affiché** : dashboards analytics de base

**Ce qui est construit mais invisible** :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `OracleChatDrawer` | `intelligence/analytique/analytics/components/OracleChatDrawer.tsx` | Chat IA Oracle (questions NL sur les données) |
| `OraclePredictor` | `intelligence/analytique/analytics/components/OraclePredictor.tsx` | Prédictions IA (CA, fréquentation) |
| `DirectorFlashReport` | `intelligence/analytique/components/DirectorFlashReport.tsx` | Flash report directeur (quotidien, hebdo) |
| `ConnectorCard` | `intelligence/connectors/hub/components/ConnectorCard.tsx` | Carte connecteur (état, sync) |
| `ConnectorConfigModal` | `intelligence/connectors/hub/components/ConnectorConfigModal.tsx` | Configuration connecteur tiers |
| `ConnectorStatusBadge` | `intelligence/connectors/hub/components/ConnectorStatusBadge.tsx` | Badge statut connecteur |
| `AIStatusBanner` | `intelligence/ia/resilience/AIStatusBanner.tsx` | Bannière statut IA (dégradé/ok) |
| `NexusFleetProvider` | `intelligence/ia/fleet/NexusFleetProvider.tsx` | Provider flotte agents IA |

---

### 1.8 Inventaire / Logistique (`/inventory`)

**Ce qui est affiché** : liste stocks, alertes DLC, réceptions

**Ce qui est construit mais invisible** :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `InventoryInlineModals` | `logistics/stock/inventory/components/InventoryInlineModals.tsx` | Modals inline (ajustement, mouvement) |
| `InvoiceReviewModal` | `logistics/stock/inventory/components/inventory/InvoiceReviewModal.tsx` | Révision facture fournisseur (OCR) |
| `DraggableIngredient` | `logistics/stock/inventory/components/storage-map/DraggableIngredient.tsx` | Drag ingrédient dans carte de stockage |
| `DraggingIngredientOverlay` | `logistics/stock/inventory/components/storage-map/DraggingIngredientOverlay.tsx` | Overlay drag-over (DnD) |
| `DroppableStorageCard` | `logistics/stock/inventory/components/storage-map/DroppableStorageCard.tsx` | Zone de stockage droppable |
| `StorageDetailBubble` | `logistics/stock/inventory/components/storage-map/StorageDetailBubble.tsx` | Bulle détail zone de stockage |
| `SupplierProductAutocomplete` | `logistics/connectors/suppliers/SupplierProductAutocomplete.tsx` | Autocomplétion produits fournisseurs |

---

### 1.9 RH / Staff (`/staff`)

**Ce qui est affiché** : 4 onglets (équipe, planning, congés, recrutement)

**Ce qui est construit mais invisible** :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `PaySlipViewer` | `human/effectifs/hr/components/PaySlipViewer.tsx` | Visualiseur fiches de paie |
| `StaffPortal` | `human/effectifs/hr/components/StaffPortal.tsx` | Portail self-service employé |
| `ShiftEditModal` | `human/effectifs/hr/components/planning/ShiftEditModal.tsx` | Modal édition shift planning |
| `CandidateModal` | `human/effectifs/hr/components/staff/CandidateModal.tsx` | Fiche candidat recrutement |
| `StaffAuditLog` | `human/effectifs/hr/components/staff/StaffAuditLog.tsx` | Journal audit actions staff |

---

### 1.10 Marketing (`/marketing`)

**Ce qui est affiché** : onglets campagnes, SEO, devis

**Ce qui est construit mais invisible** :

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
| `GoogleProfileCard` | `commerce/acquisition/seo/GoogleProfileCard.tsx` | Fiche Google Business Profile |
| `KeywordsCard` | `commerce/acquisition/seo/KeywordsCard.tsx` | Carte mots-clés SEO |
| `PageCard` | `commerce/acquisition/seo/PageCard.tsx` | Carte page (score SEO, actions) |
| `ScoreGauge` | `commerce/acquisition/seo/ScoreGauge.tsx` | Jauge score SEO global |

---

### 1.11 Onboarding / Migration (`/onboarding` + `/migration`)

**Ce qui est affiché** : pages stub

**Ce qui est construit mais invisible** :

| Composant | Fichier | Valeur métier |
|-----------|---------|---------------|
| `ExportGuidePanel` | `commerce/onboarding/ExportGuidePanel.tsx` | Guide export données ancien système |
| `CSVTemplateDownloads` | `commerce/onboarding/CSVTemplateDownloads.tsx` | Téléchargement templates CSV import |
| `FECImportPanel` | `commerce/onboarding/FECImportPanel.tsx` | Import FEC (Fichier Écritures Comptables) |
| `FloorPlanSetupWizard` | `commerce/onboarding/FloorPlanSetupWizard.tsx` | Wizard configuration plan de salle |
| `OnboardingProgress` | `commerce/onboarding/OnboardingProgress.tsx` | Barre progression onboarding |
| `UniversalImportDropzone` | `commerce/onboarding/UniversalImportDropzone.tsx` | Zone drag-drop import universel |
| `BatchTableForm` | `commerce/onboarding/BatchTableForm.tsx` | Formulaire création tables en lot |
| `ConnectorOAuthPanel` | `commerce/onboarding/ConnectorOAuthPanel.tsx` | Panel OAuth connecteurs tiers |
| `ImportCategoryPanel` | `commerce/onboarding/ImportCategoryPanel.tsx` | Panel import catégories |
| `OCRUploadZone` | `commerce/onboarding/OCRUploadZone.tsx` | Zone upload OCR (menus, fiches) |
| `OnboardingHelpButton` | `commerce/onboarding/OnboardingHelpButton.tsx` | Bouton aide contextuelle onboarding |
| `PreviewTable` | `commerce/onboarding/PreviewTable.tsx` | Tableau prévisualisation import |
| `ProgressStepper` | `commerce/onboarding/ProgressStepper.tsx` | Stepper étapes onboarding |
| `SimpleFloorPlanEditor` | `commerce/onboarding/SimpleFloorPlanEditor.tsx` | Éditeur plan simplifié pour onboarding |
| `SourceSystemSelector` | `commerce/onboarding/SourceSystemSelector.tsx` | Sélecteur système source (Lightspeed, Zelty…) |

---

## PARTIE 2 — ROUTES HORS NAVIGATION (PAGES INACCESSIBLES)

Ces pages existent dans Next.js mais n'ont aucune entrée dans `navConfig.ts` — elles sont donc inaccessibles sans URL directe.

| Route | Status | Composants clés |
|-------|--------|-----------------|
| `/nf525` | 🔴 Inaccessible | Audit NF525, export archive fiscale |
| `/vanguard-simulator` | 🔴 Inaccessible | Simulateur tests fiscaux / démo |
| `/pos-mobile` | 🔴 Inaccessible | POS mobile waiter (PWA) |
| `/mon-espace` | 🔴 Inaccessible | Espace self-service employé |
| `/aide` | 🔴 Inaccessible | Page aide / documentation in-app |
| `/migration` | 🔴 Inaccessible | Migration données (wizard complet construit) |
| `/menu-engineering` | 🔴 Inaccessible | Menu engineering (popularité × marge) |
| `/timeclock` | 🔴 Inaccessible | Pointage horodaté (badgeuse) |
| `/onboarding` | 🔴 Inaccessible | Wizard onboarding nouveau restaurant |
| `/landing` | 🔴 Inaccessible | Landing page tenant publique |
| `/planning` | ⚠️ Accessible via `/staff?tab=planning` | Pas de route directe |
| `/leaves` | ⚠️ Accessible via `/staff?tab=leaves` | Pas de route directe |
| `/recruitment` | ⚠️ Accessible via `/staff?tab=recruitment` | Pas de route directe |

---

## PARTIE 3 — SERVICES BACKEND SANS SURFACE UI

### 3.1 Event Bus (165 handlers silencieux)

**Aucun handler n'a de feedback visuel en production.** Tous opèrent silencieusement. Les plus critiques à exposer :

| Handler | Événement | UI manquante |
|---------|-----------|--------------|
| `DLQQuarantineAlertHandler` | `DLQ_QUARANTINE` | Toast + badge rouge dans header |
| `OvertimeAlertHandler` | `OVERTIME_ALERT` | Notification RH en temps réel |
| `NoShowCRMHandler` | `NO_SHOW` | Action CRM suggérée (SMS automatique ?) |
| `NoShowHandler` | `NO_SHOW` | Libération table + alerte |
| `CryptoIntegrityHandler` | `NF525_BREACH` | Alerte critique dashboard admin |
| `TicketZHandler` | `TICKET_Z` | Confirmation clôture Z |
| `OutboxProcessor` | (tous) | Monitoring Outbox (messages en attente) |

### 3.2 Engines Métier (31 engines sans écran)

| Engine | Module | UI manquante |
|--------|--------|--------------|
| `ReservationEngine` | commerce/relation | Visualisation état machine réservation |
| `LoyaltyEngine` | commerce/fidelite | Tableau de bord points fidélité client |
| `QuoteEngine` | commerce/fidelite | Suivi devis (envoyé / accepté / converti) |
| `PricingEngine` | commerce/relation | Règles de prix dynamique |
| `RecipeEngine` | ops/production | Coût matière live (recette ↔ stock) |
| `MenuEngineeringEngine` | ops/production | Matrice popularité × marge |
| `WorkflowEngine` | ops/workflow | Visualisation workflows actifs |
| `PayrollEngine` | human/remuneration | Calcul paie (pas de prévisualisation) |
| `TimeclockEngine` | human/effectifs | Suivi pointages (décompte temps réel) |
| `StockEngine` | logistics/stock | Mouvements stock temps réel |
| `ProcurementEngine` | logistics/appro | Commandes fournisseurs (statut) |
| `IoTMonitorEngine` | compliance/qualite | Monitoring sondes IoT (temps réel) |
| `AuditTrailEngine` | compliance/securite | Journal audit complet |
| `FiscalBridgeEngine` | finance/fiscalite | Chaîne NF525 (vérification + audit) |
| `BankReconciliationEngine` | finance/tresorerie | Rapprochement bancaire |

### 3.3 Cron Jobs (15 jobs sans monitoring)

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

## PARTIE 4 — VERTICALES SaaS SANS INTERFACE (7 verticales)

Ces verticales ont des composants construits mais aucune route dans le router Next.js :

| Verticale | Composants construits | Ce qui manque |
|-----------|----------------------|---------------|
| **Bakery** | `PreorderManagement`, `AllergenRegistry`, `DisplayStockPage`, `BatchProductionDashboard` | Routes `/bakery/*` + layout |
| **Hotel** | `PMSDashboard` | Routes PMS + intégration channel manager |
| **Retail** | `CatalogPage`, `PromotionsPage`, `RetailStockPage`, `RetailPOSPage`, `ReturnsPage` | Routes `/retail/*` complètes |
| **Salon** | `AppointmentCalendar`, `StylistDashboard`, `CabinStockPage` | Routes `/salon/*` + booking |
| **Clinic** | `ClinicDashboard` | Routes `/clinic/*` + RPPS |
| **Garage** | `GarageDashboard`, `GarageStatCard` | Routes `/garage/*` + OR |
| **Custom** | — | Framework vertical custom |

---

## PARTIE 5 — BUGS CRITIQUES À CORRIGER EN PRIORITÉ 0

Ces bugs bloquent la conformité NF525 ou injectent de fausses données. À corriger AVANT tout développement UI.

### C-01 : Deux `FiscalEngine` divergents

**Symptôme** : Le barrel `@/modules/finance` exporte `src/modules/finance/services/FiscalEngine.ts` qui utilise `current.previousHash ?? ""` dans `verifyChain` — au lieu de `FISCAL_CONSTANTS.GENESIS_ROOT`. Le premier sceau de la chaîne a donc un `previousHash` de `""`, non de `GENESIS_ROOT`, ce qui rend `verifyChain` faux à la première vérification.

**Fix** :
```bash
# Supprimer la version erronée
rm src/modules/finance/services/FiscalEngine.ts
# Mettre à jour le barrel finance
# src/modules/finance/index.ts : remplacer import depuis services/FiscalEngine par fiscalite/FiscalAdapter
```

**Fichiers** :
- `src/modules/finance/services/FiscalEngine.ts` → supprimer
- `src/modules/finance/index.ts` → changer l'export

---

### C-02 : Hashes codés en dur dans `useFinanceReflex`

**Symptôme** : `src/modules/finance/hooks/useFinanceReflex.ts:38` injecte `hash: '1'.repeat(64)` et `hashPrecedent: '0'.repeat(64)` dans le journal NF525 — des faux hashes qui corrompent la chaîne fiscale.

**Fix** :
```typescript
// Remplacer le chemin HACCP→Finance par FiscalSealer.sealDataAtomically()
// Le pulse HACCP_WASTE doit émettre les vraies données, pas des hashes fake
```

---

### C-03 : `RestaurantVertical.initialize()` jamais appelée à runtime

**Symptôme** : `RestaurantVertical.initialize()` n'est appelée que pendant le provisioning (`ProvisioningEngine`, `TenantProvisioningService`). À runtime, la verticale restaurant n'est jamais activée — ses adapters RestaurantOps et RestaurantCommerce ne sont pas montés.

**Fix** :
```typescript
// src/lib/NexusSyncService.ts — ajouter dans init() :
import { VerticalRegistry } from '@/shared/plugins/VerticalRegistry';
const vertical = VerticalRegistry.resolve(tenant.variant ?? 'restaurant');
if (vertical) await vertical.initialize(tenantId);
```

---

## PARTIE 6 — PLAN D'IMPLÉMENTATION PRIORISÉ

### Sprint 1 — Fondations & Bugs P0 (semaine 1-2)

**Objectif** : Corriger les bugs critiques, câbler les features les plus demandées.

#### Tâche 1.1 — Fix C-01 : Unifier FiscalEngine
```
Supprimer src/modules/finance/services/FiscalEngine.ts
Mettre à jour src/modules/finance/index.ts pour exporter depuis fiscalite/FiscalAdapter.ts
Lancer : npx vitest run src/e2e/vanguard/
Critère : 56/56 tests vanguard passent
```

#### Tâche 1.2 — Fix C-02 : Supprimer faux hashes de useFinanceReflex
```
src/modules/finance/hooks/useFinanceReflex.ts
→ Retirer les lignes hash: '1'.repeat(64) et hashPrecedent: '0'.repeat(64)
→ Soit utiliser FiscalSealer.sealDataAtomically() pour les events HACCP
→ Soit désactiver le bridge en attendant que compliance émette les bons events
```

#### Tâche 1.3 — Fix C-03 : Activer RestaurantVertical à runtime
```
src/lib/NexusSyncService.ts : appeler VerticalRegistry.resolve(variant).initialize()
→ Vérifier que RestaurantOpsAdapter et RestaurantCommerceAdapter sont bien importés
   dans RestaurantVertical.ts
```

#### Tâche 1.4 — Ajouter `/nf525` à navConfig
```
src/config/navConfig.ts — Section Finance :
{
  label: "Audit NF525",
  path: "/nf525",
  icon: ShieldCheck,
  requiredCapability: "fiscal_audit",
  requiredRole: "admin"
}
```

---

### Sprint 2 — KDS & Cuisine (semaine 3-4)

**Objectif** : Le KDS devient un vrai écran de production avec tous ses composants.

#### Tâche 2.1 — KDSDashboard complet
Fichier : `src/modules/ops/production/kds/components/KDSDashboard.tsx`

Actions :
1. Remplacer les cards actuelles par `KDSTicket` (avec `KDSItemCard` + `KDSSortableItem`)
2. Ajouter `KDSHeader` en haut avec compteurs (En attente / En cours / Prêt)
3. Ajouter `KDSEmptyState` pour l'état sans commande
4. Ajouter `KDSContextDrawer` au clic sur un ticket (historique table)

#### Tâche 2.2 — Éditeur Recettes complet
Fichier : `src/app/(client)/(ops)/kitchen/page.tsx`

Actions :
1. Ajouter bouton "Modifier la recette" → ouvre un dialog avec les 8 onglets :
   - `RecipeBasicsTab`, `RecipeCompositionTab`, `RecipeProtocolTab`, `RecipeAnalyticTab`
   - `AllergensTab`, `IngredientsTab`, `MarginsTab`, `WasteTab`
2. Ajouter `RecipeTechnicalSheet` avec bouton d'impression PDF
3. Ajouter `ModificationAlerts` en overlay (commandes avec modif en cours)

#### Tâche 2.3 — Printers : Wizard d'ajout
Fichier : `src/app/(client)/(ops)/settings/page.tsx`

Actions :
1. Ajouter `AddPrinterWizard` (2 étapes : `ConfigureStep` + test)

---

### Sprint 3 — HACCP Avancé (semaine 5-6)

**Objectif** : La page HACCP devient un vrai outil métier complet.

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
→ Câbler les events HACCP_WASTE correctement vers FiscalSealer (fix C-02 requis)
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

**Objectif** : Exposer toutes les vues comptables construites.

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

#### Tâche 4.2 — AuditTab : vue NF525 détaillée
```
Fichier: src/modules/finance/components/_tabs/AuditTab.tsx
Intégrer: FiscalAuditView (vue actuelle trop basique)
Ajouter: lien vers /nf525 pour l'archive complète
```

#### Tâche 4.3 — Monter NexusFiscalProvider
```
Fichier: src/app/(client)/layout.tsx ou NexusOpsProvider.tsx
Action: <NexusFiscalProvider> doit wrapper les pages finance
→ Actuellement non monté dans l'arbre React
```

#### Tâche 4.4 — FacturXDownloadButton
```
Fichier: src/modules/finance/components/_tabs/BillingTab.tsx
Action: ajouter le bouton sur chaque ligne de facture
```

---

### Sprint 5 — Plan de Salle Complet (semaine 9-10)

**Objectif** : Le floor plan devient un outil de gestion réel.

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

#### Tâche 7.1 — Oracle Chat
```
Page: /intelligence (ou drawer flottant partout)
Composants: OracleChatDrawer (NL → SQL → answer)
+ OraclePredictor (prédictions 7 jours)
```

#### Tâche 7.2 — Flash Report Directeur
```
Composant: DirectorFlashReport
Position: page /analytics en haut (résumé quotidien auto-généré)
Envoi: email automatique via ReportEngine (déjà construit)
```

#### Tâche 7.3 — Hub Connecteurs
```
Page: /integrations (déjà dans nav)
Composants: ConnectorCard + ConnectorConfigModal + ConnectorStatusBadge
Données: IntegrationEngine (déjà construit)
```

---

### Sprint 8 — Routes Orphelines (semaine 15-16)

#### Tâche 8.1 — `/nf525` : Page Archive Fiscale
```
Route: src/app/(client)/(ops)/nf525/page.tsx
Composants: FiscalAuditView + chaîne de scellement lisible
Accès: admin uniquement, lien depuis Finance > Audit
```

#### Tâche 8.2 — `/pos-mobile` : Mode Waiter
```
Route: src/app/(client)/(ops)/pos-mobile/page.tsx
Composants: POS simplifié pour tablette/mobile
Nav: bouton "Mode waiter" depuis POS desktop
```

#### Tâche 8.3 — `/timeclock` : Badgeuse
```
Route: src/app/(client)/(ops)/timeclock/page.tsx
Composants: TimeclockEngine UI (pointage NFC/code PIN)
Nav: entrée dans la section RH
```

#### Tâche 8.4 — `/menu-engineering` : Matrice
```
Route: src/app/(client)/(ops)/menu-engineering/page.tsx
Composants: MenuEngineeringEngine UI (4 quadrants Stars/Plowhorses/Puzzles/Dogs)
Nav: lien depuis Menu Builder
```

#### Tâche 8.5 — `/mon-espace` : Portail Employé
```
Route: src/app/(client)/(ops)/mon-espace/page.tsx
Composants: StaffPortal + PaySlipViewer
Accès: tous les rôles (self-service)
```

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

#### Tâche 10.1 — Câbler `/onboarding` comme première expérience
```
Route: src/app/(client)/(ops)/onboarding/page.tsx
Stepper en 6 étapes:
  1. SourceSystemSelector (depuis quel logiciel ?)
  2. UniversalImportDropzone (CSV/FEC)
  3. PreviewTable (vérification données)
  4. SimpleFloorPlanEditor (plan de salle rapide)
  5. BatchTableForm (tables en lot)
  6. OnboardingProgress (résumé + lancement)

Composants: tous déjà construits dans commerce/onboarding/
```

---

### Sprint 11 — Verticales SaaS (semaine 21-24)

**Objectif** : Ouvrir la plateforme aux autres secteurs.

#### Ordre recommandé par ROI estimé :

1. **Retail** (5 composants) → `/retail/*` — ajout au VerticalRegistry + navConfig par variant
2. **Bakery** (4 composants) → `/bakery/*` — précommandes + étiquetage allergènes
3. **Hotel** (1 composant PMSDashboard) → `/hotel/pms` — channel manager à câbler
4. **Salon** (3 composants) → `/salon/*` — booking rendez-vous
5. **Garage / Clinic** — verticales de niche, post-PMF

---

## PARTIE 7 — MÉTRIQUES D'AVANCEMENT

Utiliser ces métriques pour tracker la progression sprint par sprint :

| Indicateur | Valeur actuelle | Cible S11 |
|------------|----------------|-----------|
| Composants TSX connectés / total | ~65 / 192 | 180 / 192 |
| Routes dans navConfig | 38 | 50 |
| Handlers avec feedback UI | 0 / 165 | 15 / 165 |
| Pages avec 100% fonctionnalités visibles | 3 | 20 |
| Verticales actives en production | 1 (restaurant) | 3 |
| Tests vanguard passants | 56 / 56 ✅ | 56 / 56 |
| Bugs C-01/C-02/C-03 résolus | 0 / 3 | 3 / 3 |

---

## ANNEXE — FICHIERS À NE PAS TOUCHER

| Fichier | Raison |
|---------|--------|
| `tenants/{id}/journalEntries/*` | Immuable NF525 — jamais update/delete |
| `tenants/{id}/fiscalSeals/*` | Immuable NF525 — jamais update/delete |
| `tenants/{id}/fiscalLedger/*` | Immuable NF525 — jamais update/delete |
| `src/shared/nexus/SovereignGuard.ts` | Barrière cross-tenant — ne jamais contourner |
| `src/lib/nexus/NexusAdapter.ts` | Singleton Nexus — modifier uniquement via PR dédiée |

---

*Ce document est la source de vérité pour le plan d'implémentation UI.
Maintenir à jour au fur et à mesure des sprints.*
