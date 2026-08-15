# 🎨 Matrice des 16 Zones d'Interface & Composants UI

> **Cartographie Complète du Design System & Composants UI**  
> **Nombre de composants** : ~806 composants modulaires décortiqués  
> **Norme UX** : Glassmorphism, Framer Motion, Responsivité 100% Mobile/Tablet/Desktop

---

## 📚 Sommaire

1. [Vue d'Ensemble des 16 Zones UI](#1-vue-densemble-des-16-zones-ui)
2. [🖥️ Zone 1 — SERVICE (POS, KDS, Bar, Runner)](#2-️-zone-1--service-pos-kds-bar-runner)
3. [🖥️ Zone 2 — RÉSERVATIONS & ACCUEIL](#3-️-zone-2--réservations--accueil)
4. [🖥️ Zone 3 — MENU & CATALOGUE CULINAIRE](#4-️-zone-3--menu--catalogue-culinaire)
5. [🖥️ Zone 4 — CRM, CLIENTS & FIDÉLITÉ](#5-️-zone-4--crm-clients--fidélité)
6. [🖥️ Zone 5 — STOCK & LOGISTIQUE](#6-️-zone-5--stock--logistique)
7. [🖥️ Zone 6 — RESSOURCES HUMAINES & PLANNING](#7-️-zone-6--ressources-humaines--planning)
8. [🖥️ Zone 7 — FINANCE & COMPTABILITÉ FISCALE](#8-️-zone-7--finance--comptabilité-fiscale)
9. [🖥️ Zone 8 — CONFORMITÉ SANITAIRE & SÉCURITÉ (HACCP)](#9-️-zone-8--conformité-sanitaire--sécurité-haccp)
10. [🖥️ Zones 9 à 16 — FACILITY, BI, IA, MOBILE & ADMIN](#10-️-zones-9-à-16--facility-bi-ia-mobile--admin)

---

## 1. Vue d'Ensemble des 16 Zones UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               ÉCOSYSTÈME UI RESTAURANT OS                  │
│                                                                             │
│  [Zone 1] SERVICE           [Zone 2] RÉSERVATIONS      [Zone 3] MENU        │
│  POS, KDS, Salle, Bar       Plans 2D/3D, Guestbook     Recettes, Allergènes │
│                                                                             │
│  [Zone 4] CRM & FIDÉLITÉ    [Zone 5] LOGISTICS         [Zone 6] RH          │
│  RFM, Campagnes, Cartes     Stocks, DLC, Réceptions    Planning, Pointage   │
│                                                                             │
│  [Zone 7] FINANCE           [Zone 8] COMPLIANCE        [Zone 9] FACILITY    │
│  Clôture Z, FEC, Factur-X   HACCP, Coffre WORM         Parc machines, IoT   │
│                                                                             │
│  [Zone 10] ANALYTICS        [Zone 11] INTELLIGENCE     [Zone 12] EXTENSIONS │
│  Marges, Food Cost, BI      Oracle IA, LightRAG        Hub Intégrations     │
│                                                                             │
│  [Zone 13] ADMIN CLIENT     [Zone 14] MOBILE STAFF     [Zone 15] WEB PUBLIC │
│  RBAC, Paramètres, Matériel Prise de commande nomade   Click&Collect, Menu  │
│                                                                             │
│  [Zone 16] DESIGN SYSTEM TRANSVERSE (Tokens, Glassmorphism, SplashGate)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🖥️ Zone 1 — SERVICE (POS, KDS, Bar, Runner)

* **Niveau RBAC Requis** : `20` (Runner) → `30` (Serveur) → `40` (Chef de Rang) → `70` (Manager pour remises)
* **Composants Clés** :
  - `PosHeader` : Sélecteur d'opérateur, statut réseau hors-ligne, tiroir caisse. (RBAC: 30)
  - `CategorySelector` : Barre d'onglets catégories menu avec défilement fluide. (RBAC: 20)
  - `ProductGrid` : Grille d'articles avec visuels, prix, badges d'allergènes et de stock. (RBAC: 20)
  - `OrderCart` : Panier courant, quantité, modificateurs, cuisson, notes cuisine. (RBAC: 30)
  - `SplitPaymentModal` : Modale de partage d'addition (par couvert, par plat ou montant libre). (RBAC: 30)
  - `KdsGrid` : Grille de bons de commande par station avec compteurs de retard colorés. (RBAC: 20)
  - `CourseFireButton` : Bouton "Envoyer la suite" déclenchant l'impression / affichage KDS. (RBAC: 30)

---

## 3. 🖥️ Zone 2 — RÉSERVATIONS & ACCUEIL

* **Niveau RBAC Requis** : `30` (Hôtesse / Serveur) → `70` (Manager)
* **Composants Clés** :
  - `FloorPlanCanvas` : Plan de salle interactif Konva.js 2D/3D (tables, zones, statuts). (RBAC: 30)
  - `TableStatusPill` : Badge d'état de table (Libre, Occupée, Addition demandée, À nettoyer). (RBAC: 30)
  - `WelcomeGuestButton` : Bouton d'accueil déclenchant la notification des allergènes au KDS. (RBAC: 30)
  - `WaitlistTracker` : Suivi de la file d'attente avec estimation du temps et SMS automatique. (RBAC: 30)

---

## 4. 🖥️ Zone 3 — MENU & CATALOGUE CULINAIRE

* **Niveau RBAC Requis** : `50` (Expert Produit) → `70` (Chef / Manager)
* **Composants Clés** :
  - `MenuBuilder` : Éditeur de carte par glisser-déplacer, déclinaisons et formules midi/soir. (RBAC: 70)
  - `RecipeCostCard` : Fiche technique recette décomposée au gramme près avec Food Cost. (RBAC: 60)
  - `AllergenMatrix` : Matrice INCO des 14 allergènes réglementaires majeurs. (RBAC: 60)

---

## 5. 🖥️ Zone 4 — CRM, CLIENTS & FIDÉLITÉ

* **Niveau RBAC Requis** : `30` (Consultation) → `70` (Campagnes & Remises)
* **Composants Clés** :
  - `CustomerProfileCard` : Fiche client (historique visites, panier moyen, préférences). (RBAC: 30)
  - `LoyaltyWallet` : Solde de points / cagnotte fidélité en euros et historique des gains. (RBAC: 30)
  - `RFMSegmentBadge` : Classification client (VIP, Régulier, En risque d'érosion, Inactif). (RBAC: 70)

---

## 6. 🖥️ Zone 5 — STOCK & LOGISTIQUE

* **Niveau RBAC Requis** : `60` (Sous-Chef / Réceptionniste) → `70` (Manager)
* **Composants Clés** :
  - `StockLevelTable` : État des stocks multi-emplacements valorisé au PRMP. (RBAC: 60)
  - `DeliveryReceptionModal` : Rapprochement Bon de Livraison / Bon de Commande. (RBAC: 60)
  - `DlcWarningBanner` : Alerte préventive 48h sur les dates limites de consommation. (RBAC: 60)

---

## 7. 🖥️ Zone 6 — RESSOURCES HUMAINES & PLANNING

* **Niveau RBAC Requis** : `10` (Pointage) → `40` (Chef de Rang) → `70` (Planning / Manager)
* **Composants Clés** :
  - `TimeclockTerminal` : Borne de pointage PIN / NFC / Géofencée pour le personnel. (RBAC: 10)
  - `RosterCalendar` : Planning hebdomadaire collaboratif avec contrôle des règles HCR. (RBAC: 70)
  - `PayrollExportButton` : Génération du fichier de pré-paie Silae / Payfit. (RBAC: 70)

---

## 8. 🖥️ Zone 7 — FINANCE & COMPTABILITÉ FISCALE

* **Niveau RBAC Requis** : `60` (Comptable) → `80` (Directeur) → `100` (Propriétaire)
* **Composants Clés** :
  - `TicketZSummary` : Écran de clôture Z de caisse avec comptage des espèces et scellement. (RBAC: 80)
  - `FiscalChainInspector` : Explorateur de la chaîne de hash SHA-256 NF525. (RBAC: 80)
  - `FacturXPreview` : Visualiseur de facture électronique PDF/A-3 + XML UBL/CII. (RBAC: 80)

---

## 9. 🖥️ Zone 8 — CONFORMITÉ SANITAIRE & SÉCURITÉ (HACCP)

* **Niveau RBAC Requis** : `10` (Consultation) → `60` (Sous-Chef) → `80` (Directeur)
* **Composants Clés** :
  - `TemperatureLogForm` : Saisie des relevés de température des chambres froides et huiles. (RBAC: 60)
  - `IncidentAlertModal` : Déclaration de non-conformité sanitaire ou alerte hors-plage IoT. (RBAC: 60)
  - `DocumentVaultViewer` : Visualiseur du coffre-fort d'archivage WORM (6 ans). (RBAC: 80)

---

## 10. 🖥️ Zones 9 à 16 — FACILITY, BI, IA, MOBILE & ADMIN

* **Zone 9 (Facility)** : `EquipmentCard`, `MaintenanceTicketModal`. (RBAC: 60)
* **Zone 10 (Analytics)** : `CockpitExecutiveDashboard`, `BcgMenuMatrix`. (RBAC: 80)
* **Zone 11 (Intelligence)** : `OracleChatInterface`, `WasteVisionPanel`. (RBAC: 70)
* **Zone 12 (Extensions)** : `ConnectorHubGrid`, `ApiKeyManager`. (RBAC: 80)
* **Zone 13 (Admin Client)** : `RbacMatrixEditor`, `PrinterConfigurator`. (RBAC: 100)
* **Zone 14 (Mobile Staff)** : `MobilePosScreen`, `HapticNotification`. (RBAC: 30)
* **Zone 15 (Web Public)** : `PublicMenuScreen`, `ClickCollectCheckout`. (RBAC: Public)
* **Zone 16 (Transverse)** : `GlassCard`, `SplashGate`, `OfflineBanner`. (RBAC: Tous)
