# Restaurant OS — Roadmap Fonctionnelle

**~170 features** · P1 Core · P2 Important · P3 Future

> **Statut**
> - ✅ Implémenté — logique métier complète
> - 🔧 Partiel — scaffoldé ou à compléter
> - ⬜ À développer

---

## ⚙ Ops — Service & Production

| P | Statut | Feature |
|---|--------|---------|
| P1 | 🔧 | Terminal de paiement (Stripe Terminal / SumUp / Ingenico) |
| P1 | ⬜ | Mode hors-ligne POS avec sync auto au retour réseau |
| P1 | 🔧 | Impression tickets thermiques ESC/POS (Epson, Star) |
| P1 | ⬜ | Scanner code-barres / QR articles en caisse |
| P1 | ✅ | Gestion du pourboire (pool, individuel, déclaration DSN) |
| P1 | ⬜ | Alerte allergènes sur commandes (colorcode par plat) |
| P1 | ⬜ | Vérification âge alcool (blocage POS + confirmation) |
| P1 | 🔧 | Séquençage des plats (entrée → plat → dessert par table) |
| P1 | ✅ | Routage KDS multi-station (chaud / froid / pâtisserie) |
| P1 | ⬜ | Split addition (partage par convive ou par article) |
| P1 | ⬜ | Pré-autorisation CB sur table ouverte |
| P2 | ⬜ | Self-ordering QR code (commande depuis table) |
| P2 | ⬜ | Application serveur mobile-first (iOS/Android) |
| P2 | 🔧 | Estimation temps de préparation IA par station KDS |
| P2 | 🔧 | Liste de préparation journalière auto (depuis réservations) |
| P2 | ⬜ | Cave à vin (millésimes, casiers, PRMP bouteille) |
| P2 | 🔧 | Cocktails à la une dynamiques (bar suggestions) |
| P2 | ⬜ | Articles au poids (balance connectée — fromage, viande) |
| P2 | ⬜ | Multi-terminal multi-caissier simultané (quarts concurrent) |
| P3 | ⬜ | Room service (variante hôtel — liaison PMS) |
| P3 | ⬜ | Kiosque libre-service tablette (variante fast-casual) |
| P3 | ⬜ | Menus du jour / saisonniers (activation / désactivation rapide) |
| P3 | ⬜ | Impression ticket personnalisé (logo, fidélité, QR prochain avis) |

---

## 🛍 Commerce — Acquisition & Fidélité

| P | Statut | Feature |
|---|--------|---------|
| P1 | 🔧 | Click & collect (commande en ligne, retrait sur place) |
| P1 | ✅ | Intégration Uber Eats (connecteur OAuth + webhook) |
| P1 | ⬜ | Intégration Deliveroo / Just Eat (agrégateur) |
| P1 | ✅ | Intégration TheFork / Zenchef (réservation) |
| P1 | ⬜ | Intégration Google Reserve (réservation via Google Maps) |
| P1 | ⬜ | Arrhes / acompte obligatoire grands groupes avec Stripe |
| P1 | ✅ | Confirmation SMS / email + rappels J-1 et J-7 |
| P1 | 🔧 | Politique d'annulation paramétrable + pénalité no-show |
| P1 | 🔧 | Préférences clients (régime alimentaire, placement, occasion) |
| P1 | 🔧 | Liste d'attente temps réel avec SMS estimé |
| P2 | ⬜ | Réservation via WhatsApp Business |
| P2 | ✅ | Bons cadeaux / e-chèques (génération + validation POS) |
| P2 | ⬜ | Programme parrainage (referral code + tracking) |
| P2 | 🔧 | Comptes entreprise / facturation B2B mensuelle |
| P2 | 🔧 | Packages événements (anniversaire, EVJF, team building) |
| P2 | ⬜ | Demande d'avis automatique post-visite (Google, Tripadvisor) |
| P2 | 🔧 | Gestion multi-établissements (réseau, franchises — EmpireCockpit) |
| P2 | 🔧 | Tracking parcours client (RFM, CLV, churn prediction) |
| P2 | ⬜ | Abonnements repas (formule mensuelle, entreprises) |
| P3 | ⬜ | Menu multilingue QR code (EN/ES/ZH/AR) |
| P3 | ✅ | Widget réservation embeddable (iframe tiers) |
| P3 | ⬜ | Réseau partenaires fidélité inter-enseignes |
| P3 | 🔧 | Automatisation posts Google Business / réseaux sociaux |
| P3 | ⬜ | Pre-orders événements futurs (commandes à date) |

