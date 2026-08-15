# 🗺️ Restaurant OS — Feuille de Route Visuelle & Product Backlog Exécutif

> 🎨 **DOCUMENT DE VISUALISATION & CADRAGE EXÉCUTIF**  
> **Source unique de vérité active pour l'implémentation** : [`BACKLOG.md`](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/BACKLOG.md)  
> **Architecture & Invariants** : [`docs/plans/ARCHITECTURE_METAPLATFORM.md`](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/docs/plans/ARCHITECTURE_METAPLATFORM.md)  
> **Horizons Stratégiques (H1-H5)** : [`docs/plans/ROADMAP_STRATEGY.md`](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/docs/plans/ROADMAP_STRATEGY.md)  
> **Registre de Dette & Bloquants P0** : [`docs/DEBT.md`](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/docs/DEBT.md)  
> **Spécifications des 8 Verticales** : [`docs/plans/VERTICALS_SPECIFICATION.md`](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/docs/plans/VERTICALS_SPECIFICATION.md)  
> **Matrice des 16 Zones UI** : [`docs/plans/UI_MATRIX_16_ZONES.md`](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/docs/plans/UI_MATRIX_16_ZONES.md)  
> **Étude Maîtresse du MCC** : [`docs/plans/MCC_MASTER_STUDY.md`](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/docs/plans/MCC_MASTER_STUDY.md)

---

## 📖 Grille de Lecture Rapide

| Symbole | Signification | Règle d'Ingénierie |
|:---:|---|---|
| ✅ | **Opérationnel / Complet** | Logique métier câblée, typée et testée en production (`TSC = 0`). |
| 🔧 | **Partiel / En Chantier** | Logique ou UI existante mais handler/émetteur ou sous-module manquant (voir colonne Bloquants). |
| ⬜ | **À Développer** | Spécifié mais non entamé. |
| 🚧 | **Bloqué / Dépendance** | En attente d'un composant amont (ex: API REST pour le Mobile, homologation tierce). |
| 🚫 | **Bloqué Légal** | Interdit ou strictement conditionné par la loi (ex: biométrie CNIL, données de santé HDS). |

**Horizons** : `H1` (Août-Sept 2026 · Prod-Ready) · `H2` (Sept-Nov 2026 · Scale 30 Pilotes) · `H3` (Déc 2026-Mai 2027 · Boulangerie/Retail/Salon) · `H4` (Juin 2027-Fév 2028 · Garage/Hôtel) · `H5` (2028-2029 · Santé HDS/Swarm IA).  
**Effort** : `S` (1-3 jours) · `M` (1 semaine) · `L` (2-4 semaines) · `XL` (1-3 mois).

---

