# 📋 Restaurant OS — Backlog Produit & Suivi Tactique

**~170 features** · P1 Core · P2 Important · P3 Future · Source Unique de Vérité Fonctionnelle

> **Légende Statut**
> - ✅ Implémenté — logique métier complète (avec pointeur code)
> - 🔧 Partiel — scaffoldé ou à compléter
> - ⬜ À développer
>
> **Légende Horizons**
> - `H1` : Prod-Ready & Sécurisation Fiscale (M+0 · Août 2026 - 3-4 semaines réelles)
> - `H2` : Déploiement Commercial & Mobile App (M+1 → M+3)
> - `H3` : Expansion Multi-Verticales (Bakery, Retail, Salon) (M+3 → M+9)
> - `H4` : Franchises & Verticales Lourdes (Garage, PMS Hotel) (M+9 → M+18)
> - `H5` : Souveraineté IA & Santé HDS (Clinic, Swarm) (M+18 → M+36)

---

## ⚙ Ops — Service & Production

| P | Statut | Horizon | Feature | Code / Ref |
|---|--------|---------|---------|------------|
| P1 | 🔧 | H1 | Terminal de paiement (Stripe Terminal / SumUp / Ingenico) | `src/lib/adapters/StripeTerminalAdapter.ts` |
| P1 | ⬜ | H1 | Mode hors-ligne POS avec sync auto au retour réseau | `src/lib/sync/offlineQueue.ts` |
| P1 | 🔧 | H1 | Impression tickets thermiques ESC/POS (Epson, Star) | `src/lib/printers/EscPosDriver.ts` |
| P1 | ⬜ | H2 | Scanner code-barres / QR articles en caisse | `src/modules/ops/service/pos/` |
| P1 | ✅ | H1 | Gestion du pourboire (pool, individuel, déclaration DSN) | `src/modules/human/paie/tips.ts` |
| P1 | ⬜ | H1 | Alerte allergènes sur commandes (colorcode par plat) | `src/modules/commerce/catalog/` |
| P1 | ⬜ | H1 | Vérification âge alcool (blocage POS + confirmation) | `src/modules/ops/service/pos/hooks/usePos.ts` |
| P1 | 🔧 | H1 | Séquençage des plats (entrée → plat → dessert par table) | `src/modules/ops/production/kds/` |
| P1 | ✅ | H1 | Routage KDS multi-station (chaud / froid / pâtisserie) | `src/modules/ops/production/kds/KdsEngine.ts` |
| P1 | ⬜ | H1 | Split addition (partage par convive ou par article) | `src/modules/ops/service/pos/hooks/usePosSplit.ts` |
| P1 | ⬜ | H1 | Verrouillage CAS des tables & Reliquat indivisible de split | `src/shared/eventBus/handlers/TableLockHandler.ts` |
| P1 | ⬜ | H1 | Session de service & Calculs Shift UTC (Anti-DST) | `src/modules/ops/workflow/engine/` |
| P1 | ⬜ | H1 | Architecture NF525 multi-caisses offline (chaîne par terminal) | `src/modules/finance/fiscalite/FiscalSealer.ts` |
| P1 | ⬜ | H1 | Idempotence Bus via eventId deduplication log | `src/shared/eventBus/NexusEventBus.ts` |
| P1 | ⬜ | H2 | Pré-autorisation CB sur table ouverte | `src/lib/adapters/StripeAdapter.ts` |
| P2 | ⬜ | H2 | Bouton SOS Caisse & Diagnostic d'urgence POS | `src/modules/ops/service/pos/` |
| P2 | ⬜ | H2 | Self-ordering QR code (commande depuis table) | `src/app/(client)/(public)/order/` |
| P2 | ⬜ | H2 | Application serveur mobile-first (iOS/Android) | `src/app/(client)/(ops)/mobile-pos/` |
| P2 | 🔧 | H2 | Estimation temps de préparation IA par station KDS | `src/modules/ops/production/kds/` |
| P2 | 🔧 | H1 | Liste de préparation journalière auto (depuis réservations) | `src/orchestration/handlers/ResaKitchenTaskHandler.ts` |
| P2 | ⬜ | H2 | Cave à vin (millésimes, casiers, PRMP bouteille) | `src/modules/commerce/catalog/` |
| P2 | 🔧 | H2 | Cocktails à la une dynamiques (bar suggestions) | `src/modules/commerce/catalog/` |
| P2 | ⬜ | H3 | Articles au poids (balance connectée — fromage, viande) | `src/lib/hardware/scaleConnector.ts` |
| P2 | ⬜ | H2 | Multi-terminal multi-caissier simultané (quarts concurrent) | `src/modules/ops/service/pos/` |
| P3 | ⬜ | H4 | Room service (variante hôtel — liaison PMS) | `src/verticals/hotel/` |
| P3 | ⬜ | H3 | Kiosque libre-service tablette (variante fast-casual) | `src/app/(client)/(ops)/kiosk/` |
| P3 | ⬜ | H2 | Menus du jour / saisonniers (activation / désactivation rapide) | `src/modules/commerce/catalog/` |
| P3 | ⬜ | H2 | Impression ticket personnalisé (logo, fidélité, QR prochain avis) | `src/lib/printers/` |

