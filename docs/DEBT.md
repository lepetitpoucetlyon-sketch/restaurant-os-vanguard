# 🛡️ Registre de Dette Technique, Legal & Angles Morts (DEBT.md)

> **Document Maître de Cadrage des Risques, Angles Morts & Actions Pré-Lancement**
> **Dernière révision** : 2026-08-15 (Audit Codebase Empirique & Cadrage Terrain)
> **Statut Codebase** : **3 433** fichiers · **TSC = 0** · Zero-Defect Standard
> **Vue croisée** : [BACKLOG.md](../BACKLOG.md) (features) · [ARCHITECTURE_METAPLATFORM.md](plans/ARCHITECTURE_METAPLATFORM.md) (invariants) · [ROADMAP_STRATEGY.md](plans/ROADMAP_STRATEGY.md) (horizons)

---

## 🎯 1. Les 5 Bloquants Absolus d'Avant-Vente (P0)

Ces 5 items bloquent l'onboarding du **premier client payant en production**. Aucune facturation réelle ne doit avoir lieu avant leur résolution complète.

| # | Bloquant P0 | Domaine | Risque | Action Requise | Effort | Statut |
|---|-------------|---------|--------|----------------|--------|--------|
| 1 | **Accord juridique DPA RGPD & CGU/CGV B2B** | Légal | Sanction CNIL (4% CA mondial), invalidité des contrats B2B | Rédaction formelle des CGU/CGV SaaS + DPA Art. 28 RGPD + Addenda par verticale + Moteur d'e-signature souverain scellé SHA-256 eIDAS. | Livré | 🟢 **Résolu & Validé** (`LegalContractGenerator.ts`, `SovereignSignatureEngine.ts`, `MCCContractManager.tsx`, `TenantContractSignModal.tsx`) |
| 2 | **Archivage WORM Long-Terme NF525** | Fiscalité | Invalidation fiscale NF525 (amende 7 500 € par caisse) + amende Art. L102 B LPF | Rétention légale 6 ans immuable (Art. L102 B LPF) scellée avec master hash SHA-256 et verrou WORM anti-altération. | Livré | 🟢 **Résolu & Validé** (`WormArchiveStorageService.ts`) |
| 3 | **Émission `WelcomeGuestButton` → `reservation.matched`** | Sécurité Food | Erreur d'allergènes INCO lors du check-in client → **risque santé publique** | Finaliser le bouton d'accueil dans le plan de salle + handler `ResaAllergenCheckHandler` qui consomme `reservation.matched`, consulte `Customer.allergens`, push alerte KDS station concernée. | Livré | 🟢 **Résolu & Validé** (`TableInsightPanel.tsx`, `floor-plan/page.tsx`, `ResaAllergenCheckHandler.ts`) |
| 4 | **Clôture des Handlers Bus Restants (R1-R13)** | Fonctionnel | Perte d'événements asynchrones, features vendues silencieusement cassées | Émetteurs `stripe.deposit_received` & `ops.table_closed` livrés + Invariant #1 idempotence `IdempotencyGuard` + suite `bus-smoke.test.ts` à 100% vert. | Livré | 🟢 **Résolu & Validé** (`IdempotencyGuard.ts`, `bus-smoke.test.ts`) |
| 5 | **Pipeline CI/CD Minimal & Staging** | DevOps | Régression en production lors des déploiements = churn client payant | Workflows GitHub Actions bloquants (`ci.yml`, `grade-x-sovereignty.yml`, `brand-gate.yml`, `deploy-instance.yml`). | Livré | 🟢 **Résolu & Validé** (`.github/workflows/`) |

---

## 🧩 2. Les 6 Angles Morts Majeurs d'Architecture & Opérations

### ⚡ 2.1 Idempotence & Ordre des Événements du Bus (`NexusEventBus`) 🟢 (Résolu & Livré)
* **Problème** : `NexusEventBus.ts` persistait les intentions dans l'Outbox, mais ne dédupliquait pas les `eventId` consommés.
* **Solution Livrée** (`IdempotencyGuard.ts`, `NexusEventBus.ts`, `processedEvents` Dexie & Nexus) :
  1. Option `{ idempotent: true }` sur `NexusEventBus.on()` avec wrapper automatique `withIdempotencyGuard`.
  2. Vérification et verrouillage atomique sur la clé déterministe `${eventId}_${handlerId}`.
  3. Zéro double écriture comptable et zéro double débit de stock lors des retries réseau.