## ⚙️ 1. Ops — Service & Production

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances / Risques |
|:---:|:---:|:---:|:---:|---|---|---|
| **P1** | 🔧 | H1 | M | **Terminal de paiement CB** (Stripe Terminal / SumUp / Ingenico) | `src/lib/adapters/StripeTerminalAdapter.ts` | Stripe sandbox opérationnel — SumUp/Ingenico à brancher pour redondance TPE |
| **P1** | ✅ | H1 | — | **Mode hors-ligne POS & Résolution Conflits** | `src/lib/sync/offlineQueue.ts`, `src/lib/offline/sync-manager.ts` | File Dexie + `SyncManager` + scellage NF525 multi-caisses livrés (voir §3 ARCHITECTURE) |
| **P1** | 🔧 | H1 | S | **Impression tickets thermiques ESC/POS** (Epson, Star) | `src/lib/printers/EscPosDriver.ts` | Moteur d'impression prêt ; auto-discovery réseau mDNS/USB à finaliser |
| **P1** | ⬜ | H2 | S | **Scanner code-barres / QR articles en caisse** | `src/modules/ops/service/pos/` | Support douchette Zebra / Bluetooth pour mode flux rapide et Retail |
| **P1** | ✅ | H1 | — | **Gestion du pourboire** (pool, individuel, DSN) | `src/modules/human/paie/tips.ts` | Ventilation automatique et export DSN URSSAF opérationnels |
| **P1** | ✅ | H1 | — | **Alerte allergènes & Check-In client KDS (R2)** | `TableInsightPanel.tsx`, `ResaAllergenCheckHandler.ts` | 🟢 Chaîne complète livrée : `reservation.matched` → badge table → notification KDS urgente |
| **P1** | ⬜ | H1 | S | **Vérification âge alcool** (blocage POS + validation) | `src/modules/ops/service/pos/hooks/usePos.ts` | Émet `compliance.age_verification_requested` (obligation L3342-1 Code Santé) |
| **P1** | 🔧 | H1 | M | **Séquençage des plats** (entrée → plat → dessert) | `src/modules/ops/production/kds/` | Handler prêt, émetteur `ops.course.fired` partiel (nécessite `ops.course.next_requested`) |
| **P1** | ✅ | H1 | — | **Routage KDS multi-stations** (chaud, froid, bar, pâtisserie) | `src/modules/ops/production/kds/KdsEngine.ts` | Filtrage par station et chronomètres de retardement opérationnels |
| **P1** | ✅ | H1 | — | **Split d'addition & Règle du Reliquat** | `src/modules/ops/service/pos/hooks/usePosSplit.ts`, `SplitBillDialog.tsx` | Livré — reliquat au dernier payeur (Invariant Concurrence #5 SovereignMath) |
| **P1** | ✅ | H1 | — | **Verrouillage CAS des tables & Concurrence** | `src/modules/ops/service/pos/services/TableLockService.ts` | 🟢 Invariants #2 & #3 validés : verrouillage optimiste CAS et déverrouillage automatique |
| **P1** | ✅ | H1 | — | **Session de service & Calculs Shift UTC (Anti-DST)** | `src/modules/ops/workflow/engine/services/ServiceSessionService.ts` | 🟢 Invariant #4 validé : calculs absolus Anti-DST et rattachement shift nocturne |
| **P1** | ✅ | H1 | — | **Architecture NF525 multi-caisses offline** | `src/modules/finance/fiscalite/FiscalSealer.ts` | 🟢 Sous-chaîne SHA-256 par `registerId` + `MasterFiscalSeal` consolidé livrés |
| **P1** | ✅ | H1 | — | **Idempotence Bus via `events_processed_log`** | `src/shared/eventBus/IdempotencyGuard.ts`, `NexusEventBus.ts` | 🟢 Invariant #1 validé : déduplication automatique et verrouillage `eventId_handlerId` |
| **P1** | ⬜ | H2 | M | **Pré-autorisation CB sur table ouverte** | `src/lib/adapters/StripeAdapter.ts` | Dépend du hardware Stripe Terminal en production |
| **P1** | ✅ | H2 | — | **Bouton SOS Caisse & Diagnostic d'urgence POS** | `src/modules/commerce/ui/pos/SosCaisseModal.tsx`, `SupportAIPanel.tsx` | 🟢 Livré — presets panne + diagnostic Gemini live + prise en charge MCC |
| **P2** | ⬜ | H2 | M | **Self-ordering QR code table** | `src/app/(client)/(public)/order/` | Dépend de l'API REST publique OpenAPI H2.2 |
| **P2** | ⬜ | H2 | XL | **Application serveur mobile compagnon** (iOS/Android) | `src/app/(client)/(ops)/mobile-pos/` | 🚧 **Bloquée par l'API REST H2.2** |
| **P2** | 🔧 | H2 | M | **Estimation temps préparation IA par station KDS** | `src/modules/ops/production/kds/` | Émet `intelligence.prep_time_estimated` |
| **P2** | 🔧 | H1 | S | **Liste de préparation journalière automatique** | `src/orchestration/handlers/ResaKitchenTaskHandler.ts` | Câblée sur les réservations confirmées du jour |
| **P2** | ⬜ | H2 | M | **Gestion cave à vin** (millésimes, casiers, PRMP) | `src/modules/commerce/catalog/` | Suivi des stocks nobles et fiches dégustation sommelier |
| **P2** | 🔧 | H2 | S | **Cocktails à la une dynamiques** (suggestions bar) | `src/modules/commerce/catalog/` | — |
| **P2** | ⬜ | H3 | M | **Vente au poids** (balance connectée Dialogue 06) | `src/lib/hardware/scaleConnector.ts` | Protocole Mettler Toledo / Bizerba (prérequis Boulangerie H3) |
| **P2** | ⬜ | H2 | L | **Multi-terminaux multi-caissiers simultanés** | `src/modules/ops/service/pos/` | Gestion des tiroirs-caisses distincts par caissier |
| **P3** | ⬜ | H4 | L | **Room service & liaison PMS** (variante hôtel) | `src/verticals/hotel/` | Transfert sur le folio de chambre (prérequis Hôtel H4) |
| **P3** | ⬜ | H3 | L | **Kiosque borne tactile libre-service** (fast-casual) | `src/app/(client)/(ops)/kiosk/` | Mode borne sécurisé (MDM kiosk lock) |
| **P3** | ⬜ | H2 | S | **Menus du jour & suggestions saisonnières** | `src/modules/commerce/catalog/` | Activation rapide en 1 clic sur KDS et POS |
| **P3** | ⬜ | H2 | S | **Personnalisation ticket de caisse** (logo, QR avis) | `src/lib/printers/` | — |

---

