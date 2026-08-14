# 🗺️ ROADMAP PAR VERTICALE — Restaurant OS Platform
> Base : plan complet v6.0 terminé · UI refonte terminée · 2026-08-14
> ✅ = Fait · 🔧 = À finir · ⚫ = À faire

---

## 📖 Structure de lecture

Chaque verticale est organisée par **🖥️ zones d'interface client** (les grandes surfaces UI que le client utilise). Pour chaque zone :

- 📁 **Catégorie** (groupement fonctionnel)
  - 📂 **Sous-catégorie** (module précis)
    - 📄 **Sous-sous-catégorie** (fonctionnalité)
      - Tâches individuelles avec statut ✅ 🔧 ⚫

Pour chaque tâche significative :
- 🎯 **Pilier(s) mobilisé(s)** : ops/commerce/finance/compliance/human/logistics/intelligence/facility
- 📡 **Events bus** : émetteurs/handlers avec leur statut (✅ actif, 🔧 partiel, ⚫ manquant)
- 🔐 **RBAC** : actions custom + niveaux minimums (paramétrables par admin client)

---

## 📊 Sommaire

| Verticale | Progress | Statut | Effort restant |
|-----------|:--------:|--------|----------------|
| 🍽️ **Restaurant** | 95% | ✅ Verticale de référence | 🔧 Polish + onboarding terrain |
| 🥖 **Bakery** | 80% | 🔧 Extension immédiate | Fournées + précommandes |
| 🛍️ **Retail** | 60% | 🔧 Marché large | E-commerce sync + variantes |
| 💇 **Salon** | 50% | 🔧 Marché volumineux | Agenda visuel + commissions |
| 🚗 **Garage** | 55% | 🔧 B2B lucratif | Devis pièces + planning atelier |
| 🏨 **Hotel** | 40% | ⚫ Complexité PMS | Channel manager + housekeeping |
| 🩺 **Clinic** | 35% | ⚫ RGPD renforcé | Tiers-payant + DMP + Ségur |
| 🎨 **Custom** | 20% | ⚫ Framework long tail | Custom fields + templates |

---

# 🍽️ VERTICALE RESTAURANT

## 📊 Vue d'ensemble

**Positionnement** : verticale de référence — 95% du tronc générique construit avec restaurant comme cas type. Cible : restaurants indépendants + petites chaînes (1-10 étab.), gamme bistronomique à gastronomique. TAM France : ~180 000 restaurants.

**Pricing** : Starter 79€ → Business 129€ → Premium 189€ → Enterprise sur devis.

**Différenciateurs** : IA Oracle native · comptabilité automatisée · mode offline vrai · ergonomie iPad first · onboarding 30 min chrono.

---

## 🖥️ Zone 1 — SERVICE (Salle + Cuisine)

### 📁 1.1 · Point de Vente (POS)

#### 📂 1.1.1 · Prise de commande

