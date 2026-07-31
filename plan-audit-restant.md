# Plan — Reste à faire (Audits Architecture + Produit)

> Basé sur Audit Architecture V3 (CAT-01 à CAT-12 / BS-01 à BS-32) + Audit Produit UI (PRD-01 à PRD-M8).
> Priorités : 🔴 Critique · 🟠 Haute · 🟡 Moyen · ⚪ Backlog

---

## RÉSUMÉ EXÉCUTIF

| Catégorie | Nb | Action |
|---|---|---|
| ROMPUES arch (R) | 0 | ✅ Toutes corrigées (P10-B corrigé) |
| PARTIELLES arch (P) | ~32 | Câblages à compléter |
| CÂBLAGE_INCOMPLET produit (CI) | ~18 | Handlers réels à brancher |
| UI_ONLY produit (UO) | ~14 | Mock data à remplacer par Nexus |
| ABSENT produit (A) | ~9 | Features à implémenter |
| TypeScript errors | 0 | ✅ Déjà corrigée |

---

## BLOC 1 — ROMPUES ARCHITECTURALES

> ✅ Aucune ROMPUE restante — P10-B (items:[] AntiCorruptionLayerHandler) corrigé en session précédente.

---

## BLOC 2 — PARTIELLES ARCHITECTURALES (P → T)

### 2.1 Vente & Encaissement (CAT-01)

| ID | Problème | Fix |
|---|---|---|
| P01-I | Annulation → stock restitué ✓ mais **avoir comptable manquant** | Émettre `order.credit_note` dans `StockRestitutionHandler`, créer `CreditNoteHandler` |
| P01-J | Vente offline → outbox Dexie ✓ mais **re-scellement NF525 côté serveur non vérifié** | Vérifier que `NexusSyncService.replayPendingEvents` appelle bien `FiscalSealer.sealDataAtomically` côté SSR |
| P01-L | Mode formation → signature placeholder ✓ mais **taux 0% exo non confirmé** | Vérifier `FiscalSealer` : cas `trainingMode` → TVA à 0% dans le TicketZ |

### 2.2 HACCP & Conformité (CAT-03)

| ID | Problème | Fix |
|---|---|---|
| P03-E | Contrôle HACCP manuel → API REST only (pas dans bus) | Émettre `haccp.check.saved` depuis `HACCPLogService.saveCheck()` |
| P03-F | Non-conformité → action corrective via API seulement | Émettre `haccp.nonconform` + créer handler dédié |
| P03-G | Formation hygiène expirée → alerte RH via API seulement | Créer handler `CertExpiryHandler` sur `cert.expired` |
| P03-H | Rappel produit → quarantaine via API (pas bus) | Émettre `recall.declared` depuis `RecallService`, handler quarantaine |
| P03-K | Calendrier conformité → cron only, pas dans le bus | Émettre `compliance.calendar` depuis le cron, handler alerte J-7/J-1 |

### 2.3 RH & Paie (CAT-04)

| ID | Problème | Fix |
|---|---|---|
| P04-E | Absence maladie → `RainStaffingHandler` gère l'urgence météo, **pas l'absence maladie** | Créer `AbsenceHandler` sur `absence.declared` → alerte sous-effectif |
| P04-G/H | Clôture mois → `payroll.submitted` émis mais **aucun handler dans registerHandlers** | Enregistrer `PayrollExportHandler` pour push Silae/Merge.dev |
| P04-K | Contrat expiré → cron/API seulement | Émettre `contract.expiry` depuis cron, ajouter au bus |
| P04-L | Visite médicale expirée → API seulement | Idem, émettre `medical.expiry` |

### 2.4 Réservations & Plan de salle (CAT-05)

| ID | Problème | Fix |
|---|---|---|
| P05-A | `reservation.confirmed` existe dans le bus mais **aucun handler email/SMS** | Créer `ReservationConfirmHandler` → Resend email + SMS (Brevo ?) |
| P05-G | Réservation LaFourchette → ACL traduit ✓ mais `reservation.confirmed` sans handler aval | Même fix que P05-A |

### 2.5 CRM & Marketing (CAT-06)

| ID | Problème | Fix |
|---|---|---|
| P06-D | Anniversaire J-3 → cron/API ✓ mais pas dans le bus événementiel | Émettre `birthday.j3` depuis le cron, handler Resend |
| P06-J/K | Promotion activée/expirée → module commerce API ✓ mais pas de sync POS temps réel | Créer `PromoSyncHandler` sur `promo.active` / `promo.expired` → atom POS |