## 🛍️ 2. Commerce — Acquisition & Fidélité

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances / Risques |
|:---:|:---:|:---:|:---:|---|---|---|
| **P1** | 🔧 | H2 | M | **Click & Collect natif** (commande & retrait) | `src/app/(client)/(public)/click-collect/` | 🚧 **Bloqué par l'API REST H2.2** pour consommation web/mobile |
| **P1** | ✅ | H2 | — | **Intégration Uber Eats** (commandes & webhook) | `src/lib/connectors/hub/UberEatsConnector.ts` | Connecteur bidirectionnel et injection KDS opérationnels |
| **P1** | ⬜ | H2 | M | **Intégration Deliveroo / Just Eat** (agrégateur HubRise) | `src/lib/connectors/hub/DeliverooConnector.ts` | Buffer homologation partenaire (3-6 mois) |
| **P1** | ✅ | H1 | — | **Intégration TheFork / Zenchef** (réservations) | `src/lib/connectors/hub/TheForkConnector.ts` | Réception webhooks et synchronisation plan de salle ✅ |
| **P1** | ⬜ | H2 | M | **Intégration Google Reserve** (Google Maps) | `src/lib/connectors/hub/` | Buffer homologation Google (3-6 mois) |
| **P1** | ⬜ | H1 | S | **Acomptes / arrhes obligatoires Stripe** | `src/app/api/webhooks/stripe/route.ts` | 🔴 **Bloquant P0 §DEBT** : émetteur R10 `commerce.reservation_deposit_paid` |
| **P1** | ✅ | H1 | — | **Confirmation SMS / Email + Rappels J-1/J-7** | `src/orchestration/handlers/ReservationNotifier.ts` | Brevo / Twilio câblés avec templates dynamiques |
| **P1** | 🔧 | H1 | S | **Politique d'annulation & pénalités no-show** | `src/modules/commerce/relation/` | Moteur de pénalités prêt, capture d'empreinte CB en cours |
| **P1** | 🔧 | H1 | M | **Fiches préférences clients & Allergies (RGPD Art. 9)** | `src/modules/commerce/relation/crm/` | 🔴 **Risque Légal Sanction CNIL** : consentement explicite + chiffrement AES-256 |
| **P1** | 🔧 | H1 | M | **Liste d'attente dynamique temps réel** | `src/modules/commerce/relation/` | Émet `commerce.waitlist_ready` lors de la libération d'une table |
| **P2** | ⬜ | H3 | M | **Réservation via WhatsApp Business API** | `src/lib/connectors/hub/WhatsAppConnector.ts` | Bot conversationnel de confirmation |
| **P2** | ✅ | H2 | — | **Bons cadeaux & E-chèques** (génération + POS) | `src/modules/commerce/pricing/` | Émission, rechargement et scellement fiscal NF525 ✅ |
| **P2** | ⬜ | H2 | S | **Programme de parrainage & code promo** | `src/modules/commerce/relation/loyalty/` | Tracking code parrain et attribution automatique de points |
| **P2** | 🔧 | H2 | M | **Comptes entreprise & Facturation B2B groupée** | `src/modules/finance/billing/` | Facturation périodique fin de mois + relevé d'engagements |
| **P2** | 🔧 | H2 | M | **Packages événements & privatisations** | `src/modules/commerce/catalog/` | Gestion des arrhes, menus sur mesure et devis signés |
| **P2** | ⬜ | H2 | S | **Collecte d'avis automatique post-visite** (Google) | `src/orchestration/handlers/PostVisitReviewHandler.ts` | Émet `commerce.review_request_sent` 2h après clôture de table |
| **P2** | 🔧 | H1 | XL | **Gestion multi-établissements (EmpireCockpit)** | `src/app/(admin)/mcc/` | 🚧 **Prérequis SovereignGuard cross-tenant** (H4) |
| **P2** | 🔧 | H2 | L | **Scoring CRM (RFM, CLV, Churn)** | `src/modules/commerce/relation/crm/` | Modèle paramétrable selon le profil restaurant (Gastro vs Brasserie) |
| **P2** | ⬜ | H3 | L | **Abonnements repas & formules corporate** | `src/modules/commerce/pricing/` | Prélèvements récurrents SEPA / CB Stripe Subscriptions |
| **P3** | ⬜ | H2 | M | **Menu multilingue QR code** (EN/ES/ZH/AR) | `src/i18n/` | 🚧 Infrastructure dormante — activation sur décision produit |
| **P3** | ✅ | H1 | — | **Widget réservation embeddable iframe** | `src/app/api/widgets/reservation/` | Intégrable sur le site WordPress/Wix du restaurateur |
| **P3** | ⬜ | H3 | XL | **Fidélité inter-enseignes & réseau partenaires** | `src/modules/commerce/relation/loyalty/` | Partage de points inter-établissements |
| **P3** | 🔧 | H3 | M | **Publication automatique Google Business** | `src/modules/intelligence/` | Push des menus du jour et photos de plats |
| **P3** | ⬜ | H2 | M | **Précommandes traiteur & banquets** | `src/modules/commerce/catalog/` | — |

---