---

## 🛍 Commerce — Acquisition & Fidélité

| P | Statut | Horizon | Feature | Code / Ref |
|---|--------|---------|---------|------------|
| P1 | 🔧 | H2 | Click & collect (commande en ligne, retrait sur place) | `src/app/(client)/(public)/click-collect/` |
| P1 | ✅ | H2 | Intégration Uber Eats (connecteur OAuth + webhook) | `src/lib/connectors/hub/UberEatsConnector.ts` |
| P1 | ⬜ | H2 | Intégration Deliveroo / Just Eat (agrégateur) | `src/lib/connectors/hub/DeliverooConnector.ts` |
| P1 | ✅ | H1 | Intégration TheFork / Zenchef (réservation) | `src/lib/connectors/hub/TheForkConnector.ts` |
| P1 | ⬜ | H2 | Intégration Google Reserve (réservation via Google Maps) | `src/lib/connectors/hub/` |
| P1 | ⬜ | H1 | Arrhes / acompte obligatoire grands groupes avec Stripe | `src/app/api/webhooks/stripe/route.ts` |
| P1 | ✅ | H1 | Confirmation SMS / email + rappels J-1 et J-7 | `src/orchestration/handlers/ReservationNotifier.ts` |
| P1 | 🔧 | H1 | Politique d'annulation paramétrable + pénalité no-show | `src/modules/commerce/relation/` |
| P1 | 🔧 | H1 | Préférences clients (régime alimentaire, placement, occasion) | `src/modules/commerce/relation/crm/` |
| P1 | 🔧 | H1 | Liste d'attente temps réel avec SMS estimé | `src/modules/commerce/relation/` |
| P2 | ⬜ | H3 | Réservation via WhatsApp Business | `src/lib/connectors/hub/WhatsAppConnector.ts` |
| P2 | ✅ | H2 | Bons cadeaux / e-chèques (génération + validation POS) | `src/modules/commerce/pricing/` |
| P2 | ⬜ | H2 | Programme parrainage (referral code + tracking) | `src/modules/commerce/relation/loyalty/` |
| P2 | 🔧 | H2 | Comptes entreprise / facturation B2B mensuelle | `src/modules/finance/billing/` |
| P2 | 🔧 | H2 | Packages événements (anniversaire, EVJF, team building) | `src/modules/commerce/catalog/` |
| P2 | ⬜ | H2 | Demande d'avis automatique post-visite (Google, Tripadvisor) | `src/orchestration/handlers/PostVisitReviewHandler.ts` |
| P2 | 🔧 | H1 | Gestion multi-établissements (réseau, franchises — EmpireCockpit) | `src/app/(admin)/mcc/` |
| P2 | 🔧 | H2 | Tracking parcours client (RFM, CLV, churn prediction) | `src/modules/commerce/relation/crm/` |
| P2 | ⬜ | H3 | Abonnements repas (formule mensuelle, entreprises) | `src/modules/commerce/pricing/` |
| P3 | ⬜ | H2 | Menu multilingue QR code (EN/ES/ZH/AR) | `src/i18n/` |
| P3 | ✅ | H1 | Widget réservation embeddable (iframe tiers) | `src/app/api/widgets/reservation/` |
| P3 | ⬜ | H3 | Réseau partenaires fidélité inter-enseignes | `src/modules/commerce/relation/loyalty/` |
| P3 | 🔧 | H3 | Automatisation posts Google Business / réseaux sociaux | `src/modules/intelligence/` |
| P3 | ⬜ | H2 | Pre-orders événements futurs (commandes à date) | `src/modules/commerce/catalog/` |

