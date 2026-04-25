# 🍱 OPS MODULE (Service & Production)

Le moteur temps réel du restaurant qui gère le cycle de vie des commandes, les tables et les réservations.

## 1. Responsabilités & Objets (Domain)
- **Commandes (Orders)** : Suivi de la prise de commande jusqu'au paiement.
- **Tables & Salles** : Gestion de la disponibilité et plan de salle.
- **Réservations** : Planning d'occupation et gestion des groupes.
- **KDS (Kitchen Display System)** : Interface de production pour la cuisine.

## 2. Flux de Synchronisation (`ops.sync.ts`)
- **Orders Sync** : Tri par `updatedAt` descendant pour avoir toujours les dernières commandes en haut.
- **Tables Sync** : État en direct pour le plan de salle.
- **Hydratation Zero-Latency** : Le service utilise une base de données locale (`db.orders`) pour un démarrage instantané, même hors-ligne.

## 3. État Atomique (`orderAtoms.ts`)
- **Sélecteurs Intelligents** :
    - `availableTablesAtom` : Filtre automatique des tables libres.
    - `pendingOrdersAtom` : Flux dédié pour le KDS (statuts `new` ou `preparing`).
    - `orderStatsAtom` : Calcul en temps réel du chiffre d'affaires (en centimes) et du volume.

## 4. Règles d'Intégrité
- **Validation Financière** : Une commande ne peut être clôturée (`status: 'paid'`) sans un identifiant de transaction valide.
- **Liaison HACCP** : Certains produits sensibles déclenchent automatiquement des alertes de traçabilité lors de leur ajout à une commande.

## 5. Points de Vigilance
- **Calcul de Revenu** : Le `orderStatsAtom` fait un `reduce` sur l'ensemble des commandes chargées. Si le volume devient massif, ce sélecteur pourrait devenir un point de ralentissement.
- **Dépendance Finance** : Le passage au statut payé est fortement couplé au module Finance, ce qui exige une synchronisation parfaite entre les deux domaines.