### ⛓️ 2.2 NF525 en Environnement Multi-Caisses & Mode Hors-Ligne 🟢 (Résolu & Livré)
* **Problème** : tension mathématique entre la chaîne SHA-256 séquentielle (`previousHash`) et le mode hors-ligne sur plusieurs tablettes simultanées.
* **Solution Livrée** (`FiscalSealer.ts`, `offlineQueue.ts`) :
  1. **Chaîne Fiscale par Caisse (`registerId`)** : chaque tablette/terminal scelle sa propre sous-chaîne cryptographique continue `FiscalSeal_{registerId}` sans fork.
  2. **Grand Livre de Clôture Z Consolidé** : agrégation des chaînes de terminaux.
  3. **File d'attente hors-ligne** : `offlineQueue.ts` avec Dexie et priorité 1 NF525.

### 🩺 2.3 Traçabilité des Allergies = Données de Santé (RGPD Art. 9)
* **Problème** : les fiches allergies (`Customer.allergens`) liées à l'identité d'un client sont des **données de santé** au sens de l'Article 9 du RGPD.
* **Risque légal** : sanction CNIL si stockées en clair comme de simples métadonnées CRM sans consentement explicite.
* **Solution d'Ingénierie** :
  1. Case à cocher de consentement explicite sur le formulaire de réservation / CRM.
  2. Chiffrement de repos AES-256-GCM sur le champ `allergens` via `CryptoService`.
  3. Application stricte de la politique de suppression `ErasureService` (crypto-shredding).
* **Cas Salon** : les photos avant/après cuir chevelu + fiches coloration + réactions allergiques → même traitement Art. 9.

### 🏢 2.4 Support B2B Tenant, Astreinte & Dépendance ("Bus Factor = 1") 🟢 (Résolu & Livré)
* **Problème** : la plateforme propose un CRM pour les clients des restaurants, mais aucun canal de ticketing dédié pour que le restaurateur appelle l'opérateur en cas de bug en plein service.
* **Solution Livrée** (`SosCaisseModal.tsx`, `SupportAIPanel.tsx`, `/api/tenant/support/tickets`) :
  1. Bouton **SOS Caisse** sur l'écran POS déclenchant une alerte prioritaire P0 avec presets de panne et diagnostic Gemini en direct.
  2. File d'attente live sur le Cockpit MCC (`SupportAIPanel.tsx`) pour prise en charge instantanée.

### 📦 2.5 Provisioning Matériel & Réseau On-Site (Le Jour J)
* **Problème** : absence de procédure standardisée pour le déploiement physique des iPads, imprimantes thermiques ESC/POS, TPE Stripe Terminal et sondes Bluetooth Testo.
* **Risque terrain** : échec du premier service chez le client dû à un WiFi défaillant ou une imprimante mal appairée.
* **Solution Opérationnelle** :
  1. **Kit Valise d'Onboarding** : routeur 4G multi-opérateurs de secours préconfiguré pour chaque établissement.
  2. **Checklist Matérielle J-0** : procédure de validation en 12 points (test impression, test tiroir-caisse, test TPE CB 1€, test coupure WiFi, test bump bar KDS, test balance Dialogue 06).

### ⏳ 2.6 Délais d'Homologation des APIs Partenaires Tierces
* **Problème** : des intégrations clés (Google Reserve, Doctolib, Booking.com, UberEats, SESAM-Vitale) dépendent de processus de validation commerciale et technique externes.
* **Risque de planning** : bloquer une roadmap en supposant que l'activation API est instantanée après le développement.
* **Solution de Cadrage** :
  - Bufferiser obligatoirement un délai de **3 à 6 mois** pour les homologations tierces dans les Horizons H2 à H4.
  - **HDS ANSSI cas spécial** : agrément 12-18 mois → démarches lancées en H3 pour agrément en H5. **Verticale Clinic ne peut pas être commercialisée sans HDS**.

---

## 🔍 3. Diagnostic Détaillé des 10 Catégories d'Angles Morts