---

## 💰 Finance & Comptabilité

| P | Statut | Horizon | Feature | Code / Ref |
|---|--------|---------|---------|------------|
| P1 | ✅ | H1 | Rapprochement bancaire automatique (Open Banking — 5 providers) | `src/modules/finance/comptabilite/BankSync.ts` |
| P1 | 🔧 | H1 | Déclarations TVA CA3 auto-générées (DGFiP + EDI) | `src/modules/finance/fiscalite/tax/vatResolver.ts` |
| P1 | ✅ | H1 | Gestion de la caisse menue monnaie (fond de caisse + comptage) | `src/modules/finance/comptabilite/CashDrawer.ts` |
| P1 | ✅ | H1 | Comptabilité des pourboires (déclaration DSN mensuelle) | `src/modules/human/paie/tips.ts` |
| P1 | 🔧 | H1 | Prévision de trésorerie 30 / 60 / 90 jours | `src/modules/finance/comptabilite/CashflowForecast.ts` |
| P1 | ⬜ | H1 | Clés déterministes des écritures Grand Livre / Remboursements | `src/shared/eventBus/handlers/RefundJournalHandler.ts` |
| P1 | 🔧 | H2 | Facturation inter-sociétés (groupe multi-restaurants) | `src/modules/finance/billing/` |
| P1 | ✅ | H1 | Clôture journalière Z de caisse NF525 (scellement cryptographique) | `src/modules/finance/fiscalite/FiscalSeal.ts` |
| P2 | ✅ | H2 | SEPA direct débit fournisseurs récurrents (XML pain.001) | `src/orchestration/handlers/SepaExportHandler.ts` |
| P2 | 🔧 | H2 | Analyse du seuil de rentabilité par service / jour | `src/modules/finance/comptabilite/` |
| P2 | ✅ | H1 | Budget vs réel en temps réel (dashboard CFO) | `src/modules/finance/comptabilite/BudgetTracker.ts` |
| P2 | 🔧 | H2 | RevPASH (Revenue per Available Seat Hour) | `src/modules/intelligence/forecasting/` |
| P2 | 🔧 | H1 | Rentabilité par article de menu (contribution margin) | `src/modules/finance/comptabilite/` |
| P2 | ✅ | H1 | Food cost tracking avec alertes sur dérive vs objectif | `src/orchestration/handlers/BCGActionSuggestionHandler.ts` |
| P2 | ✅ | H1 | Matching 3 voies commande / réception / facture | `src/modules/logistics/approvisionnement/` |
| P2 | ✅ | H1 | Export FacturX (PDF/A-3 + XML — norme UE) | `src/modules/finance/einvoicing/FacturXGenerator.ts` |
| P2 | ✅ | H2 | Recouvrement créances avec escalade automatique | `src/modules/finance/billing/RecoveryEngine.ts` |
| P2 | ✅ | H1 | Export Pennylane (comptabilité en ligne) | `src/modules/finance/comptabilite/PennylaneAdapter.ts` |
| P3 | ⬜ | H4 | Affacturage factures clients (financement court terme) | `src/modules/finance/billing/` |
| P3 | ⬜ | H3 | Multi-devise (tourisme — USD, GBP, CHF) | `src/kernel/nexus/contracts/settings/defaults.ts` |
| P3 | 🔧 | H2 | Consolidation financière groupe (reporting agrégé MacroBrain) | `src/app/(admin)/mcc/` |
| P3 | ⬜ | H3 | DAS2 (déclaration honoraires artistes / prestataires) | `src/modules/finance/fiscalite/` |

---

## 🛡 Compliance & Sécurité Alimentaire

