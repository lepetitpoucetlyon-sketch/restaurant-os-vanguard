# 🗺️ Spécifications & Architecture des 8 Verticales Métier

> **Spécifications Sectorielles, Réglementations, Connecteurs & Cas Limites**
> **Codebase** : [`src/verticals/`](../../src/verticals/), [`src/lib/connectors/`](../../src/lib/connectors/), [`src/shared/eventBus/events/vertical.events.ts`](../../src/shared/eventBus/events/vertical.events.ts)
> **Principe fondateur** : **Zéro modification du noyau central** lors du déploiement d'une verticale — coût marginal ~48h par nouvelle verticale via `VerticalRegistry` + `MetricLabels`.
> **Dernière révision** : 2026-08-15

---

## 📚 Sommaire

1. [Synthèse Comparative des 8 Verticales](#1-synthèse-comparative-des-8-verticales)
2. [🍽️ Verticale 1 — Restaurant & Brasserie](#2-️-verticale-1--restaurant--brasserie)
3. [🥖 Verticale 2 — Boulangerie & Pâtisserie (Bakery)](#3--verticale-2--boulangerie--pâtisserie-bakery)
4. [🛍️ Verticale 3 — Commerce de Détail (Retail)](#4-️-verticale-3--commerce-de-détail-retail)
5. [💇 Verticale 4 — Coiffure & Esthétique (Salon)](#5--verticale-4--coiffure--esthétique-salon)
6. [🚗 Verticale 5 — Garage & Réparation Auto](#6--verticale-5--garage--réparation-auto)
7. [🏨 Verticale 6 — Hôtel & Hébergement (PMS Lite)](#7--verticale-6--hôtel--hébergement-pms-lite)
8. [🩺 Verticale 7 — Clinique & Paramédical (Health)](#8--verticale-7--clinique--paramédical-health)
9. [🎨 Verticale 8 — Custom & Concept Stores](#9--verticale-8--custom--concept-stores)
10. [🔌 Matrice Exhaustive des Connecteurs par Verticale](#10--matrice-exhaustive-des-connecteurs-par-verticale)
11. [📅 Phasing Multi-Verticales (T+0 → T+36)](#11--phasing-multi-verticales-t0--t36)

---

## 1. Synthèse Comparative des 8 Verticales

| Verticale | Écran Principal | Unité de Vente | Réglementation Critique | Connecteur Clé | Culinary Gating | # Événements Bus |
|---|---|---|---|---|:---:|:---:|
| 🍽️ **Restaurant** | Plan de Salle + KDS | Plat / Menu / Couvert | NF525 · HACCP · INCO EU 1169/2011 | Zenchef / UberEats | ✅ | Événements pivots universels |
| 🥖 **Bakery** | Grille Comptoir + Poids | Unité / Kg (Balance) | NF525 · Traçabilité Farine · DGCCRF | Balance Mettler / TGTG | ✅ | 9 événements |
| 🛍️ **Retail** | Caisse Scan EAN13 | Pièce (Variantes) | NF525 · Droit Rétractation (**ventes à distance uniquement**) | Douchette Zebra / Shopify | 🔧 conditionnel | 8 événements |
| 💇 **Salon** | Agenda Cabine / Coiffeur | Forfait / Prestation | NF525 · RGPD Photos (droit image + Art. 9 si cuir chevelu) | Planity / Treatwell | ❌ | 8 événements |
| 🚗 **Garage** | Tableau Ordres Réparation | Pièce + Heure MO | NF525 · Mentions CGV Auto · **Trackdéchets BSDD obligatoire** | Autossimo / Darva EDI | ❌→BSDD | 14 événements |
| 🏨 **Hotel** | Grille Chambres (Rack) | Nuitée + Taxe Séjour | NF525 · **Fiche Police CESEDA Art. L.611-1** | Booking / Expedia OTA | ✅ (option bar) | 13 événements |
| 🩺 **Clinic** | Agenda Consultations | Acte Médical (CCAM) | **HDS ANSSI** · RGPD Santé Art.9 · CSP · Secret médical Art. L.1110-4 | SESAM-Vitale / Doctolib | ❌ | 14 événements |
| 🎨 **Custom** | Tableur Dynamique | Entité Paramétrable | NF525 Généralisé | Webhooks Universels (Zapier/Make/n8n) | 🔧 paramétrable | Composition à la carte |

**Total** : **66 événements verticaux** normalisés vers les 6 événements pivots universels (`order.paid`, etc. — voir [ARCHITECTURE_METAPLATFORM.md §4.3](ARCHITECTURE_METAPLATFORM.md#43-le-pont-événementiel-verticaleventbridge--convention-de-consommation)).

---

## 2. 🍽️ Verticale 1 — Restaurant & Brasserie

* **Dossier Codebase** : [`src/verticals/restaurant/`](../../src/verticals/restaurant/)
* **TAM France** : ~180 000 restaurants indépendants + petites chaînes (1-10 étab.)
* **Cible produit** : bistronomique à gastronomique · Starter 49€ / Standard 79€ / Enterprise 149€
* **Différenciateurs** : IA Oracle native · comptabilité automatisée · vrai mode offline multi-caisses · ergonomie iPad-first · onboarding 30 min chrono
* **Statut** : verticale de référence — 95% du tronc générique construit avec restaurant comme cas type

### Spécificités fonctionnelles

- **Plan de salle 2D/3D dynamique** (Konva.js) : tables, rotations, regroupements, zones (terrasse/salle/salon privé).
- **KDS (Kitchen Display System)** multi-stations : Chaud, Froid, Pâtisserie, Bar. Chronomètres d'alerte avec code couleur, groupement par plat pour mise en place, gestion des suites de table.
- **Fiches techniques INCO** : matrice réglementaire des 14 allergènes majeurs (EU 1169/2011), décomposition au gramme + coefficients de perte (cuisson 30% viande, décorticage 60% crustacés) pour Food Cost théorique réel.
- **Split d'addition avancé** : par couvert, par plat ou par montant libre + reliquat au dernier payeur (invariant concurrence #3).
- **Séquençage des plats** : ordre entrée→plat→dessert par table, bouton "Envoyer la suite" (émet `ops.course.fired`).
- **Pool de pourboires** : distribution équitable ou proportionnelle au rang, déclaration DSN mensuelle automatique.

### Réglementations critiques

- **NF525 Article 286 CGI** : chaîne SHA-256 par caisse (`registerId`), archivage WORM 6 ans.
- **INCO EU 1169/2011** : information consommateur allergènes (14 catégories).
- **HACCP** : registres température (chambres froides, huiles), formation 14h obligatoire.
- **CESEDA Art. L.311-4** : fiche de police (si hébergement — croisement verticale Hotel).

### Cas limites & angles morts

- ⚠️ **Chargebacks Stripe** : aucun workflow défini aujourd'hui pour contester un litige carte — à ajouter H2.
- ⚠️ **Signature tablette Livraison** : pour la valeur probante en cas de litige, utiliser un prestataire eIDAS certifié (DocuSign / Universign / Yousign).

---

## 3. 🥖 Verticale 2 — Boulangerie & Pâtisserie (Bakery)

* **Dossier Codebase** : [`src/verticals/bakery/`](../../src/verticals/bakery/)
* **TAM France** : ~33 000 boulangeries artisanales
* **9 événements bus dédiés** (`bakery.batch_scheduled`, `bakery.sale_completed`, `bakery.waste_recorded`, `bakery.preorder_confirmed`, …)

### Spécificités fonctionnelles

- **Planning de cuisson & fournées** : cadencement dynamique des cuissons (baguettes toutes les 2h vs viennoiseries 1×/jour), planning tenant compte du personnel et des affluences pré-mesurées.
- **Vente au poids** : intégration balance homologuée via protocole **Dialogue 06** (norme européenne — Mettler Toledo, Bizerba, Precia Molen). Le poids capté est TVA-ventilé automatiquement.
- **Traiteur & Précommandes** : gestion des acomptes pour gâteaux sur commande, pièces montées, fiches de retrait avec date/heure planifiées.
- **Valorisation des invendus** : intégration Too Good To Go (Partner API), don alimentaire (associations locales), transformation (chapelure), déduction fiscale automatique loi Garot 2016.

### Réglementations critiques

- **Traçabilité farine** : origine du blé + numéro de lot pour rappel produit (EU 178/2002).
- **DGCCRF** : information consommateur sur composition (allergènes gluten obligatoire).
- **Loi anti-gaspillage 2016 (Garot)** : obligation don alimentaire >400m² surface commerciale.

### Cas limites & angles morts

- ⚠️ **Cold-start** : nouvelle boulangerie sans historique → utiliser modèle heuristique (temps depuis dernière fournée + affluence type) pendant 30 jours avant activation ML.
- ⚠️ **Poids fluctuant vs prix** : le prix affiché doit toujours être calculé en temps réel (grammes × prix/kg) avec arrondi microunit correct.

---

## 4. 🛍️ Verticale 3 — Commerce de Détail (Retail)

* **Dossier Codebase** : [`src/verticals/retail/`](../../src/verticals/retail/)
* **TAM France** : ~450 000 commerces de détail (mode, alimentation spécialisée, cadeaux, décoration…)
* **8 événements bus dédiés** (`retail.sale_completed`, `retail.return_processed`, `retail.variant_stock_low`, `retail.ecom_sync_completed`, …)

### Spécificités fonctionnelles

- **Scan douchette 2D** : encaissement ultra-rapide par lecture EAN-13 / QR articles (Zebra, Datalogic, Honeywell).
- **Matrice Variantes (Taille / Couleur / Matière)** : déclinaison automatique des SKU et gestion des stocks par variante.
- **Synchronisation E-Commerce 2-ways** : connecteurs natifs Shopify / WooCommerce / PrestaShop pour unifier le stock magasin physique et web.
- **Paiement fractionné BNPL** : Alma / Klarna / Scalapay pour 3× ou 4× sans frais (déclenche split entries fiscales).

### Réglementations critiques

- **Droit de rétractation 14 jours (Art. L221-18 Code Conso)** : **ne s'applique qu'aux ventes à distance** (e-commerce), pas aux achats en boutique physique. Si le tenant Retail utilise Shopify/Woo, ce droit doit être documenté dans les CGV + workflow de retour prévu.
- **NF525** : universel comme tout commerce assujetti TVA.
- **Places de marché** : conformité Amazon Seller / Cdiscount (délais expédition, taux d'annulation).

### Cas limites & angles morts

- ⚠️ **Réservation en boutique + retrait web** : le stock doit être "prêt à retirer" sans double-vente. Utiliser réservation atomique avec expiration 24h.
- ⚠️ **Multi-devise touristes** (`CurrencyConfigPanel`) : moteur TVA multi-devise pas encore scopé — à traiter H3.

---

## 5. 💇 Verticale 4 — Coiffure & Esthétique (Salon)

* **Dossier Codebase** : [`src/verticals/salon/`](../../src/verticals/salon/)
* **TAM France** : ~85 000 salons de coiffure + 40 000 instituts esthétique
* **8 événements bus dédiés** (`salon.appointment_completed`, `salon.color_formula_recorded`, `salon.commission_calculated`, …)

### Spécificités fonctionnelles

- **Agenda collaboratif par cabine / fauteuil** : prise de RDV en ligne avec attribution de collaborateur, vue par heure/jour/semaine.
- **Fiches techniques coloration** : historique des formules utilisées pour chaque client (dosage, oxydant, temps de pose, marque produit) avec photos avant/après sécurisées.
- **Calcul automatique des commissions** : ventilation des ventes prestations (35% coiffeur, 15% coloriste) et produits cosmétiques (10% vendeur) par collaborateur, avec export paie DSN.

### Réglementations critiques

- **RGPD Photos avant/après** :
  - **Droit à l'image** obligatoire : contrat écrit signé pour usage réseaux sociaux / vitrine.
  - **Photos de cuir chevelu / peau** = données de santé au sens Art. 9 RGPD → chiffrement au repos + consentement explicite + AIPD si volume important.
- **RGPD Fiches coloration** : les formules coloration + réactions allergiques sont des **données de santé**.
- **NF525** : universel.

### Cas limites & angles morts

- ⚠️ **Salon multi-marques** (Wella + L'Oréal + Schwarzkopf) : le catalogue produit doit gérer les EDI simultanés (L'Oréal Pro Direct, Wella Professionals EDI).
- ⚠️ **Rendez-vous récurrents** (client hebdo pour brushing) : moteur de règles de récurrence + rappels J-7 automatisés.

---

## 6. 🚗 Verticale 5 — Garage & Réparation Auto

* **Dossier Codebase** : [`src/verticals/garage/`](../../src/verticals/garage/)
* **TAM France** : ~32 000 garages multimarques + 8 000 concessions
* **14 événements bus dédiés** (`auto.vehicle_checked_in`, `auto.diagnostic_completed`, `auto.repair_started`, `auto.invoice_issued`, `auto.vin_registered`, …)

### Spécificités fonctionnelles

- **Ordres de Réparation (OR)** : réception véhicule, relevé kilométrique, photos de carrosserie (état à la réception + à la restitution), signature client sur tablette.
- **Chiffrage Pièces & Main d'Œuvre** : catalogue pièces détachées (TecDoc, Autodata) + barème de temps constructeur (HaynesPro API).
- **Facturation Normée Véhicule** : mentions obligatoires immatriculation, numéro VIN, date prochain contrôle technique, kilométrage, catégorie véhicule.

### Réglementations critiques

- **Trackdéchets BSDD** (Bordereau de Suivi des Déchets Dangereux) : **obligation légale** pour huiles moteur, batteries, pneus usagés, liquides refroidissement. API Trackdéchets publique gratuite — non-compliance = amende Art. R541-45 Code Env.
- **Mentions légales auto** : Art. L211-2 Code Conso + arrêté 20 mars 1978.
- **Signature tablette OR** : valeur probante en cas de litige nécessite prestataire eIDAS certifié (DocuSign / **Universign** / Yousign) avec horodatage certifié — sinon la signature n'est pas opposable au client.
- **Assurance carrosserie** : télétransmission chiffrages Sidexa / Darva EDI pour mutuelles.

### Cas limites & angles morts

- ⚠️ **Reprise véhicule + occasion** : gestion double statut (VN/VO) avec TVA marge pour véhicules d'occasion (Art. 297 A CGI).
- ⚠️ **Contrôle technique intégré** : renvoi automatique 2 mois avant expiration CT → email + SMS client.

---

## 7. 🏨 Verticale 6 — Hôtel & Hébergement (PMS Lite)

* **Dossier Codebase** : [`src/verticals/hotel/`](../../src/verticals/hotel/)
* **TAM France** : ~17 000 hôtels + résidences services
* **13 événements bus dédiés** (`hotel.guest_checked_in`, `hotel.guest_checked_out`, `hotel.room_status_changed`, `hotel.folio_charged`, `hotel.city_ledger_entry`, `hotel.yield_rate_updated`, …)

### Spécificités fonctionnelles

- **Rack des chambres** : planning visuel de réservation, statuts de ménage (propre, sale, inspection, maintenance).
- **Facturation Folio / Note de chambre** : transfert direct des consommations bar et restaurant sur le compte de la chambre (avec ventilation TVA correcte : 10% hébergement vs 20% bar).
- **Channel Manager** : synchronisation automatique 2-ways avec Booking.com, Expedia et Airbnb (D-EDGE, SiteMinder ou Expedia QuickConnect).
- **Yield Management** : ajustement dynamique des tarifs selon occupation prévue + événements locaux + météo.

### Réglementations critiques

- **Fiche de Police numérique** : obligation Art. L.611-1 CESEDA de déclarer les résidents étrangers aux autorités. Télétransmission via **VISABIO** ou dépôt préfectoral — nécessite **agrément préfectoral** de l'établissement (à intégrer dans onboarding onboarding H4).
- **Taxe de séjour** : calcul par nuitée × personne × catégorie hôtel × commune. API Taxe de Séjour / Déclaration municipale automatique.
- **Contrôle d'accès numérique** : intégration serrures Assa Abloy VingCard, Salto Systems, Nuki pour clés mobiles RFID.
- **NF525** : universel.

### Cas limites & angles morts

- ⚠️ **Overbooking hôtel** : politique de relogement automatique en cas de surbooking (chambre supérieure gratuitement, remboursement, hôtel voisin).
- ⚠️ **PMS legacy migration** : import historique depuis Opera / Mews / Cloudbeds — connecteurs à développer H4.

---

## 8. 🩺 Verticale 7 — Clinique & Paramédical (Health)

* **Dossier Codebase** : [`src/verticals/clinic/`](../../src/verticals/clinic/)
* **TAM France** : ~20 000 cabinets paramédicaux (kinés, ostéos, sages-femmes, orthophonistes)
* **14 événements bus dédiés** (`health.patient_admitted`, `health.act_billed`, `health.hds_audit_log`, `health.consent_recorded`, `health.appointment_booked`, …)

### Spécificités fonctionnelles

- **Hébergement HDS & Sécurité** : déploiement certifié Données de Santé (agrément ANSSI).
- **Télétransmission SESAM-Vitale & FSE** : facturation des actes médicaux (nomenclature CCAM) et gestion du tiers-payant mutuelle.
- **Dossier Patient Informatisé (DPI)** : historique des consultations, prescriptions et suivi Mon Espace Santé.
- **Messagerie sécurisée MSSanté / Apicrypt** : échange chiffré d'ordonnances et bilans entre confrères.

### Réglementations critiques

- **HDS ANSSI** : certification ISO 27001 étendue avec audits tous les 3 ans par organisme accrédité COFRAC. **Obtention 12-18 mois minimum**, plusieurs dizaines de k€. **Les démarches doivent démarrer en H3 pour tenir H5 (2028).**
- **RGPD Art. 9** : données de santé à protection renforcée. Chiffrement au repos + tokenisation + versionnement dans `hds_vault`.
- **Secret médical Art. L.1110-4 CSP** : un technicien MCC qui accède techniquement aux données patient (même pour debugging) commet une violation du secret. Nécessite **compartimentage HDS séparé** + logs d'accès MCC certifiés dans `mcc/hds_access_audit`.
- **Ségur numérique santé** : conformité indicateurs Ségur pour financement CPAM.

### Cas limites & angles morts

- ⚠️ **Ne peut PAS être commercialisé avant agrément HDS** — c'est un prérequis légal absolu, pas un backlog item.
- ⚠️ **Consentement patient** : traçabilité obligatoire de chaque consentement (soins, partage DMP, prise de photos avant/après).
- ⚠️ **Transferts hors UE** : si le LLM Oracle est hébergé aux US (Gemini API), les prompts contenant des données patient tombent sous les clauses de transfert RGPD — soit hébergement Gemini EU obligatoire, soit LLM local (Mistral / Llama).

---

## 9. 🎨 Verticale 8 — Custom & Concept Stores

* **Dossier Codebase** : [`src/verticals/custom/`](../../src/verticals/custom/)
* **Use-cases cibles** : commerces hybrides (café-librairie, salon-boutique, épicerie-cave-restaurant, gymnase-bar)
* **Événements bus** : composition à la carte (combinaison de plusieurs verticales via `VerticalRegistry.compose(...)`)

### Spécificités fonctionnelles

- **Composition à la carte** : activation / désactivation des modules (ex: Caisse POS seule, sans RH ni Stock).
- **Champs personnalisés & Tableur dynamique** : adaptation aux commerces hybrides (café-librairie, salon-boutique).
- **Workflow builder** : moteur no-code pour créer des workflows personnalisés (ex: livraison de fleurs avec confirmation photo).
- **Templates communautaires** : marketplace de templates partagés par les intégrateurs (H5).

### Cas limites & angles morts

- ⚠️ **Facturation multi-catégorie** : un café-librairie doit ventiler la TVA correctement (10% café, 5.5% livres).
- ⚠️ **RBAC hybride** : un vendeur de café-librairie doit avoir le rôle "vendeur" ET "serveur" simultanément — la matrice RBAC actuelle est mono-verticale, à adapter.
- ⚠️ **SDK Partenaires** : permettre à un intégrateur externe de développer une verticale spécialisée nécessite versionnement API + sandbox de test — à traiter H5.

---

## 10. 🔌 Matrice Exhaustive des Connecteurs par Verticale

**Architecture du Hub** : tous les connecteurs sont déclarés dans [`src/lib/connectors/manifest/`](../../src/lib/connectors/manifest/) sous le contrat typé `IConnectorManifest` et administrables depuis le Hub d'Intégrations ([`src/modules/intelligence/connectors/hub/`](../../src/modules/intelligence/connectors/hub/)).

### 🍽️ 1. Verticale RESTAURANT
| Catégorie | Connecteurs Actifs | Connecteurs Prévus | Rôle & Impact Métier |
|---|---|---|---|
| **Livraison** | Uber Eats, Deliveroo, Just Eat | **HubRise / Deliverect** (agrégateur d'agrégateurs) | Agrégation multi-plateformes sur un seul flux KDS — supprime doublons |
| **Réservation** | Zenchef, TheFork, Widget natif | **Google Reserve (sync finale), SevenRooms** | Réservation directe depuis Google Search / Maps |
| **Fournisseurs** | Metro, Pomona | **Transgourmet, Sysco France** | Import automatique factures et mercuriales EDI |
| **Paiement Table** | Stripe Terminal, Verifone, SumUp | **Sunday, LyfPay** | Paiement autonome à table par QR Code sans attente |
| **Comptabilité** | Pennylane, Export FEC | **Zelty & Lightspeed Importers** | Migration express des menus et historiques en 1 clic |

### 🥖 2. Verticale BAKERY (Boulangerie / Pâtisserie)
| Catégorie | Connecteurs Actifs | Connecteurs Prévus | Rôle & Impact Métier |
|---|---|---|---|
| **Matériel Caisse** | Imprimantes ESC/POS | **Balances Poids/Prix (Dialogue 06 : Mettler, Bizerba)** | Tarification automatique au poids (kg / part) |
| **Anti-Gaspillage** | — | **Too Good To Go (Partner API), Phenix** | Mise en vente automatique des invendus à 18h |
| **Matières Premières** | — | **Grands Moulins de Paris, Foricher, Girardeau** | Commandes récurrentes de farine + traçabilité lots |
| **Facturation B2B** | Factur-X natif | **Chorus Pro API** | Facturation automatique collectivités/crèches/mairies |

### 🛍️ 3. Verticale RETAIL (Commerce de Détail)
| Catégorie | Connecteurs Actifs | Connecteurs Prévus | Rôle & Impact Métier |
|---|---|---|---|
| **E-Commerce 2-Ways** | Shopify, Google Shopping | **WooCommerce REST API, PrestaShop Webservices** | Unification temps réel stocks boutique + web |
| **Places de Marché** | — | **Amazon Seller API, Cdiscount, Ankorstore** | Vente omnicanale + réapprovisionnement grossistes |
| **Hardware Scan** | — | **Zebra, Datalogic, Honeywell (EAN-13/QR 2D)** | Encaissement et inventaire éclair par scan |
| **Paiement Fractionné** | Stripe | **Alma, Klarna, Scalapay (BNPL)** | 3× ou 4× sans frais garanti |

### 💇 4. Verticale SALON (Coiffure / Esthétique / Spa)
| Catégorie | Connecteurs Actifs | Connecteurs Prévus | Rôle & Impact Métier |
|---|---|---|---|
| **Prise de RDV** | Treatwell, Fresha | **Planity Bridge API** | Synchronisation bidirectionnelle agenda cabine |
| **Produits Pros** | — | **L'Oréal Pro Direct, Wella Professionals EDI, Schwarzkopf** | Réapprovisionnement tubes coloration + oxydants |
| **Communication** | Brevo, WhatsApp Business | **Twilio SMS Gateway** | Rappels RDV H-24 + SMS anniversaire |
| **E-Réputation** | Google My Business | **Avis Vérifiés / Trustpilot API** | Collecte automatique d'avis post-prestation |

### 🚗 5. Verticale GARAGE (Automobile / Carrosserie / Maintenance)
| Catégorie | Connecteurs Actifs | Connecteurs Prévus | Rôle & Impact Métier |
|---|---|---|---|
| **Identification Auto** | — | **SIV / AAA Data / Autovista (Immatriculation API)** | Remplissage auto marque, modèle, VIN, moteur via plaque |
| **Catalogues Pièces** | TecDoc | **AD Autodistribution, Autossimo, PartsLink24** | Consultation stocks équipementiers + prix en direct |
| **Barèmes Temps** | — | **Autodata API, HaynesPro API** | Devisage aux barèmes de temps officiels constructeurs |
| **Assurances** | — | **Darva EDI, Sidexa (Chiffrage Sinistres)** | Télétransmission devis carrosserie aux mutuelles |
| **Environnement** | — | **Trackdéchets API (BSDD Déchets Dangereux)** | **OBLIGATOIRE** : registre légal huiles/batteries/pneus |
| **Signature électronique** | — | **DocuSign / Universign / Yousign (eIDAS)** | Valeur probante OR signature client tablette |

### 🏨 6. Verticale HOTEL (Hébergement / Résidence / PMS)
| Catégorie | Connecteurs Actifs | Connecteurs Prévus | Rôle & Impact Métier |
|---|---|---|---|
| **Channel Manager** | Booking.com, Mews PMS | **D-EDGE, SiteMinder, Expedia QuickConnect, Airbnb** | Synchronisation 2-ways tarifs/disponibilités/stops |
| **Contrôle d'Accès** | — | **Assa Abloy (VingCard), Salto Systems, Nuki** | Génération cartes magnétiques + clés mobiles RFID |
| **Légal / Police** | — | **VISABIO (Fiche de Police Numérique)** | Envoi sécurisé données résidents étrangers autorités |
| **Facturation Séjour** | Factur-X natif | **Taxe de Séjour API / Déclaration Municipale** | Calcul + ventilation automatique taxe de séjour |

### 🩺 7. Verticale CLINIC (Paramédical / Cabinets / Santé)
| Catégorie | Connecteurs Actifs | Connecteurs Prévus | Rôle & Impact Métier |
|---|---|---|---|
| **Prise de RDV** | Doctolib | **Maiia Agenda Santé API** | Prise RDV patient + rappel SMS certifié santé |
| **Assurance Maladie** | — | **SESAM-Vitale (FSE), CPAM AmeliPro, Almerys** | Télétransmission feuilles de soins + Tiers-Payant |
| **Dossier Médical** | — | **DMP (Mon Espace Santé) / Télésanté INS** | Consultation + versement au dossier médical informatisé |
| **Messagerie Médicale** | — | **MSSanté / Apicrypt** | Échange crypté ordonnances + bilans entre confrères |

### 🎨 8. Verticale CUSTOM (Universelle / Méta-Commerce)
| Catégorie | Connecteurs Actifs | Connecteurs Prévus | Rôle & Impact Métier |
|---|---|---|---|
| **Automatisations No-Code** | — | **Zapier, Make.com, n8n (Webhooks bidirectionnels)** | Déclenchement d'actions externes sur tout événement Nexus |
| **ERP & Compta Majeurs** | QuickBooks, Xero | **Sage 100, Cegid Quadra, Odoo, Microsoft Dynamics** | Synchronisation financière vers les grands ERP du marché |
| **Communication** | Gmail, IMAP | **Slack / Microsoft Teams Webhooks** | Alertes de gestion + monitoring d'activité temps réel |

---

## 11. 📅 Phasing Multi-Verticales (T+0 → T+36)

Voir aussi [ROADMAP_STRATEGY.md](ROADMAP_STRATEGY.md) pour le détail des Horizons H1-H5.

### T+0 à T+3 mois — 🎯 RESTAURANT priorité absolue
- **Objectif** : 30 clients restaurant payants + valider Sprints H1-H2 (Bus, CI/CD, Kit Matériel, API REST, Mobile).
- **Nouveau code par zone** : Zone 1 POS avancé, Zone 1 KDS pro, Zone 2 R2 bouton accueillir + waitlist, Zone 4 fidélité opérationnelle.
- **Critère de sortie binaire** : 30 clients ayant réalisé ≥10 clôtures Z + NPS >40.

### T+3 à T+6 mois — 🥖 BAKERY en extension
- **Objectif** : 20 boulangeries + validation framework "verticale héritée" (temps de développement <48h).
- **Sprints** : `OPS-B1` planning production, `OPS-B2` vente comptoir + balance Dialogue 06, `OPS-B3` précommandes, `COM-B1` clients pro (Chorus Pro), `INT-B1/B2` prédiction demande + invendus TGTG.

### T+6 à T+12 mois — 💇 SALON + 🛍️ RETAIL en parallèle
- **Objectif** : 100 clients cumulés sur les 2 verticales.
- **Sprints salon** : `OPS-S1` agenda visuel, `COM-S1` RDV en ligne (Planity/Fresha), `FIN-S1` commissions coiffeur, `OPS-S2` fiche technique coloration + RGPD Art. 9.
- **Sprints retail** : `OPS-RT1` POS retail scan, `OPS-RT2` retours + droit rétractation (ventes à distance), `COM-RT1` e-commerce Shopify/Woo, `LOG-RT1` multi-emplacement, `LOG-RT2` variantes.

### T+12 à T+18 mois — 🚗 GARAGE niche premium
- **Objectif** : 100 garages payants (ticket moyen élevé, ~189€/mois formule Enterprise).
- **Sprints** : `OPS-G1` fiche véhicule + SIV, `OPS-G2` devis pièces (TecDoc/Autodata), `OPS-G4` planning atelier, `COM-G1` RDV en ligne, `FIN-G1` facturation détaillée + mentions légales, `COMP-G1` Trackdéchets BSDD **obligatoire**, `OPS-G3` signature Universign/Yousign eIDAS.

### T+18 à T+24 mois — 🏨 HOTEL + 🩺 CLINIC (verticales complexes)
- **Sprints hotel** : PMS core, channel manager (Booking + Expedia + Airbnb, D-EDGE ou SiteMinder), housekeeping, room service, yield management, taxe séjour, fiche police VISABIO + agrément préfectoral.
- **Sprints clinic** : Doctolib sync, FSE tiers-payant SESAM-Vitale, DMP, ordonnances, Ségur numérique santé, **HDS hébergement (démarches lancées en H3 — 12-18 mois de délai)**.

### T+24+ — 🎨 CUSTOM en ouverture
- Custom fields, formulaires custom, workflow builder, templates communautaires, programme intégrateurs, SDK Partenaires + sandbox.

### 🎯 Objectifs consolidés

| Horizon | MRR total | Clients cumulés | Verticales actives | ARPU moyen |
|:---:|:---:|:---:|:---:|:---:|
| **T+3** | ~10 000€ | ~30 | 🍽️ | 333€ (mix Enterprise pilotes) |
| **T+6** | ~15 000€ | ~50 | 🍽️ + 🥖 | 300€ |
| **T+12** | ~50 000€ | ~250 | + 💇 + 🛍️ | 200€ |
| **T+18** | ~120 000€ | ~600 | + 🚗 | 200€ |
| **T+24** | ~250 000€ | ~1 200 | + 🏨 + 🩺 | 208€ |
| **T+36** | ~600 000€ | ~2 500 | + 🎨 (toutes) | 240€ |

> ⚠️ **Ces projections supposent** : churn mensuel <5%, CAC <1 500€, LTV/CAC >3. Les hypothèses churn/CAC/LTV sont à réviser trimestriellement avec les données réelles.

### 🚨 La décision T+0

**🍽️ Restaurant seul les 3 premiers mois** (recommandation) : validation ultra-focalisée, tous les efforts commerciaux et support sur une verticale, itération produit maximale.

Alternative écartée : 🍽️ + 🥖 en parallèle — élargit la base acquisition mais dilue l'attention.

**Critère de bascule vers Bakery** : 30 clients restaurant ayant réalisé ≥10 clôtures Z + NPS >40 + ≤5% churn observé sur 3 mois.

---

## Références Codebase

- **Registre des verticales** : [`src/lib/verticalRegistry.ts`](../../src/lib/verticalRegistry.ts)
- **Événements verticaux** : [`src/shared/eventBus/events/vertical.events.ts`](../../src/shared/eventBus/events/vertical.events.ts) (66 événements)
- **DNA seeds** : [`src/shared/seeds/`](../../src/shared/seeds/)
- **Gating culinaire** : `usesCulinaryStock(variant)` dans les hooks partagés
- **Nav config gating** : [`src/config/navConfig.ts`](../../src/config/navConfig.ts) via `filterByCapabilities`
- **Connecteurs** : [`src/lib/connectors/manifest/`](../../src/lib/connectors/manifest/) · [`src/modules/intelligence/connectors/hub/`](../../src/modules/intelligence/connectors/hub/)
