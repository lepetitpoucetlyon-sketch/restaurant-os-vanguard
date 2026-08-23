# Audit Baseline Impeccable — 5 Pages Critiques

Audit initial réalisé sur les 5 pages les plus sollicitées avant refonte structurelle.

## 1. `/pos` — Caisse Tactile & Point de Vente
- **État Initial** : Page épaisse de ~300 lignes, header ad-hoc, ticket addition codé avec des largeurs fixes, pas de protection `<TabGuard>` sur l'onglet historique, boutons de remise et d'annulation non protégés par PIN.
- **Score Impeccable Baseline** : `72/100`
- **Actions Requises V5.1** :
  - Migration vers `PageShell` + `ResponsiveShell` (3 colonnes Desktop / 2 colonnes Tablette / Catalogue plein écran + Sheet Mobile).
  - Câblage `<ActionGuard page="pos" action="void_line">` et `apply_discount`.

## 2. `/kds` — Affichage Cuisine & Production
- **État Initial** : Coquille déléguant à `KDSDashboard.tsx`. Manque de lisibilité à distance (contraste insuffisant sur fond sombre), pas de swipe tactile entre postes sur tablette.
- **Score Impeccable Baseline** : `78/100`
- **Actions Requises V5.1** :
  - Vue 4 postes murale grand format + swipe 2 postes iPad Chef.
  - Squelettes de commande `SkeletonList` au lieu d'écran noir au chargement.

## 3. `/floor-plan` — Plan de Salle Interactif
- **État Initial** : Canvas Konva bien structuré mais barre d'outils et timeline d'arrivée non responsive (déborde sur écrans < 1024px), modal de réservation non adaptée au mobile.
- **Score Impeccable Baseline** : `75/100`
- **Actions Requises V5.1** :
  - `DesktopFloorView` (Canvas + Timeline) / `TabletFloorView` (Canvas tactile) / `MobileFloorView` (Liste des tables du rang serveur).

## 4. `/finance` — Comptabilité & Clôtures
- **État Initial** : Coquille déléguant à `FinanceDashboard.tsx`. 6 onglets sans `<TabGuard>` (un serveur voyait les boutons de grand livre et de TVA), export FEC sans confirmation PIN.
- **Score Impeccable Baseline** : `68/100`
- **Actions Requises V5.1** :
  - Câblage strict `<TabGuard>` pour réserver l'accès FEC/Z/Audit aux rôles comptables et directeurs.
  - Intégration de `<StatGrid>` et de `<SectionCard>`.

## 5. `/planning` — Planning Effectifs & RH
- **État Initial** : Grille 7 jours lourde, peu maniable sur smartphone, formulaire d'édition de vacation trop dense.
- **Score Impeccable Baseline** : `70/100`
- **Actions Requises V5.1** :
  - `DesktopPlanningView` (Grille drag & drop) / `MobilePlanningView` (Vue "Mes vacations" et pose de congés simplifiée).