| P | Statut | Horizon | Feature | Code / Ref |
|---|--------|---------|---------|------------|
| P1 | ✅ | H1 | Registres HACCP numériques complets (temp, huiles, nettoyage) | `src/modules/compliance/qualite/haccp/` |
| P1 | 🔧 | H1 | Étiquetage allergènes EU 1169/2011 (14 allergènes, menu + étiquettes) | `src/modules/compliance/sanitaire/` |
| P1 | 🔧 | H1 | Traçabilité farm-to-fork (lot → plat → table) | `src/modules/compliance/sanitaire/TraceabilityEngine.ts` |
| P1 | 🔧 | H1 | Contrôle qualité de l'eau (pH, chlore, relevés) | `src/modules/compliance/qualite/` |
| P1 | 🔧 | H2 | Journal des nuisibles (dératisation, désinsectisation) | `src/modules/compliance/qualite/` |
| P1 | ✅ | H1 | Signalement incidents DGCCRF / RASFF (rappel produit) | `src/orchestration/handlers/NonConformActionHandler.ts` |
| P1 | ✅ | H1 | Formation HACCP 14h obligatoire (suivi attestations) | `src/orchestration/handlers/TrainingComplianceAlertHandler.ts` |
| P1 | ⬜ | H2 | Permis d'exploitation (suivi renouvellement 10 ans) | `src/modules/compliance/registre/` |
| P2 | ⬜ | H4 | Bilan carbone GES (scope 1 + 2 + 3 restauration) | `src/modules/compliance/` |
| P2 | 🔧 | H3 | Reporting réduction déchets (loi Agec, dons associations) | `src/modules/compliance/qualite/` |
| P2 | ✅ | H1 | Conformité incendie (extincteurs, exercices, ERP) | `src/modules/compliance/securite/` |
| P2 | ⬜ | H3 | Audit fournisseur (Bio, MSC, Label Rouge, local) | `src/modules/logistics/approvisionnement/` |
| P2 | ✅ | H1 | RGPD — droit à l'oubli client (ErasureService) | `src/modules/compliance/registre/ErasureService.ts` |
| P1 | ⬜ | H1 | RGPD Art. 9 — Consentement & chiffrement données santé allergies | `src/modules/commerce/relation/crm/` |
| P2 | 🔧 | H1 | Détection fraude POS (anomalies caisse, voids suspects) | `src/orchestration/handlers/CryptoIntegrityCheckHandler.ts` |
| P3 | ⬜ | H3 | Score Nutri-Score calculé automatiquement par plat | `src/modules/commerce/catalog/` |
| P3 | ✅ | H1 | Conformité accessibilité PMR (ERP catégorie 3-4-5) | `src/modules/compliance/securite/` |
| P3 | ⬜ | H2 | Licence IV (gestion renouvellement, transfert) | `src/modules/compliance/registre/` |
| P3 | 🔧 | H2 | Audit tiers externe (consultants, cabinets — AuditService) | `src/modules/compliance/securite/AuditService.ts` |

---

## 👥 Human — RH & Paie

