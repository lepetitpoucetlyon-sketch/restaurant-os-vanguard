# 🗺️ Spécifications & Architecture des 8 Verticales Métier

> **Spécifications Sectorielles & Matrice des Connecteurs Partenaires**  
> **Codebase** : `src/verticals/`, `src/lib/connectors/`  
> **Principe** : Zéro modification du noyau central lors du déploiement d'une verticale.

---

## 📚 Sommaire

1. [Synthèse Comparative des 8 Verticales](#1-synthèse-comparative-des-8-verticales)
2. [🍽️ Verticale 1 — Restaurant & Brasserie](#2-️-verticale-1--restaurant--brasserie)
3. [🥖 Verticale 2 — Boulangerie & Pâtisserie (Bakery)](#3--verticale-2--boulangerie--pâtisserie-bakery)
4. [🛍️ Verticale 3 — Commerce de Détail (Retail)](#4-️-verticale-3--commerce-de-détail-retail)
5. [💇 Verticale 4 — Coiffure & Esthétique (Salon)](#5--verticale-4--coiffure--esthétique-salon)
6. [🚗 Verticale 5 — Garage & Reparation Auto](#6--verticale-5--garage--reparation-auto)
7. [🏨 Verticale 6 — Hôtel & Hébergement (PMS Lite)](#7--verticale-6--hôtel--hébergement-pms-lite)
8. [🩺 Verticale 7 — Clinique & Paramédical (Health)](#8--verticale-7--clinique--paramédical-health)
9. [🎨 Verticale 8 — Custom & Concept Stores](#9--verticale-8--custom--concept-stores)
10. [🔌 Matrice des Connecteurs Partenaires](#10--matrice-des-connecteurs-partenaires)

---

## 1. Synthèse Comparative des 8 Verticales

| Verticale | Écran Principal | Unité de Vente | Réglementation Critique | Connecteur Clé | Gating Culinaire (`usesCulinaryStock`) |
|---|---|---|---|---|:---:|
| 🍽️ **Restaurant** | Plan de Salle + KDS | Plat / Menu / Couvert | NF525 · HACCP · INCO | Zenchef / UberEats | `true` |
| 🥖 **Bakery** | Grille Comptoir + Poids | Unité / Kg (Balance) | NF525 · Traçabilité Farine | Balance Mettler / TGTG | `true` |
| 🛍️ **Retail** | Caisse Scan EAN13 | Pièce (Variantes) | NF525 · Droit Rétractation | Douchette / Shopify | `false` |
| 💇 **Salon** | Agenda Cabine / Coiffeur | Forfait / Prestation | NF525 · RGPD Photos | Planity / Treatwell | `false` |
| 🚗 **Garage** | Tableau Ordres Réparation | Pièce + Heure MO | NF525 · Mentions CGV Auto | Autossimo / Darva | `false` |
| 🏨 **Hotel** | Grille Chambres (Rack) | Nuitée + Taxe Séjour | NF525 · Fiche Police | Booking / Expedia | `false` (option bar) |
| 🩺 **Clinic** | Agenda Consultations | Acte Médical (CCAM) | HDS · RGPD Santé · CSP | SESAM-Vitale / Doctolib | `false` |
| 🎨 **Custom** | Tableur Dynamique | Entité Paramétrable | NF525 Généralisé | Webhooks Universels | `paramétrable` |

---

## 2. 🍽️ Verticale 1 — Restaurant & Brasserie

* **Dossier Codebase** : `src/verticals/restaurant/`
* **Spécificités** :
  - **Plan de salle 2D/3D dynamique** avec gestion des tables, rotations et regroupements.
  - **KDS (Kitchen Display System)** multi-stations (Chaud, Froid, Bar) avec chronomètres d'alerte.
  - **Fiches techniques et allergènes INCO** (14 allergènes majeurs) avec décrémentation automatique de stock par gramme.
  - **Split d'addition avancé** (par couvert, par plat ou par montant libre).

---

## 3. 🥖 Verticale 2 — Boulangerie & Pâtisserie (Bakery)

* **Dossier Codebase** : `src/verticals/bakery/`
* **Spécificités** :
  - **Planning de cuisson & fournées** : Cadencement des cuissons selon l'affluence de la journée.
  - **Vente au poids** : Intégration balance homologuée via le protocole Dialogue 06.
  - **Traiteur & Précommandes** : Gestion des acomptes pour gâteaux sur commande et pièces montées.
  - **Valorisation des invendus** : Intégration Too Good To Go et dons alimentaires.

---

## 4. 🛍️ Verticale 3 — Commerce de Détail (Retail)

* **Dossier Codebase** : `src/verticals/retail/`
* **Spécificités** :
  - **Scan douchette 2D** : Encaissement ultra-rapide par lecture de codes EAN-13 / QR articles.
  - **Matrice Variantes (Taille / Couleur / Matière)** : Déclinaison automatique des SKU et gestion des stocks par variante.
  - **Synchronisation E-Commerce 2-ways** : Connecteur natif Shopify et WooCommerce pour unifier le stock magasin et web.

---

## 5. 💇 Verticale 4 — Coiffure & Esthétique (Salon)

* **Dossier Codebase** : `src/verticals/salon/`
* **Spécificités** :
  - **Agenda collaboratif par cabine / fauteuil** : Prise de RDV en ligne avec attribution de collaborateur.
  - **Fiches techniques coloration** : Historique des formules utilisées pour chaque client avec photos avant/après sécurisées.
  - **Calcul automatique des commissions** : Ventilation des ventes de prestations et de produits cosmétiques par coiffeur.

---

## 6. 🚗 Verticale 5 — Garage & Réparation Auto

* **Dossier Codebase** : `src/verticals/garage/`
* **Spécificités** :
  - **Ordres de Réparation (OR)** : Relevé de kilométrage, inspection carrosserie, signature tablette à la réception.
  - **Barème de temps & Pièces détachées** : Chiffrage combiné pièces (catalogues TecDoc) et main d'œuvre.
  - **Mentions légales obligatoires auto** : Numéro VIN, immatriculation SIV et prochain contrôle technique sur les factures.

---

## 7. 🏨 Verticale 6 — Hôtel & Hébergement (PMS Lite)

* **Dossier Codebase** : `src/verticals/hotel/`
* **Spécificités** :
  - **Rack des chambres** : Planning visuel de réservation, statuts de ménage (propre, sale, inspection).
  - **Facturation Folio / Note de chambre** : Transfert direct des consommations bar et restaurant sur le compte de la chambre.
  - **Channel Manager** : Synchronisation automatique 2-ways avec Booking.com, Expedia et Airbnb.

---

## 8. 🩺 Verticale 7 — Clinique & Paramédical (Health)

* **Dossier Codebase** : `src/verticals/clinic/`
* **Spécificités** :
  - **Hébergement HDS & Sécurité** : Déploiement certifié Données de Santé avec chiffrement renforcé.
  - **Télétransmission SESAM-Vitale & FSE** : Facturation des actes médicaux (CCAM) et gestion du tiers-payant mutuelle.
  - **Dossier Patient Informatisé (DPI)** : Historique des consultations, prescriptions et suivi Mon Espace Santé.

---

## 9. 🎨 Verticale 8 — Custom & Concept Stores

* **Dossier Codebase** : `src/verticals/custom/`
* **Spécificités** :
  - **Composition à la carte** : Activation / désactivation des modules (ex: Caisse POS seule, sans RH ni Stock).
  - **Champs personnalisés & Tableur dynamique** : Adaptation aux commerces hybrides (café-librairie, salon-boutique).

---

## 10. 🔌 Matrice des Connecteurs Partenaires

| Connecteur | Domaine | Status | Protocoles | Verticales Cibles |
|---|---|:---:|---|---|
| **Stripe / Terminal** | Paiement CB | ✅ Prod | REST / SDK Native | Toutes |
| **Zenchef / TheFork** | Réservation | ✅ Prod | Webhooks / OAuth2 | Restaurant, Hotel |
| **UberEats / Deliveroo**| Livraison | ✅ Prod | OAuth2 / Webhook API | Restaurant, Bakery |
| **Shopify / Woo** | E-Commerce | 🔧 Prepa | GraphQL / REST | Retail, Bakery |
| **Planity / Treatwell**| RDV Beauté | 🔧 Prepa | REST API | Salon |
| **Booking / Expedia** | PMS Channel | ⬜ Prevu | OTA XML / iCal | Hotel |
| **Darva / TecDoc** | Pièces Auto | ⬜ Prevu | EDI / Webservice | Garage |
| **SESAM-Vitale** | Télétransmission| ⬜ Prevu | FSE / Carte Vitale | Clinic |
| **Pennylane / Silae** | Compta / Paie | ✅ Prod | Export XML / API | Toutes |
