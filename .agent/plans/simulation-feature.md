# Plan d'Implémentation : Simulateur de Croissance (Digital Twin)

## 🎯 Objectif
Créer un simulateur interactif permettant aux gérants de tester des hypothèses business sur un "jumeau numérique" du restaurant avant implémentation réelle.

---

## 📋 Fonctionnalités Prévues

### 1. Modal de Configuration du Scénario
- **Nom du scénario** (ex: "Augmentation Prix Menu")
- **Type de scénario** avec templates prédéfinis :
  - 💰 Changement de prix (boissons, plats, menu)
  - 🕐 Horaires (ouverture/fermeture, jours supplémentaires)
  - 👥 Personnel (réduction/augmentation équipe)
  - 📊 Capacité (ajout tables, terrasse)
  - 🎯 Marketing (promotion, offre spéciale)

### 2. Paramètres Configurables par Type

#### Prix
- Catégorie impactée (Entrées, Plats, Desserts, Boissons, Menu)
- Pourcentage de variation (-30% à +50%)
- Prix cible optionnel

#### Horaires
- Jours concernés
- Heures d'ouverture/fermeture
- Service supplémentaire (midi/soir)

#### Personnel
- Nombre d'ETP en variation
- Postes concernés (serveur, cuisine, bar)
- Coût horaire moyen

#### Capacité
- Nombre de couverts ajoutés/retirés
- Zone (intérieure, terrasse)

### 3. Moteur de Simulation (IA)
Calculs basés sur :
- Élasticité de la demande (historique)
- Taux de remplissage moyen
- Ticket moyen actuel
- Coûts fixes et variables
- Saisonnalité

### 4. Résultats Affichés
- **Impact Revenus** (€/mois estimé)
- **Impact Coûts** (personnel, matières)
- **Profit Net Projeté**
- **Score de Confiance** (%)
- **Risques Identifiés**
- **Graphique de projection** (6 mois)

---

## 🔧 Composants à Créer

1. **`SimulationModal.tsx`** - Modal principal avec wizard multi-étapes
2. **Mise à jour `IntelligenceContext.tsx`** - Logique de simulation
3. **Mise à jour `intelligence/page.tsx`** - Liaison du bouton

---

## 📁 Structure des Fichiers

```
src/
├── components/
│   └── modals/
│       └── SimulationModal.tsx       # NOUVEAU
├── context/
│   └── IntelligenceContext.tsx       # MODIFIER
└── app/
    └── intelligence/
        └── page.tsx                  # MODIFIER
```

---

## 🎨 Design UX

### Étape 1: Choix du Type
- 5 cartes visuelles cliquables
- Icônes colorées
- Description courte

### Étape 2: Configuration
- Formulaire dynamique selon type
- Sliders pour pourcentages
- Inputs numériques avec validation

### Étape 3: Résultats
- KPIs en grand format
- Graphique de projection
- Boutons : Sauvegarder / Nouvelle Simulation / Fermer

---

## ⏱️ Estimation
- **SimulationModal.tsx** : ~400 lignes (complet)
- **IntelligenceContext.tsx** : +50 lignes
- **intelligence/page.tsx** : +10 lignes (onClick)

---

## ✅ Validation Requise
L'utilisateur doit confirmer ce plan avant implémentation.