---

## 💰 Finance & Comptabilité

| P | Statut | Feature |
|---|--------|---------|
| P1 | ✅ | Rapprochement bancaire automatique (Open Banking — 5 providers) |
| P1 | 🔧 | Déclarations TVA CA3 auto-générées (DGFiP + EDI) |
| P1 | ✅ | Gestion de la caisse menue monnaie (fond de caisse + comptage) |
| P1 | ✅ | Comptabilité des pourboires (déclaration DSN mensuelle) |
| P1 | 🔧 | Prévision de trésorerie 30 / 60 / 90 jours |
| P1 | 🔧 | Facturation inter-sociétés (groupe multi-restaurants) |
| P1 | ✅ | Clôture journalière Z de caisse NF525 (scellement cryptographique) |
| P2 | ✅ | SEPA direct débit fournisseurs récurrents (XML pain.001) |
| P2 | 🔧 | Analyse du seuil de rentabilité par service / jour |
| P2 | ✅ | Budget vs réel en temps réel (dashboard CFO) |
| P2 | 🔧 | RevPASH (Revenue per Available Seat Hour) |
| P2 | 🔧 | Rentabilité par article de menu (contribution margin) |
| P2 | ✅ | Food cost tracking avec alertes sur dérive vs objectif |
| P2 | ✅ | Matching 3 voies commande / réception / facture |
| P2 | ✅ | Export FacturX (PDF/A-3 + XML — norme UE) |
| P2 | ✅ | Recouvrement créances avec escalade automatique (FRIENDLY→FORMAL→LEGAL) |
| P2 | ✅ | Export Pennylane (comptabilité en ligne) |
| P3 | ⬜ | Affacturage factures clients (financement court terme) |
| P3 | ⬜ | Multi-devise (tourisme — USD, GBP, CHF) |
| P3 | 🔧 | Consolidation financière groupe (reporting agrégé MacroBrain) |
| P3 | ⬜ | DAS2 (déclaration honoraires artistes / prestataires) |

---

## 🛡 Compliance & Sécurité alimentaire

| P | Statut | Feature |
|---|--------|---------|
| P1 | ✅ | Registres HACCP numériques complets (temp, huiles, nettoyage) |
| P1 | 🔧 | Étiquetage allergènes EU 1169/2011 (14 allergènes, menu + étiquettes) |
| P1 | 🔧 | Traçabilité farm-to-fork (lot → plat → table) |
| P1 | 🔧 | Contrôle qualité de l'eau (pH, chlore, relevés) |
| P1 | 🔧 | Journal des nuisibles (dératisation, désinsectisation) |
| P1 | ✅ | Signalement incidents DGCCRF / RASFF (rappel produit) |
| P1 | ✅ | Formation HACCP 14h obligatoire (suivi attestations, blocage pointeuse) |
| P1 | ⬜ | Permis d'exploitation (suivi renouvellement 10 ans) |
| P2 | ⬜ | Bilan carbone GES (scope 1 + 2 + 3 restauration) |
| P2 | 🔧 | Reporting réduction déchets (loi Agec, dons associations) |
| P2 | ✅ | Conformité incendie (extincteurs, exercices, ERP) |
| P2 | ⬜ | Audit fournisseur (Bio, MSC, Label Rouge, local) |
| P2 | ✅ | RGPD — droit à l'oubli client (ErasureService) |
| P2 | 🔧 | Détection fraude POS (anomalies caisse, voids suspects) |
| P3 | ⬜ | Score Nutri-Score calculé automatiquement par plat |
| P3 | ✅ | Conformité accessibilité PMR (ERP catégorie 3-4-5) |
| P3 | ⬜ | Licence IV (gestion renouvellement, transfert) |
| P3 | 🔧 | Audit tiers externe (consultants, cabinets — AuditService) |

---

## 👥 Human — RH & Paie