### 3.1 Sécurité & Conformité Données (RGPD / HDS / WORM)

| Sév. | Gap | Détail |
|---|---|---|
| 🟠 | Zéro audit externe / pentest avant premier client payant | Les gates actuels (TSC=0) vérifient la compilation, pas les vulnérabilités comportementales |
| 🟠 | Pas de gestion des secrets en rotation | Clés API (Stripe, Gemini, Firebase) dans `.env` sans coffre ni rotation planifiée |
| 🟡 | Pas de scan vulnérabilités dépendances | Dependabot / Snyk absents du pipeline CI/CD |
| 🟡 | PCI-DSS SAQ-A non documenté | Stripe délègue le chiffrement mais la conformité (aucune carte en clair, logs sécurisés) se documente et s'atteste |
| 🟠 | Pas de WAF / protection DDoS | Le passage à une API REST publique (S5) ouvre une surface d'attaque nouvelle sans protection devant |
| 🟡 | `TwoFactorAuthConfig` (Zone 13) jamais rendu obligatoire | Le niveau 100 (Propriétaire) et le MCC lui-même devraient imposer le 2FA, pas le laisser optionnel |
| 🔴 | **Backups 90j vs NF525 6 ans : écart 24×** | La rétention backup (90j, H4) est 24× inférieure à la rétention fiscale légale (6 ans, art. L102 B LPF). Nécessite une archive froide immuable (WORM) séparée des snapshots opérationnels |
| 🟡 | Aucun RTO/RPO défini | "SLA monitoring" évoqué sans cibles de disponibilité, temps de reprise ni RPO chiffré |
| 🟡 | Masquage PII dans logs non systématique | Middleware `redactPII` à appliquer en entrée de logger — un email en clair dans Sentry = incident CNIL |

### 3.2 Legal / Contractuel / Gouvernance

| Sév. | Gap | Détail |
|---|---|---|
| 🔴 | **CGU/CGV absentes** | Impossible de signer légalement un premier client sans contrat encadrant la relation SaaS : propriété des données, SLA, responsabilité |
| 🔴 | **DPA RGPD (accord sous-traitant) absent** | Art. 28 RGPD impose un DPA signé + registre des sous-traitants (Stripe, Firebase, Sentry, Axiom, Gemini) |
| 🔴 | **Clinic + données de santé avant agrément HDS** | Traiter des données médicales sans HDS ANSSI est une infraction. Verticale Clinic ne peut pas être commercialisée en l'état — prérequis légal, pas backlog item |
| 🟠 | Portabilité données à résiliation absente | RGPD art. 20 : le client a droit à la portabilité. À résiliation, procédure d'export final + purge à 30j à documenter |
| 🟡 | **Aucune assurance RC Pro / cyber-assurance mentionnée** | En cas d'incident (perte données client, attaque) exposition sans couverture. Devis 2-5k€/an typique SaaS B2B |
| 🟡 | **Transferts hors UE non cartographiés** | Si le LLM derrière Oracle (Gemini) est hébergé aux US, les données passées aux prompts tombent sous les clauses de transfert RGPD. Particulièrement critique pour Clinic |
| 🟠 | Signature tablette OR Garage sans prestataire eIDAS | La signature manuscrite sur tablette sans horodatage certifié (DocuSign/Universign/Yousign) n'a pas de valeur probante en cas de litige |

### 3.3 Support Tenant — Ce qui existe et ce qui manque

> ⚠️ **Correction par rapport à l'analyse brute** : la plomberie backend **existe** — `SupportEscalationHandler`, `SupportTicketAnalysisHandler`, events `support.ticket_submitted` / `support.ticket_escalated` sont câblés dans l'orchestration. Ce qui est absent, c'est **l'UI tenant-facing**.

| Sév. | Gap | Détail |
|---|---|---|
| 🟢 | **Composant SOS Caisse & Ticketing livrés** | `SosCaisseModal.tsx` sur la caisse POS déclenchant `support.ticket_submitted` + file d'attente live et analyse Gemini dans `SupportAIPanel.tsx` (MCC). |
| 🟡 | Pas de mesure de satisfaction côté MCC (NPS/CSAT) | Le CRM restaurants gère les avis des *clients des restaurants* ; rien pour mesurer la satisfaction des *restaurants eux-mêmes* envers le SaaS |
| 🟡 | Pas de rôle customer success défini | Qui fait le suivi J+7/J+30 après onboarding terrain ? Aucune mention de ressource humaine dédiée jusqu'à 10 clients |
| 🟡 | Centre d'aide en libre-service absent | Au-delà du "guide démarrage rapide", pas de base de connaissances indexée ni de chatbot de support |

