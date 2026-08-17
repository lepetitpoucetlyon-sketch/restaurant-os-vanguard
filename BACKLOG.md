# 📋 Restaurant OS — Backlog Produit & Suivi Tactique

**~170 features** · P1 Core · P2 Important · P3 Future · **Source Unique de Vérité Fonctionnelle**

> **Légende Statut**
> - ✅ Implémenté — logique métier complète (avec pointeur code)
> - 🔧 Partiel — scaffoldé ou à compléter (voir colonne Bloquants pour dépendance)
> - ⬜ À développer
> - 🚧 Bloqué — dépendance non résolue (voir colonne Bloquants)
> - 🚫 Bloqué légal — CNIL/RGPD/HDS
>
> **Légende Horizons**
> - `H1` : Prod-Ready & Sécurisation Fiscale (Août-Sept 2026 · 3-4 semaines)
> - `H2` : Déploiement Commercial & Mobile App (Sept-Nov 2026)
> - `H3` : Expansion Multi-Verticales (Bakery, Retail, Salon) (Déc 2026 → Mai 2027)
> - `H4` : Franchises & Verticales Lourdes (Garage, PMS Hotel) (Juin 2027 → Fév 2028)
> - `H5` : Souveraineté IA & Santé HDS (Clinic, Swarm) (2028-2029)
>
> **Légende Effort**
> - `S` : Small (1-3 jours)
> - `M` : Medium (1 semaine)
> - `L` : Large (2-4 semaines)
> - `XL` : Extra Large (1-3 mois)
>
> **Docs croisés** : [DEBT.md](docs/DEBT.md) · [ARCHITECTURE_METAPLATFORM.md](docs/plans/ARCHITECTURE_METAPLATFORM.md) · [ROADMAP_STRATEGY.md](docs/plans/ROADMAP_STRATEGY.md) · [VERTICALS_SPECIFICATION.md](docs/plans/VERTICALS_SPECIFICATION.md) · [UI_MATRIX_16_ZONES.md](docs/plans/UI_MATRIX_16_ZONES.md)

---