| P | Statut | Horizon | Feature | Code / Ref |
|---|--------|---------|---------|------------|
| P1 | ✅ | H1 | Planning des équipes (roster hebdomadaire, conformité HCR) | `src/modules/human/planning/RosterEngine.ts` |
| P1 | ✅ | H1 | Gestion congés / absences / RTT avec soldes | `src/app/(client)/(ops)/leaves/page.tsx` |
| P1 | ✅ | H1 | Pointeuse badge / QR code / géolocalisation | `src/modules/human/timeclock/TimeclockEngine.ts` |
| P1 | ⬜ | H1 | Debounce anti-rebond pointeuse staff (60s) | `src/modules/human/timeclock/` |
| P1 | ✅ | H1 | Calcul automatique heures supp (25% / 50%) | `src/orchestration/handlers/HRClockInGuardHandler.ts` |
| P1 | ✅ | H1 | Répartition automatique des pourboires (pool / individuel) | `src/design/settings/TipsDistributionSettingsSection.tsx` |
| P1 | ✅ | H1 | DSN mensuelle (builder XML URSSAF) | `src/orchestration/handlers/PayrollExportHandler.ts` |
| P2 | ✅ | H2 | Module recrutement ATS simplifié | `src/modules/human/effectifs/hr/` |
| P2 | ⬜ | H2 | Onboarding digital (livret, contrat e-sign, accès) | `src/modules/human/effectifs/hr/` |
| P2 | ⬜ | H3 | Entretiens professionnels (bilan 2 ans, objectifs) | `src/modules/human/effectifs/hr/` |
| P2 | 🔧 | H2 | Rotation multi-sites (staff partagé entre établissements) | `src/modules/human/planning/` |
| P2 | ⬜ | H3 | Avances sur salaire avec remboursement automatique | `src/modules/human/paie/` |
| P2 | ✅ | H1 | Accidents du travail / DUER (Document Unique) | `src/modules/human/effectifs/hr/` |
| P2 | ✅ | H1 | Registre Unique du Personnel (RUP) | `src/modules/human/effectifs/hr/components/staff/StaffMemberForm.tsx` |
| P2 | ✅ | H1 | Prépaie export Silae (expert-comptable) | `src/orchestration/handlers/PayrollExportHandler.ts` |
| P2 | ⬜ | H3 | CET (Compte Épargne Temps, règles branche HCR) | `src/modules/human/paie/` |
| P3 | ⬜ | H3 | Formation e-learning interne (HACCP, service, hygiène) | `src/modules/human/effectifs/hr/` |
| P3 | ⬜ | H2 | Gestion contrats saisonniers / extras (CDDU) | `src/modules/human/effectifs/hr/` |
| P3 | 🔧 | H1 | Conformité syndicale / accord de branche HCR (amplitude, repos) | `src/orchestration/handlers/HRBreakCheckHandler.ts` |
| P3 | ⬜ | H3 | Gestion apprentis / alternants (CFA, tuteurs, suivi) | `src/modules/human/effectifs/hr/` |

---

## 📦 Logistics — Stock & Approvisionnement