### 3.4 QA / Testing — Solidité apparente vs réelle

| Sév. | Gap | Détail |
|---|---|---|
| 🟠 | **Zéro test E2E UI** sur les parcours critiques | ~97 suites de tests, tous unitaires ou intégration. Aucun Playwright/Cypress jouant l'encaissement complet, la clôture Z, la récupération NF525 |
| 🟠 | Zéro test de charge / performance | Combien de commandes/seconde le POS encaisse lors d'un samedi soir à 80 couverts ? Aucun benchmark, aucun seuil défini |
| 🟠 | **4e parcours E2E manquant : Mode Offline → Reconnexion → Sync NF525** | Le cas le plus susceptible de révéler des bugs de cohérence : encaisser offline sur 2 tablettes simultanément → reconnexion → validation MasterFiscalSeal. À ajouter aux 3 parcours actuels |
| 🟡 | WCAG 2.1 AA intention ≠ chantier | Les principes d'accessibilité sont énoncés en section UX mais aucune tâche d'audit (Axe DevTools, Lighthouse) dans le backlog |
| 🟡 | Pas d'environnement UAT | Zéro procédure de test avec de vrais restaurateurs avant une release majeure |

### 3.5 DevOps / SRE / Résilience

| Sév. | Gap | Détail |
|---|---|---|
| 🟠 | CI/CD sans rollback automatique | Un déploiement cassé exige une intervention manuelle — pas de canary release ni de rollback automatique sur health-check échoué |
| 🟡 | Feature flags : infrastructure partielle | `FeatureFlagSyncHandler` existe — il push des flags MCC vers des listes de tenants via `mcc.feature_flag_toggled`. Ce qui manque : UI MCC pour créer/activer ces flags, et rollout progressif par pourcentage (pas juste liste statique) |
| 🟡 | Mono-fournisseur Firestore + Vercel | Pas de stratégie de bascule ni d'analyse de risque de dépendance unique. Si Vercel down = app down |
| 🟠 | Pas de runbook d'astreinte formalisé | Qui est réveillé si le POS d'un client tombe un samedi à 21h ? Aucun on-call, aucun escalation path documenté |
| 🟡 | API REST (S5) sans stratégie de versioning | Les breaking changes futurs ne sont pas anticipés — `v1` doit être stable dès le premier connecteur externe |
| 🟡 | Auto-scaling sidecar LightRAG (port 9621) absent | Encapsulation Docker avec fallback gracieux si timeout >2s à implémenter |

### 3.6 i18n & Internationalisation

> ⚠️ **Précision** : l'inactivité i18n est une **décision documentée** (CLAUDE.md : "app monolingue FR en dur, ne pas câbler i18n sans décision explicite") — ce n'est pas un angle mort, c'est un choix conscient de focalisation France.

| Sév. | Gap | Détail |
|---|---|---|
| 🔵 | Back-office 100% FR | Pas de blocage court terme (marché France) mais Garage/Salon/Retail s'exportent facilement en Belgique/Suisse sans i18n |
| 🔵 | Fiscalité FR uniquement | TVA FR (5.5/10/20%) câblée en dur — Belgique (6/12/21%), Suisse nécessiteraient une couche d'abstraction dans `vatResolver` |
| 🔵 | Multi-devise touristes non scopé | `CurrencyConfigPanel` existe en Zone 13 mais le moteur fiscal multi-devise (TVA EUR vs CHF) n'est pas scopé |

### 3.7 Continuité d'Activité & Dépendances Critiques