| P | Statut | Feature |
|---|--------|---------|
| P1 | ✅ | Planning des équipes (roster hebdomadaire, conformité HCR) |
| P1 | ✅ | Gestion congés / absences / RTT avec soldes |
| P1 | ✅ | Pointeuse badge / QR code / géolocalisation |
| P1 | ✅ | Calcul automatique heures supp (25% / 50%) |
| P1 | ✅ | Répartition automatique des pourboires (pool / individuel / rank) |
| P1 | ✅ | DSN mensuelle (builder XML URSSAF — télétransmissible net-entreprises) |
| P2 | ✅ | Module recrutement ATS simplifié (offre → entretien → contrat) |
| P2 | ⬜ | Onboarding digital (livret, contrat e-sign, accès) |
| P2 | ⬜ | Entretiens professionnels (bilan 2 ans, objectifs) |
| P2 | 🔧 | Rotation multi-sites (staff partagé entre établissements) |
| P2 | ⬜ | Avances sur salaire avec remboursement automatique |
| P2 | ✅ | Accidents du travail / DUER (Document Unique) |
| P2 | ✅ | Registre Unique du Personnel (RUP) |
| P2 | ✅ | Prépaie export Silae (expert-comptable) |
| P2 | ⬜ | CET (Compte Épargne Temps, règles branche HCR) |
| P3 | ⬜ | Formation e-learning interne (HACCP, service, hygiène) |
| P3 | ⬜ | Gestion contrats saisonniers / extras (CDDU) |
| P3 | 🔧 | Conformité syndicale / accord de branche HCR (amplitude, repos) |
| P3 | ⬜ | Gestion apprentis / alternants (CFA, tuteurs, suivi) |

---

## 📦 Logistics — Stock & Approvisionnement

