# Restaurant OS — Roadmap Fonctionnelle

**124 features identifiées** · 49 P1 (Core) · 47 P2 (Important) · 28 P3 (Future)

> **Légende**
> - `P1` · Core — bloquant pour l'exploitation
> - `P2` · Important — différenciateur marché
> - `P3` · Future — avantage concurrentiel long terme

---

## ⚙ Ops — Service & Production (17)

| P | Feature |
|---|---------|
| P1 | Terminal de paiement (Stripe Terminal / SumUp / Ingenico) |
| P1 | Mode hors-ligne POS avec sync auto au retour réseau |
| P1 | Impression tickets thermiques ESC/POS (Epson, Star) |
| P1 | Scanner code-barres / QR articles en caisse |
| P1 | Gestion du pourboire (pool, individuel, déclaration DSN) |
| P1 | Alerte allergènes sur commandes (colorcode par plat) |
| P1 | Vérification âge alcool (blocage POS + confirmation) |
| P1 | Séquençage des plats (entrée → plat → dessert par table) |
| P1 | Routage KDS multi-station (chaud / froid / pâtisserie) |
| P2 | Self-ordering QR code (commande depuis table) |
| P2 | Application serveur mobile-first (iOS/Android) |
| P2 | Estimation temps de préparation IA par station KDS |
| P2 | Liste de préparation journalière auto (depuis réservations) |
| P2 | Cave à vin (millésimes, casiers, PRMP bouteille) |
| P2 | Cocktails à la une dynamiques (bar suggestions) |
| P3 | Room service (variante hôtel — liaison PMS) |
| P3 | Kiosque libre-service tablette (variante fast-casual) |

---

## 🛍 Commerce — Acquisition & Fidélité (20)

| P | Feature |
|---|---------|
| P1 | Click & collect (commande en ligne, retrait sur place) |
| P1 | Intégration Uber Eats / Deliveroo / Just Eat (agrégateur) |
| P1 | Intégration TheFork / LaFourchette |
| P1 | Intégration Google Reserve (réservation via Google Maps) |
| P1 | Arrhes / acompte obligatoire grands groupes avec Stripe |
| P1 | Confirmation SMS / email + rappels J-1 et J-7 |
| P1 | Politique d'annulation paramétrable + pénalité CB |
| P1 | Préférences clients (régime alimentaire, placement, occasion) |
| P2 | Réservation via WhatsApp Business |
| P2 | Bons cadeaux / e-chèques (génération + validation POS) |
| P2 | Programme parrainage (referral code + tracking) |
| P2 | Comptes entreprise / facturation B2B mensuelle |
| P2 | Packages événements (anniversaire, EVJF, team building) |
| P2 | Demande d'avis automatique post-visite (Google, Tripadvisor) |
| P2 | Gestion multi-établissements (réseau, franchises) |
| P2 | Tracking parcours client (RFM, CLV, churn prediction) |
| P3 | Menu multilingue QR code (EN/ES/ZH/AR) |
| P3 | Marketplace widgets tiers (réservation embedded) |
| P3 | Réseau partenaires fidélité inter-enseignes |
| P3 | Automatisation posts Instagram / Google Business |

---

## 💰 Finance & Comptabilité (15)

| P | Feature |
|---|---------|
| P1 | Rapprochement bancaire automatique (Open Banking API) |
| P1 | Déclarations TVA CA3 auto-générées (DGFiP) |
| P1 | Gestion de la caisse menue monnaie (fond de caisse) |
| P1 | Comptabilité des pourboires (déclaration DSN mensuelle) |
| P1 | Prévision de trésorerie 30 / 60 / 90 jours |
| P1 | Facturation inter-sociétés (groupe multi-restaurants) |
| P2 | SEPA direct débit fournisseurs récurrents |
| P2 | Analyse du seuil de rentabilité par service / jour |
| P2 | Budget vs réel en temps réel (dashboard CFO) |
| P2 | RevPASH (Revenue per Available Seat Hour) |
| P2 | Rentabilité par article de menu (contribution margin) |
| P2 | Food cost tracking avec alertes sur dérive vs objectif |
| P3 | Affacturage factures clients (financement court terme) |
| P3 | Multi-devise (tourisme — USD, GBP, CHF) |
| P3 | Consolidation financière groupe (reporting agrégé) |

---

## 🛡 Compliance & Sécurité alimentaire (12)

| P | Feature |
|---|---------|
| P1 | Registres HACCP numériques complets (temp, huiles, nettoyage) |
| P1 | Étiquetage allergènes EU 1169/2011 (14 allergènes, menu) |
| P1 | Traçabilité farm-to-fork (lot → plat → table) |
| P1 | Contrôle qualité de l'eau (pH, chlore, relevés) |
| P1 | Journal des nuisibles (dératisation, désinsectisation) |
| P1 | Signalement incidents DGCCRF / RASFF (rappel produit) |
| P2 | Bilan carbone GES (scope 1+2+3 restauration) |
| P2 | Reporting réduction déchets (loi Agec, dons associations) |
| P2 | Conformité incendie (extincteurs, exercices, ERP) |
| P2 | Audit fournisseur (Bio, MSC, Label Rouge, local) |
| P3 | Score Nutri-Score calculé automatiquement par plat |
| P3 | Conformité accessibilité PMR (ERP catégorie 3-4-5) |