##### 📄 Panier & articles
- ✅ Ajout produit au panier depuis grille tactile
- ✅ Options / modificateurs (cuisson, accompagnement, allergies)
- ✅ Notes libres par plat ("bien cuit, sans oignon")
- ✅ Quantité fractionnaire (0.5 verre de vin)
- ✅ Split addition par article / par convive / custom
- ✅ Remise ligne + remise globale (avec RBAC seuils)
- 🔧 Envoi partiel cuisine (entrées d'abord, plats après)
  - 🎯 ops
  - 📡 émet `ops.course.fired` 🔧 (handler prêt, émetteur partiel)
  - 🔐 `pos.send_partial` — niveau min 20 (serveur)
- ⚫ Groupage par convive (siège 1, siège 2 sur même table)
  - 🎯 ops
  - 🔐 `pos.assign_seat` — niveau min 20

##### 📄 Séquençage des plats
- 🔧 Statuts par étape (entrée → plat → dessert)
- ⚫ Bouton "Envoyer suite" quand entrées consommées
  - 🎯 ops + intelligence
  - 📡 émet `ops.course.next_requested` ⚫
  - 🔐 `pos.request_next_course` — niveau min 20
- ⚫ Vue KDS "prochain plat à sortir par table"

##### 📄 Alerte allergènes
- 🔧 Framework prêt côté données CRM/réservation
- ⚫ Alerte visuelle KDS quand commande vient de table avec allergie
  - 🎯 ops + commerce + compliance
  - 📡 consomme `reservation.matched` (R2 bus) ⚫ **émetteur manquant**
  - 🔐 automatique (pas de RBAC — obligation légale INCO)

##### 📄 Vérification âge alcool
- ⚫ Modal blocage POS sur catégorie `alcool` avec confirmation majorité
  - 🎯 ops + compliance
  - 📡 émet `compliance.age_verification_requested` ⚫
  - 🔐 `pos.override_age_check` — niveau min 60 (manager)

#### 📂 1.1.2 · Paiement & encaissement

##### 📄 Modes de paiement
- ✅ Espèces avec rendu monnaie
- ✅ CB via Stripe Terminal (physique)
- ✅ CB via saisie manuelle
- ✅ Ticket restaurant / carte titre-restaurant
- ✅ Chèque
- ✅ Virement (référence facture)
- 🔧 Pré-autorisation CB table ouverte (Stripe Terminal API)
  - 🎯 ops + finance
  - 📡 émet `payment.pre_authorized` ⚫
  - 🔐 `pos.pre_authorize` — niveau min 30

##### 📄 Split payment
- ✅ Split par article
- ✅ Split par convive (n personnes)
- ✅ Split custom (montants libres)
- ✅ Multi-modes sur un même ticket (moitié CB, moitié espèces)

##### 📄 Pourboires
- ✅ Ajout pourboire au terminal Stripe
- ✅ Pourboire manuel (espèces)
- ✅ Déclaration légale 2022 (pool ou individuel)
  - 🎯 ops + human + finance
  - 📡 émet `hr.tip_declared` ✅
  - 🔐 `pos.record_tip` — niveau min 30

#### 📂 1.1.3 · Impression tickets

##### 📄 Ticket client
- ✅ Impression thermique ESC/POS (Epson TM-T88, Star)
- ✅ Format avec logo, TVA effective, mentions NF525
- ✅ Ticket avec fidélité (points cumulés + solde)
- ✅ Reprint depuis historique
- 🔧 Ticket dématérialisé (email/SMS avec QR)
  - 🎯 ops + commerce
  - 📡 émet `commerce.receipt_sent` ⚫

##### 📄 Bon de préparation cuisine
- ✅ Impression sur imprimante KDS de fallback
- ✅ Regroupement par station (chaud/froid/pâtisserie)
- ⚫ Impression QR sur bon pour scan côté salle (validation "prêt")

---

### 📁 1.2 · Écran Cuisine (KDS)

#### 📂 1.2.1 · Affichage commandes

##### 📄 Layout écran
- ✅ Grille de tickets (2×4 sur 32", 4×6 sur 55")
- ✅ Auto-scroll si trop de tickets
- 🔧 Vue "par plat" (bouillon en cours × 3, plats froids × 2)
- 🔧 Vue "par table" (tous les plats de la 12)
- ⚫ Vue "par mode service" (sur place / à emporter / livraison)

##### 📄 Timers et alertes
- ✅ Timer par ticket
- 🔧 Seuil rouge configurable (> 8 min = alerte visuelle)
- ⚫ Alerte sonore configurable (silencieuse par défaut, cloche à 10 min)
- ⚫ Estimation temps préparation IA par station
  - 🎯 ops + intelligence
  - 📡 émet `intelligence.prep_time_estimated` ⚫

#### 📂 1.2.2 · Interactions cuisinier

##### 📄 Actions ticket
- ✅ Bump ticket (marquer terminé)
- ✅ Recall ticket (annuler bump)
- 🔧 Support bump bar physique USB (clavier configurable)
  - 🐕 ops
  - 🔐 pas de RBAC (fonctionnalité par défaut cuisinier)
- ⚫ Split ticket cuisine (envoi entrée à froid, plat à chaud simultanément)

##### 📄 Communication salle ↔ cuisine
- ⚫ Chat vocal push-to-talk
  - 🎯 ops
  - 📡 émet `ops.kitchen_call` ⚫
- ⚫ Notifications ciblées ("Table 82 attend l'entrée")
  - 🎯 ops
  - 📡 émet `ops.service_alert` ⚫

#### 📂 1.2.3 · Multi-station

##### 📄 Routage automatique
- ✅ Routage plat → station configurable (chaud/froid/pâtisserie/bar)
- ✅ Fan-out : un plat sur 2 stations si nécessaire
- ✅ Filtrage par station à l'écran (KDS chaud ne voit que ses plats)

##### 📄 Coordination sortie
- ⚫ Coordonnateur "expeditor" : vue globale synchronisation sorties
  - 🎯 ops
  - 🔐 `kds.expeditor_view` — niveau min 60 (chef de cuisine)

---

### 📁 1.3 · Plan de salle

#### 📂 1.3.1 · Édition du plan

##### 📄 Éditeur graphique
- ✅ Drag & drop tables sur canvas
- ✅ Rotation tables (rectangulaire orientable)
- ✅ Zones (terrasse, salle principale, salon privé)
- ✅ Verrouillage zones (empêcher modifs sans droit)
  - 🔐 `floorplan.edit` — niveau min 60

##### 📄 Templates de départ
- ✅ Bistrot 40 couverts
- ✅ Brasserie 80 couverts
- ✅ Gastronomique 30 couverts
- ⚫ Import DWG/PDF (plan architecte)

#### 📂 1.3.2 · Vue temps réel service

##### 📄 États tables
- ✅ Libre (gris)
- ✅ Occupée (couleur selon durée)
- ✅ Réservée (badge horaire)
- ✅ Nettoyage / à débarasser
- 🔧 Alerte table qui attend depuis > X min
  - 🎯 ops
  - 📡 émet `ops.table_delay_alert` ⚫

##### 📄 Actions rapides
- ✅ Ouvrir addition depuis clic table
- ✅ Transférer commande table → table
- ✅ Fusionner tables (groupe qui se rejoint)
- 🔧 Libérer table (fin de service)
  - 📡 émet `ops.table_closed` (R11 bus) 🔧 émetteur partiel
  - 🔐 `floorplan.close_table` — niveau min 20

#### 📂 1.3.3 · Capacité et occupation

##### 📄 Suivi capacité
- ✅ Total couverts disponibles
- ✅ Occupation temps réel (%)
- 🔧 Prévision occupation (basée sur réservations + walk-ins)
  - 🎯 ops + intelligence
- ⚫ Alerte surcapacité (105% en semaine tolérée, 95% weekend)

---

## 🖥️ Zone 2 — RÉSERVATIONS & ACCUEIL

### 📁 2.1 · Prise de réservation

#### 📂 2.1.1 · Canaux d'entrée

##### 📄 Manuelle (téléphone/comptoir)
- ✅ Formulaire hôtesse : nom, téléphone, nb convives, date/heure
- ✅ Affectation table auto ou manuelle
- ✅ Notes internes ("client VIP, table cheminée")
- 🔧 Émission events bus (R1 — reservation.created)
  - 📡 émet `reservation.created/updated/cancelled` 🔧 **émetteur partiel — R1 du bus**

##### 📄 En ligne (site public + Google Reserve)
- ✅ Widget site web (formulaire embed)
- 🔧 Google Reserve API (routes en place, sync à finaliser)
  - 🎯 commerce + ops
  - 📡 émet `reservation.created` via Google 🔧
- ⚫ The Fork (Yums) API — sync bidirectionnelle
- ⚫ Zenchef API (alternative premium)

##### 📄 Acomptes et garanties
- ✅ Stripe deposit configurable (montant fixe ou % couvert)
- ✅ Auto-deposit si groupe > 6 ou dimanche soir
- ✅ Remboursement automatique si annulation J-2

#### 📂 2.1.2 · Règles métier

##### 📄 Overbooking contrôlé
- 🔧 Framework en place
- ⚫ Config UI : 105% semaine, 95% weekend (paramétrable)
  - 🔐 `reservations.configure_overbooking` — niveau min 70

##### 📄 Créneaux et durées
- ✅ Durée par défaut par type couvert (2 pers = 1h30, 6 pers = 2h30)
- ✅ Créneaux configurables (12h/12h30/13h, 19h/19h30/20h/20h30/21h)
- ⚫ Blocages ponctuels (fermeture privatisation, événement)

### 📁 2.2 · Accueil client

#### 📂 2.2.1 · Check-in réservation

##### 📄 Bouton "Accueillir"
- ⚫ **Bouton "Accueillir le client"** dans le dialog réservation ⚫ **CRITIQUE — R2 bus**
  - 🎯 ops + commerce + compliance
  - 📡 émet `reservation.matched` ⚫ **transmet allergènes au KDS**
  - 🔐 `reservations.check_in` — niveau min 20

##### 📄 Attribution table à l'arrivée
- ✅ Suggestion auto (meilleure table disponible pour la config)
- ✅ Override manuel hôtesse
- 🔧 Vue plan de salle avec highlighting réservation

#### 📂 2.2.2 · Walk-in (sans réservation)

##### 📄 Accueil rapide
- 🔧 Flow rapide "client sans résa" (nom + nb + table)
- ⚫ Estimation temps d'attente
- ⚫ Liste d'attente avec SMS de rappel quand table libre
  - 📡 émet `commerce.waitlist_ready` ⚫

### 📁 2.3 · Rappels et no-show

#### 📂 2.3.1 · Rappels programmés

##### 📄 SMS/Email
- 🔧 SMS J-2 configurable
  - 📡 émet `reservation.reminder_sent` ⚫
- 🔧 Email J-1 avec lien annulation
- ⚫ Rappel 2h avant (dernier moment)

#### 📂 2.3.2 · No-show tracking

##### 📄 Détection & suivi
- 🔧 Marquer no-show manuellement
  - 📡 émet `reservation.no_show` ✅
- ⚫ Détection auto (table libérée > 30 min après horaire)
- ⚫ CRM auto-update : flag "risque" après 2 no-show
- ⚫ Demande acompte obligatoire au prochain RDV client no-show

---

## 🖥️ Zone 3 — MENU & CATALOGUE

### 📁 3.1 · Menu Builder

#### 📂 3.1.1 · Structure du menu

##### 📄 Catégories et sections
- ✅ Créer catégorie (Entrées, Plats, Desserts, Vins, Cocktails)
- ✅ Drag & drop ordre affichage
- ✅ Sous-catégories (Vins → Rouges/Blancs/Rosés)
- ✅ Menu par service (déjeuner / dîner / brunch weekend)
- 🔧 Menu saisonnier (activation/désactivation par période)
  - 📡 émet `commerce.menu_activated` ⚫

##### 📄 Produits
- ✅ Créer produit (nom, description, prix, TVA, allergènes)
- ✅ Photo produit (upload + optimisation)
- ✅ Prix multiples (heure creuse / heure pleine / brunch)
- ✅ Disponibilité configurable (rupture manuelle)
- ✅ Modificateurs (cuisson, sauce, accompagnement)

#### 📂 3.1.2 · Recettes & food cost

##### 📄 Composition recette
- ✅ Ingrédients avec quantités
- ✅ Coût matière calculé automatiquement (PMP × qté)
- ✅ Marge brute affichée
- ✅ Prix conseillé pour cible de marge (30%, 25%, 20%)

##### 📄 Menu Engineering (matrice Bruce-Miller)
- ✅ Classification Star / Puzzle / Plowhorse / Dog
- ✅ Basée sur popularité × marge
- 🔧 Suggestions IA de repositionnement
  - 🎯 commerce + intelligence
  - 🔐 `menu.view_engineering` — niveau min 60

### 📁 3.2 · Cartes physiques et digitales

#### 📂 3.2.1 · Cartes imprimables
- 🔧 Export PDF avec design personnalisable
- ⚫ Templates de mise en page (bistrot / gastro / brasserie)
- ⚫ QR code carte allergènes obligatoire

#### 📂 3.2.2 · Menu digital (QR table)
- ⚫ Page mobile responsive
  - 🎯 commerce + ops
- ⚫ Photos plats + description
- ⚫ Choix langue (FR/EN/DE/ES/IT)
- ⚫ Commande directe depuis QR (self-ordering)
  - 📡 émet `ops.order_placed_from_qr` ⚫

### 📁 3.3 · Promotions et offres

#### 📂 3.3.1 · Types de promo
- ✅ Happy hour (prix réduit sur créneau)
- ✅ Menu du jour (formule prix fixe)
- ✅ Remise % sur catégorie
- 🔧 Code promo (COUPON10 = -10%)
  - 📡 émet `commerce.promotion_activated` (R4 bus) 🔧 **émetteur manquant**
  - 🔐 `promotions.create` — niveau min 60

#### 📂 3.3.2 · Bons cadeaux
- ⚫ Émission (montant + validité)
- ⚫ Utilisation partielle (solde restant)
- ⚫ Suivi bons émis vs utilisés
  - 🎯 commerce + finance
  - 📡 émet `commerce.gift_card_issued/redeemed` ⚫

---

## 🖥️ Zone 4 — CLIENTS & FIDÉLITÉ (CRM)

### 📁 4.1 · Fichier client

#### 📂 4.1.1 · Fiche contact

##### 📄 Coordonnées
- ✅ Nom, prénom, téléphone, email
- ✅ Anniversaire (pour campagnes)
- ✅ Adresse (utile pour livraison)
- ✅ Consentement RGPD (opt-in SMS/email)

##### 📄 Préférences et notes
- ✅ Allergies déclarées (liste 14 allergènes INCO)
- ✅ Régime (végé / végan / sans gluten)
- ✅ Préférences (table calme, coin cheminée)
- ✅ Notes libres ("Client Michelin en visite")
- ✅ VIP flag

#### 📂 4.1.2 · Historique client
- ✅ Toutes réservations passées
- ✅ Toutes visites (avec ticket moyen)
- ✅ Plats favoris (top 5 commandés)
- ✅ Vins favoris
- 🔧 Photo profil (upload ou avatar auto)

### 📁 4.2 · Segments et campagnes

#### 📂 4.2.1 · Segmentation
- ✅ Segments auto (VIP, régulier, occasionnel, dormant)
- ✅ Segments manuels custom
- 🔧 Segments dynamiques (règles : "clients venus > 5x sur 6 mois")

#### 📂 4.2.2 · Campagnes marketing

##### 📄 Email
- ✅ Éditeur campagne (framework EmailCampaign)
- ✅ Templates (nouveau menu, anniversaire, promo saisonnière)
- ✅ Tracking ouvertures et clics
- ✅ Désabonnement conforme RGPD

##### 📄 SMS
- ✅ Envoi SMS ciblé
- 🔧 Notification promo ponctuelle
- ⚫ Automation : SMS anniversaire J-0 avec coupon

##### 📄 Google Business
- 🔧 Sync horaires + menu
- ⚫ Notifications avis Google (nouveau avis reçu)
- ⚫ Réponse avis assistée par IA

### 📁 4.3 · Fidélité

#### 📂 4.3.1 · Programme points
- 🔧 Attribution auto post-paiement (1 point / euro)
  - 📡 émet `commerce.loyalty_points_earned` (R5 bus) 🔧 **émetteur manquant**
  - 🔐 automatique
- 🔧 Paliers récompenses (100pts = café, 500pts = dessert)
- ⚫ Notification client à chaque palier
  - 📡 émet `commerce.loyalty_reward_reached` ⚫

#### 📂 4.3.2 · Carte fidélité digitale
- ⚫ Carte QR sur téléphone client
- ⚫ Solde consultable côté client
- ⚫ Historique points gagnés / utilisés

---

## 🖥️ Zone 5 — STOCK & APPROVISIONNEMENT (LOGISTICS)

### 📁 5.1 · Inventaire

#### 📂 5.1.1 · Fiche produit stock

##### 📄 Attributs stock
- ✅ Nom, unité (kg/L/pièce), fournisseur principal
- ✅ Prix unitaire moyen pondéré (PMP)
- ✅ Stock actuel + seuil rupture (minQuantity)
- ✅ DLC / DDM si applicable
- 🔧 Multi-emplacement (chambre froide, réserve, bar)

##### 📄 Traçabilité
- ✅ Lot fournisseur à la réception
- ✅ Étiquette de traçabilité imprimée
- ✅ Historique mouvements (entrées/sorties)

#### 📂 5.1.2 · Inventaire physique
- 🔧 Assistant inventaire mensuel
- ⚫ Scan code-barres pour count rapide
- ⚫ Écart théorique/réel avec justification
- ⚫ Ajustement auto après validation
  - 📡 émet `inventory.stock_adjusted` ✅ (handler câblé après fix P0)
  - 🔐 `inventory.adjust` — niveau min 40

### 📁 5.2 · Approvisionnement

#### 📂 5.2.1 · Fournisseurs

##### 📄 Fiche fournisseur
- ✅ Coordonnées, conditions commerciales
- ✅ Catalogue négocié (produits + prix)
- 🔧 Multi-fournisseurs par produit (comparaison prix)

##### 📄 Catalogues connectés
- 🔧 Metro France (connecteur en cours)
- ⚫ Transgourmet
- ⚫ Pomona
- ⚫ Grands Moulins de Paris (boulangerie/pizzeria)
- ⚫ Sysco France

#### 📂 5.2.2 · Commandes fournisseur

##### 📄 Création bon de commande
- 🔧 Suggestion auto basée sur stock + prévisions J+7
  - 🎯 logistics + intelligence
- ✅ Édition bon de commande PDF
- ✅ Envoi email fournisseur
- 🔧 Suivi statut (envoyé/confirmé/expédié/livré)
  - 📡 émet `logistics.purchase_order_sent` ✅

#### 📂 5.2.3 · Réception marchandises

##### 📄 Bon de livraison
- ✅ Scan/upload BL fournisseur
- ✅ Rapprochement BL vs bon de commande
- ✅ Signalement écarts (manquants, casse)
- 🔧 Émission event bus
  - 📡 émet `logistics.delivery_received` (R7 bus) 🔧 **émetteur partiel**
  - 🔐 `logistics.receive_delivery` — niveau min 30

##### 📄 Impact stock
- ✅ Mise à jour auto stock après réception validée
- ✅ Mise à jour PMP (prix moyen pondéré)
- ✅ Étiquettes traçabilité imprimées

### 📁 5.3 · DLC / DDM tracking

#### 📂 5.3.1 · Alertes péremption
- ✅ Alerte 48h avant DLC
- 🔧 Vue dashboard "à consommer d'urgence"
- ⚫ Suggestion menu du jour utilisant ces produits
  - 🎯 logistics + intelligence

#### 📂 5.3.2 · Gestion déchets (waste)
- ⚫ Saisie déchet avec raison (périmé, cassé, brûlé)
- ⚫ Coût gaspillage calculé
- ⚫ Rapport mensuel top produits gaspillés
  - 📡 émet `logistics.waste_recorded` ✅

---

## 🖥️ Zone 6 — RESSOURCES HUMAINES (HR)

### 📁 6.1 · Effectifs

#### 📂 6.1.1 · Fiche employé

##### 📄 Contrat & administratif
- ✅ Coordonnées, RIB, sécu, mutuelle
- ✅ Contrat (CDI/CDD, temps plein/partiel)
- 🔧 Génération contrat PDF depuis template
- ⚫ Signature électronique contrat (Yousign)
- ⚫ DPAE auto envoi Urssaf
  - 📡 émet `hr.dpae_submitted` ⚫

##### 📄 Compétences & rôles
- ✅ Rôle principal (serveur/chef/manager…)
- ✅ Niveau RBAC (10-100)
- ✅ Compétences additionnelles (bilingue, sommellerie)
- 🔧 Formations suivies (avec dates)

#### 📂 6.1.2 · Recrutement
- ✅ Base candidats
- 🔧 Pipeline (candidature → entretien → embauche)
- ⚫ Import Indeed / HelloWork (webhook)
- ⚫ Notation entretien
- ⚫ Test aptitude (mini quiz produit)

### 📁 6.2 · Planning

#### 📂 6.2.1 · Génération planning

##### 📄 Planning manuel
- ✅ Vue semaine (jours × collaborateurs)
- ✅ Drag & drop shifts
- ✅ Copier semaine précédente

##### 📄 Planning IA
- 🔧 Suggestion basée sur affluence prévue + réservations
- ⚫ Contraintes légales auto (11h repos, 35h max, jour off)
- ⚫ Contraintes perso (dispos, indispos)
  - 🎯 human + intelligence

#### 📂 6.2.2 · Diffusion & échanges
- ✅ Notification employé J-7 planning validé
  - 📡 émet `hr.schedule_published` ⚫
- 🔧 Échange shifts (proposition entre collègues, validation manager)
- ⚫ App mobile employé (voir planning + swap)

### 📁 6.3 · Timeclock (pointage)

#### 📂 6.3.1 · Modes de pointage
- ✅ PIN sur borne (hashed PBKDF2)
- ✅ NFC (badge personnel)
- ⚫ QR code depuis téléphone
- ⚫ Reconnaissance faciale (option)

#### 📂 6.3.2 · Événements pointage
- ✅ Clock-in / clock-out
- 🔧 Émission events bus
  - 📡 émet `hr.shift_started/ended` (R9 bus) 🔧 **émetteur partiel**
- ✅ Coupures (pause déjeuner)
- ✅ Correction manager (oubli pointage)
  - 🔐 `hr.correct_timeclock` — niveau min 60

### 📁 6.4 · Absences

#### 📂 6.4.1 · Déclaration absence
- ✅ Formulaire employé (maladie/congé/RTT)
- 🔧 Justificatif upload
- ⚫ Émission event bus
  - 📡 émet `hr.absence_declared` (R3 bus) ⚫ **émetteur manquant**
  - 🔐 `hr.declare_absence` — niveau min 20

#### 📂 6.4.2 · Validation & impact planning
- 🔧 Workflow validation manager
- ⚫ Alerte sous-effectif automatique
  - 📡 consomme `hr.absence_declared` → émet `hr.understaffed_alert` ⚫
- ⚫ Suggestion remplacement (qui est libre + compétent)

### 📁 6.5 · Paie

#### 📂 6.5.1 · Calcul heures
- ✅ Heures normales
- ✅ Heures sup 25% / 50%
- ✅ Coupures et repos
- 🔧 Prime rendement
- 🔧 Pourboires (pool ou individuel)

#### 📂 6.5.2 · Bulletin & DSN
- 🔧 Connecteur Payfit (paie externalisée)
- 🔧 Connecteur Silae (alternative)
- ⚫ DSN mensuelle générée + télétransmise
- ⚫ Bulletin PDF envoyé employé

---

## 🖥️ Zone 7 — FINANCE & COMPTABILITÉ

### 📁 7.1 · Comptabilité automatisée

#### 📂 7.1.1 · Écritures comptables

##### 📄 Génération auto
- ✅ Vente POS → JournalEntry immuable NF525
- ✅ Ventilation TVA 5.5% / 10% / 20% par produit
- ✅ Réception fournisseur → écriture achat
- ✅ Chaîne fiscale SHA-256 chaînée

##### 📄 Événements bus
- ✅ `finance.journal_entry_created`
- 🔧 `finance.invoice_generated` (R6 bus) 🔧 **émetteur partiel**
- ✅ `finance.ticket_z_closed`
- ✅ `finance.bank_synced`

#### 📂 7.1.2 · Exports comptables

##### 📄 Formats
- ✅ FEC (Fichier des Écritures Comptables) — export standard
- 🔧 Pennylane (format direct API)
- ⚫ Cegid (format spécifique)
- ⚫ Sage 100 (format spécifique)
- ⚫ QuickBooks (format spécifique)

##### 📄 Fréquence
- ✅ Manuel (à la demande)
- ⚫ Automatique mensuel (dernier jour du mois → envoi comptable)

### 📁 7.2 · Trésorerie

#### 📂 7.2.1 · Caisse temps réel

##### 📄 Suivi cash
- ✅ Espèces en caisse (calcul auto ventes cash)
- ✅ CB du jour (rapprochement Stripe)
- ✅ Autres modes (chèques, TR)
- ⚫ Alerte écart caisse > seuil configurable
  - 🔐 `finance.close_cash_drawer` — niveau min 40

##### 📄 Dépôt bancaire
- ✅ Fond de caisse configurable
- ✅ Calcul dépôt (cash - fond de caisse)
- ⚫ Bordereau dépôt bancaire imprimable

#### 📂 7.2.2 · Prévisionnel
- 🔧 Dashboard cash flow J+7
- ⚫ Prévision J+30 avec IA
- ⚫ Provisions charges (URSSAF, TVA, IS)

#### 📂 7.2.3 · Banques
- ✅ Connecteur open banking (bridge/plaid)
- ✅ Rapprochement bancaire semi-auto
- 🔧 Multi-comptes bancaires
- 🔧 Suivi reconnexion (event `bank.connection_expired` handler câblé)

### 📁 7.3 · Facturation

#### 📂 7.3.1 · Auto-facture
- ✅ Ticket > 150€ HT → génération facture auto (obligation légale)
- ✅ Numérotation continue conforme
- ✅ Envoi email au client si SIRET renseigné

#### 📂 7.3.2 · Factures BtoB
- ✅ Facturation entreprise (SIRET client)
- ✅ Groupes/séminaires (multi-couvert facturé consolidé)
- 🔧 Chorus Pro (secteur public — envoi obligatoire)

#### 📂 7.3.3 · E-facture (obligation légale 1er sept 2026)
- ✅ **Réception e-facture** — 100% conforme
- ✅ Format Factur-X (PDF/A-3 + XML)
- ✅ Format UBL 2.1
- ✅ Format CII (Cross Industry Invoice)
- ✅ Lifecycle inbound (reçu → validation → paiement)
- ✅ Câblage stock + trésorerie sur facture entrante

### 📁 7.4 · Avoirs et remboursements
- ✅ Émission avoir
- ✅ Ticket de remboursement NF525
- ✅ Séparation nette des flux (avoir ≠ vente négative)

### 📁 7.5 · Suivi impayés
- 🔧 Relance J+30 automatique
- ⚫ Relance J+45, J+60
- ⚫ Mise en recouvrement (Alma / Floa)

---

## 🖥️ Zone 8 — CONFORMITÉ & SÉCURITÉ (COMPLIANCE)

### 📁 8.1 · NF525 & Fiscalité

#### 📂 8.1.1 · Chaîne fiscale
- ✅ FiscalSealer atomique (chaîne SHA-256)
- ✅ TicketZ quotidien avec fermeture verrouillée
- ✅ Grand livre fiscal immuable
- ✅ FEC exportable conforme
- ✅ Horodatage serveur autoritaire

#### 📂 8.1.2 · Contrôle et audit
- ✅ Vérification intégrité chaîne (bouton audit)
- ✅ Historique complet immuable
- 🔧 Rapport audit annuel PDF

### 📁 8.2 · HACCP

#### 📂 8.2.1 · Températures

##### 📄 Relevés manuels
- ✅ Formulaire saisie température (chambre froide, congélateur, viande)
- ✅ Photo obligatoire
- ✅ Journal quotidien

##### 📄 IoT connecté
- 🔧 Sondes Bluetooth (Testo, SwissAvant)
- 🔧 Capture automatique températures
  - 📡 émet `haccp.temperature_logged` ✅ (fix P0 récent)
- ⚫ Alerte immédiate SMS/push si seuil franchi
  - 📡 émet `haccp.threshold_exceeded` ⚫
- ⚫ Auto-création non-conformité si récurrent
  - 📡 émet `haccp.non_conformity_created` ✅

#### 📂 8.2.2 · Non-conformités

##### 📄 Registre
- ✅ Création NC manuelle
- ✅ Photos + description + gravité
- ✅ Plan d'action associé
- 🔧 Workflow validation manager
- ⚫ Rapport mensuel PDF pour DDCCRF

#### 📂 8.2.3 · Traçabilité étiquettes
- ✅ Impression étiquette avec lot + date + fournisseur
- ✅ Historique consommation lot
- 🔧 Import lot via scan photo BL

### 📁 8.3 · Allergènes INCO

#### 📂 8.3.1 · Déclaration
- ✅ 14 allergènes obligatoires cochés par recette
- ✅ Vue matrice par produit
- 🔧 Fiche allergène PDF par produit (obligation vitrine)

#### 📂 8.3.2 · Diffusion
- 🔧 Sync KDS (alerte serveur/cuisinier)
- ⚫ Consumer allergen event depuis réservation (voir zone 2 R2)

### 📁 8.4 · RGPD

#### 📂 8.4.1 · Consentements
- ✅ Opt-in email/SMS
- ✅ Cookie banner conforme CNIL
- ✅ Registre traitements par tenant

#### 📂 8.4.2 · Droits clients
- ✅ Droit à l'oubli (crypto-shredding)
- ✅ Export données (portabilité JSON)
- 🔧 Interface self-service client

### 📁 8.5 · Registre du personnel
- ✅ Framework en place
- 🔧 Génération PDF conforme
- ⚫ Historique modifications immuable

---

## 🖥️ Zone 9 — FACILITY & MAINTENANCE

### 📁 9.1 · Équipements

#### 📂 9.1.1 · Registre équipements
- ✅ Fiche équipement (nom, marque, date achat, garantie)
- ✅ Photo + facture achat
- 🔧 QR code physique à coller sur l'équipement
- ⚫ Historique interventions

#### 📂 9.1.2 · Maintenance préventive
- ⚫ Rappels entretien (filtre hotte tous les 3 mois)
  - 📡 émet `facility.maintenance_due` ⚫
- ⚫ Calendrier interventions
- ⚫ Contact prestataire par équipement

### 📁 9.2 · Signalements
- 🔧 Formulaire signalement panne + photo
  - 📡 émet `facility.maintenance_requested` (R12 bus) 🔧 **émetteur partiel**
- ⚫ Priorité (critique/haute/normale)
- ⚫ Assignation prestataire
- ⚫ Suivi jusqu'à résolution

### 📁 9.3 · Consommation énergétique
- ⚫ Interface Linky (Enedis API)
- ⚫ Alerte pic hors service
- ⚫ Rapport mensuel

### 📁 9.4 · Nettoyage
- ✅ Check-list ouverture/fermeture par zone
- 🔧 Registre nettoyage HACCP-adjacent
- ⚫ Photo post-nettoyage (preuve)

---

## 🖥️ Zone 10 — ANALYTICS & BI

### 📁 10.1 · Dashboards temps réel

#### 📂 10.1.1 · Dashboard salle (manager service)
- ✅ Occupation actuelle
- ✅ CA du jour vs objectif
- ✅ Ticket moyen jour
- ✅ Top plats du jour
- 🔧 Comparaison N-1 (même jour l'an dernier)

#### 📂 10.1.2 · Dashboard cuisine (chef)
- ✅ Vue KDS globale
- 🔧 Temps moyen préparation par plat
- 🔧 Ratio food cost temps réel
- ⚫ Alertes ruptures ingrédients

#### 📂 10.1.3 · Dashboard direction (propriétaire)
- ✅ CA cumulé mois/année
- ✅ Marge brute
- 🔧 Charges vs prévisionnel
- ⚫ Alertes anomalies (CA en baisse anormale)

### 📁 10.2 · Rapports périodiques

#### 📂 10.2.1 · Rapport quotidien
- ✅ Ticket Z (fin de journée)
- ✅ Ventilation TVA
- ✅ Répartition modes paiement
- 🔧 Envoi email propriétaire chaque soir

#### 📂 10.2.2 · Rapport hebdo/mensuel
- 🔧 CA + marge + food cost
- ⚫ Menu Engineering (Star/Puzzle/Plowhorse/Dog)
- ⚫ Performance staff (ventes serveur)
- ⚫ Fréquentation par créneau
- ⚫ Export PDF envoyé au comptable

#### 📂 10.2.3 · Rapports fiscaux
- ✅ FEC exportable
- ✅ Rapport TVA mensuel
- 🔧 Rapport IS annuel préparation

### 📁 10.3 · Analytics avancés

#### 📂 10.3.1 · Menu Engineering (Bruce-Miller)
- ✅ Matrice popularité × marge
- 🔧 Suggestions repositionnement
- ⚫ Historique évolution mensuelle par plat

#### 📂 10.3.2 · Analyse clientèle
- 🔧 Cohortes (clients acquis en mars 2026, rétention à N mois)
- ⚫ CLV (Customer Lifetime Value) par segment
- ⚫ Détection turnover (clients qui décrochent)

#### 📂 10.3.3 · Multi-établissements (chaîne)
- ⚫ Consolidation groupe (5 restos → dashboard unifié)
- ⚫ Benchmark inter-établissements
- ⚫ Alerte automatique si un établissement décroche
- ⚫ Export direction générale mensuel

### 📁 10.4 · Data exports
- ✅ Export CSV commandes
- ✅ Export CSV clients CRM
- 🔧 Export inventaire (comptable)
- ⚫ API GraphQL analytics (pour BI externe type Metabase)

---

## 🖥️ Zone 11 — INTELLIGENCE & IA (Oracle)

### 📁 11.1 · Oracle chat

#### 📂 11.1.1 · Chat conversationnel
- 🔧 Interface chat activée (LightRAG sidecar)
- 🔧 Questions naturelles : "Quel est mon plat le plus rentable ce mois ?"
- 🔧 Réponse SQL-free avec citations sources
- ⚫ Historique conversations
- ⚫ Suggestions questions

#### 📂 11.1.2 · Suggestions proactives
- ⚫ "Il vous reste 3 portions saumon, vente moyenne 5/soir → rupture ce soir"
- ⚫ "Ce soir vous avez 40% de couverts en moins que d'habitude"
- ⚫ Alertes anomalies (comportement inhabituel)

### 📁 11.2 · Prédictions

#### 📂 11.2.1 · Fréquentation
- 🔧 Prévision J+7 par créneau (déjeuner/dîner)
- ⚫ Impact météo (pluie/soleil)
- ⚫ Impact événements locaux (match/concert)
- ⚫ Suggestion staff optimal par créneau

#### 📂 11.2.2 · Commandes
- ⚫ Prévision commandes par catégorie
- ⚫ Suggestion menu du jour (météo + stocks + historique)
- ⚫ Prévision ruptures ingrédients

#### 📂 11.2.3 · Client
- ⚫ Prédiction turnover client (non revenu depuis 90j)
- ⚫ Suggestion relance ciblée
  - 📡 émet `intelligence.churn_risk_detected` ⚫

### 📁 11.3 · Détection anomalies
- 🔧 Détection écarts CA
- 🔧 Détection fraudes potentielles (annulations excessives)
- ✅ Détection anomalie IoT (HACCP hors seuil)
  - 📡 émet `intelligence.anomaly_detected` (R13 bus) 🔧 **émetteur partiel**

---

## 🖥️ Zone 12 — INTÉGRATIONS

### 📁 12.1 · Plateformes de commande en ligne

#### 📂 12.1.1 · Delivery
- 🔧 Deliveroo (connecteur squelette)
- ⚫ UberEats (marché critique)
- ⚫ Just Eat Takeaway
- 🔧 Stuart / Coursier local

#### 📂 12.1.2 · Click & Collect
- ⚫ Interface propre site web
- ⚫ Réception commande → KDS
- ⚫ Paiement en ligne Stripe

### 📁 12.2 · Réservations

- 🔧 Google Reserve (routes en place)
- ⚫ The Fork (Yums)
- ⚫ Zenchef

### 📁 12.3 · Paiement

- ✅ Stripe (paiement + Terminal + Billing)
- ⚫ SumUp Air
- ⚫ Ingenico Move
- ⚫ Alma (paiement fractionné)

### 📁 12.4 · Comptabilité

- ✅ Export FEC générique
- 🔧 Pennylane
- ⚫ Cegid
- ⚫ Sage 100
- ⚫ QuickBooks

### 📁 12.5 · Fournisseurs

- 🔧 Metro France
- ⚫ Transgourmet
- ⚫ Pomona
- ⚫ Sysco

### 📁 12.6 · Paie et RH

- 🔧 Payfit
- 🔧 Silae
- ⚫ Combo (planning + paie)

### 📁 12.7 · Marketing

- 🔧 Google Business Profile
- ✅ Resend (transactionnel email)
- ⚫ Sendinblue (marketing campagnes)
- ⚫ Twilio SMS (à confirmer usage)

### 📁 12.8 · Objets connectés (IoT)

- 🔧 Sondes Bluetooth Testo
- ⚫ Sondes SwissAvant
- ⚫ Compteur Linky (Enedis)
- ⚫ Balance connectée USB (Bizerba, Dibal)

---

## 🖥️ Zone 13 — PARAMÉTRAGE & ADMIN CLIENT

### 📁 13.1 · Paramètres établissement

#### 📂 13.1.1 · Identité
- ✅ Nom, SIRET, adresse, téléphone
- ✅ Logo (upload avec optim)
- ✅ Couleurs brand tokens
- ✅ Font brand (Playfair, Cormorant, custom)
- 🔧 Splash screen brandée toggle

#### 📂 13.1.2 · Horaires et calendrier
- ✅ Horaires ouverture par jour
- ✅ Jours fériés et fermetures
- ⚫ Événements spéciaux (privatisation, journée porte ouverte)

#### 📂 13.1.3 · Configuration fiscale
- ✅ Régime (BIC réel/simplifié)
- ✅ TVA par catégorie
- ✅ Numéro RCS
- ✅ Cabinet comptable (contact)

### 📁 13.2 · Utilisateurs et rôles

#### 📂 13.2.1 · Gestion utilisateurs
- ✅ Invitation par email
- ✅ Attribution rôle
- ✅ Activation/désactivation
- 🔧 Bulk import CSV (grosse équipe)

#### 📂 13.2.2 · RBAC paramétrable

##### 📄 Rôles standards (levels 10-100)
- **10** : Apprenti / Plongeur
- **20** : Commis / Serveur junior / Runner
- **30** : Serveur / Barman / Vendeur
- **40** : Chef de rang / Timeclock manager
- **50** : Sommelier / Expert produit
- **60** : Sous-chef / Manager service / Chef d'équipe
- **70** : Chef de cuisine / Chef de salle
- **80** : Directeur établissement
- **100** : Propriétaire / Super admin

##### 📄 Libellés paramétrables par client
- ✅ Renommage libellés rôles (RoleLabels par verticale)
- 🔧 Personnalisation avancée depuis MCC (super admin)
- ⚫ Rôles custom (créer un rôle sur-mesure "Chef sommelier" niveau 55)

##### 📄 Actions RBAC (ACTION_MAP)
- ✅ Framework `minLevel` par action
- ✅ Override par action pour un rôle (ex : accorder `pos.void_ticket` au serveur senior)
- 🔧 Interface admin visuelle (matrice rôles × actions)
- ⚫ Audit trail des changements RBAC (qui a changé quoi quand)

##### 📄 Actions clés (extrait)
| Action | Level défaut | Paramétrable |
|--------|:-----------:|:------------:|
| `pos.void_ticket` | 60 | ✅ |
| `pos.discount_line` (< 10%) | 30 | ✅ |
| `pos.discount_line` (> 10%) | 60 | ✅ |
| `pos.pre_authorize` | 30 | ✅ |
| `pos.override_age_check` | 60 | ✅ |
| `pos.record_tip` | 30 | ✅ |
| `pos.close_cash_drawer` | 40 | ✅ |
| `reservations.check_in` | 20 | ✅ |
| `reservations.configure_overbooking` | 70 | ✅ |
| `floorplan.edit` | 60 | ✅ |
| `floorplan.close_table` | 20 | ✅ |
| `menu.edit_prices` | 60 | ✅ |
| `menu.view_engineering` | 60 | ✅ |
| `promotions.create` | 60 | ✅ |
| `inventory.adjust` | 40 | ✅ |
| `inventory.receive` | 30 | ✅ |
| `hr.correct_timeclock` | 60 | ✅ |
| `hr.declare_absence` | 20 | ✅ |
| `hr.view_payroll` | 80 | ✅ |
| `finance.view_z_report` | 60 | ✅ |
| `finance.export_fec` | 80 | ✅ |
| `finance.close_cash_drawer` | 40 | ✅ |
| `compliance.view_haccp_history` | 40 | ✅ |
| `compliance.close_non_conformity` | 60 | ✅ |
| `facility.request_maintenance` | 20 | ✅ |
| `analytics.view_dashboard_service` | 40 | ✅ |
| `analytics.view_dashboard_direction` | 80 | ✅ |
| `intelligence.query_oracle` | 40 | ✅ |
| `settings.edit_establishment` | 80 | ✅ |
| `settings.edit_rbac` | 100 | ⚫ (uniquement owner) |
| `settings.edit_integrations` | 80 | ✅ |

### 📁 13.3 · Notifications

#### 📂 13.3.1 · Configuration notifs
- 🔧 Choix canal par événement (email/SMS/push)
- ⚫ Configuration par rôle (managers reçoivent alertes stock, pas les serveurs)
- ⚫ Silencer plages horaires (pas de push la nuit)

#### 📂 13.3.2 · Push notifications
- ✅ Framework WebPush avec VAPID
- 🔧 Émission via NexusEventBus
- ⚫ Ciblage par rôle et permissions

### 📁 13.4 · Intégrations client

#### 📂 13.4.1 · Marketplace connecteurs
- 🔧 Framework connector-hub en place
- ⚫ Auto-activation par verticale (DNA)
- 🔧 Configuration OAuth par connecteur
- ⚫ Health monitoring (ping périodique)

### 📁 13.5 · Facturation SaaS (côté client)

#### 📂 13.5.1 · Abonnement
- ✅ Plan actuel + prochain renouvellement
- ✅ Historique factures MCC
- ⚫ Changement de plan self-service
- ⚫ Portail Stripe (mise à jour CB)

---

## 📡 Events Bus — Synthèse Restaurant

### ✅ Émetteurs actifs
- `finance.journal_entry_created`
- `finance.ticket_z_closed`
- `finance.bank_synced`
- `hr.tip_declared`
- `hr.employee_created`
- `haccp.temperature_logged`
- `haccp.non_conformity_created`
- `inventory.stock_adjusted`
- `logistics.purchase_order_sent`
- `logistics.waste_recorded`
- `reservation.no_show`

### 🔧 Émetteurs partiels (à finaliser R1-R13 bus)
- `reservation.created/updated/cancelled` — **R1**
- `hr.shift_started/ended` — **R9**
- `logistics.delivery_received` — **R7**
- `finance.invoice_generated` — **R6**
- `facility.maintenance_requested` — **R12**
- `intelligence.anomaly_detected` — **R13**
- `commerce.promotion_activated` — **R4**
- `ops.table_closed` — **R11**

### ⚫ Émetteurs manquants (à construire)
- `reservation.matched` — **R2 CRITIQUE (allergènes)**
- `hr.absence_declared` — **R3**
- `commerce.loyalty_points_earned` — **R5**
- `commerce.reservation_deposit_paid` — **R10**
- `ops.course.fired/next_requested`
- `ops.table_delay_alert`
- `commerce.gift_card_issued/redeemed`
- `commerce.receipt_sent`
- `commerce.menu_activated`
- `commerce.waitlist_ready`
- `commerce.loyalty_reward_reached`
- `facility.maintenance_due`
- `haccp.threshold_exceeded`
- `hr.schedule_published`
- `hr.dpae_submitted`
- `hr.understaffed_alert`
- `intelligence.prep_time_estimated`
- `intelligence.churn_risk_detected`
- `ops.kitchen_call / service_alert`
- `ops.order_placed_from_qr`

---

# 🥖 VERTICALE BAKERY (BOULANGERIE)

## 📊 Vue d'ensemble

**Progress** : 80% (proche restaurant, mêmes zones 1-13 avec spécificités).

Les zones 1-13 sont **héritées du restaurant** avec les mêmes tâches ✅/🔧/⚫. Ce qui suit décrit **uniquement les spécificités bakery** à ajouter/remplacer.

---

## 🖥️ Zone 1 — SERVICE (spécificités bakery)

### 📁 1.4 · Production & fournées

#### 📂 1.4.1 · Planning production
- ⚫ Interface production (baguettes/croissants par fournée)
  - 🎯 ops + logistics + intelligence
  - 📡 émet `ops.batch_planned` ⚫
- ⚫ Suggestion auto historique + météo + jour semaine
- ⚫ Alarme pétrin/cuisson (mise en route → sortie four)
- ⚫ Registre production quotidien (traçabilité HACCP)
  - 🔐 `production.plan_batch` — niveau min 60 (boulanger)

#### 📂 1.4.2 · Cuisson
- ⚫ Timer fournée (60 min baguette, 20 min croissant)
- ⚫ Alerte sortie four SMS/push
- ⚫ Historique fournées (nb pièces / lot farine)

### 📁 1.5 · Vente comptoir (POS mode flux rapide)

#### 📂 1.5.1 · Interface caisse
- 🔧 Mode "flux rapide" (gros boutons favoris)
- ⚫ Balance connectée USB (Bizerba, Dibal) — vente au poids
  - 📡 émet `commerce.weighed_item_sold` ⚫
- ⚫ Impression étiquette prix à la part
- ⚫ Rendu monnaie grand écran client

### 📁 1.6 · Précommandes clients

#### 📂 1.6.1 · Commande à l'avance
- ⚫ Saisie précommande ("dimanche 8h : 3 tradi + tarte pommes 6 parts")
- ⚫ Notification production auto la veille au soir
- ⚫ Retrait comptoir (scan numéro commande)
  - 📡 émet `commerce.pre_order_placed` ⚫
- ⚫ Acompte ou paiement retrait (choix client)

---

## 🖥️ Zone 4 — CLIENTS (spécificités bakery)

### 📁 4.4 · Comptes clients pro (B2B)

#### 📂 4.4.1 · Cafés / restos / hôtels / entreprises
- ⚫ Compte pro avec conditions négociées
- ⚫ Commandes récurrentes ("40 croissants lundi-vendredi 7h")
  - 📡 émet `commerce.recurring_order_scheduled` ⚫
- ⚫ Facturation mensuelle groupée
- ⚫ Portail client (consulter historique + modifier)

---

## 🖥️ Zone 5 — STOCK (spécificités bakery)

### 📁 5.4 · Traçabilité farine
- ⚫ Lot farine par fournée (obligation rappels)
- ⚫ Lien fournée → produits vendus (traçabilité rappel)
  - 📡 émet `haccp.batch_tracked` ⚫

### 📁 5.5 · Fournisseurs boulangerie
- ⚫ Catalogue Grands Moulins de Paris
- ⚫ Catalogue Foricher / Girardeau
- ⚫ Alerte stock farine hebdo

---

## 🖥️ Zone 11 — INTELLIGENCE (spécificités bakery)

### 📁 11.4 · Prédiction demande fournées
- ⚫ Historique × jour semaine × météo → suggestion fournée
- ⚫ Suivi précision prédiction (auto-amélioration)

### 📁 11.5 · Gestion invendus
- ⚫ Prédiction fin de journée
- ⚫ Suggestion pricing dynamique (-30% après 18h)
- ⚫ Intégration Too Good To Go / Phenix pour don
  - 📡 émet `commerce.food_donated` ⚫

---

## 📡 Events bus spécifiques bakery
- ⚫ `ops.batch_planned`
- ⚫ `commerce.weighed_item_sold`
- ⚫ `commerce.pre_order_placed`
- ⚫ `commerce.recurring_order_scheduled`
- ⚫ `haccp.batch_tracked`
- ⚫ `commerce.food_donated`

---

# 🛍️ VERTICALE RETAIL (COMMERCE DE DÉTAIL)

## 📊 Vue d'ensemble

**Progress** : 60% (catalogue et POS génériques OK, spécifiques e-commerce et variantes à construire).

---

## 🖥️ Zone 1 — VENTE COMPTOIR (pas de KDS ni plan de salle)

### 📁 1.7 · POS retail
- ⚫ Mode caisse pure (pas de table, pas de KDS)
- ⚫ Scan EAN-13 (webcam ou lecteur USB Zebra/Datalogic)
- ⚫ Recherche produit rapide (autocomplete nom/ref)
- ⚫ Multi-tarifs (pro/particulier/soldé)

### 📁 1.8 · Retours & échanges
- ⚫ Recherche ticket original
- ⚫ Retour partiel (1 article sur 3 achetés)
- ⚫ Note de crédit à valoir
- ⚫ Politique retour configurable (14j/30j)
  - 📡 émet `commerce.return_processed` ⚫
  - 🔐 `pos.process_return` — niveau min 30

### 📁 1.9 · Bons cadeaux
- ⚫ Émission (QR ou email)
- ⚫ Suivi valeur restante
- ⚫ Rapport bons émis/utilisés

---

## 🖥️ Zone 3 — MENU/CATALOGUE (spécificités retail)

### 📁 3.4 · Variantes produits (tailles × couleurs)
- ⚫ Matrice variantes (T-shirt : S/M/L × Rouge/Bleu/Noir)
- ⚫ Stock par variante
- ⚫ Impression étiquette par variante avec EAN

### 📁 3.5 · E-commerce natif

#### 📂 3.5.1 · Connecteurs
- ⚫ Shopify (P0)
  - 📡 émet `commerce.web_order_received` ⚫
- ⚫ WooCommerce (P0)
- ⚫ Prestashop (P1, marché FR)
- ⚫ Amazon MWS (P1)
- ⚫ Cdiscount / Manomano (P2)

#### 📂 3.5.2 · Réconciliation
- ⚫ Commande web → fulfilment magasin ou expédition
- ⚫ Sync stock temps réel (pas de survente)

---

## 🖥️ Zone 5 — STOCK (spécificités retail)

### 📁 5.6 · Multi-emplacement
- ⚫ Stock par emplacement (boutique/réserve/entrepôt)
- ⚫ Transfert entre emplacements
  - 📡 émet `inventory.transfer_completed` ⚫
- ⚫ Vue consolidée + par emplacement

### 📁 5.7 · Inventaire physique
- ⚫ Assistant annuel (scan tous produits)
- ⚫ Écart théorique/réel + justification
- ⚫ Ajustement auto après validation

---

## 🖥️ Zone 6 — HR (spécificités retail)

### 📁 6.6 · Commissions vendeur
- ⚫ Suivi ventes par vendeur
- ⚫ Commission % par catégorie
- ⚫ Rapport mensuel commission
- ⚫ Objectifs mensuels avec tracker

---

## 🖥️ Zone 10 — ANALYTICS (spécificités retail)

### 📁 10.5 · Ruptures et rotations
- ⚫ Rotation lente (non vendu 90j)
  - 📡 émet `intelligence.slow_moving_detected` ⚫
- ⚫ ABC analysis (top 20% = 80% CA)
- ⚫ Suggestion réassort auto

---

## 📡 Events spécifiques retail
- ⚫ `commerce.return_processed`
- ⚫ `commerce.web_order_received`
- ⚫ `commerce.gift_card_issued/redeemed`
- ⚫ `inventory.transfer_completed`
- ⚫ `intelligence.slow_moving_detected`

---

# 💇 VERTICALE SALON (COIFFURE / ESTHÉTIQUE)

## 📊 Vue d'ensemble

**Progress** : 50% (appointments génériques OK, agenda visuel et commissions à construire).

---

## 🖥️ Zone 2 — RÉSERVATIONS (spécificités salon — CENTRE DU MÉTIER)

### 📁 2.4 · Agenda visuel collaborateurs

#### 📂 2.4.1 · Vue Gantt journée
- ⚫ Colonnes = collaborateurs × lignes = créneaux 15 min
- ⚫ Drag & drop RDV entre créneaux
  - 📡 émet `appointment.rescheduled` ⚫
- ⚫ Bloc "pause" configurable
- ⚫ Vue semaine (planning global)

#### 📂 2.4.2 · Auto-attribution
- ⚫ "Cliente veut Sophie pour couleur" → suggère créneaux libres Sophie
- ⚫ Filtrage par compétence (coloriste vs coupe)

### 📁 2.5 · Walk-in barbier
- ⚫ File d'attente sans RDV
- ⚫ Temps d'attente estimé
- ⚫ SMS d'appel ("Dans 5 min !")
  - 📡 émet `commerce.walkin_notified` ⚫

### 📁 2.6 · Prise RDV en ligne (site salon)
- ⚫ Page publique par salon (`salon-marie.mycaisse.fr`)
- ⚫ Sélection prestation + collaborateur
- ⚫ Créneaux libres temps réel
- ⚫ Acompte optionnel (10-30% Stripe)

---

## 🖥️ Zone 4 — CLIENTS (spécificités salon)

### 📁 4.5 · Fiche technique cliente

#### 📂 4.5.1 · Historique prestations
- ⚫ Dates, prestations, prix
- ⚫ Formule couleur utilisée (Wella 6.34 + 20 vol, temps 25 min)
- ⚫ Photos avant/après
- ⚫ Notes personnelles ("préfère ambiance calme")

#### 📂 4.5.2 · Sécurité couleur
- ⚫ Patch test PPD (paraphénylènediamine) obligatoire
- ⚫ Date validité (6 mois)
- ⚫ Refus service si test expiré
  - 📡 émet `compliance.allergy_test_missing` ⚫

### 📁 4.6 · Relances automatiques
- ⚫ Client non revenu 45j → "Il est temps de reprendre RDV"
- ⚫ Anniversaire → SMS "-20% ce mois"

---

## 🖥️ Zone 6 — HR (spécificités salon)

### 📁 6.7 · Commissions coiffeur
- ⚫ Configuration par collaborateur (fixe / % / paliers)
- ⚫ Ex : Sophie = 40% prestations + 15% produits
- ⚫ Calcul auto mensuel
- ⚫ Bulletin commission PDF
- ⚫ Intégration paie
  - 📡 émet `hr.commission_calculated` ⚫

---

## 🖥️ Zone 5 — STOCK (spécificités salon)

### 📁 5.8 · Produits pro
- ⚫ Inventaire colorations, oxydants, shampooings pros
- ⚫ Consommation par prestation (1 couleur = 60g Wella)
- ⚫ Commande auto L'Oréal Pro / Kadus / Wella
  - 📡 émet `logistics.pro_products_reorder` ⚫

---

## 📡 Events spécifiques salon
- ⚫ `appointment.rescheduled`
- ⚫ `commerce.walkin_notified`
- ⚫ `compliance.allergy_test_missing`
- ⚫ `hr.commission_calculated`
- ⚫ `logistics.pro_products_reorder`

---

# 🚗 VERTICALE GARAGE (AUTOMOBILE)

## 📊 Vue d'ensemble

**Progress** : 55% (RepairIntake amorcé, devis pièces + planning atelier à construire).

---

## 🖥️ Zone 2 — INTAKE (spécificité garage)

### 📁 2.7 · Fiche véhicule

#### 📂 2.7.1 · Identification
- ⚫ Immat client → auto-fetch SIV (marque/modèle/année)
  - 📡 émet `service.vehicle_identified` ⚫
- ⚫ Kilométrage à l'entrée
- ⚫ Photos état extérieur
- ⚫ Historique interventions (dates + km)

#### 📂 2.7.2 · Ordre de Réparation (OR)
- 🔧 ServiceTicket → OR
- ⚫ Génération document légal OR
- ⚫ Signature électronique client (Yousign)
  - 📡 émet `service.repair_order_signed` ⚫
- ⚫ Suivi statut ("Pièces reçues", "Test route", "Prêt")

---

## 🖥️ Zone 3 — CATALOGUE (spécificités garage)

### 📁 3.6 · Devis pièces + main d'oeuvre

#### 📂 3.6.1 · Recherche pièces
- ⚫ Catalogue AD Autodistribution
- ⚫ Catalogue Groupauto
- ⚫ Recherche référence OEM ou équivalent
- ⚫ Comparaison prix multi-fournisseurs

#### 📂 3.6.2 · Temps main d'oeuvre
- ⚫ Barème constructeur ou Autodata
- ⚫ Calcul total HT/TTC
- ⚫ Ventilation obligatoire pièces / MO
- ⚫ Envoi devis PDF client (email/SMS avec lien signature)
  - 📡 émet `service.quote_sent` ⚫

---

## 🖥️ Zone 6 — HR (spécificités garage)

### 📁 6.8 · Planning atelier
- ⚫ Vue journée mécaniciens × heures × interventions
- ⚫ Drag & drop réattribution
- ⚫ Temps réel ("Julien a fini 308 en 4h vs 5h prévu")
  - 📡 émet `service.intervention_completed` ⚫
- ⚫ Alerte surcharge

---

## 🖥️ Zone 8 — COMPLIANCE (spécificités garage)

### 📁 8.6 · Environnement
- ⚫ Registre déchets dangereux (huiles, batteries, filtres)
- ⚫ Bordereau de suivi BSDD vers collecteur agréé
  - 📡 émet `compliance.waste_manifest_created` ⚫

### 📁 8.7 · Rappels réglementaires
- ⚫ Contrôle Technique rappel 2 mois avant
- ⚫ Révisions constructeur

---

## 📡 Events spécifiques garage
- ⚫ `service.vehicle_identified`
- ⚫ `service.repair_order_signed`
- ⚫ `service.quote_sent`
- ⚫ `service.intervention_completed`
- ⚫ `compliance.waste_manifest_created`

---

# 🏨 VERTICALE HOTEL

## 📊 Vue d'ensemble

**Progress** : 40% (rooms basiques, PMS et channel manager à construire).

---

## 🖥️ Zone 2 — RÉSERVATIONS HÔTEL (PMS)

### 📁 2.8 · Vue calendrier chambres
- ⚫ Gantt chambres × jours
- ⚫ Drag & drop client entre chambres
  - 📡 émet `booking.room_reassigned` ⚫
- ⚫ Bloc "hors service"
- ⚫ Check-in / check-out signature électronique

### 📁 2.9 · Channel manager

#### 📂 2.9.1 · Connecteurs OTA
- ⚫ Booking.com API
  - 📡 émet `booking.ota_synced` ⚫
- ⚫ Expedia Rapid
- ⚫ Airbnb API (Guesty)
- ⚫ Hostelworld

#### 📂 2.9.2 · Sync temps réel
- ⚫ Stock chambres (pas de surbooking)
- ⚫ Prix (yield management)
- ⚫ Restrictions (min stay)

### 📁 2.10 · Groupes et séminaires
- ⚫ Multi-chambres + salle séminaire
- ⚫ Facturation entreprise
- ⚫ Prix négocié
- ⚫ Suivi acompte / solde

---

## 🖥️ Zone 9 — FACILITY (spécificités hôtel)

### 📁 9.5 · Housekeeping
- ⚫ Vue statuts chambres (à faire / en cours / propre / inspectée)
  - 📡 émet `facility.room_cleaned` ⚫
- ⚫ Attribution femme de chambre par étage
- ⚫ Notification arrivée anticipée → priorité
- ⚫ Signalement problèmes (télé cassée)

---

## 🖥️ Zone 1 — SERVICE (spécificité hôtel : Room Service)

### 📁 1.10 · Room service
- ⚫ Commande depuis chambre (QR menu ou téléphone)
- ⚫ Envoi cuisine (KDS partagé F&B hôtel)
  - 📡 émet `ops.room_service_ordered` ⚫
- ⚫ Livraison chambre avec coche "livré"
- ⚫ Ajout auto à la facture chambre

---

## 🖥️ Zone 7 — FINANCE (spécificités hôtel)

### 📁 7.6 · Facturation cumulée séjour
- ⚫ Cumul auto : nuitées + petit-déj + F&B + minibar + spa + parking
  - 📡 émet `finance.folio_updated` ⚫
- ⚫ Facture unique fin de séjour
- ⚫ Split facture (client paie chambre, entreprise paie séminaire)

### 📁 7.7 · Yield Management
- ⚫ Prix dynamique selon taux occupation
- ⚫ Règles ("> 80% occup → +15%")
- ⚫ Historique + optimisation

---

## 🖥️ Zone 8 — COMPLIANCE (spécificités hôtel)

### 📁 8.8 · Registre police
- ⚫ Registre voyageurs (obligation)
  - 📡 émet `compliance.guest_registered` ⚫
- ⚫ Déclaration mensuelle préfecture

### 📁 8.9 · Taxe séjour
- ⚫ Calcul auto par nuitée / personne
- ⚫ Barème par commune
- ⚫ Reversement mensuel/trimestriel mairie
  - 📡 émet `finance.tourist_tax_calculated` ⚫

---

## 📡 Events spécifiques hôtel
- ⚫ `booking.room_reassigned`
- ⚫ `booking.ota_synced`
- ⚫ `facility.room_cleaned`
- ⚫ `ops.room_service_ordered`
- ⚫ `finance.folio_updated`
- ⚫ `compliance.guest_registered`
- ⚫ `finance.tourist_tax_calculated`

---

# 🩺 VERTICALE CLINIC (PARAMÉDICAL / SANTÉ)

## 📊 Vue d'ensemble

**Progress** : 35% (consultation amorcée, tiers-payant + DMP + Ségur à construire).

---

## 🖥️ Zone 2 — RÉSERVATIONS (spécificités clinic)

### 📁 2.11 · Doctolib sync
- ⚫ Sync bidirectionnelle API Doctolib
- ⚫ RDV Doctolib → apparaît agenda plateforme
  - 📡 émet `appointment.imported_from_doctolib` ⚫
- ⚫ RDV direct → sync inverse

### 📁 2.12 · Télé-consultation
- ⚫ Intégration Doctolib Télésanté
- ⚫ Alternatives : Livi, Qare, Maiia
- ⚫ Salle d'attente virtuelle
- ⚫ Cotation acte télé-consultation

---

## 🖥️ Zone 4 — CLIENTS (Dossier Médical Partagé)

### 📁 4.7 · DMP (Dossier Médical Patient)

#### 📂 4.7.1 · Antécédents
- ⚫ Antécédents médicaux
- ⚫ Allergies
- ⚫ Traitements en cours
- ⚫ Historique consultations avec cotation
  - 🔐 `patient.view_medical_record` — niveau min 60 (praticien)

#### 📂 4.7.2 · Bilans thérapeutiques
- ⚫ Bilan initial + objectifs (kiné, ostéo)
- ⚫ Évolution (EVA douleur, mobilité)
- ⚫ Photos évolution (dermato, blessures)

### 📁 4.8 · Ordonnances
- ⚫ Éditeur ordonnance avec templates
- ⚫ Envoi patient email/SMS
  - 📡 émet `patient.prescription_sent` ⚫
- ⚫ Envoi pharmacie (Ordoclic)
- ⚫ Historique par patient

---

## 🖥️ Zone 7 — FINANCE (spécificités clinic : tiers-payant)

### 📁 7.8 · Feuille de Soins Électronique (FSE)
- ⚫ Lecture carte Vitale (lecteur GALSS ou Cegetel)
- ⚫ Génération FSE conforme
- ⚫ Télétransmission Cegetel/Almerys/Cnda
  - 📡 émet `finance.fse_sent` ⚫
- ⚫ Suivi paiement Sécu (délai 5j)

### 📁 7.9 · Tiers-payant
- ⚫ Interrogation droits Vitale
- ⚫ Facturation part Sécu directe
- ⚫ Facturation part mutuelle
- ⚫ Reste à charge patient

### 📁 7.10 · Cotation actes
- ⚫ Nomenclature NGAP (paramédical : AMK, AMS, AMO)
- ⚫ Nomenclature CCAM (médical)
- ⚫ Calcul auto prix Sécu + complémentaire
- ⚫ Vérification cumul actes autorisé

---

## 🖥️ Zone 8 — COMPLIANCE (RGPD santé)

### 📁 8.10 · HDS et RGPD santé
- ⚫ Certification Hébergeur Données Santé (OVH Santé, AWS HDS)
- ⚫ Consentement explicite art. 9 RGPD
- ⚫ Conservation dossier 20 ans obligatoire
- ⚫ Journal accès (qui a consulté quand)
  - 📡 émet `compliance.medical_record_accessed` ⚫

### 📁 8.11 · Ségur numérique santé
- ⚫ Compatibilité ROSP
- ⚫ Intégration Mon Espace Santé
  - 📡 émet `compliance.segur_sync_completed` ⚫
- ⚫ Envoi vers MSS (Messagerie Sécurisée Santé)

---

## 📡 Events spécifiques clinic
- ⚫ `appointment.imported_from_doctolib`
- ⚫ `patient.prescription_sent`
- ⚫ `finance.fse_sent`
- ⚫ `compliance.medical_record_accessed`
- ⚫ `compliance.segur_sync_completed`

---

# 🎨 VERTICALE CUSTOM (SUR-MESURE)

## 📊 Vue d'ensemble

**Progress** : 20% (2/9 adapters, framework de personnalisation à construire).

Custom = **framework**, pas produit fini. Objectif : permettre à des intégrateurs/consultants de configurer la plateforme pour des métiers "long tail".

---

## 🖥️ Zone 13 — PARAMÉTRAGE (spécificités custom)

### 📁 13.6 · Custom fields
- ⚫ Éditeur no-code : ajouter champ "Type de peau" fiche client
  - 🔐 `settings.add_custom_field` — niveau min 100
- ⚫ Types : texte, nombre, date, sélection, multi-sélection, fichier, calcul dérivé
- ⚫ Groupement par section

### 📁 13.7 · Formulaires custom
- ⚫ Éditeur wizard : formulaire de prise en charge métier
- ⚫ Ex auto-école : questionnaire médical préalable
- ⚫ Ex photographe : brief avant séance

### 📁 13.8 · Workflow builder
- ⚫ Éditeur no-code séquences
- ⚫ "Après RDV → SMS satisfaction J+1 → email newsletter J+30"
- ⚫ Trigger-based (events du bus)
  - 📡 émet `workflow.custom_step_executed` ⚫

### 📁 13.9 · Templates communautaires
- ⚫ Store de templates par métier
- ⚫ Fork template → adapter à son cas
- ⚫ Contribution partagée

---

# 🔀 CROSS-VERTICAL — Chantiers transverses

## 📁 CX.1 · Application mobile Expo

Modules par verticale :
- Restaurant : caisse iPad + KDS tablette + manager smartphone
- Bakery : caisse comptoir tactile
- Retail : caisse iPad + scanner Bluetooth
- Salon : agenda mobile + reporting manager
- Garage : réceptionniste tablette + fiche véhicule
- Hotel : housekeeping mobile + reception iPad
- Clinic : agenda praticien + saisie compte-rendu

Statut : ⚫ (débloqué par API REST Hono — Sprint S5 du roadmap execution)

## 📁 CX.2 · API REST Hono (S5)
- ⚫ Serveur Hono découplé
- ⚫ Routes v1 (orders, menu, reservations, timeclock, inventory)
- ⚫ Auth Bearer JWT
- ⚫ OpenAPI auto-généré

## 📁 CX.3 · CI/CD (S2)
- ⚫ `.github/workflows/gate.yml`
- ⚫ Protection branche merge
- ⚫ Deploy staging auto
- ⚫ Notification Slack

## 📁 CX.4 · Monitoring (S3)
- ✅ Sentry câblé multi-tenant
- ⚫ DSN production configuré
- ⚫ Alertes FISCAL_/SovereignGuard/DLQ
- ⚫ Axiom logs structurés
- ⚫ Uptime monitor

## 📁 CX.5 · MCC provisioning ref/custom (S4)
- ✅ SystemTenantRegistry (24 tenants système)
- ✅ cloneFromReference()
- ✅ Write-guard `_ref_*` / `_demo_*`
- 🔧 Preview avant clone dans SystemTenantsTab
- 🔧 Choix ref vs custom explicite dans wizard
- ⚫ Indicateur read-only sur formulaires système
- ⚫ Promote test→ref avec diff visuel

## 📁 CX.6 · Marketplace connecteurs (H4)
- 🔧 Framework connector-hub en place
- ⚫ Auto-activation par DNA (verticale)
- ⚫ Self-service client (activer sans MCC)
- ⚫ Health monitoring périodique
- ⚫ Marketplace publique avec docs

## 📁 CX.7 · Multi-établissements (H4)
- ⚫ Dashboard consolidé groupe
- ⚫ Comparaison inter-établissements
- ⚫ Stock/staff partagé si applicable
- ⚫ Facturation centralisée
- ⚫ RBAC hiérarchique (directeur groupe > directeur établissement)

## 📁 CX.8 · Intelligence Oracle par verticale
- 🔧 LightRAG opérationnel
- ⚫ Prompts spécialisés par verticale
- ⚫ Fine-tuning modèles par domaine (H4)

---

# 📈 Phasing global multi-verticales

## T+0 à T+3 mois — 🎯 RESTAURANT priorité absolue

**Objectif** : 30 clients restaurant payants + valider les Sprints 1-13 du roadmap execution.

**Sprints prioritaires** :
- Sprint 1 bus (R1-R13 émetteurs)
- Sprint 2 CI/CD + tests intégration
- Sprint 3 monitoring
- Sprint 4 MCC provisioning
- Sprint 5 API REST Hono
- Sprint 6-8 onboarding + documentation + facturation

**Nouveau code par zone** : zone 1 (POS avancé, KDS pro), zone 2 (R2 bouton accueillir), zone 4 (fidélité opérationnelle).

## T+3 à T+6 mois — 🥖 BAKERY en extension

**Objectif** : 20 boulangeries + validation du framework "verticale héritée".

**Sprints** :
- OPS-B1 planning production
- OPS-B2 vente comptoir + balance
- OPS-B3 précommandes
- COM-B1 clients pro
- INT-B1/B2 prédiction demande + invendus

## T+6 à T+12 mois — 💇 SALON + 🛍️ RETAIL en parallèle

**Objectif** : 100 clients cumulés sur les 2 verticales.

**Sprints salon** : OPS-S1 agenda visuel · COM-S1 RDV en ligne · FIN-S1 commissions · OPS-S2 fiche technique.

**Sprints retail** : OPS-RT1 POS retail · OPS-RT2 retours · COM-RT1 e-commerce · LOG-RT1 multi-emplacement · LOG-RT2 variantes.

## T+12 à T+18 mois — 🚗 GARAGE niche premium

**Objectif** : 100 garages payants (ticket moyen élevé).

**Sprints** : OPS-G1 fiche véhicule · OPS-G2 devis pièces · OPS-G4 planning atelier · COM-G1 RDV en ligne · FIN-G1 facturation détaillée.

## T+18 à T+24 mois — 🏨 HOTEL + 🩺 CLINIC (verticales complexes)

**Sprints hotel** : PMS core, channel manager (Booking + Expedia + Airbnb), housekeeping, room service, yield management.

**Sprints clinic** : Doctolib sync, FSE tiers-payant, DMP, ordonnances, Ségur numérique santé, HDS hébergement.

## T+24+ — 🎨 CUSTOM en ouverture

Custom fields, formulaires custom, workflow builder, templates communautaires, programme intégrateurs.

---

# 🎯 Objectifs consolidés

| Horizon | MRR total | Clients cumulés | Verticales actives |
|:-------:|:---------:|:---------------:|:-------------------|
| **T+6** | ~10 000€ | ~50 | 🍽️ + 🥖 |
| **T+12** | ~50 000€ | ~250 | + 💇 + 🛍️ |
| **T+18** | ~120 000€ | ~600 | + 🚗 |
| **T+24** | ~250 000€ | ~1 200 | + 🏨 + 🩺 |
| **T+36** | ~600 000€ | ~2 500 | + 🎨 (toutes) |

---

# 🔑 Ce qui fait tenir cette roadmap

1. ✅ **Le tronc est construit** — 8 piliers × 30 modules × 8 verticales généralisées.
2. ✅ **La dette est identifiée** — plan complet v6.0 documente les blocages restants.
3. ✅ **Chaque verticale a un leader identifié** dans les concurrents — tu proposes 20-30% mieux sur des points précis.
4. ✅ **La rentabilité opère au-delà de 100 clients cumulés** — à 10k€ MRR, tu couvres les frais fixes.
5. ✅ **L'écosystème connecteurs t'affranchit** de développer tout toi-même.

---

# 🚨 La décision T+0

Après Horizon 1 (Prod-Ready) du `ROADMAP_EXECUTION.md`, ta première décision stratégique :

**🍽️ Restaurant seul les 3 premiers mois** (recommandation) — validation ultra-focalisée, tous les efforts commerciaux et supports sur une verticale.

**🍽️ + 🥖 en parallèle** — élargit la base acquisition mais dilue l'attention.

Recommandation : Restaurant seul jusqu'à 30 clients payants, puis bakery en opportunité.