| P | Statut | Horizon | Feature | Code / Ref |
|---|--------|---------|---------|------------|
| P1 | 🔧 | H1 | Comparateur prix multi-fournisseurs (appel d'offres auto) | `src/modules/logistics/approvisionnement/` |
| P1 | 🔧 | H1 | Bons de commande automatiques (réapprovisionnement seuil) | `src/modules/logistics/approvisionnement/` |
| P1 | 🔧 | H2 | Suivi livraisons temps réel (portail fournisseur) | `src/modules/logistics/approvisionnement/` |
| P1 | 🔧 | H1 | Traçabilité lot / batch (DLC + DLO + numéro de lot) | `src/modules/logistics/dlc/` |
| P1 | ✅ | H1 | Valorisation stock FIFO / PRMP (déduction par batch) | `src/__tests__/helpers/saga.stock.test.ts` |
| P1 | ✅ | H1 | Contrôle qualité réception (conformité BL vs commande) | `src/modules/logistics/inventaire/` |
| P1 | ✅ | H1 | Service 86 automatique (blocage commande si stock zéro) | `src/modules/ops/service/pos/` |
| P1 | ✅ | H1 | Déduction stock automatique sur commande validée | `src/modules/logistics/stocks/` |
| P1 | ⬜ | H1 | Décrémentation atomique des stocks (Anti-Race-Condition) | `src/shared/eventBus/handlers/StockDeductionHandler.ts` |
| P2 | ⬜ | H3 | Stock en consignation (tracking bouteilles, fûts bière, gaz) | `src/modules/logistics/stocks/` |
| P2 | ⬜ | H2 | Retours fournisseurs avec avoir automatique | `src/modules/logistics/approvisionnement/` |
| P2 | 🔧 | H2 | Par level management adaptatif (seuils dynamiques) | `src/modules/logistics/stocks/` |
| P2 | 🔧 | H1 | Reporting gaspillage avec causes (DLC, sur-production) | `src/modules/logistics/inventaire/` |
| P2 | ⬜ | H2 | Inventaire tournant par zone (sans fermeture) | `src/app/(client)/(ops)/inventory/loading.tsx` |
| P2 | ✅ | H1 | Extraction OCR / IA factures fournisseurs | `src/__tests__/onboarding/ocrParsers.test.ts` |
| P2 | ✅ | H1 | Matching 3 voies logistique (commande / BL / facture) | `src/modules/logistics/approvisionnement/` |
| P3 | 🔧 | H3 | Prédiction péremption IA (alerte avant DLC) | `src/modules/intelligence/` |
| P3 | 🔧 | H2 | Tracking énergie chambres froides (IoT capteurs) | `src/orchestration/handlers/FridgeTempAlertHandler.ts` |
| P3 | ⬜ | H3 | Label anti-gaspillage (Too Good To Go, Phenix) | `src/modules/logistics/` |
| P3 | ✅ | H1 | Migration historique depuis Zelty | `src/modules/acquisition/onboarding/migration/types.ts` |

---

## 🧠 Intelligence — IA & Analytics

| P | Statut | Horizon | Feature | Code / Ref |
|---|--------|---------|---------|------------|
| P1 | 🔧 | H2 | Prévision des ventes ML (J+7, semaine, mois) | `src/modules/intelligence/forecasting/` |
| P1 | ⬜ | H2 | Menu engineering (étoile / vache à lait / poids mort) | `src/orchestration/handlers/BCGActionSuggestionHandler.ts` |
| P1 | 🔧 | H1 | Recommandations upselling serveur en temps réel | `src/modules/intelligence/ia/ai/HermesEngine.ts` |
| P1 | ✅ | H1 | Rapports flash quotidiens automatisés | `src/orchestration/handlers/DailyDigestHandler.ts` |
| P1 | ✅ | H1 | Rapports hebdomadaires consolidés | `src/modules/intelligence/` |
| P1 | ✅ | H1 | Détection anomalies cross-domain (revenus, stock) | `src/modules/intelligence/domain/agency/Zeus.ts` |
| P2 | ✅ | H2 | Pricing dynamique basé sur la demande | `src/modules/commerce/pricing/` |
| P2 | ⬜ | H3 | Analyse sentiment clients multi-sources | `src/modules/intelligence/` |
| P2 | 🔧 | H2 | Optimisation planning RH selon prévisions d'affluence | `src/modules/human/planning/` |
| P2 | 🔧 | H2 | Prédiction du gaspillage (sur-commande vs historique) | `src/modules/logistics/inventaire/` |
| P2 | ⬜ | H3 | Score de performance fournisseur (délai, qualité, prix) | `src/modules/logistics/approvisionnement/` |
| P2 | ✅ | H1 | Veille concurrentielle (pricing, avis — MarketOracle) | `src/app/api/oracle/route.ts` |
| P2 | 🔧 | H1 | Détection d'anomalie sur recettes (coût vs historique) | `src/modules/intelligence/` |
| P2 | ⬜ | H3 | Prédiction no-show ML (historique × météo × événement) | `src/modules/intelligence/forecasting/` |
| P2 | ✅ | H1 | Benchmarking inter-établissements (FleetBenchmark) | `src/lib/mcc/auth/MccOperatorContract.ts` |
| P2 | ✅ | H1 | Ajustement staffing selon météo | `src/orchestration/handlers/RushModeIntegrationHandler.ts` |
| P3 | ⬜ | H4 | Optimisation coût recettes IA (substitution ingrédients) | `src/modules/intelligence/` |
| P3 | 🔧 | H3 | Intelligence marché (tendances cuisine, saisonnalité) | `src/modules/intelligence/` |
| P3 | 🔧 | H4 | Computer vision plateau / stock (photo → gaspillage) | `src/modules/intelligence/domain/agency/types.ts` |
| P3 | 🔧 | H3 | RevPAC — Revenue per Available Cover | `src/modules/intelligence/forecasting/` |
| P3 | ⬜ | H3 | Recommandation accords mets-vins | `src/modules/commerce/catalog/` |

---

## 🏛 Facility — Espaces & Maintenance

| P | Statut | Horizon | Feature | Code / Ref |
|---|--------|---------|---------|------------|
| P1 | ✅ | H1 | Plan de salle 2D interactif (drag & drop, zones) | `src/app/(client)/(ops)/floor-plan/page.tsx` |
| P1 | ✅ | H1 | Calcul géométrique plan (centrage auto, zoom) | `src/app/(client)/(ops)/floor-plan/` |
| P1 | ⬜ | H2 | Heatmap d'occupation des tables (par service / semaine) | `src/app/(client)/(ops)/floor-plan/` |
| P1 | ✅ | H1 | Réservation salle privatisée (contrat + acompte) | `src/modules/commerce/relation/` |
| P1 | ✅ | H1 | Gestion multi-espaces (terrasse, intérieur, bar, cave) | `src/app/(client)/(ops)/floor-plan/` |
| P2 | ⬜ | H2 | Planning maintenance préventive (fours, chambre froide) | `src/modules/facility/maintenance/` |
| P2 | ⬜ | H3 | Cycle de vie matériel (garantie, amortissement) | `src/modules/facility/` |
| P2 | ⬜ | H2 | Planning ménage / nettoyage des espaces | `src/modules/facility/` |
| P2 | 🔧 | H2 | Gestion multi-étages avec ascenseur / monte-plat | `src/app/(client)/(ops)/floor-plan/` |
| P2 | ✅ | H1 | Registre interventions maintenance | `src/modules/facility/interventions/` |
| P2 | ✅ | H1 | CERFA 13984 (vérifications réglementaires) | `src/modules/compliance/securite/` |
| P2 | ✅ | H1 | Gestion prestataires maintenance (contrats) | `src/modules/facility/interventions/` |
| P3 | ⬜ | H4 | Monitoring énergie bâtiment (électricité, gaz, eau) | `src/modules/facility/iot/` |
| P3 | ⬜ | H5 | Réalité augmentée plan de salle (tablette AR) | `src/app/(client)/(ops)/floor-plan/` |
| P3 | ⬜ | H4 | Domotique salle (éclairage, température par zone) | `src/modules/facility/iot/` |
| P3 | ⬜ | H4 | Surveillance CCTV avec détection intrusion | `src/modules/facility/` |

---

## 🔌 Intégrations Transversales

| P | Statut | Horizon | Feature | Code / Ref |
|---|--------|---------|---------|------------|
| P1 | 🔧 | H1 | Apple Pay / Google Pay / NFC (intégration native POS) | `src/modules/ops/service/pos/` |
| P1 | ✅ | H1 | Google Business Profile sync (horaires, menu, photos) | `src/modules/commerce/relation/` |
| P1 | ⬜ | H2 | Application mobile client-facing iOS / Android | `src/app/(client)/(public)/` |
| P1 | ✅ | H1 | Webhooks réservations (Zenchef, UberEats) | `src/lib/connectors/hub/hooks/useConnector.ts` |
| P1 | ✅ | H1 | Email marketing (Brevo — campagnes, transactionnel) | `src/modules/commerce/relation/` |
| P2 | ⬜ | H3 | Mailchimp / Klaviyo (automation marketing avancée) | `src/lib/connectors/hub/` |
| P2 | ✅ | H1 | Export Pennylane (comptabilité cloud) | `src/modules/finance/comptabilite/PennylaneAdapter.ts` |
| P2 | ⬜ | H2 | Export Cegid / Sage / QuickBooks natif | `src/modules/finance/comptabilite/` |
| P2 | ⬜ | H2 | API publique REST + webhooks (intégrations partenaires) | `src/app/api/` |
| P2 | ⬜ | H4 | PMS hôtel (Opera, Mews, Cloudbeds) — variante hôtel | `src/verticals/hotel/` |
| P2 | ✅ | H1 | Silae paie (export DSN + fiche de paie) | `src/orchestration/handlers/PayrollExportHandler.ts` |
| P2 | ✅ | H1 | Météo temps réel (MeteoFrance + OpenWeatherMap) | `src/orchestration/handlers/RushModeIntegrationHandler.ts` |
| P2 | ✅ | H1 | Événements locaux (Ticketmaster — prévision affluence) | `src/modules/intelligence/forecasting/` |
| P2 | ⬜ | H2 | Playbook Kit Matériel & Checklist Réseau 4G Failover | `docs/guides/HARDWARE_PLAYBOOK.md` |
| P3 | ⬜ | H3 | Affichage dynamique digital signage (menu boards) | `src/app/(client)/(public)/` |
| P3 | ⬜ | H5 | SDK tiers — marketplace d'extensions partenaires | `src/kernel/plugins/` |
| P3 | ✅ | H1 | MQTT IoT (capteurs température / humidité) | `src/orchestration/handlers/FridgeTempAlertHandler.ts` |
| P3 | ⬜ | H3 | GS1 code-barres EAN (traçabilité supply chain) | `src/modules/logistics/approvisionnement/` |