### 2.6 Finance & Banking (CAT-07)

| ID | Problème | Fix |
|---|---|---|
| P07-A | Rapprochement bancaire → webhook Powens ✓ mais **pas dans le bus** | Émettre `bank.transaction` depuis le webhook, handler réconciliation |
| P07-D | Solde bancaire → API Powens ✓ mais **pas dans atom Jotai** | Surfacer `bankBalance` dans `financeAtom` |
| P07-F | Clôture période → module finance API ✓ mais **lock Nexus non confirmé** | Vérifier que `FiscalAdapter.lockPeriod()` verrouille bien les `journalEntries` |
| P07-J/K | Stripe renewal/fail → webhook ✓ mais **handler billing non enregistré dans registerHandlers** | Enregistrer `BillingWebhookHandler` |

### 2.7 Intelligence IA (CAT-08)

| ID | Problème | Fix |
|---|---|---|
| P08-A | Oracle RAG → `IntelligenceHandler` debounce 30s sur `order.paid` mais **pas de vrai handler oracle** | Créer endpoint `/api/oracle/chat` + handler `OracleQueryHandler` sur `oracle.query` |
| P08-F | Anomalie z-score calculée dans `IntelligenceHandler` mais **pas d'event émis** | Émettre `anomaly.detected` quand z-score > seuil |
| P08-H | `closeTicketZForDay()` → NF525 ✓ mais **prévision J+1 non câblée** | Brancher `ForecastHandler` après clôture |

### 2.8 Sécurité (CAT-09)

| ID | Problème | Fix |
|---|---|---|
| P09-C | Lockdown cash drawer → browser `Notification` ✓ mais **pas push natif** | Brancher `WebPushService.sendToUser()` (déjà implémenté) dans `CashDrawerAnomalyHandler` |
| P09-H | Rate limit PIN → persist Nexus **non vérifié** | Vérifier que `pinLockAtom` passe par `Nexus.adapter.set()` |

### 2.9 Connecteurs (CAT-10)

| ID | Problème | Fix |
|---|---|---|
| P10-C | LaFourchette → ACL ✓ mais `reservation.confirmed` sans handler aval | Fix partagé avec P05-A |
| P10-F | Idempotency webhook → `dedupLog` partiel | Compléter `DedupService` avec TTL 24h sur `webhookId` |

### 2.10 MCC & Fleet (CAT-12)

| ID | Problème | Fix |
|---|---|---|
| P12-C | Onboarding step → API ✓ mais pas dans le bus | Émettre `onboarding.step` depuis `OnboardingService` |
| P12-D/E | Stripe actif/expiré → `BillingService` ✓ mais **features lock non surfacé dans Nexus** | Synchroniser `tenants/{id}/plan` dans Nexus après chaque webhook Stripe |
| P12-F | Score santé tenant bas → fleet routes ✓ mais **ticket support non auto-créé** | Créer `HealthWatcherHandler` → ticket auto si score < seuil |
| P12-G | `SupportTicketAnalysisHandler` → SSR only, **non enregistré côté client bus** | OK pour SSR, documenter que c'est intentionnel |

---

## BLOC 3 — CÂBLAGE INCOMPLET PRODUIT (CI → L)

Ces features ont une UI et un handler partiel mais la donnée réelle n'arrive pas jusqu'à l'écran.

### 3.1 Plan de salle

| Feature | Problème | Fix |
|---|---|---|
| Capacité salle | Capacité définie en config mais **non surfacée sur le plan** | Lire `restaurantConfig.capacity` dans `FloorPlanProvider`, afficher compteur couverts |

### 3.2 Réservations

| Feature | Problème | Fix |
|---|---|---|
| Notification confirmation | `reservation.confirmed` émis → `logger.info` seulement | Brancher `ReservationConfirmHandler` → Resend (même fix P05-A) |
| Pénalité no-show | UI de saisie présente mais **aucun déclencheur de débit** | Appeler `BillingService.chargeNoShow()` depuis `ReservationService.markNoShow()` |

### 3.3 CRM

| Feature | Problème | Fix |
|---|---|---|
| Envoi campagne | Bouton présent → `logger.info` seulement | Brancher `CampaignService.send()` → Resend bulk ou Brevo API |

### 3.4 Marketing