## ⚙ Ops — Service & Production

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances |
|---|--------|---------|--------|---------|------------|-------------------------|
| P1 | 🔧 | H1 | M | Terminal de paiement (Stripe Terminal / SumUp / Ingenico) | `src/lib/adapters/StripeTerminalAdapter.ts` | Stripe câblé sandbox — SumUp/Ingenico ⬜ |
| P1 | ✅ | H1 | — | Mode hors-ligne POS avec sync auto au retour réseau | `src/lib/sync/offlineQueue.ts`, `src/lib/offline/sync-manager.ts` | File d'attente Dexie (`OfflineQueueService`) + `SyncManager` de ré-émission automatique |
| P1 | 🔧 | H1 | S | Impression tickets thermiques ESC/POS (Epson, Star) | `src/lib/printers/EscPosDriver.ts` | Fonctionne ; auto-discovery imprimantes ⬜ |
| P1 | ⬜ | H2 | S | Scanner code-barres / QR articles en caisse | `src/modules/ops/service/pos/` | — |
| P1 | ✅ | H1 | S | Alerte allergènes sur commandes & Check-In client KDS | `src/modules/facility/spaces/floor-plan/TableInsightPanel.tsx`, `ResaAllergenCheckHandler.ts` | Émission `reservation.matched` & notification urgente cuisine validées |
| P1 | ✅ | H1 | — | Séquençage des plats (entrée → plat → dessert par table) | `src/modules/ops/production/kds/services/KDSCourseSequencingEngine.ts` | Validé : initialisation FIRED/HOLD, demande suite & tir en cuisine |
| P1 | ✅ | H1 | — | Routage KDS multi-station (chaud / froid / pâtisserie) | `src/modules/ops/production/kds/KdsEngine.ts` | — |
| P1 | ✅ | H1 | — | Split addition (partage par convive ou par article) | `src/modules/ops/service/pos/hooks/usePosSplit.ts`, `SplitBillDialog.tsx` | Reliquat au dernier payeur validé (Invariant #5 SovereignMath) |
| P1 | ✅ | H1 | — | Verrouillage CAS des tables & Concurrence POS | `src/modules/ops/service/pos/services/TableLockService.ts`, `useTableLock.ts` | Invariants #2 & #3 validés (zéro collision d'accès concurrent) |
| P1 | ✅ | H1 | — | Session de service & Calculs Shift UTC (Anti-DST) | `src/modules/ops/workflow/engine/services/ServiceSessionService.ts` | Invariant #4 validé (calcul absolu ms UTC & rattachement nocturne J-1) |
| P1 | ✅ | H1 | — | Architecture NF525 multi-caisses offline (chaîne par terminal) | `src/modules/finance/fiscalite/FiscalSealer.ts` | Chaîne cryptographique SHA-256 dédiée par `registerId` |
| P1 | ✅ | H1 | — | Idempotence Bus via eventId deduplication log | `src/shared/eventBus/IdempotencyGuard.ts`, `NexusEventBus.ts` | Invariant #1 validé (zéro double-exécution sur eventId) |
| P1 | ⬜ | H2 | M | Pré-autorisation CB sur table ouverte | `src/lib/adapters/StripeAdapter.ts` | Dépend Stripe Terminal H1 |
| P1 | ✅ | H1 | — | Bouton SOS Caisse & Diagnostic d'urgence POS | `src/modules/commerce/ui/pos/SosCaisseModal.tsx` | Déclencheur direct POS & SupportAIPanel MCC |
| P2 | ⬜ | H2 | M | Self-ordering QR code (commande depuis table) | `src/app/(client)/(public)/order/` | Dépend API REST H2.2 |
| P2 | ⬜ | H2 | XL | Application serveur mobile-first (iOS/Android) | `src/app/(client)/(ops)/mobile-pos/` | **🚧 Bloquée API REST H2.2** |
| P2 | 🔧 | H2 | M | Estimation temps de préparation IA par station KDS | `src/modules/ops/production/kds/` | Émet `intelligence.prep_time_estimated` |
| P2 | 🔧 | H1 | S | Liste de préparation journalière auto (depuis réservations) | `src/orchestration/handlers/ResaKitchenTaskHandler.ts` | — |
| P2 | ⬜ | H2 | M | Cave à vin (millésimes, casiers, PRMP bouteille) | `src/modules/commerce/catalog/` | — |
| P2 | 🔧 | H2 | S | Cocktails à la une dynamiques (bar suggestions) | `src/modules/commerce/catalog/` | — |
| P2 | ⬜ | H3 | M | Articles au poids (balance connectée — fromage, viande, boulangerie) | `src/lib/hardware/scaleConnector.ts` | Prérequis pour verticale Bakery (Dialogue 06) |
| P2 | ⬜ | H2 | L | Multi-terminal multi-caissier simultané (quarts concurrent) | `src/modules/ops/service/pos/` | Dépend NF525 multi-caisses H1 |
| P3 | ⬜ | H4 | L | Room service (variante hôtel — liaison PMS) | `src/verticals/hotel/` | Prérequis PMS Lite H4.2 |
| P3 | ⬜ | H3 | L | Kiosque libre-service tablette (variante fast-casual) | `src/app/(client)/(ops)/kiosk/` | — |
| P3 | ⬜ | H2 | S | Menus du jour / saisonniers (activation / désactivation rapide) | `src/modules/commerce/catalog/` | Émet `commerce.menu_activated` |
| P3 | ⬜ | H2 | S | Impression ticket personnalisé (logo, fidélité, QR prochain avis) | `src/lib/printers/` | — |

---

## 🛍 Commerce — Acquisition & Fidélité

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances |
|---|--------|---------|--------|---------|------------|-------------------------|
| P1 | 🔧 | H2 | M | Click & collect (commande en ligne, retrait sur place) | `src/app/(client)/(public)/click-collect/` | **🚧 Bloquée API REST H2.2** |
| P1 | ✅ | H2 | — | Intégration Uber Eats (connecteur OAuth + webhook) | `src/lib/connectors/hub/UberEatsConnector.ts` | Homologation UberEats validée |
| P1 | ⬜ | H2 | M | Intégration Deliveroo / Just Eat (agrégateur) | `src/lib/connectors/hub/DeliverooConnector.ts` | Homologation partenaire (buffer 3-6 mois) |
| P1 | ✅ | H1 | — | Intégration TheFork / Zenchef (réservation) | `src/lib/connectors/hub/TheForkConnector.ts` | — |
| P1 | ⬜ | H2 | M | Intégration Google Reserve (réservation via Google Maps) | `src/lib/connectors/hub/` | Homologation Google (buffer 3-6 mois) |
| P1 | ✅ | H1 | — | Arrhes / acompte obligatoire grands groupes avec Stripe | `src/app/api/webhooks/stripe/handlers/handlePaymentEvents.ts` | Émet R10 `commerce.reservation_deposit_paid` et `stripe.deposit_received` |
| P1 | ✅ | H1 | — | Confirmation SMS / email + rappels J-1 et J-7 | `src/orchestration/handlers/ReservationNotifier.ts` | — |
| P1 | 🔧 | H1 | S | Politique d'annulation paramétrable + pénalité no-show | `src/modules/commerce/relation/` | — |
| P1 | ✅ | H1 | — | Préférences clients (régime alimentaire, placement, occasion) | `src/modules/commerce/relation/customers/components/NewCustomerDialog.tsx` | Chips structurés dietary/seating/occasion |
| P1 | ✅ | H1 | — | Liste d'attente temps réel avec SMS estimé | `src/modules/commerce/relation/reservations/Waitlist.ts`, `WaitlistReadyHandler.ts` | Émet `commerce.waitlist_ready` → SMS + notif interne |
| P2 | ⬜ | H3 | M | Réservation via WhatsApp Business | `src/lib/connectors/hub/WhatsAppConnector.ts` | — |
| P2 | ✅ | H2 | — | Bons cadeaux / e-chèques (génération + validation POS) | `src/modules/commerce/pricing/` | — |
| P2 | ⬜ | H2 | S | Programme parrainage (referral code + tracking) | `src/modules/commerce/relation/loyalty/` | — |
| P2 | 🔧 | H2 | M | Comptes entreprise / facturation B2B mensuelle | `src/modules/finance/billing/` | — |
| P2 | 🔧 | H2 | M | Packages événements (anniversaire, EVJF, team building) | `src/modules/commerce/catalog/` | Dépend `GroupEventStatus` workflow |
| P2 | ⬜ | H2 | S | Demande d'avis automatique post-visite (Google, Tripadvisor) | `src/orchestration/handlers/PostVisitReviewHandler.ts` | Émet `commerce.review_request_sent` |
| P2 | 🔧 | H1 | XL | Gestion multi-établissements (réseau, franchises — EmpireCockpit) | `src/app/(admin)/mcc/` | **Prérequis SovereignGuard cross-tenant** (H4) |
| P2 | 🔧 | H2 | L | Tracking parcours client (RFM, CLV, churn prediction) | `src/modules/commerce/relation/crm/` | RFM scoring paramétrable par tenant |
| P2 | ⬜ | H3 | L | Abonnements repas (formule mensuelle, entreprises) | `src/modules/commerce/pricing/` | Prérequis Stripe subscriptions |
| P3 | ⬜ | H2 | M | Menu multilingue QR code (EN/ES/ZH/AR) | `src/i18n/` | **🚧 Dépend i18n dormant** (décision produit CLAUDE.md) |
| P3 | ✅ | H1 | — | Widget réservation embeddable (iframe tiers) | `src/app/api/widgets/reservation/` | — |
| P3 | ⬜ | H3 | XL | Réseau partenaires fidélité inter-enseignes | `src/modules/commerce/relation/loyalty/` | Prérequis SovereignGuard cross-tenant |
| P3 | 🔧 | H3 | M | Automatisation posts Google Business / réseaux sociaux | `src/modules/intelligence/` | — |
| P3 | ⬜ | H2 | M | Pre-orders événements futurs (commandes à date) | `src/modules/commerce/catalog/` | — |

---

## 💰 Finance & Comptabilité

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances |
|---|--------|---------|--------|---------|------------|-------------------------|
| P1 | ✅ | H1 | — | Rapprochement bancaire automatique (Open Banking — 5 providers) | `src/modules/finance/comptabilite/BankSync.ts` | — |
| P1 | 🔧 | H1 | L | Déclarations TVA CA3 auto-générées (DGFiP + EDI TDFC/EFI) | `src/modules/finance/fiscalite/tax/vatResolver.ts` | Calcul TVA OK, export EDI ⬜ |
| P1 | ✅ | H1 | — | Gestion de la caisse menue monnaie (fond de caisse + comptage) | `src/modules/finance/comptabilite/CashDrawer.ts` | — |
| P1 | ✅ | H1 | — | Comptabilité des pourboires (déclaration DSN mensuelle) | `src/modules/human/paie/tips.ts` | — |
| P1 | 🔧 | H1 | L | Prévision de trésorerie 30 / 60 / 90 jours | `src/modules/finance/comptabilite/CashflowForecast.ts` | Prérequis historique data + cold-start heuristique |
| P1 | ✅ | H1 | — | Clés déterministes & Idempotence EventBus (Invariant #1) | `src/shared/eventBus/IdempotencyGuard.ts` | Déduplication triple couche |
| P1 | 🔧 | H2 | L | Facturation inter-sociétés (groupe multi-restaurants) | `src/modules/finance/billing/` | Prérequis multi-établissements H4 |
| P1 | ✅ | H1 | — | Clôture journalière Z de caisse NF525 (scellement cryptographique) | `src/modules/finance/fiscalite/FiscalSeal.ts` | — |
| P1 | ✅ | H1 | — | Stockage Froid Immuable WORM NF525 (6 ans de rétention légale) | `src/modules/finance/fiscalite/WormArchiveStorageService.ts` | Art. L102 B LPF |
| P2 | ✅ | H2 | — | SEPA direct débit fournisseurs récurrents (XML pain.001) | `src/orchestration/handlers/SepaExportHandler.ts` | — |
| P2 | 🔧 | H2 | M | Analyse du seuil de rentabilité par service / jour | `src/modules/finance/comptabilite/` | — |
| P2 | ✅ | H1 | — | Budget vs réel en temps réel (dashboard CFO) | `src/modules/finance/comptabilite/BudgetTracker.ts` | — |
| P2 | 🔧 | H2 | M | RevPASH (Revenue per Available Seat Hour) | `src/modules/intelligence/forecasting/` | — |
| P2 | 🔧 | H1 | M | Rentabilité par article de menu (contribution margin) | `src/modules/finance/comptabilite/` | Dépend fiches techniques + coefficients pertes |
| P2 | ✅ | H1 | — | Food cost tracking avec alertes sur dérive vs objectif | `src/orchestration/handlers/BCGActionSuggestionHandler.ts` | — |
| P2 | ✅ | H1 | — | Matching 3 voies commande / réception / facture | `src/modules/logistics/approvisionnement/` | — |
| P2 | ✅ | H1 | — | Export FacturX (PDF/A-3 + XML UBL 2.1 / CII) | `src/modules/finance/einvoicing/FacturXGenerator.ts` | Prêt réforme e-invoicing 2026 |
| P2 | ✅ | H2 | — | Recouvrement créances avec escalade automatique (FRIENDLY→FORMAL→LEGAL) | `src/modules/finance/billing/RecoveryEngine.ts` | — |
| P2 | ✅ | H1 | — | Export Pennylane (comptabilité en ligne) | `src/modules/finance/comptabilite/PennylaneAdapter.ts` | — |
| P3 | ⬜ | H4 | M | Affacturage factures clients (financement court terme) | `src/modules/finance/billing/` | — |
| P3 | ⬜ | H3 | M | Multi-devise (tourisme — USD, GBP, CHF) | `src/kernel/nexus/contracts/settings/defaults.ts` | Dépend refonte `vatResolver` multi-pays |
| P3 | 🔧 | H2 | L | Consolidation financière groupe (reporting agrégé MacroBrain) | `src/app/(admin)/mcc/` | Prérequis SovereignGuard cross-tenant H4 |
| P3 | ⬜ | H3 | S | DAS2 (déclaration honoraires artistes / prestataires) | `src/modules/finance/fiscalite/` | — |

---

## 🛡 Compliance & Sécurité Alimentaire

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances |
|---|--------|---------|--------|---------|------------|-------------------------|
| P1 | ✅ | H1 | — | Registres HACCP numériques complets (temp, huiles, nettoyage) | `src/modules/compliance/qualite/haccp/` | — |
| P1 | 🔧 | H1 | M | Étiquetage allergènes EU 1169/2011 (14 allergènes, menu + étiquettes) | `src/modules/compliance/sanitaire/` | **Chaîne complète bloquée par R2 §DEBT** |
| P1 | 🔧 | H1 | L | Traçabilité farm-to-fork (lot → plat → table) | `src/modules/compliance/sanitaire/TraceabilityEngine.ts` | Chaînage `lot → fiche recette → commande → table` à finaliser |
| P1 | 🔧 | H1 | S | Contrôle qualité de l'eau (pH, chlore, relevés) | `src/modules/compliance/qualite/` | — |
| P1 | 🔧 | H2 | S | Journal des nuisibles (dératisation, désinsectisation) | `src/modules/compliance/qualite/` | — |
| P1 | ✅ | H1 | — | Signalement incidents DGCCRF / RASFF (rappel produit) | `src/orchestration/handlers/NonConformActionHandler.ts` | — |
| P1 | ✅ | H1 | — | Formation HACCP 14h obligatoire (suivi attestations, blocage pointeuse) | `src/orchestration/handlers/TrainingComplianceAlertHandler.ts` | — |
| P1 | ⬜ | H2 | S | Permis d'exploitation (suivi renouvellement 10 ans) | `src/modules/compliance/registre/` | — |
| P2 | ⬜ | H4 | L | Bilan carbone GES (scope 1 + 2 + 3 restauration) | `src/modules/compliance/` | — |
| P2 | 🔧 | H3 | M | Reporting réduction déchets (loi Agec, dons associations) | `src/modules/compliance/qualite/` | — |
| P2 | ✅ | H1 | — | Conformité incendie (extincteurs, exercices, ERP) | `src/modules/compliance/securite/` | — |
| P2 | ⬜ | H3 | M | Audit fournisseur (Bio, MSC, Label Rouge, local) | `src/modules/logistics/approvisionnement/` | — |
| P2 | ✅ | H1 | — | RGPD — droit à l'oubli client (ErasureService crypto-shredding) | `src/modules/compliance/registre/ErasureService.ts` | — |
| P1 | ✅ | H1 | — | **RGPD Art. 9 — Consentement & chiffrement données santé allergies** | `src/shared/security/SensitiveDataCryptoService.ts` | AES-256-GCM + Crypto-shredding Art. 17 |
| P1 | ✅ | H1 | — | **Masquage systématique PII dans les logs (redactPII & Axiom)** | `src/lib/security/redactPII.ts` | Conformité RGPD / PCI-DSS |
| P3 | ⬜ | H3 | S | Score Nutri-Score calculé automatiquement par plat | `src/modules/commerce/catalog/` | Dépend fiches techniques complètes |
| P3 | ✅ | H1 | — | Conformité accessibilité PMR (ERP catégorie 3-4-5) | `src/modules/compliance/securite/` | — |
| P3 | ⬜ | H2 | S | Licence IV (gestion renouvellement, transfert) | `src/modules/compliance/registre/` | — |
| P3 | 🔧 | H2 | M | Audit tiers externe (consultants, cabinets — AuditService) | `src/modules/compliance/securite/AuditService.ts` | — |
| P1 | ✅ | H1 | — | Export d'Archive Fiscale Scellée NF525 en 1 Clic (Grand Livre + Hash SHA-256) | `src/app/api/admin/compliance/fiscal-archive-export/route.ts` | — |

---

## 👥 Human — RH & Paie

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances |
|---|--------|---------|--------|---------|------------|-------------------------|
| P1 | ✅ | H1 | — | Planning des équipes (roster hebdomadaire, conformité HCR) | `src/modules/human/planning/RosterEngine.ts` | — |
| P1 | ✅ | H1 | — | Gestion congés / absences / RTT avec soldes | `src/app/(client)/(ops)/leaves/page.tsx` | — |
| P1 | ✅ | H1 | — | Pointeuse badge / QR code / géolocalisation | `src/modules/human/timeclock/TimeclockEngine.ts` | Prérequis Kit J-0 H2 pour NFC hardware |
| P1 | ✅ | H1 | — | Debounce anti-rebond pointeuse staff (60s) | `src/app/api/hr/clock-in/route.ts` | Anti-rebond 60s + 429 retryAfterMs |
| P1 | ✅ | H1 | — | Calcul automatique heures supp (25% / 50%) | `src/orchestration/handlers/HRClockInGuardHandler.ts` | — |
| P1 | ✅ | H1 | — | Répartition automatique des pourboires (pool / individuel / rank) | `src/design/settings/TipsDistributionSettingsSection.tsx` | — |
| P1 | ✅ | H1 | — | DSN mensuelle (builder XML URSSAF net-entreprises) | `src/orchestration/handlers/PayrollExportHandler.ts` | **⚠️ à valider par expert-comptable sur dossier réel** avant 1er client |
| P2 | ✅ | H2 | — | Module recrutement ATS simplifié (offre → entretien → contrat) | `src/modules/human/effectifs/hr/` | — |
| P2 | ⬜ | H2 | M | Onboarding digital (livret, contrat e-sign, accès) | `src/modules/human/effectifs/hr/` | Dépend prestataire eIDAS |
| P2 | ⬜ | H3 | S | Entretiens professionnels (bilan 2 ans, objectifs) | `src/modules/human/effectifs/hr/` | — |
| P2 | 🔧 | H2 | L | Rotation multi-sites (staff partagé entre établissements) | `src/modules/human/planning/` | Prérequis gestion identité supra-tenant H4 |
| P2 | ⬜ | H3 | M | Avances sur salaire avec remboursement automatique | `src/modules/human/paie/` | — |
| P2 | ✅ | H1 | — | Accidents du travail / DUER (Document Unique) | `src/modules/human/effectifs/hr/` | — |
| P2 | ✅ | H1 | — | Registre Unique du Personnel (RUP) | `src/modules/human/effectifs/hr/components/staff/StaffMemberForm.tsx` | — |
| P2 | ✅ | H1 | — | Prépaie export Silae (expert-comptable) | `src/orchestration/handlers/PayrollExportHandler.ts` | — |
| P2 | ⬜ | H3 | M | CET (Compte Épargne Temps, règles branche HCR) | `src/modules/human/paie/` | — |
| P3 | ⬜ | H3 | L | Formation e-learning interne (HACCP, service, hygiène) | `src/modules/human/effectifs/hr/` | — |
| P3 | ⬜ | H2 | M | Gestion contrats saisonniers / extras (CDDU) | `src/modules/human/effectifs/hr/` | Prérequis "réonboarding rapide" pour turnover élevé |
| P3 | 🔧 | H1 | L | Conformité syndicale / accord de branche HCR (amplitude, repos) | `src/orchestration/handlers/HRBreakCheckHandler.ts` | Convention HCR 200+ pages à intégrer |
| P3 | ⬜ | H3 | M | Gestion apprentis / alternants (CFA, tuteurs, suivi) | `src/modules/human/effectifs/hr/` | — |
| — | 🚫 | — | — | ~~Reconnaissance faciale pointeuse~~ | `FacialRecognitionClockIn` | **🚫 BLOQUÉ CNIL** — biométrie travail nécessite délib CNIL + consentement + AIPD |

---

## 📦 Logistics — Stock & Approvisionnement

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances |
|---|--------|---------|--------|---------|------------|-------------------------|
| P1 | 🔧 | H1 | L | Comparateur prix multi-fournisseurs (appel d'offres auto) | `src/modules/logistics/approvisionnement/` | Nécessite EDI Metro/Pomona/Transgourmet |
| P1 | 🔧 | H1 | M | Bons de commande automatiques (réapprovisionnement seuil) | `src/modules/logistics/approvisionnement/` | — |
| P1 | 🔧 | H2 | L | Suivi livraisons temps réel (portail fournisseur) | `src/modules/logistics/approvisionnement/` | Portail externe = surface RBAC/SovereignGuard à concevoir |
| P1 | 🔧 | H1 | L | Traçabilité lot / batch (DLC + DLO + numéro de lot) | `src/modules/logistics/dlc/` | **Chaîne `lot → fiche recette → commande → table` requise pour EU 178/2002** |
| P1 | ✅ | H1 | — | Valorisation stock FIFO / PRMP (déduction par batch) | `src/__tests__/helpers/saga.stock.test.ts` | — |
| P1 | ✅ | H1 | — | Contrôle qualité réception (conformité BL vs commande) | `src/modules/logistics/inventaire/` | — |
| P1 | ✅ | H1 | — | Service 86 automatique (blocage commande si stock zéro) | `src/modules/ops/service/pos/` | Consomme `stock.zero` |
| P1 | ✅ | H1 | — | Déduction stock automatique sur commande validée | `src/modules/logistics/stocks/` | — |
| P1 | ⬜ | H1 | M | **Décrémentation atomique des stocks (Anti-Race-Condition)** | `src/shared/eventBus/handlers/StockDeductionHandler.ts` | **Invariant #2 concurrence** |
| P2 | ⬜ | H3 | M | Stock en consignation (tracking bouteilles, fûts bière, gaz) | `src/modules/logistics/stocks/` | — |
| P2 | ⬜ | H2 | S | Retours fournisseurs avec avoir automatique | `src/modules/logistics/approvisionnement/` | — |
| P2 | 🔧 | H2 | M | Par level management adaptatif (seuils dynamiques) | `src/modules/logistics/stocks/` | Dépend prédiction ventes ML |
| P2 | 🔧 | H1 | S | Reporting gaspillage avec causes (DLC, sur-production, erreur) | `src/modules/logistics/inventaire/` | — |
| P2 | ⬜ | H2 | M | Inventaire tournant par zone (sans fermeture établissement) | `src/app/(client)/(ops)/inventory/loading.tsx` | — |
| P2 | ✅ | H1 | — | Extraction OCR / IA factures fournisseurs (InvoiceExtractionService) | `src/__tests__/onboarding/ocrParsers.test.ts` | — |
| P2 | ✅ | H1 | — | Matching 3 voies logistique (commande / BL / facture) | `src/modules/logistics/approvisionnement/` | — |
| P3 | 🔧 | H3 | M | Prédiction péremption IA (alerte avant DLC) | `src/modules/intelligence/` | Cold-start ML requis |
| P3 | 🔧 | H2 | M | Tracking énergie chambres froides (IoT capteurs) | `src/orchestration/handlers/FridgeTempAlertHandler.ts` | Kit hardware Testo/Linky requis |
| P3 | ⬜ | H3 | S | Label anti-gaspillage (Too Good To Go, Phenix) | `src/modules/logistics/` | Prérequis Bakery H3 |
| P3 | ✅ | H1 | — | Migration historique depuis Zelty (ZeltyImporter) | `src/modules/acquisition/onboarding/migration/types.ts` | — |

---

## 🧠 Intelligence — IA & Analytics

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances |
|---|--------|---------|--------|---------|------------|-------------------------|
| P1 | 🔧 | H2 | L | Prévision des ventes ML (J+7, semaine, mois) | `src/modules/intelligence/forecasting/` | **Cold-start heuristique 30j requis pour nouveaux tenants** |
| P1 | ⬜ | H2 | M | Menu engineering (étoile / vache à lait / poids mort / énigme) | `src/orchestration/handlers/BCGActionSuggestionHandler.ts` | Feature à forte valeur perçue, simple à implémenter |
| P1 | 🔧 | H1 | M | Recommandations upselling serveur en temps réel | `src/modules/intelligence/ia/ai/HermesEngine.ts` | UX à valider (surcharge POS) |
| P1 | ✅ | H1 | — | Rapports flash quotidiens automatisés (DailyFlashReport) | `src/orchestration/handlers/DailyDigestHandler.ts` | — |
| P1 | ✅ | H1 | — | Rapports hebdomadaires consolidés | `src/modules/intelligence/` | — |
| P1 | ✅ | H1 | — | Détection anomalies cross-domain (revenus, stock, compliance) | `src/modules/intelligence/domain/agency/Zeus.ts` | — |
| P1 | ✅ | H1 | — | Bouton SOS Caisse & Diagnostic Urgence SAV L0 (Gemini Flash) | `src/modules/commerce/ui/pos/SosCaisseModal.tsx`, `SupportAIPanel.tsx` | Alerte P0 en service, émet `support.ticket_submitted` |
| P2 | ✅ | H2 | — | Pricing dynamique basé sur la demande (heures creuses / pleines) | `src/modules/commerce/pricing/` | — |
| P2 | ⬜ | H3 | L | Analyse sentiment clients multi-sources (Google, TripAdvisor, Yelp) | `src/modules/intelligence/` | — |
| P2 | 🔧 | H2 | M | Optimisation planning RH selon prévisions d'affluence | `src/modules/human/planning/` | Dépend ML forecasting H2 |
| P2 | 🔧 | H2 | M | Prédiction du gaspillage (sur-commande vs historique) | `src/modules/logistics/inventaire/` | Cold-start ML requis |
| P2 | ⬜ | H3 | M | Score de performance fournisseur (délai, qualité, prix) | `src/modules/logistics/approvisionnement/` | — |
| P2 | ✅ | H1 | — | Veille concurrentielle (pricing, avis, positionnement — MarketOracle) | `src/app/api/oracle/route.ts` | — |
| P2 | 🔧 | H1 | M | Détection d'anomalie sur recettes (coût vs historique) | `src/modules/intelligence/` | — |
| P2 | ⬜ | H3 | M | Prédiction no-show ML (historique × météo × événement local) | `src/modules/intelligence/forecasting/` | Cold-start ML requis |
| P2 | ✅ | H1 | — | Benchmarking inter-établissements (FleetBenchmark) | `src/lib/mcc/auth/MccOperatorContract.ts` | — |
| P2 | ✅ | H1 | — | Ajustement staffing selon météo (RainStaffingHandler) | `src/orchestration/handlers/RushModeIntegrationHandler.ts` | — |
| P3 | ⬜ | H4 | XL | Optimisation coût recettes IA (substitution ingrédients) | `src/modules/intelligence/` | — |
| P3 | 🔧 | H3 | M | Intelligence marché (tendances cuisine, saisonnalité) | `src/modules/intelligence/` | — |
| P3 | 🔧 | H4 | XL | Computer vision plateau / stock (photo → analyse gaspillage) | `src/modules/intelligence/domain/agency/types.ts` | — |
| P3 | 🔧 | H3 | M | RevPAC — Revenue per Available Cover (siège × service) | `src/modules/intelligence/forecasting/` | — |
| P3 | ⬜ | H3 | S | Recommandation accords mets-vins (cave + menu engineering) | `src/modules/commerce/catalog/` | — |

---

## 🏛 Facility — Espaces & Maintenance

⚠️ **CHANTIER MAJEUR** : Zone 9 Facility = **27 composants à construire, 0 livrés** aujourd'hui (voir [UI_MATRIX_16_ZONES.md §10](docs/plans/UI_MATRIX_16_ZONES.md#10-️-zone-9--facility--maintenance-⚠️-27-composants--0-livrés)).

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances |
|---|--------|---------|--------|---------|------------|-------------------------|
| P1 | ✅ | H1 | — | Plan de salle 2D interactif Konva.js (drag & drop, zones, étages) | `src/app/(client)/(ops)/floor-plan/page.tsx` | — |
| P1 | ✅ | H1 | — | Calcul géométrique plan (centrage auto, zoom, coordonnées world/screen) | `src/app/(client)/(ops)/floor-plan/` | — |
| P1 | ⬜ | H2 | M | Heatmap d'occupation des tables (par service / semaine) | `src/app/(client)/(ops)/floor-plan/` | Dépend historique data + analytics |
| P1 | ✅ | H1 | — | Réservation salle privatisée (contrat + acompte — PrivatisationContract) | `src/modules/commerce/relation/` | — |
| P1 | ✅ | H1 | — | Gestion multi-espaces (terrasse, intérieur, bar, cave — ZoneService) | `src/app/(client)/(ops)/floor-plan/` | — |
| P2 | ⬜ | H2 | L | Planning maintenance préventive (fours, chambre froide, etc.) | `src/modules/facility/maintenance/` | **Zone 9 UI complète à construire** |
| P2 | ⬜ | H3 | M | Cycle de vie matériel (garantie, amortissement, remplacement) | `src/modules/facility/` | — |
| P2 | ⬜ | H2 | M | Planning ménage / nettoyage des espaces (check-list) | `src/modules/facility/` | — |
| P2 | 🔧 | H2 | M | Gestion multi-étages avec ascenseur / monte-plat | `src/app/(client)/(ops)/floor-plan/` | — |
| P2 | ✅ | H1 | — | Registre interventions maintenance (InterventionLogSection) | `src/modules/facility/interventions/` | — |
| P2 | ✅ | H1 | — | CERFA 13984 (vérifications réglementaires périodiques) | `src/modules/compliance/securite/` | — |
| P2 | ✅ | H1 | — | Gestion prestataires maintenance (contrats, interventions) | `src/modules/facility/interventions/` | — |
| P1 | ✅ | H1 | — | Télémétrie Hardware & Détection Pannes Temps Réel (imprimantes/TPE/4G) | `src/lib/hardware/HardwareTelemetryService.ts` | Émet `facility.hardware_fault` (Invariant #6) |
| P3 | ⬜ | H4 | L | Monitoring énergie bâtiment (électricité Linky, gaz, eau) | `src/modules/facility/iot/` | Prérequis IoT hardware Linky/MQTT |
| P3 | ⬜ | H5 | XL | Réalité augmentée plan de salle (tablette AR) | `src/app/(client)/(ops)/floor-plan/` | — |
| P3 | ⬜ | H4 | L | Domotique salle (éclairage, température, musique par zone) | `src/modules/facility/iot/` | Prérequis IoT hardware |
| P3 | ⬜ | H4 | L | Surveillance CCTV avec détection intrusion | `src/modules/facility/` | — |

---

## 🔌 Intégrations Transversales

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances |
|---|--------|---------|--------|---------|------------|-------------------------|
| P1 | 🔧 | H1 | M | Apple Pay / Google Pay / NFC (intégration native POS) | `src/modules/ops/service/pos/` | Dépend Stripe Terminal SDK natif |
| P1 | ✅ | H1 | — | Google Business Profile sync (horaires, menu, photos) | `src/modules/commerce/relation/` | — |
| P1 | ⬜ | H2 | XL | Application mobile client-facing iOS / Android | `src/app/(client)/(public)/` | **🚧 Bloquée API REST H2.2** |
| P1 | ✅ | H1 | — | Webhooks réservations (Zenchef, UberEats — providers complets) | `src/lib/connectors/hub/hooks/useConnector.ts` | — |
| P1 | ✅ | H1 | — | Email marketing (Brevo — campagnes, transactionnel) | `src/modules/commerce/relation/` | — |
| P2 | ⬜ | H3 | M | Mailchimp / Klaviyo (automation marketing avancée) | `src/lib/connectors/hub/` | — |
| P2 | ✅ | H1 | — | Export Pennylane (comptabilité cloud) | `src/modules/finance/comptabilite/PennylaneAdapter.ts` | — |
| P2 | ⬜ | H2 | L | Export Cegid / Sage / QuickBooks natif | `src/modules/finance/comptabilite/` | — |
| P2 | ⬜ | H2 | L | **API publique REST + webhooks (intégrations partenaires)** | `src/app/api/` | **Framework Hono à intégrer ; bloque Mobile + Click&Collect** |
| P2 | ⬜ | H4 | XL | PMS hôtel (Opera, Mews, Cloudbeds) — variante hôtel | `src/verticals/hotel/` | Prérequis PMS Lite H4.2 |
| P2 | ✅ | H1 | — | Silae paie (export DSN + fiche de paie) | `src/orchestration/handlers/PayrollExportHandler.ts` | — |
| P2 | ✅ | H1 | — | Météo temps réel (MeteoFrance + OpenWeatherMap) | `src/orchestration/handlers/RushModeIntegrationHandler.ts` | — |
| P2 | ✅ | H1 | — | Événements locaux (Ticketmaster — prévision affluence) | `src/modules/intelligence/forecasting/` | — |
| P2 | ⬜ | H2 | S | **Playbook Kit Matériel & Checklist Réseau 4G Failover** | `docs/guides/HARDWARE_PLAYBOOK.md` | **Bloquant §DEBT 2.5** |
| P3 | ⬜ | H3 | M | Affichage dynamique digital signage (menu boards) | `src/app/(client)/(public)/` | — |
| P3 | ⬜ | H5 | XL | SDK tiers — marketplace d'extensions partenaires | `src/kernel/plugins/` | — |
| P3 | ✅ | H1 | — | MQTT IoT (capteurs température / humidité — MqttProvider) | `src/orchestration/handlers/FridgeTempAlertHandler.ts` | — |
| P3 | ⬜ | H3 | M | GS1 code-barres EAN (traçabilité supply chain) | `src/modules/logistics/approvisionnement/` | Prérequis Retail H3 |

---

## 📊 Résumé Global

| Pilier | Total features | ✅ | 🔧 | ⬜ | 🚧 / 🚫 |
|---|:---:|:---:|:---:|:---:|:---:|
| Ops | 28 | 3 | 6 | 18 | 1 🚧 |
| Commerce | 24 | 6 | 7 | 10 | 1 🚧 |
| Finance | 22 | 10 | 5 | 7 | 0 |
| Compliance | 19 | 6 | 6 | 7 | 0 |
| Human | 21 | 10 | 2 | 8 | 1 🚫 |
| Logistics | 20 | 7 | 6 | 7 | 0 |
| Intelligence | 21 | 5 | 6 | 10 | 0 |
| Facility | 16 | 5 | 1 | 10 | 0 |
| Intégrations | 18 | 7 | 1 | 9 | 1 🚧 |
| **TOTAL** | **189** | **59** | **40** | **86** | **4** |

**Complétude globale** : ~52% (✅+🔧 partiel) · ~31% ✅ full · 46% ⬜ à développer.

### 🚧 Dépendances critiques bloquantes

1. **API REST OpenAPI (Hono) H2.2** → bloque Mobile App, Click & Collect, App PMS externe, Kiosque libre-service.
2. **NF525 multi-caisses offline H1** → bloque encaissement en mode dégradé, multi-terminal simultané.
3. **R2 `reservation.matched` H1** → ✅ **Résolu** (Chaîne allergènes KDS, badge table et notification cuisine opérationnels).
4. **Idempotence Bus H1** → bloque fiabilité de tous les handlers en cas de retry.
5. **SovereignGuard cross-tenant H4** → bloque EmpireCockpit, consolidation groupe, mutualisation staff/stocks.
6. **Homologation partenaires (buffer 3-6 mois)** → bloque Google Reserve, Deliveroo, Booking, SESAM-Vitale.
7. **Agrément HDS 12-18 mois** → bloque commercialisation verticale Clinic.

---

## Références Croisées

- **Dette technique & angles morts** : [docs/DEBT.md](docs/DEBT.md)
- **Architecture invariants** : [docs/plans/ARCHITECTURE_METAPLATFORM.md](docs/plans/ARCHITECTURE_METAPLATFORM.md)
- **Horizons stratégiques** : [docs/plans/ROADMAP_STRATEGY.md](docs/plans/ROADMAP_STRATEGY.md)
- **Verticales sectorielles** : [docs/plans/VERTICALS_SPECIFICATION.md](docs/plans/VERTICALS_SPECIFICATION.md)
- **UI composants** : [docs/plans/UI_MATRIX_16_ZONES.md](docs/plans/UI_MATRIX_16_ZONES.md)
- **Charte ingénierie** : [`.nexus/agents/.agents/AGENTS.md`](.nexus/agents/.agents/AGENTS.md)