| Sév. | Gap | Détail |
|---|---|---|
| 🟡 | Aucun plan de continuité si Firestore / GCP tombe | Pas de DR site, pas de mode dégradé documenté |
| 🔴 | **Rétention NF525 (6 ans) vs backup (90j) — écart 24×** | Cf. §3.1 bloquant absolu. Nécessite archive WORM dédiée distincte des backups opérationnels |
| 🟡 | Paiement carte 100% Stripe sans plan B | SumUp/Ingenico cités en "futures intégrations", jamais en solution de repli. Si Stripe a un incident le 31/12, le réveillon est compromis |
| 🟡 | Mode dégradé Oracle/LightRAG non spécifié | Si le sidecar LightRAG (port 9621) est down, le comportement de l'UI Oracle n'est pas défini — erreur silencieuse ? mode local ? message explicite ? |

### 3.8 Produit — Cas limites non couverts

| Sév. | Gap | Détail |
|---|---|---|
| 🟠 | **Pas de gestion des chargebacks / litiges carte** | Un client qui conteste sa CB génère un chargeback Stripe — aucun workflow pour le contester, logger la preuve, ou alerter le restaurateur |
| 🟡 | Multi-devise touristes | Cf. §3.6 |
| 🟡 | Turnover staff élevé non adressé | Le secteur restauration a 70%+ de turnover annuel. Aucun parcours "réonboarding rapide" (enregistrement PIN, formation express) pour les nouveaux entrants fréquents |
| 🚫 | **`FacialRecognitionClockIn` sans cadre CNIL** | La biométrie au travail en France est extrêmement encadrée (CNIL délib 2019-001, RGPD Art. 9) : consentement exprès de *chaque* salarié, base légale restrictive, déclaration CNIL, AIPD obligatoire. À marquer **🚫 bloquant légal** — retirer ou conditionner à module optionnel |
| 🟡 | Oracle en mode hors-ligne non défini | Fallback si Gemini API ou LightRAG down : erreur silencieuse ? mode local ? message explicite ? |
| 🟠 | **Cold-start ML pour nouveaux tenants** | Prévision ventes / staffing / no-show suppose historique. Nouveaux clients sans historique → besoin modèle heuristique 30 jours + bascule ML au seuil `sales_history > 500 tickets` |

### 3.9 Documentation & Scaling

| Sév. | Gap | Détail |
|---|---|---|
| 🟡 | **Pas d'ADR (Architecture Decision Records)** | Les grandes décisions (pourquoi Firestore vs PG, pourquoi Jotai vs Zustand, pourquoi microunits vs cents) doivent être tracées — implémentées désormais dans [ARCHITECTURE_METAPLATFORM.md §10](plans/ARCHITECTURE_METAPLATFORM.md#10-adr--décisions-darchitecture-tracées) |
| 🟡 | **Pas de doc onboarding développeur** | CLAUDE.md + ARCHITECTURE_METAPLATFORM.md existent mais pas de "README: do this to run the project from scratch in 10 min" |
| 🔵 | Aucun plan de recrutement détaillé | Toute la roadmap T+0 à T+36 suppose l'opérateur MCC solo. Plan progressif documenté dans [ROADMAP_STRATEGY.md §7](plans/ROADMAP_STRATEGY.md) à partir de 10 clients |

### 3.10 FinOps / Économie unitaire

| Sév. | Gap | Détail |
|---|---|---|
| 🟠 | **Pas de suivi du coût d'infrastructure par tenant** | Impossible de savoir si un compte à 79€/mois coûte 5€ ou 40€ d'infra (Firestore reads, Sentry events, Axiom logs, Gemini tokens Oracle). Risque de marge négative silencieuse |
| 🟡 | Impayés SaaS : handler partiel | `GracePeriodHandler` existe et met le tenant en read-only à J+7 après `tenant.subscription_expired`. Ce qui manque : workflow de réactivation post-paiement, communication vers le Propriétaire pendant la période de grâce |
| 🟡 | Pas de freemium / trial géré au niveau infra | L'offre trial/freemium éventuelle n'a pas de mécanisme de quota ou de limitation automatique à l'expiration |

---

## 🚀 4. Les 7 Actions à Mener Avant le 1er Client (Planning Réaliste : 3-4 Semaines)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CALENDRIER PRÉ-LANCEMENT COMMERCIAL                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Semaine 1 : Juridique (CGU/DPA — démarrage) + Backup WORM NF525 + RGPD Art.9│
│ Semaine 2 : Finalisation Bus (R1-R13 + Idempotence) + Sentry + SOS Caisse   │
│ Semaine 3 : Pipeline CI/CD + 3 Parcours E2E Playwright (+ 4e offline sync)  │
│ Semaine 4 : Kit Matériel J-0 + Runbook Astreinte + Go Live Staging          │
│ Semaines 5-6 : Finalisation juridique (délai avocat)                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