| Feature | Problème | Fix |
|---|---|---|
| Social scheduling | UI présente mais **aucune API réelle branchée** | Intégrer Buffer/Meta Graph API dans `SocialSchedulerService` |
| SEO local | Champs remplis mais **pas d'indexation Google My Business** | Appeler GMB API depuis `SeoService.sync()` |

### 3.5 Analytics BI

| Feature | Problème | Fix |
|---|---|---|
| Rentabilité (CoGS) | Affiché mais **CoGS non calculé** (masse salariale absente) | Agréger `timeclockAtom` + `invoiceAtom` dans `ProfitabilityEngine` |
| Insights IA | Exemples hardcodés si pas de vraie analyse | Déclencher `IntelligenceHandler.analyze()` au chargement, stocker résultat dans Nexus |

### 3.6 HACCP

| Feature | Problème | Fix |
|---|---|---|
| IoT capteurs | `getSimulatedSensors()` côté UI malgré `HACCPLogService` Firestore | Remplacer par lecture `sensorReadingsAtom` → Nexus → Firestore réel |

### 3.7 Bar

| Feature | Problème | Fix |
|---|---|---|
| Stocks bar | Affiché mais **non lié à `stockLevels` Nexus** (stocks partagés avec cuisine) | Filtrer `stockLevelsAtom` par `category:'bar'` dans le composant Bar |

### 3.8 RH (SILAE)

| Feature | Problème | Fix |
|---|---|---|
| Export SILAE | API call commenté + `setTimeout` simulé | Décommenter l'appel Merge.dev, gérer le token OAuth dans `env.local` |

### 3.9 Finance

| Feature | Problème | Fix |
|---|---|---|
| Rapprochement bancaire | Powens branchée **si clés configurées** sinon `PlaceholderView` | Documenter la procédure clés Powens, ne pas laisser le placeholder en prod |
| Trésorerie tenant | Solde calculé mais **non surfacé dans le dashboard tenant** | Ajouter widget `TresoWidget` dans `/finance` lisant `bankBalanceAtom` |
| SEPA virement | Handler présent mais **aucun déclencheur UI** | Ajouter bouton "Virement SEPA" dans Finance → `SepaService.initiate()` |

### 3.10 Intelligence IA

| Feature | Problème | Fix |
|---|---|---|
| Agent RAG | Génère un rapport Sentinel mais **pas de chat interactif** | Ajouter composant `OracleChat` → `/api/oracle/chat` |
| Insights auto | Déclenchement **manuel seulement** | Déclencher analyse au login manager (debounce 10min) |

### 3.11 MCC Compliance

| Feature | Problème | Fix |
|---|---|---|
| Push patch depuis Compliance | Déploiement non exposé depuis l'onglet Compliance | Ajouter bouton "Déployer patch" dans `MccComplianceTab` → `PatchCenterService.deploy()` |

---

## BLOC 4 — UI_ONLY / DONNÉES HARDCODÉES (UO → L)

Ces écrans affichent des données inventées. Priorité haute pour ne pas induire en erreur.

### 4.1 Menu Builder — CRITIQUE

| Élément hardcodé | Fichier | Fix |
|---|---|---|
| `mockProducts` | `src/app/(admin)/menu-builder/` | Remplacer par `productsAtom` → Nexus `products` |
| `mockCategories` | idem | Remplacer par `categoriesAtom` → Nexus `categories` |
| Prix produits | idem | Les prix viennent de `product.priceInMicrounits` (Nexus) |

### 4.2 Bar — CRITIQUE

| Élément hardcodé | Fix |
|---|---|
| `WINE_CELLAR` (217 lignes de constantes) | Migrer vers collection Nexus `products` filtré `category:wine` |
| `COCKTAILS` hardcodés | Migrer vers `recipes` Nexus |
| Recettes bar | Migrer vers `recipes` Nexus |

### 4.3 Registres — IMPORTANT

| Élément hardcodé | Fix |
|---|---|
| `mockDoc()` sur DUERP | Migrer vers `registresAtom` → Nexus `documents/duerp` |
| `mockDoc()` sur registre incendie | Nexus `documents/fire` |
| `mockDoc()` sur prestataires | Nexus `documents/providers` |
| `mockDoc()` sur interventions | Nexus `documents/interventions` |
| `mockDoc()` sur accessibilité PMR | Nexus `documents/pmr` |
| `mockDoc()` sur registre sanitaire | Nexus `documents/sanitary` |

### 4.4 Marketing