---

## 👥 Human — RH & Paie (14)

| P | Feature |
|---|---------|
| P1 | Planning des équipes (roster hebdomadaire, drag & drop) |
| P1 | Gestion congés / absences / RTT avec soldes |
| P1 | Pointeuse badge / biométrie / géolocalisation |
| P1 | Calcul automatique heures supp (25% / 50%) |
| P1 | Répartition automatique des pourboires (pool / individuel) |
| P2 | Module recrutement ATS simplifié (offre → entretien → contrat) |
| P2 | Onboarding digital (livret, contrat e-sign, accès) |
| P2 | Entretiens professionnels (bilan 2 ans, objectifs) |
| P2 | Rotation multi-sites (staff partagé entre établissements) |
| P2 | Avances sur salaire avec remboursement automatique |
| P2 | Incidents sécurité / accidents du travail (DUER) |
| P3 | Formation e-learning interne (HACCP, service, hygiène) |
| P3 | Gestion contrats saisonniers / extras (CDDU) |
| P3 | Conformité syndicale / accord de branche HCR |

---

## 📦 Logistics — Stock & Approvisionnement (13)

| P | Feature |
|---|---------|
| P1 | Comparateur prix multi-fournisseurs (appel d'offres auto) |
| P1 | Bons de commande automatiques (réapprovisionnement) |
| P1 | Suivi livraisons temps réel (EDI, portail fournisseur) |
| P1 | Traçabilité lot/batch (DLC + DLO + numéro de lot) |
| P1 | Valorisation stock FIFO / PRMP (choix par catégorie) |
| P1 | Contrôle qualité réception (conformité BL vs commande) |
| P2 | Stock en consignation (tracking bouteilles, fûts) |
| P2 | Retours fournisseurs avec avoir automatique |
| P2 | Par level management intelligent (seuils adaptatifs) |
| P2 | Reporting gaspillage avec causes (DLC, sur-production, erreur) |
| P2 | Inventaire tournant par zone (sans fermeture) |
| P3 | Prédiction péremption IA (alerte avant DLC) |
| P3 | Tracking énergie chambres froides (consommation / alerte) |

---

## 🧠 Intelligence — IA & Analytics (14)

| P | Feature |
|---|---------|
| P1 | Prévision des ventes ML (J+7, semaine, mois) |
| P1 | Menu engineering (étoile / vache à lait / poids mort / énigme) |
| P1 | Recommandations upselling serveur en temps réel |
| P2 | Pricing dynamique basé sur la demande (heures creuses / pleines) |
| P2 | Analyse sentiment clients multi-sources (Google, TripAdvisor, Yelp) |
| P2 | Optimisation planning RH selon prévisions d'affluence |
| P2 | Prédiction du gaspillage (sur-commande vs historique) |
| P2 | Score de performance fournisseur (délai, qualité, prix) |
| P2 | Veille concurrentielle (pricing, avis, positionnement) |
| P2 | Détection d'anomalie sur recettes (coût vs historique) |
| P3 | Optimisation coût recettes IA (substitution ingrédients) |
| P3 | Intelligence marché (tendances cuisine, saisonnalité) |
| P3 | Computer vision plateau (détection gaspillage photo) |
| P3 | RevPAC — Revenue per Available Cover (siège × service) |

---

## 🏛 Facility — Espaces & Maintenance (10)

| P | Feature |
|---|---------|
| P1 | Plan de salle 3D interactif (drag & drop, zones) |
| P1 | Heatmap d'occupation des tables (par service / semaine) |
| P1 | Réservation salle privatisée (contrat + acompte) |
| P1 | Gestion multi-espaces (terrasse, intérieur, bar, cave) |
| P2 | Planning maintenance préventive (fours, chambre froide, etc.) |
| P2 | Cycle de vie matériel (garantie, amortissement, remplacement) |
| P2 | Planning ménage / nettoyage des espaces (check-list) |
| P2 | Gestion multi-étages avec ascenseur / monte-plat |
| P3 | Monitoring énergie bâtiment (électricité, gaz, eau) |
| P3 | Réalité augmentée plan de salle (tablette AR) |

---

## 🔌 Intégrations Transversales (9)

| P | Feature |
|---|---------|
| P1 | Apple Pay / Google Pay / NFC (intégration native POS) |
| P1 | Google Business Profile sync (horaires, menu, photos) |
| P1 | Application mobile client-facing iOS / Android |
| P2 | Mailchimp / Klaviyo marketing automation (campagnes) |
| P2 | Export comptable Cegid / Sage / QuickBooks natif |
| P2 | API publique REST + webhooks (intégrations partenaires) |
| P2 | PMS hôtel (Opera, Mews, Cloudbeds) — variante hôtel |
| P3 | Affichage dynamique digital signage (menu boards) |
| P3 | SDK tiers — marketplace d'extensions partenaires |
