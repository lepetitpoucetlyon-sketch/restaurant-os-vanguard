# 📋 Roadmap & Spécifications — Profils UX & Modes Métier

Ce document recense les spécifications des 4 modes d'expérience utilisateur (UX Profiles) à construire pour adapter **RESTAURANT-OS-CORE** aux spécificités de chaque type d'établissement.

---

## 🍔 1. Mode Fast-Food / Vente à Emporter (Takeaway & Fast-Casual)

### Objectif UX
Maximiser la vitesse de prise de commande et d'encaissement sur les flux à fort volume.

### Fonctionnalités à Construire
- [ ] **Encaissement Ultra-Rapide (1-Click Checkout)** : Boutons de paiement direct (Espèces exactes, CB Sans Contact, Ticket Resto) sans passer par l'écran intermédiaire de rendu de monnaie.
- [ ] **Masquage Automatique du Plan de Salle** : Redirection directe sur le catalogue POS dès l'ouverture d'une nouvelle session.
- [ ] **Écran de Retrait Client (Customer Order Display)** : Interface de file d'attente pour écran externe (Commandes en préparation vs Commandes prêtes).
- [ ] **Propositions de Vente Incitative (Upselling Auto)** : Pop-up ou suggestion automatique de menus, boissons et desserts lors de la sélection des plats principaux.

---

## 🍷 2. Mode Gastronomique / Service à Table (Fine Dining)

### Objectif UX
Offrir une gestion fluide du service en salle, du suivi de table et de la personnalisation client.

### Fonctionnalités à Construire
- [ ] **Plan de Salle 3D / 2D Interactif** : Visualisation en temps réel de l'état des tables (Libre, Occupée, En attente addition, À nettoyer).
- [ ] **Gestion des Suites de Plats (Order Pacing)** : Envoi différencié en cuisine (Réclame Entrées, Plats, Desserts) déclenchable depuis le POS mobile du serveur.
- [ ] **Fiche Client & Préférences (CRM Table)** : Historique des visites, régimes alimentaires, allergies et préférences de vin intégrés directement sur la fiche table.
- [ ] **Partage & Division d'Addition Complexe** : Séparation de la note par convive, par produit ou division égale en $N$ personnes.

---

## 🍸 3. Mode Bar / Nightclub (High-Volume Nightlife)

### Objectif UX
Garantir un service ultra-rapide dans un environnement sombre à forte intensité.

### Fonctionnalités à Construire
- [ ] **Gestion des Onglets / Ardoises Client (Bar Tabs)** : Ouverture d'une ardoise par empreinte CB ou nom de client avec encaissement différé en fin de nuit.
- [ ] **Raccourcis Boissons Géants (Quick Grid)** : Grille tactile grand format pour les alcools, cocktails et pressions les plus vendus.
- [ ] **Theme Dark Contrast UI** : Interface à fort contraste visuel (Néon & Noir profond) optimisée pour la pénombre des établissements de nuit.
- [ ] **Mode Happy Hour Automatique** : Basculement automatique des tarifs selon des plages horaires paramétrables.

---

## 🛵 4. Mode Dark Kitchen (Delivery & Multi-Brand)

### Objectif UX
Centraliser la production culinaire et rationaliser l'expédition des livreurs.

### Fonctionnalités à Construire
- [ ] **Focus 100% KDS (Kitchen Display System)** : Interface d'écran de cuisine plein écran optimisée par poste de cuisson (Chaud, Froid, Emballage).
- [ ] **Agrégation Multi-Plateformes (Deliveroo, UberEats, JustEat)** : Centralisation de tous les flux de commandes externes sur un seul écran sans multiplier les tablettes.
- [ ] **Gestion des Marques Virtuelles (Multi-Branding)** : Distinction visuelle claire de la marque virtuelle associée à chaque commande pour l'emballage.
- [ ] **Gestion du Dispatch Livreurs** : Notification sonore et visuelle dès l'arrivée du livreur pour remise en main propre immédiate.