| Élément hardcodé | Fix |
|---|---|
| ExpertHub référencement IA | Remplacer le contenu statique par appel `IntelligenceService.getSeoAdvice()` |

### 4.5 MCC Lifecycle

| Élément hardcodé | Fix |
|---|---|
| `LifecycleTreePanel` — STAGES hardcodés | Lire depuis `tenantLifecycleAtom` → Nexus `lifecycle/{tenantId}` |

---

## BLOC 5 — ABSENTS À IMPLÉMENTER (A)

Features complètement absentes. Arbitrer : implémenter ou déprioriser.

| ID | Feature | Section | Priorité estimée |
|---|---|---|---|
| A-01 | Assignation serveur à une table | Plan de salle | 🟠 Haute — fonctionnel pour le service |
| A-02 | Fusion/split de tables | Plan de salle | 🟡 Moyen |
| A-03 | Allergènes sur Menu Builder | Menu Builder | 🔴 Critique (légal INCO) |
| A-04 | Suivi préparation temps réel | Opérations | 🟠 Haute |
| A-05 | Priorités commandes | Opérations | 🟡 Moyen |
| A-06 | Export contacts CRM | CRM | 🟡 Moyen |
| A-07 | Taux no-show dans Analytics | Analytics BI | ⚪ Backlog |
| A-08 | Livre de police | Registres | 🟡 Moyen (légal hôtel) |
| A-09 | Export PDF registres | Registres | 🟠 Haute (audit) |
| A-10 | Suspension/résiliation tenant | MCC Lifecycle | 🟠 Haute (SaaS critique) |
| A-11 | Migrations entre plans | MCC Lifecycle | 🟡 Moyen |

---

## ORDRE D'EXÉCUTION RECOMMANDÉ

```
Sprint 1 — Légal & critique (1-2 semaines)
  → A-03 Allergènes Menu Builder       (INCO obligatoire)
  → 4.1  Menu Builder mockProducts/mockCategories → Nexus
  → P01-I Avoir comptable sur annulation
  → P05-A Handler confirmation réservation (email/SMS)

Sprint 2 — Données réelles (1 semaine)
  → 4.2  Bar : WINE_CELLAR + COCKTAILS → Nexus products/recipes
  → 4.3  Registres : tous les mockDoc() → Nexus documents
  → 3.6  HACCP IoT : getSimulatedSensors() → Nexus réel

Sprint 3 — Câblages métier (1-2 semaines)
  → 3.8  SILAE décommenter + OAuth Merge.dev
  → 3.9  Finance : trésorerie tenant surfacée + SEPA UI
  → 3.1  Plan de salle : compteur capacité
  → P09-C WebPush cash drawer (déjà implémenté, juste à brancher)

Sprint 4 — Features absentes (2+ semaines)
  → A-01 Assignation serveur table
  → A-10 Suspension/résiliation tenant MCC
  → A-09 Export PDF registres
  → 3.10 Oracle chat interactif

Sprint 5 — Bus événementiel & handlers manquants
  → P03-E/F HACCP → bus
  → P04-E AbsenceHandler
  → P04-G/H PayrollExportHandler Silae
  → P07-J/K BillingWebhookHandler Stripe
  → P08-F emit anomaly.detected
```

---

## FICHIERS CLÉ À MODIFIER

| Sprint | Fichier | Action |
|---|---|---|
| 1 | `src/app/(admin)/menu-builder/` | Remplacer mockProducts/mockCategories |
| 1 | `src/shared/eventBus/handlers/StockRestitutionHandler.ts` | Émettre `order.credit_note` |
| 1 | Nouveau : `ReservationConfirmHandler.ts` | Resend email/SMS |
| 2 | `src/app/(admin)/bar/` | WINE_CELLAR → Nexus |
| 2 | `src/app/(admin)/registres/` | mockDoc() → Nexus |
| 2 | `src/modules/compliance/haccp/` | getSimulatedSensors() → Nexus |
| 3 | `src/modules/human/payroll/` | Décommenter SILAE |
| 3 | `src/modules/ops/pos/handlers/CashDrawerAnomalyHandler.ts` | Brancher WebPush |
| 4 | `src/modules/ops/engine/components/floor-plan/` | Assignation serveur |
| 4 | `src/shared/nexus/engines/mcc/` | Lifecycle suspension |
| 5 | `src/shared/eventBus/registerHandlers.ts` | Enregistrer tous les handlers manquants |
