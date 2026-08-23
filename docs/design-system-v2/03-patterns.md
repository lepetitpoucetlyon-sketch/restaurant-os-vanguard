# 03 — Patterns Composés & Architectures de Pages

Les pages de Restaurant OS s'articulent autour de 4 archétypes de composition :

## Pattern 1 : Tableau de Bord Opérationnel (Operational Dashboard)
Utilisé pour : POS, KDS, Floor Plan, Inventaire.

1. **Enveloppe** : `<PageShell variant="compact">` avec breadcrumb et statut du shift.
2. **KPIs** : `<StatGrid columns={4}>` affichant l'activité temps réel.
3. **Zone Centrale** : Grille 2 ou 3 colonnes (Catalogue / Liste de tickets / Détails addition).
4. **Bas de page** : `<ActionBar variant="sticky-bottom">` avec actions primaires d'encaissement et d'envoi en cuisine.

## Pattern 2 : Page Analytique & Financière (Analytics & Ledger)
Utilisé pour : Finance, Ventes, Facturation, Clôture Z.

1. **Enveloppe** : `<PageShell variant="default">` avec filtres de date et sélecteur d'exercice.
2. **Indicateurs** : `<StatGrid>` avec variations N-1.
3. **Sections Dépliées** : 2 à 4 `<SectionCard variant="default">` hébergeant les graphiques temporels et le grand livre.
4. **Actions Sensibles** : Protégées par `<ActionGuard>` (Export FEC, Clôture Z).

## Pattern 3 : Vue Grille & Calendrier (Planning & Roster)
Utilisé pour : Planning RH, Réservations.

1. **Header** : Navigation temporelle (semaine / jour) + indicateur de capacité.
2. **Grille d'organisation** : Table responsive avec drag & drop sur desktop et liste accordéon sur mobile.
3. **Drawer latéral** : Fiche détail employé ou fiche réservation VIP.

## Pattern 4 : Page de Configuration & Paramètres
Utilisé pour : Paramètres Tenant, Branding, Intégrations, Rôles.

1. **Barre de Sauvegarde** : `<ActionBar>` flottante ou en header avec bouton "Enregistrer" et indicateur d'état non sauvegardé.
2. **Disposition à 2 colonnes** :
   - Colonne gauche (7/12) : Formulaires et sélecteurs dans des `<SectionCard>`.
   - Colonne droite (5/12) : Aperçu en direct temps réel (Live Preview).