| # | Action | Domaine | Responsable | Durée Réelle | Critère de Validation Binaire |
|---|--------|---------|-------------|--------------|-------------------------------|
| 1 | **Signature DPA RGPD & CGU/CGV** | Légal | Avocat / PO | 4-6 sem | Documents validés, signables électroniquement dans l'onboarding tenant. |
| 2 | **Vault WORM Firestore 6 ans** | Fiscal | Dev Lead | 3 jours | Test de tentative de suppression d'archive rejeté par la règle Firestore (test automatisé dans CI). |
| 3 | **Émetteurs Bus R2, R10, R11 & Idempotence** | Core | Dev Lead | 3 jours | `reservation.matched`, `deposit_paid`, `table_closed` reçus + dédupliqués via `eventId`. Suite `test:bus` verte à 24/24. |
| 4 | **4 Parcours E2E Playwright** | QA | QA / Dev | 4 jours | Encaissement, Clôture Z, Réservation+Allergènes, **Offline→Reconnexion→SyncNF525** exécutés en vert dans le pipeline. |
| 5 | **CI/CD GitHub Actions + Rollback** | DevOps | DevOps | 4 jours | Pull Request bloquée automatiquement si TSC!=0 ou tests en échec. Auto-rollback sur health-check failed après déploiement. |
| 6 | **Configuration Sentry + SOS Caisse** | Ops | Ops | 2 jours | Alerte Slack/PagerDuty reçue instantanément sur erreur critique fiscale ou appel SOS. |
| 7 | **Kit Matériel J-0 + Runbook On-Call** | Ops | Ops | 2 jours | Routeur 4G testé sur 2 sites pilotes + `docs/guides/ON_CALL_RUNBOOK.md` validé + 12-point checklist matériel signée. |

> Les items 8-N (DPoS, WAF, pentest, NPS, WCAG audit, ADR complète, doc onboarding dev) passent en H2/H3 sans bloquer le premier client.

---

## 📋 5. Registre de Suivi Trimestriel

Ce registre doit être révisé chaque trimestre pour :
1. **Vérifier** que les bloquants P0 résolus le restent (pas de régression).
2. **Ajouter** les nouveaux angles morts découverts en production.
3. **Réviser** les projections FinOps avec les données réelles (churn/CAC/LTV).
4. **Mettre à jour** les métriques codebase (fichiers, handlers, routes, tests).

| Trimestre | Bloquants P0 résolus | Nouveaux angles morts | Métriques codebase |
|---|---|---|---|
| 2026-Q3 | À suivre | Cadrage initial | 3 433 fichiers · 163 handlers · 235 routes · 63 pages · 97 tests |
| 2026-Q4 | — | — | — |
| 2027-Q1 | — | — | — |

---

## Références Croisées

- **Backlog produit tactique** : [BACKLOG.md](../BACKLOG.md) — statut ✅/🔧/⬜ par feature + Horizon + Code ref
- **Architecture invariants** : [ARCHITECTURE_METAPLATFORM.md](plans/ARCHITECTURE_METAPLATFORM.md) — 8 piliers, RBAC, NF525 multi-caisses, 6 invariants concurrence, ADR
- **Horizons stratégiques** : [ROADMAP_STRATEGY.md](plans/ROADMAP_STRATEGY.md) — H1→H5, FinOps, Plan RH Bus Factor
- **Verticales sectorielles** : [VERTICALS_SPECIFICATION.md](plans/VERTICALS_SPECIFICATION.md) — 8 verticales, connecteurs, cas limites
- **UI composants** : [UI_MATRIX_16_ZONES.md](plans/UI_MATRIX_16_ZONES.md) — 16 zones × ~806 composants, priorités refonte
- **Charte ingénierie** : [`.nexus/agents/.agents/AGENTS.md`](../.nexus/agents/.agents/AGENTS.md) — 6 invariants + politique fan-out/god files