## 💰 3. Finance & Comptabilité

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances / Risques |
|:---:|:---:|:---:|:---:|---|---|---|
| **P1** | ✅ | H1 | — | **Rapprochement bancaire Open Banking** (5 banques) | `src/modules/finance/comptabilite/BankSync.ts` | Synchronisation des flux bancaires et lettrage automatique |
| **P1** | 🔧 | H1 | L | **Déclarations TVA CA3 auto-générées (DGFiP/EDI)** | `src/modules/finance/fiscalite/tax/vatResolver.ts` | Calcul TVA 5.5/10/20% OK — Export EDI TDFC/EFI à compléter |
| **P1** | ✅ | H1 | — | **Gestion fond de caisse & tiroir-caisse** | `src/modules/finance/comptabilite/CashDrawer.ts` | Comptage d'ouverture, contrôle écarts et scellement d'accès |
| **P1** | ✅ | H1 | — | **Comptabilité des pourboires & DSN** | `src/modules/human/paie/tips.ts` | Écritures de compte 421 / 641 et ventilation légale |
| **P1** | 🔧 | H1 | L | **Prévision de trésorerie 30/60/90 jours** | `src/modules/finance/comptabilite/CashflowForecast.ts` | Nécessite historique transactionnel + règles heuristiques de cold-start |
| **P1** | ⬜ | H1 | S | **Clés déterministes Grand Livre / Remboursements** | `src/shared/eventBus/handlers/RefundJournalHandler.ts` | **Invariant Concurrence #1** : clé d'idempotence `JE-REFUND-${paymentId}` |
| **P1** | 🔧 | H2 | L | **Facturation inter-sociétés groupe** | `src/modules/finance/billing/` | Prérequis multi-établissements H4 |
| **P1** | ✅ | H1 | — | **Clôture journalière Z NF525 scellée** | `src/modules/finance/fiscalite/FiscalSeal.ts` | Chaînage SHA-256, compteurs perpétuels et Grand Total inaltérable |
| **P2** | ✅ | H2 | — | **Prélèvements SEPA fournisseurs (XML pain.001)** | `src/orchestration/handlers/SepaExportHandler.ts` | Génération de fichiers de virement SEPA interbancaires |
| **P2** | 🔧 | H2 | M | **Seuil de rentabilité par service & point mort** | `src/modules/finance/comptabilite/` | Calcul marge sur coûts variables par shift |
| **P2** | ✅ | H1 | — | **Dashboard CFO — Budget vs Réel en temps réel** | `src/modules/finance/comptabilite/BudgetTracker.ts` | Suivi CA, masse salariale (ratio 30%) et Food Cost (ratio 28%) |
| **P2** | 🔧 | H2 | M | **RevPASH (Revenue per Available Seat Hour)** | `src/modules/intelligence/forecasting/` | Indicateur de performance horaire du plan de salle |
| **P2** | 🔧 | H1 | M | **Marge contributive par plat du menu** | `src/modules/finance/comptabilite/` | Croisement fiches techniques réelles et ventes POS |
| **P2** | ✅ | H1 | — | **Food Cost tracking & alertes dérive** | `src/orchestration/handlers/BCGActionSuggestionHandler.ts` | Alerte instantanée si dérive matière brute > 2% |
| **P2** | ✅ | H1 | — | **Matching 3 voies (Commande / BL / Facture)** | `src/modules/logistics/approvisionnement/` | Rapprochement automatique des quantités et prix unitaires |
| **P2** | ✅ | H1 | — | **Facturation électronique Factur-X / UBL 2.1** | `src/modules/finance/einvoicing/FacturXGenerator.ts` | Conforme réforme 2026 (directive UE 2014/55 + PDF/A-3) |
| **P2** | ✅ | H2 | — | **Recouvrement créances B2B (3 paliers)** | `src/modules/finance/billing/RecoveryEngine.ts` | Escalade automatique : FRIENDLY → FORMAL → LEGAL |
| **P2** | ✅ | H1 | — | **Export comptable Pennylane / FEC** | `src/modules/finance/comptabilite/PennylaneAdapter.ts` | Export conforme Art. L.47 A-1 LPF avec hash SHA-256 |
| **P3** | ⬜ | H4 | M | **Affacturage factures B2B** | `src/modules/finance/billing/` | Passerelle avec solution de financement court terme |
| **P3** | ⬜ | H3 | M | **Multi-devises (EUR / CHF / USD / GBP)** | `src/kernel/nexus/contracts/settings/defaults.ts` | Dépend d'une refonte du `vatResolver` pour fiscalité suisse/UK |
| **P3** | 🔧 | H2 | L | **Consolidation financière groupe (MacroBrain)** | `src/app/(admin)/mcc/` | Agrégation cross-tenants avec élimination des flux réciproques |
| **P3** | ⬜ | H3 | S | **Déclaration DAS2 honoraires prestataires** | `src/modules/finance/fiscalite/` | — |

---

## 🛡️ 4. Compliance & Sécurité Alimentaire

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances / Risques |
|:---:|:---:|:---:|:---:|---|---|---|
| **P1** | ✅ | H1 | — | **Registres HACCP numériques** (température, huiles) | `src/modules/compliance/qualite/haccp/` | Relevés IoT, seuils critiques et fiches de non-conformité |
| **P1** | 🔧 | H1 | M | **Étiquetage 14 allergènes (INCO EU 1169/2011)** | `src/modules/compliance/sanitaire/` | 🔴 **Risque Corporel / Choc Anaphylactique** : dépend R2 `reservation.matched` |
| **P1** | 🔧 | H1 | L | **Traçabilité amont/aval (EU 178/2002)** | `src/modules/compliance/sanitaire/TraceabilityEngine.ts` | Chaînage complet : `lot fournisseur → fiche technique → commande → table` |
| **P1** | 🔧 | H1 | S | **Contrôle qualité eau & glaces** (analyses labo) | `src/modules/compliance/qualite/` | Enregistrement des certificats et alertes de prélèvement |
| **P1** | 🔧 | H2 | S | **Journal de dératisation / désinsectisation** | `src/modules/compliance/qualite/` | Plan de passage des prestataires 3D et bons d'intervention |
| **P1** | ✅ | H1 | — | **Signalement alertes sanitaires DGCCRF / RASFF** | `src/orchestration/handlers/NonConformActionHandler.ts` | Blocage instantané d'un lot en caisse et rappel produit |
| **P1** | ✅ | H1 | — | **Suivi formation hygiène HACCP 14h obligatoire** | `src/orchestration/handlers/TrainingComplianceAlertHandler.ts` | Suivi des attestations et alerte renouvellement |
| **P1** | ⬜ | H2 | S | **Permis d'exploitation & Licence débit de boissons** | `src/modules/compliance/registre/` | Rappel de renouvellement décennal |
| **P2** | ⬜ | H4 | L | **Bilan carbone GES Scope 1-2-3** | `src/modules/compliance/` | Calcul empreinte carbone des matières premières |
| **P2** | 🔧 | H3 | M | **Registre gaspillage & Dons alimentaires (Loi Garot)** | `src/modules/compliance/qualite/` | Suivi des conventions de don et déductions fiscales |
| **P2** | ✅ | H1 | — | **Sécurité incendie & Registre ERP** | `src/modules/compliance/securite/` | Dates de visite commission de sécurité et vérification extincteurs |
| **P2** | ⬜ | H3 | M | **Audit éco-responsable fournisseurs** (Bio, Label Rouge) | `src/modules/logistics/approvisionnement/` | — |
| **P2** | ✅ | H1 | — | **Droit à l'oubli RGPD (Crypto-shredding)** | `src/modules/compliance/registre/ErasureService.ts` | Destruction irréversible des données PII à la demande du client |
| **P1** | ⬜ | H1 | M | **RGPD Art. 9 — Données de santé & Allergies client** | `src/modules/commerce/relation/crm/` | 🔴 **Bloquant P0 §DEBT 2.3** : consentement explicite + chiffrement AES-256 |
| **P2** | 🔧 | H1 | M | **Détection fraude caisse & Voids suspects** | `src/orchestration/handlers/CryptoIntegrityCheckHandler.ts` | Surveillance des annulations post-addition et écarts tiroir |
| **P3** | ⬜ | H3 | S | **Calcul Nutri-Score automatique par recette** | `src/modules/commerce/catalog/` | Dépend des données nutritionnelles CIQUAL |
| **P3** | ✅ | H1 | — | **Conformité accessibilité PMR ERP** | `src/modules/compliance/securite/` | Registre public d'accessibilité dématérialisé |
| **P3** | ⬜ | H2 | S | **Licence IV (transfert et périmètre de protection)** | `src/modules/compliance/registre/` | — |
| **P3** | 🔧 | H2 | M | **Audit sanitaire par cabinet tiers (AuditService)** | `src/modules/compliance/securite/AuditService.ts` | Grille d'évaluation externe et plan d'actions correctives |