| P | Statut | Feature |
|---|--------|---------|
| P1 | 🔧 | Comparateur prix multi-fournisseurs (appel d'offres auto) |
| P1 | 🔧 | Bons de commande automatiques (réapprovisionnement seuil) |
| P1 | 🔧 | Suivi livraisons temps réel (portail fournisseur) |
| P1 | 🔧 | Traçabilité lot / batch (DLC + DLO + numéro de lot) |
| P1 | ✅ | Valorisation stock FIFO / PRMP (déduction par batch) |
| P1 | ✅ | Contrôle qualité réception (conformité BL vs commande) |
| P1 | ✅ | Service 86 automatique (blocage commande si stock zéro) |
| P1 | ✅ | Déduction stock automatique sur commande validée |
| P2 | ⬜ | Stock en consignation (tracking bouteilles, fûts bière, gaz) |
| P2 | ⬜ | Retours fournisseurs avec avoir automatique |
| P2 | 🔧 | Par level management adaptatif (seuils dynamiques) |
| P2 | 🔧 | Reporting gaspillage avec causes (DLC, sur-production, erreur) |
| P2 | ⬜ | Inventaire tournant par zone (sans fermeture établissement) |
| P2 | ✅ | Extraction OCR / IA factures fournisseurs (InvoiceExtractionService) |
| P2 | ✅ | Matching 3 voies logistique (commande / BL / facture) |
| P3 | 🔧 | Prédiction péremption IA (alerte avant DLC) |
| P3 | 🔧 | Tracking énergie chambres froides (IoT capteurs) |
| P3 | ⬜ | Label anti-gaspillage (Too Good To Go, Phenix) |
| P3 | ✅ | Migration historique depuis Zelty (ZeltyImporter) |

---

## 🧠 Intelligence — IA & Analytics

| P | Statut | Feature |
|---|--------|---------|
| P1 | 🔧 | Prévision des ventes ML (J+7, semaine, mois) |
| P1 | ⬜ | Menu engineering (étoile / vache à lait / poids mort / énigme) |
| P1 | 🔧 | Recommandations upselling serveur en temps réel |
| P1 | ✅ | Rapports flash quotidiens automatisés (DailyFlashReport) |
| P1 | ✅ | Rapports hebdomadaires consolidés |
| P1 | ✅ | Détection anomalies cross-domain (revenus, stock, compliance) |
| P2 | ✅ | Pricing dynamique basé sur la demande (heures creuses / pleines) |
| P2 | ⬜ | Analyse sentiment clients multi-sources (Google, TripAdvisor, Yelp) |
| P2 | 🔧 | Optimisation planning RH selon prévisions d'affluence |
| P2 | 🔧 | Prédiction du gaspillage (sur-commande vs historique) |
| P2 | ⬜ | Score de performance fournisseur (délai, qualité, prix) |
| P2 | ✅ | Veille concurrentielle (pricing, avis, positionnement — MarketOracle) |
| P2 | 🔧 | Détection d'anomalie sur recettes (coût vs historique) |
| P2 | ⬜ | Prédiction no-show ML (historique × météo × événement local) |
| P2 | ✅ | Benchmarking inter-établissements (FleetBenchmark) |
| P2 | ✅ | Ajustement staffing selon météo (RainStaffingHandler) |
| P3 | ⬜ | Optimisation coût recettes IA (substitution ingrédients) |
| P3 | 🔧 | Intelligence marché (tendances cuisine, saisonnalité) |
| P3 | 🔧 | Computer vision plateau / stock (photo → analyse gaspillage) |
| P3 | 🔧 | RevPAC — Revenue per Available Cover (siège × service) |
| P3 | ⬜ | Recommandation accords mets-vins (cave + menu engineering) |

---

## 🏛 Facility — Espaces & Maintenance

| P | Statut | Feature |
|---|--------|---------|
| P1 | ✅ | Plan de salle 2D interactif Konva.js (drag & drop, zones, étages) |
| P1 | ✅ | Calcul géométrique plan (centrage auto, zoom, coordonnées world/screen) |
| P1 | ⬜ | Heatmap d'occupation des tables (par service / semaine) |
| P1 | ✅ | Réservation salle privatisée (contrat + acompte — PrivatisationContract) |
| P1 | ✅ | Gestion multi-espaces (terrasse, intérieur, bar, cave — ZoneService) |
| P2 | ⬜ | Planning maintenance préventive (fours, chambre froide, etc.) |
| P2 | ⬜ | Cycle de vie matériel (garantie, amortissement, remplacement) |
| P2 | ⬜ | Planning ménage / nettoyage des espaces (check-list) |
| P2 | 🔧 | Gestion multi-étages avec ascenseur / monte-plat |
| P2 | ✅ | Registre interventions maintenance (InterventionLogSection) |
| P2 | ✅ | CERFA 13984 (vérifications réglementaires périodiques) |
| P2 | ✅ | Gestion prestataires maintenance (contrats, interventions) |
| P3 | ⬜ | Monitoring énergie bâtiment (électricité, gaz, eau) |
| P3 | ⬜ | Réalité augmentée plan de salle (tablette AR) |
| P3 | ⬜ | Domotique salle (éclairage, température, musique par zone) |
| P3 | ⬜ | Surveillance CCTV avec détection intrusion |

---

## 🔌 Intégrations Transversales

| P | Statut | Feature |
|---|--------|---------|
| P1 | 🔧 | Apple Pay / Google Pay / NFC (intégration native POS) |
| P1 | ✅ | Google Business Profile sync (horaires, menu, photos) |
| P1 | ⬜ | Application mobile client-facing iOS / Android |
| P1 | ✅ | Webhooks réservations (Zenchef, UberEats — providers complets) |
| P1 | ✅ | Email marketing (Brevo — campagnes, transactionnel) |
| P2 | ⬜ | Mailchimp / Klaviyo (automation marketing avancée) |
| P2 | ✅ | Export Pennylane (comptabilité cloud) |
| P2 | ⬜ | Export Cegid / Sage / QuickBooks natif |
| P2 | ⬜ | API publique REST + webhooks (intégrations partenaires) |
| P2 | ⬜ | PMS hôtel (Opera, Mews, Cloudbeds) — variante hôtel |
| P2 | ✅ | Silae paie (export DSN + fiche de paie) |
| P2 | ✅ | Météo temps réel (MeteoFrance + OpenWeatherMap) |
| P2 | ✅ | Événements locaux (Ticketmaster — prévision affluence) |
| P3 | ⬜ | Affichage dynamique digital signage (menu boards) |
| P3 | ⬜ | SDK tiers — marketplace d'extensions partenaires |
| P3 | ✅ | MQTT IoT (capteurs température / humidité — MqttProvider) |
| P3 | ⬜ | GS1 code-barres EAN (traçabilité supply chain) |