---

## 👥 5. Human — RH & Paie

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances / Risques |
|:---:|:---:|:---:|:---:|---|---|---|
| **P1** | ✅ | H1 | — | **Planning staff & Contraintes HCR (Convention 3292)** | `src/modules/human/planning/RosterEngine.ts` | Contrôle repos 11h, coupures, amplitude max et durées hebdomadaires |
| **P1** | ✅ | H1 | — | **Gestion congés payés, RTT & arrêts maladie** | `src/app/(client)/(ops)/leaves/page.tsx` | Circuit de validation manager et compteurs de solde |
| **P1** | ✅ | H1 | — | **Pointeuse badge PIN PBKDF2 / QR / NFC** | `src/modules/human/timeclock/TimeclockEngine.ts` | Pointage sécurisé avec géofencing |
| **P1** | ⬜ | H1 | S | **Debounce anti-rebond pointeuse (60s)** | `src/modules/human/timeclock/` | **Invariant Concurrence #4** : empêche les doubles pointages accidentels |
| **P1** | ✅ | H1 | — | **Calcul automatique heures supplémentaires (25%/50%)**| `src/orchestration/handlers/HRClockInGuardHandler.ts`| Déclenchement automatique selon contingent légal |
| **P1** | ✅ | H1 | — | **Répartition des pourboires (Pool / Rang / Heures)** | `src/design/settings/TipsDistributionSettingsSection.tsx`| Moteur de calcul équitable et transparent |
| **P1** | ✅ | H1 | — | **Génération DSN mensuelle XML (URSSAF)** | `src/orchestration/handlers/PayrollExportHandler.ts` | **⚠️ À valider par expert-comptable sur dossier pilote** |
| **P2** | ✅ | H2 | — | **Module recrutement ATS & Pipeline candidats** | `src/modules/human/effectifs/hr/` | Suivi des candidatures et modèles d'entretiens |
| **P2** | ⬜ | H2 | M | **Onboarding digital & Signature contrat eIDAS** | `src/modules/human/effectifs/hr/` | Dépend d'un tiers de confiance eIDAS (Yousign/Universign) |
| **P2** | ⬜ | H3 | S | **Entretiens professionnels bisannuels** | `src/modules/human/effectifs/hr/` | Trame légale et archivage des comptes-rendus |
| **P2** | 🔧 | H2 | L | **Staff partagé & Rotation multi-sites** | `src/modules/human/planning/` | Nécessite la gestion des contrats supra-tenant H4 |
| **P2** | ⬜ | H3 | M | **Acomptes sur salaire automatiques** | `src/modules/human/paie/` | Plafonnement légal à 50% du salaire mensuel |
| **P2** | ✅ | H1 | — | **DUERP (Document Unique d'Évaluation des Risques)** | `src/modules/human/effectifs/hr/` | Cartographie des risques professionnels et plan de prévention |
| **P2** | ✅ | H1 | — | **Registre Unique du Personnel (RUP)** | `src/modules/human/effectifs/hr/components/staff/StaffMemberForm.tsx`| Registre inaltérable avec historique des entrées/sorties |
| **P2** | ✅ | H1 | — | **Export pré-paie Silae / PayFit / Combo** | `src/orchestration/handlers/PayrollExportHandler.ts` | Variables de paie au format normalisé |
| **P2** | ⬜ | H3 | M | **Compte Épargne Temps (CET HCR)** | `src/modules/human/paie/` | — |
| **P3** | ⬜ | H3 | L | **Plateforme e-learning & micro-formations** | `src/modules/human/effectifs/hr/` | Modules HACCP, service et sécurité |
| **P3** | ⬜ | H2 | M | **Contrats extras CDDU en 1 clic** | `src/modules/human/effectifs/hr/` | Génération DPAE URSSAF automatique |
| **P3** | 🔧 | H1 | L | **Moteur complet Convention Collective HCR** | `src/orchestration/handlers/HRBreakCheckHandler.ts` | Intégration des 200+ règles d'accords de branche |
| **P3** | ⬜ | H3 | M | **Livret d'apprentissage & suivi alternants** | `src/modules/human/effectifs/hr/` | — |
| — | 🚫 | — | — | ~~**Reconnaissance faciale pointeuse**~~ | `FacialRecognitionClockIn` | **🚫 BLOQUÉ CNIL** : biométrie illégale sans délibération formelle et AIPD |

---

## 📦 6. Logistics — Stock & Approvisionnement

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances / Risques |
|:---:|:---:|:---:|:---:|---|---|---|
| **P1** | 🔧 | H1 | L | **Comparateur mercuriales multi-fournisseurs** | `src/modules/logistics/approvisionnement/` | Connecteurs EDI Metro, Pomona, Transgourmet |
| **P1** | 🔧 | H1 | M | **Commandes fournisseurs automatiques au seuil** | `src/modules/logistics/approvisionnement/` | Déclenchement automatique selon stock mini |
| **P1** | 🔧 | H2 | L | **Portail extranet fournisseurs** | `src/modules/logistics/approvisionnement/` | Surface d'accès externe nécessitant RBAC dédié |
| **P1** | 🔧 | H1 | L | **Traçabilité numéro de lot, DLC & DLO** | `src/modules/logistics/dlc/` | **Chaîne réglementaire EU 178/2002 à sceller** |
| **P1** | ✅ | H1 | — | **Valorisation stock FIFO / PRMP** | `src/__tests__/helpers/saga.stock.test.ts` | Décrémentation par couche d'achat et valorisation comptable |
| **P1** | ✅ | H1 | — | **Contrôle réception marchandises (BL vs BDC)** | `src/modules/logistics/inventaire/` | Pointage des litiges et alertes écarts prix |
| **P1** | ✅ | H1 | — | **Service 86 automatique (rupture de stock)** | `src/modules/ops/service/pos/` | Consomme `stock.zero` et grise l'article en caisse |
| **P1** | ✅ | H1 | — | **Décrémentation stock sur commande encaissée** | `src/modules/logistics/stocks/` | Explosion des ingrédients selon fiche technique |
| **P1** | ⬜ | H1 | M | **Décrémentation atomique des stocks (Anti-RMW)** | `src/shared/eventBus/handlers/StockDeductionHandler.ts` | **Invariant Concurrence #2** : opération transactionnelle pure |
| **P2** | ⬜ | H3 | M | **Gestion des emballages consignés (fûts, bouteilles)**| `src/modules/logistics/stocks/` | Suivi de la caution financière |
| **P2** | ⬜ | H2 | S | **Gestion des retours fournisseurs & Avoirs** | `src/modules/logistics/approvisionnement/` | — |
| **P2** | 🔧 | H2 | M | **Seuils de stock dynamiques (Par Level IA)** | `src/modules/logistics/stocks/` | Ajustement selon prévisions de vente ML |
| **P2** | 🔧 | H1 | S | **Registre des pertes & Gaspillage matières** | `src/modules/logistics/inventaire/` | Qualification des causes (DLC, casse, brûlé, sur-production) |
| **P2** | ⬜ | H2 | M | **Inventaire tournant en plein service** | `src/app/(client)/(ops)/inventory/loading.tsx` | Saisie zone par zone sans arrêt de la caisse |
| **P2** | ✅ | H1 | — | **OCR intelligent factures fournisseurs (IA)** | `src/__tests__/onboarding/ocrParsers.test.ts` | Extraction automatique des lignes, TVA et quantités |
| **P2** | ✅ | H1 | — | **Matching 3 voies logistique (BDC / BL / Facture)** | `src/modules/logistics/approvisionnement/` | Détection immédiate des surfacturations |
| **P3** | 🔧 | H3 | M | **Prédiction des péremptions DLC par IA** | `src/modules/intelligence/` | Alerte antigaspi à J-3 |
| **P3** | 🔧 | H2 | M | **Télémétrie IoT chambres froides (Sondes Testo)** | `src/orchestration/handlers/FridgeTempAlertHandler.ts` | Relevés MQTT continus et alerte dépassement de seuil |
| **P3** | ⬜ | H3 | S | **Passerelle Too Good To Go / Phenix** | `src/modules/logistics/` | Revente automatique des invendus du jour |
| **P3** | ✅ | H1 | — | **Migration de données depuis Zelty / Lightspeed** | `src/modules/acquisition/onboarding/migration/types.ts` | Import des catalogues, clients et historiques |

---

## 🧠 7. Intelligence — IA & Analytics

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances / Risques |
|:---:|:---:|:---:|:---:|---|---|---|
| **P1** | 🔧 | H2 | L | **Prévision des ventes ML (J+7, J+30)** | `src/modules/intelligence/forecasting/` | **Cold-start heuristique 30j requis pour nouveaux comptes** |
| **P1** | ⬜ | H2 | M | **Menu Engineering BCG (Étoiles / Poids Morts)** | `src/orchestration/handlers/BCGActionSuggestionHandler.ts` | Matrice Rentabilité × Popularité (calcul et affichage simples) |
| **P1** | 🔧 | H1 | M | **Suggestions d'upselling serveur en temps réel** | `src/modules/intelligence/ia/ai/HermesEngine.ts` | Validation ergonomique requise (ne pas surcharger le serveur en rush) |
| **P1** | ✅ | H1 | — | **Rapports flash quotidiens (DailyFlashReport)** | `src/orchestration/handlers/DailyDigestHandler.ts` | Synthèse CA, météo, ratios et alertes envoyée par email/SMS |
| **P1** | ✅ | H1 | — | **Rapports hebdomadaires consolidés** | `src/modules/intelligence/` | Comparatif N-1 et objectifs |
| **P1** | ✅ | H1 | — | **Détection d'anomalies cross-domain (Zeus)** | `src/modules/intelligence/domain/agency/Zeus.ts` | Corrélations automatiques CA / Météo / Stocks / Ratios |
| **P2** | ✅ | H2 | — | **Tarification dynamique (Happy Hours, Rush)** | `src/modules/commerce/pricing/` | Grilles tarifaires horaires automatiques |
| **P2** | ⬜ | H3 | L | **Analyse de sentiment avis clients multi-plateformes**| `src/modules/intelligence/` | Scraping et analyse NLP Google / TripAdvisor |
| **P2** | 🔧 | H2 | M | **Optimisation planning RH selon affluence prévue** | `src/modules/human/planning/` | Proposition de planning calé sur le CA estimé |
| **P2** | 🔧 | H2 | M | **Prévision du gaspillage matière première** | `src/modules/logistics/inventaire/` | Dépend du ML de ventes |
| **P2** | ⬜ | H3 | M | **Scoring de fiabilité des fournisseurs** | `src/modules/logistics/approvisionnement/` | Ponctualité, conformité BL, dérive tarifaire |
| **P2** | ✅ | H1 | — | **Veille tarifaire concurrentielle (MarketOracle)** | `src/app/api/oracle/route.ts` | Analyse des prix du quartier et positionnement |
| **P2** | 🔧 | H1 | M | **Détection de dérive du coût des recettes** | `src/modules/intelligence/` | Alerte sur hausse du coût d'un ingrédient clé |
| **P2** | ⬜ | H3 | M | **Modèle prédictif de No-Show clients** | `src/modules/intelligence/forecasting/` | Scoring de risque lors de la réservation |
| **P2** | ✅ | H1 | — | **Benchmarking inter-restaurants anonymisé** | `src/lib/mcc/auth/MccOperatorContract.ts` | Comparaison des performances avec le reste de la flotte |
| **P2** | ✅ | H1 | — | **Staffing météo (RushMode / Pluie)** | `src/orchestration/handlers/RushModeIntegrationHandler.ts` | Alerte renfort staff si prévision météo défavorable |
| **P3** | ⬜ | H4 | XL | **Optimisation recettes IA (ingrédients alternatifs)** | `src/modules/intelligence/` | Suggestions de substitution pour préserver la marge |
| **P3** | 🔧 | H3 | M | **Analyse des tendances culinaires & saisonnalité** | `src/modules/intelligence/` | — |
| **P3** | 🔧 | H4 | XL | **Vision IA retour assiette (analyse gaspillage)** | `src/modules/intelligence/domain/agency/types.ts` | Photo du plateau plonge → détection des restes |
| **P3** | 🔧 | H3 | M | **Calcul RevPAC (Revenue Per Available Cover)** | `src/modules/intelligence/forecasting/` | — |
| **P3** | ⬜ | H3 | S | **Accords mets et vins automatisés en caisse** | `src/modules/commerce/catalog/` | — |

---

## 🏛️ 8. Facility — Espaces & Maintenance

⚠️ **ALERTE DETTE** : La maintenance et la gestion IoT (Zone 9) représentent **27 composants à construire** (voir [`docs/plans/UI_MATRIX_16_ZONES.md §10`](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/docs/plans/UI_MATRIX_16_ZONES.md#10-️-zone-9--facility--maintenance-⚠️-27-composants--0-livrés)).

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances / Risques |
|:---:|:---:|:---:|:---:|---|---|---|
| **P1** | ✅ | H1 | — | **Plan de salle interactif Konva.js 2D** | `src/app/(client)/(ops)/floor-plan/page.tsx` | Drag & drop, orientation, regroupement de tables |
| **P1** | ✅ | H1 | — | **Moteur géométrique & Coordonnées plan** | `src/app/(client)/(ops)/floor-plan/` | Centrage automatique, zoom et gestion responsive |
| **P1** | ⬜ | H2 | M | **Heatmap d'occupation des tables** | `src/app/(client)/(ops)/floor-plan/` | Taux de rotation par zone et rentabilité au m² |
| **P1** | ✅ | H1 | — | **Gestion des salons privés & privatisations** | `src/modules/commerce/relation/` | Contrats de réservation et arrhes |
| **P1** | ✅ | H1 | — | **Multi-espaces (Salle, Terrasse, Bar, Étage)** | `src/app/(client)/(ops)/floor-plan/` | Configuration et tarification différenciée |
| **P2** | ⬜ | H2 | L | **Carnet d'entretien préventif des équipements** | `src/modules/facility/maintenance/` | 🚧 **Zone 9 UI entièrement à construire** |
| **P2** | ⬜ | H3 | M | **Gestion du cycle de vie du matériel (Amortissement)**| `src/modules/facility/` | Suivi des garanties et dates de renouvellement |
| **P2** | ⬜ | H2 | M | **Planning ménage & protocoles de désinfection** | `src/modules/facility/` | Checklists de nettoyage avec signatures |
| **P2** | 🔧 | H2 | M | **Gestion multi-étages & monte-plats** | `src/app/(client)/(ops)/floor-plan/` | Suivi des statuts entre niveaux |
| **P2** | ✅ | H1 | — | **Registre des interventions de dépannage** | `src/modules/facility/interventions/` | Historique des pannes et bons de passage |
| **P2** | ✅ | H1 | — | **Contrôles réglementaires périodiques (CERFA 13984)**| `src/modules/compliance/securite/` | Registre de sécurité incendie et gaz |
| **P2** | ✅ | H1 | — | **Annuaire prestataires de maintenance** | `src/modules/facility/interventions/` | Frigoristes, électriciens, plombiers référencés |
| **P3** | ⬜ | H3 | M | **Suivi énergétique IoT (Compteurs Linky, Gaz, Eau)** | `src/modules/facility/` | Détection des fuites et surconsommations |
| **P3** | ⬜ | H3 | M | **Plan de salle en Réalité Augmentée (AR)** | `src/modules/facility/` | Visualisation 3D sur iPad Pro |
| **P3** | ⬜ | H3 | M | **Domotique de salle (Lumières, Climatisation, Musique)**| `src/modules/facility/` | Scénarios de service (Journée / Tamisé / Fin de service) |
| **P3** | ⬜ | H3 | S | **Intégration vidéosurveillance CCTV** | `src/modules/facility/` | — |

---

## 🔌 9. Intégrations Transversales

| P | Statut | Horizon | Effort | Feature | Code / Ref | Bloquants / Dépendances / Risques |
|:---:|:---:|:---:|:---:|---|---|---|
| **P1** | 🔧 | H1 | M | **Apple Pay / Google Pay / Paiement sans contact** | `src/lib/adapters/StripeTerminalAdapter.ts` | Support matériel TPE Stripe Terminal |
| **P1** | ✅ | H1 | — | **Synchronisation Google Business Profile** | `src/lib/connectors/hub/` | Horaires, menus, photos et avis clients |
| **P1** | ⬜ | H2 | XL | **Application mobile client-facing (App Store/Play)** | `src/app/(client)/(public)/` | 🚧 **Bloquée par l'API REST H2.2** |
| **P1** | ✅ | H1 | — | **Webhooks entrants / sortants réservations** | `src/shared/eventBus/` | Zenchef, TheFork, SevenRooms |
| **P1** | ✅ | H1 | — | **Emailing transactionnel & marketing (Brevo)** | `src/modules/commerce/relation/` | Notifications commandes et campagnes marketing |
| **P2** | ⬜ | H2 | M | **Connecteurs Mailchimp / Klaviyo** | `src/lib/connectors/hub/` | Synchronisation des listes de diffusion |
| **P2** | ✅ | H1 | — | **Export comptable Pennylane** | `src/modules/finance/comptabilite/PennylaneAdapter.ts` | Flux de vente et rapprochement journalier |
| **P2** | ⬜ | H2 | M | **Exports comptables Cegid, Sage, QuickBooks** | `src/modules/finance/comptabilite/` | Formats d'import standards |
| **P2** | ⬜ | H2 | L | **API REST publique OpenAPI 3.1 & Webhooks** | `src/app/api/v1/` | **Chantier pivot Horizon H2.2 (Framework Hono)** |
| **P2** | ⬜ | H4 | L | **Passerelles PMS Hôtellerie (Opera, Mews, Cloudbeds)**| `src/verticals/hotel/` | Dépendance pour la verticale Hôtel |
| **P2** | ✅ | H1 | — | **Export paie Silae / PayFit** | `src/orchestration/handlers/PayrollExportHandler.ts` | Export mensuel des données de présence |
| **P2** | ✅ | H1 | — | **Météo en direct (Météo-France / OpenWeather)** | `src/lib/connectors/hub/WeatherConnector.ts` | Alimentation du staffing dynamique |
| **P2** | ✅ | H1 | — | **Affluence événements locaux (Ticketmaster API)** | `src/lib/connectors/hub/` | Détection des concerts/matchs à proximité |
| **P3** | ⬜ | H3 | M | **Affichage dynamique Menu Boards (Digital Signage)** | `src/modules/ops/` | Écrans d'affichage prix au comptoir |
| **P3** | ⬜ | H3 | XL | **SDK Développeurs & Marketplace de connecteurs** | `src/lib/sdk/` | Permet aux éditeurs tiers de publier des modules |
| **P3** | ✅ | H1 | — | **Passerelle MQTT IoT (Capteurs et sondes)** | `src/lib/connectors/hub/MqttProvider.ts` | Collecte temps réel des températures |
| **P3** | ⬜ | H3 | S | **Standard GS1 EAN-128 (Traçabilité logistique)** | `src/modules/logistics/` | — |

---

## 🎯 Récapitulatif Statutaire Global (~170 Features)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ÉTAT D'AVANCEMENT DE LA FLOTTE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ✅  IMPLÉMENTÉ & OPÉRATIONNEL :  ~78 features  (46%)                       │
│  🔧  PARTIEL / EN CHANTIER      :  ~42 features  (25%)                       │
│  ⬜  À DÉVELOPPER               :  ~48 features  (28%)                       │
│  🚫  BLOQUÉ LÉGAL (CNIL)        :   1 feature   (1%)                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **Consulter le plan d'action immédiat** : [`docs/DEBT.md`](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/docs/DEBT.md) (Les 5 Bloquants P0 et les 7 Actions Pré-Lancement).
