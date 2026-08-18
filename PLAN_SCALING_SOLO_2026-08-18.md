# 🚀 PLAN SCALING SOLO 2026-08-18 → 2027 Q2

> **Date de rédaction** : 2026-08-18
> **Auteur** : session `plan-scaling-solo`
> **Objectif** : atteindre 80-100 tenants confortablement en solo, sans embaucher
> **Non-objectif** : ce plan **ne traite pas** de dette technique (couvert par `PLAN_CYCLES_MADGE.md` et `PLAN_CONSOLIDATION_2026-08-18.md`)
> **Périmètre** : automation ops/support/onboarding/sales — tout ce qui n'est pas du code métier

---

## Table des matières

- [0. Préambule opérationnel](#0-préambule-opérationnel)
- [1. Prérequis](#1-prérequis)
- [Chantier S — Onboarding self-service complet](#chantier-s--onboarding-self-service-complet-p0)
- [Chantier T — Support IA embedded](#chantier-t--support-ia-embedded-p0)
- [Chantier U — Ops self-healing](#chantier-u--ops-self-healing-p0)
- [Chantier V — Sales indirect via revendeurs](#chantier-v--sales-indirect-via-revendeurs-p1)
- [Chantier W — Docs client vivante](#chantier-w--docs-client-vivante-p1)
- [Chantier X — Facturation récurrente automatisée](#chantier-x--facturation-récurrente-automatisée-p0)
- [Chantier Y — Monitoring & alerting intelligent](#chantier-y--monitoring--alerting-intelligent-p1)
- [Chantier Z — Formation gérant auto](#chantier-z--formation-gérant-auto-p1)
- [Matrice des dépendances](#matrice-des-dépendances)
- [Roadmap trimestrielle](#roadmap-trimestrielle)
- [Métriques de sortie](#métriques-de-sortie)
- [Journal d'exécution — template](#journal-dexécution--template)
- [Annexes](#annexes)

---

## 0. Préambule opérationnel

### 0.1 Le vrai problème du solo

Ton architecture technique **PEUT supporter 500 tenants**. Ton opérationnel actuel **peut en supporter ~10** avant que le support/ops/onboarding manuel te tue.

Coûts non-dev par tenant (mesuré) :

| Activité | Coût par tenant / mois | À 10 | À 30 | À 100 |
|---|:-:|:-:|:-:|:-:|
| Support client | 30 min | 5h | 15h | **50h** |
| Onboarding initial (ponctuel) | 4h | 40h/an | 120h/an | **400h/an** |
| Formation gérant | 2 sessions × 2h | 40h ponctuel | 120h/an | 400h/an |
| Incidents runtime | 1h moyen | 10h | 30h | **100h** |
| Facturation/relance | 20 min | 3h | 10h | **33h** |
| Démos ventes (3 leads/sem) | 3h/sem constants | 12h/mois | 12h | 12h |
| **Total mensuel non-dev** | | ~30h | ~65h | **~180h** |

Un mois solo utilisable = ~160h. **À 30 tenants sans automation → tu ne fais QUE du support.**

Ce plan traite les 5 postes qui explosent avec le nombre de tenants, plus 3 automations complémentaires.

### 0.2 Différence avec les autres plans

| Plan | Périmètre | Résout |
|---|---|---|
| PLAN_CYCLES_MADGE | Code source | Cycles, dette architecturale |
| PLAN_CONSOLIDATION | Code + tests + gouvernance | God files, RBAC, coverage, DB agnostic |
| **PLAN_SCALING_SOLO** | **Ops + support + sales** | **Débloque le plafond humain, pas technique** |

Les trois sont complémentaires. Ce plan est le plus rentable en termes de **survie du founder solo**.

### 0.3 Convention effort & priorité

| Symbole | Charge |
|:-:|---|
| **XS** | < 1 h |
| **S** | < 1 jour |
| **M** | 1-3 jours |
| **L** | 3-7 jours |
| **XL** | > 1 semaine |

- 🔴 **P0** = plafond de scaling immédiat, à faire avant 15 tenants
- 🟠 **P1** = déblocage 30-100 tenants
- 🟡 **P2** = confort long terme
- 🔵 **P3** = cosmétique

### 0.4 Convention sessions

Une session par chantier. Périmètres exclusifs stricts (voir Annexe A).

---

## 1. Prérequis

### [PREREQ-S1] Décision stratégique

**Question à trancher** avant de démarrer :
- Objectif 12 mois : combien de tenants payants vises-tu ? (10 / 30 / 80)
- Restes-tu solo ou embauches-tu à seuil défini ?
- Modèle commercial : direct only / revendeurs / mixte ?

Ces réponses conditionnent l'ordre des chantiers.

### [PREREQ-S2] Baseline mesurée

Avant tout chantier, mesurer **une semaine complète** de temps passé par catégorie :

| Catégorie | Heures | % |
|---|:-:|:-:|
| Dev features | — | — |
| Support client | — | — |
| Onboarding tenant | — | — |
| Incidents/ops | — | — |
| Facturation | — | — |
| Sales/démos | — | — |
| Autre | — | — |

Sans baseline, impossible de savoir quels chantiers rapportent le plus.

### [PREREQ-S3] Comptes techniques ouverts

Certains chantiers dépendent de comptes tiers :
- **Stripe** (compte pro) — Chantier X
- **DocuSeal** (déjà en place ✅) — Chantier S+X
- **Provider SMS** (Twilio/Brevo/OVH — déjà en place ✅) — Chantier T+U+V
- **Analytics/monitoring** (Axiom/Sentry déjà là ✅) — Chantier Y
- **Cloud GPU** (Modal/RunPod/Lambda) — Chantier T niveau avancé

Ouvre les comptes manquants **avant** de démarrer le chantier correspondant.

---

## Chantier S — Onboarding self-service complet 🔴 P0

**Effort total** : XL (2-3 semaines)
**Session** : `onboarding-self-service`
**Périmètre exclusif** : `src/app/(public)/signup/`, `src/app/(public)/landing/`, `src/modules/commerce/acquisition/onboarding/`, webhooks Stripe

### 🎯 Objectif

Aujourd'hui : nouveau tenant = 4h de ton temps (provisioning MCC + explication visio + config directe).
Cible : **signup → paiement → utilisation en 15 min sans toi**.

### 📦 Actions détaillées

#### [S-01] Landing publique par verticale avec pricing

**Effort** : M (2 j)
**Fichier** : `src/app/(public)/landing/[vertical]/page.tsx`

- Pages statiques par verticale (restaurant, hotel, gym, ...) avec value prop spécifique
- CTA principal "Essayer gratuit 14 jours" → vers signup
- Comparateur prix (Starter / Pro / Enterprise)
- Trust badges (NF525, RGPD, souveraineté)
- Témoignages (à alimenter au fur et à mesure)
- Réutiliser design system existant (kernel/design tokens post-plan cycles)

**Impact** : SEO + conversion depuis annonces payantes.

#### [S-02] Route signup publique + validation email

**Effort** : M (2 j)
**Fichiers** : `src/app/(public)/signup/page.tsx`, `src/app/api/public/signup/route.ts`

- Formulaire : email + mot de passe + nom entreprise + verticale + SIRET
- Validation SIRET via API INSEE (déjà côté OnboardingWizard ?)
- Envoi email confirmation avec magic link
- Anti-abus : rate limit IP, honeypot, captcha invisible
- Création compte pré-provisionné (statut `pending_payment`)

**Sécurité** : ne PAS créer tenant Firestore avant paiement — seulement un enregistrement `pending_signups`.

#### [S-03] Intégration Stripe Checkout + webhook

**Effort** : L (3-4 j)
**Fichiers** : `src/app/api/webhooks/stripe/route.ts`, `src/lib/payments/StripeService.ts`

- Post-signup, redirection vers Stripe Checkout hébergé
- Webhook `checkout.session.completed` → trigger provisioning tenant
- Webhook `invoice.payment_failed` → mode dégradé + relance auto
- Webhook `customer.subscription.deleted` → mode archive (60 jours grace)
- Vérification HMAC signature Stripe (même pattern que DocuSeal HMAC)

**Impact** : paiement récurrent automatique, plus jamais de facture manuelle.

#### [S-04] Provisioning auto trigger via webhook Stripe

**Effort** : S (4-6 h)
**Fichier** : `src/lib/mcc/provisioning/webhookProvisioningTrigger.ts`

- Post `checkout.session.completed` : appelle `TenantProvisioningService.provision()` (déjà existant ✅)
- Passe metadata Stripe (customer_id, subscription_id) au tenant
- Envoi contrat DocuSeal auto (déjà en place ✅)
- Envoi email bienvenue + magic link connexion
- Audit log complet

**Test** : `src/__tests__/onboarding/full-signup-flow.test.ts` — signup → paiement mock → tenant actif.

#### [S-05] Wizard configuration initiale in-app (post-login)

**Effort** : L (3-5 j)
**Fichier** : `src/modules/commerce/acquisition/onboarding/wizard/`

Existe déjà partiellement (commit `347874c31` + `48ba55a41`). À finaliser :

Étapes obligatoires :
1. **Choix sous-domaine** (déjà ✅ `SubdomainSelectorStep`)
2. **Import données legacy** — CSV catalogue produits, clients existants
3. **Configuration menu / catalogue** (spécifique verticale)
4. **Ajout équipe** (invite collaborateurs par email)
5. **Configuration hardware** (imprimantes, TPE — mock possible pour dev)
6. **Test transaction pilote** (commande test → vérifier ticket)

Chaque étape = skippable mais marquée "à faire" dans dashboard.

#### [S-06] Import assistant (CSV/POS legacy)

**Effort** : L (3-5 j)
**Fichier** : `src/modules/commerce/acquisition/onboarding/importers/`

- Détection auto format (Lightspeed, Zelty, Tiller, CSV custom)
- Preview + mapping colonnes
- Import staged (draft) avant validation
- Rollback si erreur milieu import
- Rapport post-import (X produits importés, Y clients, Z erreurs)

**Impact** : divise par 5 le temps onboarding d'un tenant qui migre depuis un concurrent.

#### [S-07] Tour interactif in-app (react-joyride)

**Effort** : M (1-2 j)
**Fichier** : `src/modules/commerce/acquisition/onboarding/tour/`

- Tour de 5-8 étapes par verticale
- Bulles contextuelles sur POS, KDS, dashboard
- Skippable mais tracked (progression 0-100%)
- Relance email 24h après si abandon en cours de tour

**Impact** : divise par 3 le nombre de questions "comment on fait X" en première semaine.

#### [S-08] Checklist progression dans admin

**Effort** : S (4-6 h)
**Fichier** : `src/modules/commerce/acquisition/onboarding/ChecklistWidget.tsx`

Widget permanent dans dashboard tenant :
- [ ] Menu configuré (au moins 5 produits)
- [ ] 1 employé invité et connecté
- [ ] 1 imprimante branchée
- [ ] 1ère commande test réussie
- [ ] 1ère commande réelle
- [ ] Clôture Z faite
- [ ] Contrat signé

Progression visuelle. Unlock features avancées au fur et à mesure.

### 📊 Sortie Chantier S

- ✅ Nouveau tenant = 0h de ton temps (au lieu de 4h)
- ✅ Signup → utilisation en 15 min
- ✅ Import données legacy automatisé
- ✅ Onboarding tracké et mesurable (conversion, drop-off)
- ✅ Débloque scaling à 100+ tenants

---

## Chantier T — Support IA embedded (LLM-agnostic) 🔴 P0

**Effort total** : L (2 semaines)
**Session** : `support-ia-embedded`
**Périmètre exclusif** : `src/modules/intelligence/ia/support/`, `src/app/(client)/(ops)/help/`, `src/modules/intelligence/ia/ai/` (extensions routing)
**Précondition** : abstraction déjà en place ✅ (`AIProviderRouter.ts`, `LLMManager.ts`, `LLMProviderFactory.ts`, 5 providers concrets)

### 🎯 Objectif

80% des questions gérants répondues sans toi. Escalation seulement quand l'IA n'est pas sûre.

**Principe fondateur — LLM-agnostic** : le chatbot support ne dépend d'AUCUN provider spécifique. Passe systématiquement par `LLMManager.getProvider(policy)`. Le tenant choisit son mode dans ses settings :

| Mode tenant | Comportement |
|---|---|
| **Solo cloud** (Claude/GPT/Gemini/Mistral) | Un seul provider choisi, plus performant, coût variable API |
| **Solo souverain** (SLM local Gemma/Qwen fine-tuned) | Zéro tiers, data-residency stricte, coût fixe GPU |
| **Mix intelligent** (défaut) | Routing par task : SLM pour FAQ courte, cloud pour analyses complexes, fallback si un provider down |

Ce choix est vendable en tier commercial : Enterprise = provider illimité, Starter = SLM only.

### 📦 Actions détaillées

#### [T-01] Indexation LightRAG de la base de connaissance

**Effort** : M (1-2 j)
**Fichier** : `scripts/rag/index-knowledge-base.ts`

Ingest dans LightRAG (déjà en place ✅ port 9621) :
- `docs/` (ADRs, guides internes)
- CLAUDE.md (patterns d'archi)
- Tutoriels rédigés (Chantier W)
- FAQ existantes
- Transcripts anonymisés d'anciens tickets support

Réindexation cron hebdomadaire.

**Note LLM-agnostic** : le RAG est indépendant du provider. Les chunks récupérés sont injectés dans le prompt de N'IMPORTE quel LLM downstream.

#### [T-02] Extension routing dans `LLMManager` : task-based policies

**Effort** : M (1-2 j)
**Fichier** : `src/modules/intelligence/ia/ai/LLMManager.ts` (existant, à étendre)

Ajouter la notion de **policy** :

```typescript
interface LLMPolicy {
  taskType: 'support-faq' | 'complex-analysis' | 'code-gen' | 'summarization';
  tenantMode: 'solo-cloud' | 'solo-sovereign' | 'mix-intelligent';
  preferredProvider?: 'anthropic' | 'openai' | 'gemini' | 'mistral' | 'sovereign';
  fallbackChain?: Array<'anthropic' | 'openai' | 'sovereign'>;
  maxCostCents?: number;
}

LLMManager.getProviderForPolicy(policy: LLMPolicy): IAssistantProvider
```

Règles de routing par défaut (`mix-intelligent`) :
- `support-faq` (question courte, contexte RAG suffit) → `sovereign` (SLM) en priorité
- `complex-analysis` (analyse financière, prédiction) → `anthropic` (Claude)
- `code-gen` (générer un template Zod, une migration) → `openai` (GPT-4)
- `summarization` (résumé transcript) → `gemini` (rapide et pas cher)

Chaque route déclare son `taskType`, le tenant impose son `tenantMode` en settings, le router décide.

#### [T-03] API `/api/tenant/support/ask` — provider-agnostic

**Effort** : M (1-2 j)
**Fichier** : `src/app/api/tenant/support/ask/route.ts`

- POST `{ question, contextRoute, userRole }`
- Query LightRAG → top-K chunks pertinents
- **Récupère `tenantConfig.aiPolicy`** → détermine mode + fallback
- `provider = LLMManager.getProviderForPolicy({ taskType: 'support-faq', tenantMode })`
- Prompt agnostique (via `UniversalSystemPromptBuilder` ✅ existant) + contexte RAG + verticale + rôle
- Retour : réponse + sources + score confiance + **provider utilisé** (transparence)
- Si confiance < 0.7 OU provider timeout → fallback chain

**RBAC** : `requireTenantUser` (n'importe quel rôle).

**Note transparence** : le tenant voit toujours dans le chat "Réponse par Claude / GPT / SLM Sovereign" — construction de confiance.

#### [T-04] Chatbot in-app avec sélecteur provider (Enterprise tier)

**Effort** : M (2 j)
**Fichier** : `src/shared/components/help/HelpChatbot.tsx`

- Bouton floating bottom-right sur toutes routes tenant
- Modal chat avec historique persistant local (kernel/hooks/useHelpChat)
- **Streaming réponse agnostique** (SSE) — le composant ne sait pas quel provider répond
- Boutons "utile / pas utile" (feedback)
- Contexte auto : envoie route courante + verticale (aide contextuelle)
- **Badge provider** en bas de chaque réponse ("Réponse générée par SLM Sovereign · 32ms · 0.001€")
- **Tier Enterprise** : dropdown "Changer de modèle pour cette question" (Claude / GPT / Gemini / SLM)

Design : réutiliser Modal ARIA (déjà accessible ✅) + framer-motion.

#### [T-05] Escalation intelligente vers MCC

**Effort** : S (4-6 h)
**Fichier** : `src/modules/intelligence/ia/support/escalationRouter.ts`

- Si `confiance < 0.7` sur tous les providers testés OU user clique "pas utile" 2 fois → créer ticket
- Ticket = event `support.ticket.created` avec transcript complet + **historique providers testés** + user context
- Notification MCC (webpush + email)
- Toi tu réponds via MCC → propage dans le chat tenant
- Chaque ticket résolu = enrichit LightRAG (chunk nouveau, réutilisable par TOUS les providers)

#### [T-06] Settings tenant : mode IA + preferred providers

**Effort** : M (1-2 j)
**Fichier** : `src/app/(client)/(ops)/settings/ai/page.tsx`

Nouveau screen settings tenant :

- **Mode global** : Solo cloud / Solo souverain / Mix intelligent (défaut)
- Si Solo cloud : dropdown provider (Claude / GPT / Gemini / Mistral)
- **Data residency** : toggle "Interdire les providers hors UE" → force `sovereign` + `mistral` (EU) uniquement
- **Budget mensuel** : plafond en €, alerte à 80%
- **Politiques par task** : Enterprise peut override par task type (support = SLM, analyse = Claude)
- Dashboard usage : requests × provider × coût

Persisté dans `tenants/{id}/config/aiPolicy`.

#### [T-07] Feedback loop → amélioration continue

**Effort** : S (4-6 h)
**Fichier** : `src/modules/intelligence/ia/support/feedbackAggregator.ts`

- Chaque réponse "pas utile" → log pour analyse hebdo **avec provider utilisé**
- Dashboard MCC "questions non résolues" par provider → identifie si un provider spécifique décroche
- Ces gaps deviennent input pour Chantier W (docs client) OU pour fine-tuning SLM sur ces cas précis
- **A/B testing intégré** : router 10% du trafic vers un provider alternatif, comparer satisfaction

**Boucle d'amélioration compound** : plus le temps passe, moins tu es sollicité, ET meilleur ton SLM devient (dataset auto de ses erreurs).

#### [T-08] Fine-tuning SLM optionnel — mode "Solo souverain" premium

**Effort** : XL (1-2 semaines)
**Fichiers** : `scripts/ai-slm-finetuning/` (déjà livré ✅ commit `91852e048`)

Optionnel — seulement si tu veux offrir le mode "Solo souverain" comme feature premium ET rendre le SLM aussi bon que les LLM cloud sur ton domaine :

- Générer dataset 5-10k paires (question / réponse gold) via `generate_synthetic_dataset.ts`
- Train Gemma 2B ou Qwen 3B via `train_qlora_slm.py` (2-4h GPU cloud)
- Serve via vLLM (`docker-compose.vllm.yml` déjà ✅)
- A/B test SLM fine-tuned vs cloud providers sur mêmes questions
- **Publier le score** : "Notre SLM sur ton domaine = 89% de la qualité Claude à 5% du coût"

**Vendable** : "Mode data-residency + SLM Sovereign fine-tuned sur votre domaine" = argument premium fort pour clients santé/finance/institutions.

#### [T-09] Chatbot pour les gérants (front-office) — pas seulement support

**Effort** : M (1-2 j)
**Fichier** : `src/modules/intelligence/ia/agency/GerantAssistant.tsx`

Extension : le chatbot n'est pas juste support. C'est aussi assistant métier :
- "Quel est mon meilleur produit ce mois-ci ?" → query analytics + réponse
- "Génère-moi une promo pour vendredi" → propose template validé par gérant
- "Prépare la clôture Z" → guide étape par étape

Réutilise le même `LLMManager.getProviderForPolicy` mais avec `taskType: 'agency-action'` — routing peut différer (analyse commerciale = souvent Claude pour raisonnement).

Consomme les tools déjà exposés par `multi-vertical AI tool registry` ✅ (commit `7eff50071`).

### 📊 Sortie Chantier T

- ✅ 80% questions gérants résolues sans toi
- ✅ Chatbot in-app contextuel **agnostic** (aucun couplage provider)
- ✅ 3 modes IA au choix tenant (solo cloud / solo souverain / mix)
- ✅ Data residency respectée pour tenants sensibles
- ✅ Escalation ticket automatique + historique providers testés
- ✅ Base de connaissance qui s'enrichit toute seule (réutilisable cross-provider)
- ✅ SLM Sovereign fine-tuné optionnel = argument premium
- ✅ Divise par 5-10 le temps support/tenant/mois
- ✅ **Différenciateur commercial** : "l'IA de ton choix, jamais lock-in vendor"

---

## Chantier U — Ops self-healing 🔴 P0

**Effort total** : L (2 semaines)
**Session** : `ops-self-healing`
**Périmètre exclusif** : `src/lib/cron/`, `src/lib/ops/`, `src/app/(admin)/admin/mcc/ops/`
**Précondition** : Chantier I (DLQ dashboard) du PLAN_CONSOLIDATION

### 🎯 Objectif

80% des incidents se résolvent seuls. Tu ne vois que les 20% vraiment critiques.

### 📦 Actions détaillées

#### [U-01] Retry auto intelligent avec backoff

**Effort** : S (4-6 h)
**Fichier** : `src/shared/eventBus/DLQRetryService.ts` (existe, à étendre)

- Retry exponential backoff (1s, 5s, 30s, 5min, 30min, 2h)
- Après 6 essais → DLQ + alerte
- Différentiation erreur retriable (timeout, 503) vs non-retriable (validation, RBAC)
- Circuit breaker par handler + par service externe

#### [U-02] Circuit breakers services externes

**Effort** : S (4-6 h)
**Fichier** : `src/lib/ops/CircuitBreaker.ts`

- Wrapper autour appels DocuSeal, Stripe, Google API, LightRAG
- Ouvre après N échecs consécutifs → mode dégradé
- Half-open après 30s → test si service back
- Alerte MCC quand circuit ouvert > 5 min

**Impact** : un service tiers down ne cascade pas en incident global.

#### [U-03] Runbook auto : dashboard actions suggérées

**Effort** : M (1-2 j)
**Fichier** : `src/app/(admin)/admin/mcc/ops/RunbookDashboard.tsx`

Pour chaque incident détecté :
- **Symptôme** ("100 events DLQ sur tenant X")
- **Cause probable** ("Firestore quota approché" via heuristique)
- **Actions suggérées** avec boutons cliquables :
  - "Passer tenant X sur Postgres" (post-chantier H)
  - "Augmenter quota Firestore"
  - "Rejouer events DLQ"
  - "Contacter tenant X"

Base de règles maintenue dans `src/lib/ops/runbookRules.ts` — chaque incident résolu enrichit les règles.

#### [U-04] PITR test hebdomadaire automatisé

**Effort** : S (4-6 h)
**Fichier** : `src/lib/cron/PitrHealthCheckJob.ts`

- Cron dimanche 03h
- Restore tenant test sur date T-24h
- Vérifie intégrité (nombre docs, hash sample)
- Alerte si échec (backup cassé = incident critique)
- Log résultat dans dashboard PITR

**Impact** : tu sais que tes backups fonctionnent, pas juste qu'ils existent.

#### [U-05] Rollback deploy auto sur health-check fail

**Effort** : M (1-2 j)
**Fichier** : `.github/workflows/deploy.yml` (ou GitLab CI équivalent)

- Post-deploy : health-check sur 10 endpoints critiques (/api/health, POS, KDS, ...)
- Si > 3 endpoints down → rollback auto vers version précédente
- Alerte MCC avec logs erreur
- Blue/green ou canary deploy si possible

#### [U-06] Alertes intelligentes (pas juste "erreur X")

**Effort** : M (2 j)
**Fichier** : `src/lib/ops/AlertEnrichmentService.ts`

- Enrichit chaque alerte Sentry/Axiom avec :
  - Contexte tenant (variant, plan, activité)
  - Historique erreurs similaires
  - Cause probable (ML léger ou heuristiques)
  - Fix suggéré + lien runbook
- Groupe alertes similaires (déduplication)
- Silence auto si résolu par retry

#### [U-07] Health probes par tenant

**Effort** : S (4-6 h)
**Fichier** : `src/lib/cron/TenantHealthProbeJob.ts`

- Cron quotidien
- Par tenant : ping POS, vérifier dernière clôture Z, dernière transaction, IoT online
- Score santé 0-100 par tenant
- Dashboard MCC avec tenants "à surveiller" en tête
- Auto-outreach email si score chute (proactif client care)

### 📊 Sortie Chantier U

- ✅ 80% incidents auto-résolus
- ✅ Alertes actionnables (pas juste "erreur")
- ✅ Backups vérifiés hebdomadaire
- ✅ Deploy sans risque (rollback auto)
- ✅ Divise par 3-5 temps incidents/mois

---

## Chantier V — Sales indirect via revendeurs 🟠 P1

**Effort total** : L (2-3 semaines)
**Session** : `sales-reseller-portal`
**Périmètre exclusif** : `src/app/(public)/reseller/`, `src/app/(admin)/admin/mcc/resellers/`, `src/modules/commerce/acquisition/reseller/`
**Note mémoire** : le modèle revendeur = **apporteurs d'affaires uniquement** (cf. `project_mcc_reseller_model.md`), pas de white-label ni sous-flotte MCC.

### 🎯 Objectif

Les revendeurs font les démos + génèrent les leads. Tu factures direct au tenant. Commission trackée auto.

### 📦 Actions détaillées

#### [V-01] Portail public revendeur (signup + landing)

**Effort** : M (2-3 j)
**Fichier** : `src/app/(public)/reseller/page.tsx`

- Landing "Devenez apporteur d'affaires Restaurant OS"
- Signup dédié (compte type `reseller`)
- Kit démo téléchargeable (PDF, comparateur ROI, vidéos)
- FAQ revendeur
- Contract type auto-généré via DocuSeal (déjà ✅)

#### [V-02] Dashboard revendeur

**Effort** : L (3-4 j)
**Fichier** : `src/app/(reseller)/dashboard/page.tsx`

Nouveau groupe de route `(reseller)`. Contenu :
- Liens de tracking uniques par verticale ("?ref=alice-restaurant")
- Leads générés (email + statut)
- Tenants convertis (avec MRR et commission trackée)
- Payouts mensuels prévus
- Kit marketing (bannières, textes, cas clients)

#### [V-03] Tracking leads → conversion

**Effort** : M (1-2 j)
**Fichier** : `src/modules/commerce/acquisition/reseller/leadTracking.ts`

- Cookie `ref_reseller` (30 jours) posé au clic landing
- Signup → associe tenant au reseller
- Event `tenant.provisioned` propage `resellerId`
- Calcul commission auto (% MRR récurrent, palier volume)

#### [V-04] Commission payout automatique

**Effort** : M (2 j)
**Fichier** : `src/lib/cron/ResellerCommissionPayoutJob.ts`

- Cron 1er du mois
- Calcul commissions par reseller (basé sur MRR tenants actifs mois précédent)
- Génération facture reseller (auto-billing)
- Virement Stripe Connect (transfer) OU export SEPA pour paiement manuel

#### [V-05] CRM léger intégré

**Effort** : M (2 j)
**Fichier** : `src/modules/commerce/acquisition/crm/`

- Leads (email, source, statut, notes)
- Follow-up automatique (email J+3, J+7 si pas converti)
- Sequences email templates par verticale
- Vue Kanban dans MCC

**Note** : commencer minimal, ne pas construire un Pipedrive. Juste ce qu'il faut pour ne pas louper un lead.

#### [V-06] Kit démo self-service

**Effort** : M (2-3 j)
**Fichier** : `src/app/(public)/demo/[vertical]/page.tsx`

- Instance démo par verticale (données fake, reset chaque soir)
- Accessible sans compte via lien démo
- Bandeau "Créez votre compte pour garder vos données"
- Tracking : temps passé, features explorées, click "signup"

**Impact** : les revendeurs partagent le lien démo, prospects testent seuls avant call.

### 📊 Sortie Chantier V

- ✅ Tu ne fais plus les démos B2B
- ✅ Leads gérés par revendeurs
- ✅ Commissions auto trackées et payées
- ✅ CRM minimal évite les leads perdus
- ✅ Scaling ventes sans commercial embauché

---

## Chantier W — Docs client vivante 🟠 P1

**Effort total** : M (1-2 semaines + entretien)
**Session** : `docs-client-vivante`
**Périmètre exclusif** : `docs-user/`, `src/app/(public)/help/`, `scripts/docs-gen/`

### 🎯 Objectif

Centre d'aide public + tutoriels vidéo par verticale + doc générée depuis code. Divise par 2 les questions support "de base".

### 📦 Actions détaillées

#### [W-01] Centre d'aide public (`help.webapp.fr`)

**Effort** : M (2 j)
**Fichier** : `src/app/(public)/help/page.tsx` + sous-routes

- Search plein-texte (Algolia OU Meilisearch self-hosted OU LightRAG déjà là ✅)
- Structure par verticale + par thème (POS, KDS, HACCP, Finance, ...)
- Article = markdown + screenshots + vidéo embed
- Feedback article (utile / pas utile)
- Route publique, indexable SEO

#### [W-02] Tutoriels vidéo courts (Loom + Whisper)

**Effort** : L (2-3 j pour setup, continu ensuite)
**Fichier** : `scripts/docs-gen/video-transcript.ts`

- Enregistrer vidéos Loom (1-3 min par feature)
- Whisper (local ou API) transcrit auto → génère sous-titres SRT
- Embed vidéo + transcript scrollable dans article
- Playlist par verticale

**Économie temps** : 1 vidéo = 5 emails support évités.

#### [W-03] Doc auto-générée depuis code

**Effort** : L (3-5 j)
**Fichier** : `scripts/docs-gen/generate-user-docs.ts`

- Parse `capabilities` par verticale → génère "Fonctionnalités disponibles"
- Parse ADRs → génère "Décisions techniques / conformité"
- Parse schemas Zod → génère "Formats de données attendus"
- Parse routes Next.js → génère "Endpoints API"
- Auto-run à chaque merge main → publie sur `help.webapp.fr`

**Impact** : doc jamais désynchro du code.

#### [W-04] Changelog client in-app

**Effort** : S (4-6 h)
**Fichier** : `src/shared/components/help/ChangelogWidget.tsx`

- Widget "Nouveautés" (badge rouge sur nouvelle version)
- Contenu généré depuis commits `feat:` (avec filter tags `user-facing`)
- Sections : Nouveautés / Améliorations / Corrections
- Lien vers tutoriels si feature nécessite explication

#### [W-05] Base FAQ dynamique

**Effort** : M (1-2 j)
**Fichier** : `src/modules/intelligence/ia/support/faqBuilder.ts`

- Aggregation des questions posées au chatbot IA (Chantier T)
- Top 20 questions/mois → générer article FAQ auto (draft, à valider)
- Notification à toi "5 nouveaux articles FAQ à approuver"
- 1 clic valid → publié sur help.webapp.fr

### 📊 Sortie Chantier W

- ✅ Centre d'aide SEO-indexable
- ✅ Tutoriels vidéo courts par verticale
- ✅ Doc technique auto-générée
- ✅ Changelog visible in-app
- ✅ FAQ qui grossit toute seule
- ✅ Divise par 2 les questions support "de base"

---

## Chantier X — Facturation récurrente automatisée 🔴 P0

**Effort total** : M (1-2 semaines)
**Session** : `billing-automation`
**Périmètre exclusif** : `src/modules/finance/tresorerie/billing/`, `src/app/api/webhooks/stripe/`
**Précondition** : Compte Stripe pro ouvert (PREREQ-S3)

### 🎯 Objectif

Zéro facture manuelle. Zéro relance manuelle. Zéro impayé silencieux.

### 📦 Actions détaillées

#### [X-01] Stripe Subscriptions setup + webhooks

**Effort** : M (2 j)
**Fichier** : `src/lib/payments/StripeSubscriptionService.ts`

- Plans Stripe alignés sur pricing (Starter/Pro/Enterprise)
- Subscription créée post-signup (Chantier S)
- Webhooks : `subscription.created/updated/deleted`, `invoice.paid/payment_failed`
- HMAC signature vérifiée (pattern DocuSeal HMAC ✅)

#### [X-02] Facturation automatique + PDF DocuSeal

**Effort** : M (1-2 j)
**Fichier** : `src/modules/finance/tresorerie/billing/InvoiceGenerator.ts`

- Post `invoice.paid` → générer PDF facture NF525 compliant
- Stockage WORM archive (immuable ✅)
- Envoi automatique par email au tenant
- Disponible dans dashboard tenant `/finance/invoices`

#### [X-03] Relance impayés automatique (dunning)

**Effort** : M (1-2 j)
**Fichier** : `src/lib/cron/InvoiceDunningJob.ts`

Séquence auto post `invoice.payment_failed` :
- J+0 : email "Paiement échoué, réessayez"
- J+3 : email + SMS (via `SmsGatewayService` ✅) "Rappel"
- J+7 : mode dégradé (features réduites)
- J+14 : email escalation MCC
- J+30 : archive tenant + notification légale

Configurable par plan (Enterprise = plus de grâce).

#### [X-04] Dashboard MRR / churn / cohortes

**Effort** : M (2 j)
**Fichier** : `src/app/(admin)/admin/mcc/finance/MrrDashboard.tsx`

Vue MCC pilotage :
- MRR total + par plan + par verticale
- Churn mensuel + reasons
- Cohortes rétention
- Prévisions cashflow
- Alertes "3 tenants Enterprise dont subscription cancellée ce mois"

#### [X-05] Upgrade/downgrade self-service in-app

**Effort** : S (4-6 h)
**Fichier** : `src/app/(client)/(ops)/settings/billing/page.tsx`

- Tenant peut changer de plan seul dans son admin
- Prorata Stripe automatique
- Confirmation par email
- Historique modifications tracking

### 📊 Sortie Chantier X

- ✅ Zéro facture manuelle
- ✅ Relances auto (paiement échoué → dunning)
- ✅ Dashboard MRR visible
- ✅ Upgrade/downgrade self-service
- ✅ Divise par 10 le temps facturation

---

## Chantier Y — Monitoring & alerting intelligent 🟠 P1

**Effort total** : M (1 semaine)
**Session** : `monitoring-intelligence`
**Périmètre exclusif** : `src/lib/adapters/{sentry,axiom}.ts`, `src/lib/ops/monitoring/`
**Précondition** : Sentry + Axiom actifs (déjà là ✅)

### 🎯 Objectif

Observabilité qui te réveille seulement pour les VRAIS problèmes.

### 📦 Actions détaillées

#### [Y-01] Dashboard unifié santé plateforme

**Effort** : M (2 j)
**Fichier** : `src/app/(admin)/admin/mcc/status/page.tsx`

Une seule page pour :
- Uptime services (app, docuseal, LightRAG, DB provider)
- Latency P50/P95/P99 par route critique
- Erreurs 500 dernières 24h
- DLQ count par tenant
- Health score par tenant (agrégé)

Rafraîchi temps réel via SSE.

#### [Y-02] Alertes multi-canal (email + webpush + SMS critique)

**Effort** : S (4-6 h)
**Fichier** : `src/lib/ops/AlertDispatcher.ts`

Politique par sévérité :
- **Info** : log only
- **Warning** : email quotidien digest
- **Error** : email immédiat + webpush
- **Critical** : email + webpush + SMS

Configurable par toi (`.env`) — pas de spam.

#### [Y-03] Silences intelligents (déduplication + snooze)

**Effort** : S (4-6 h)
**Fichier** : `src/lib/ops/AlertSilencer.ts`

- Grouper alertes identiques 15 min
- Auto-silence si résolu par retry
- Snooze manuel via bouton MCC
- Escalation auto si silence dépassé

#### [Y-04] Rapport hebdo santé plateforme (email dimanche soir)

**Effort** : S (4-6 h)
**Fichier** : `src/lib/cron/WeeklyPlatformReportJob.ts`

Email récap :
- Nouveaux tenants (semaine)
- MRR delta
- Incidents résolus / en cours
- Top 5 erreurs
- Top 5 questions support (via Chantier T)
- Actions suggérées

**Impact** : tu commences ta semaine avec une vue claire, pas anxiogène.

#### [Y-05] Uptime public status page

**Effort** : S (4-6 h)
**Fichier** : `src/app/(public)/status/page.tsx` (existe partiellement)

- Étendre pour montrer historique 90 jours
- Incidents publics (résumé, timeline, résolution)
- Souscription email/RSS pour tenants
- Auto-génération incidents depuis Sentry

**Impact** : rassure prospects et évite les emails "c'est down ?".

### 📊 Sortie Chantier Y

- ✅ Vision unique de la santé plateforme
- ✅ Alertes actionnables sans spam
- ✅ Rapport hebdo automatique
- ✅ Status page publique pro
- ✅ Divise par 2 le temps monitoring passif

---

## Chantier Z — Formation gérant auto 🟠 P1

**Effort total** : M (1-2 semaines + contenus continus)
**Session** : `formation-automation`
**Périmètre exclusif** : `src/modules/commerce/acquisition/formation/`, `docs-user/formations/`

### 🎯 Objectif

Nouveau gérant s'auto-forme. Zéro session visio de ta part sauf demande spécifique.

### 📦 Actions détaillées

#### [Z-01] Parcours de formation gamifié in-app

**Effort** : L (3-5 j)
**Fichier** : `src/modules/commerce/acquisition/formation/FormationPath.tsx`

- 8-12 modules par verticale (5-10 min chacun)
- Vidéo + quiz + action pratique in-app
- Badges de progression
- Certification "Restaurant OS Certified" à la fin
- Unlock features avancées au fur et à mesure (gamification)

#### [Z-02] Webinaires enregistrés + replay

**Effort** : M (1-2 j setup, continu ensuite)
**Fichier** : `docs-user/webinaires/`

- Enregistre 1 webinaire par verticale × 3-4 thèmes
- Hosted sur ton domaine (self-hosted ou Vimeo)
- Accessible depuis dashboard + email post-onboarding
- Chapters + transcript searchable (Whisper)

#### [Z-03] Formation certifiante employés (pour le tenant)

**Effort** : M (2 j)
**Fichier** : `src/modules/commerce/acquisition/formation/EmployeeCertification.tsx`

- Le gérant peut former ses employés via ton système
- Modules courts spécifiques rôle (serveur, chef, comptable)
- Certificats PDF DocuSeal (déjà ✅)
- **Valeur ajoutée vendable** : "formation employés incluse"

#### [Z-04] Support asynchrone dans app (pas Zoom)

**Effort** : S (2-3 h)
**Fichier** : Widget de contact via chatbot (Chantier T) + video async (Loom)

- Bouton "Contacter" propose : chat IA / email / vidéo async
- Vidéo async : gérant enregistre 1 min de son problème, tu réponds à ton rythme
- Fini les visios 30 min pour un truc que tu réponds en 2 min

### 📊 Sortie Chantier Z

- ✅ Nouveau gérant s'auto-forme
- ✅ Formation employés vendable comme feature
- ✅ Zéro visio de ta part sauf VIP
- ✅ Certification = argument commercial

---

## Matrice des dépendances

```
PREREQ-S1 (décision stratégique — obligatoire d'abord)
PREREQ-S2 (baseline temps mesurée)
PREREQ-S3 (comptes Stripe / SMS / Cloud GPU ouverts)
   │
   ├── Chantiers **P0 immédiats** (démarrer en parallèle)
   │   ├── S — Onboarding self-service (XL, 2-3 sem.)
   │   │   └── S-03 dépend de X-01 (Stripe setup)
   │   ├── T — Support IA embedded (L, 2 sem.)
   │   │   └── T-01 dépend de LightRAG actif ✅
   │   ├── U — Ops self-healing (L, 2 sem.)
   │   │   └── Précondition : Chantier I du PLAN_CONSOLIDATION (DLQ dashboard)
   │   └── X — Facturation auto (M, 1-2 sem.)
   │       └── Débloque S-03 (paiement post-signup)
   │
   ├── Chantiers **P1 déblocage 30-100 tenants**
   │   ├── V — Sales revendeurs (L, 2-3 sem.)
   │   │   └── Dépend de S livré (onboarding auto pour leads convertis)
   │   ├── W — Docs client (M, 1-2 sem.)
   │   │   └── Nourrit T (base RAG) et Z (contenus formation)
   │   ├── Y — Monitoring intelligent (M, 1 sem.)
   │   │   └── Post U (alertes basées sur circuit breakers + runbook)
   │   └── Z — Formation auto (M, 1-2 sem.)
   │       └── Post W (utilise vidéos + articles)
```

**Chemin critique** :
```
PREREQ → X (Stripe) → S (onboarding avec paiement) → premier tenant self-service
```

---

## Roadmap trimestrielle

### 🚀 Vague α — Ops immédiate (Q3 2026, Août-Octobre)
**Objectif** : ne plus être plafonné à 10 tenants

- Chantier X (facturation auto) — 1-2 sem.
- Chantier U (self-healing) — 2 sem., parallèle
- Chantier Y minimal (dashboard santé + alertes) — 1 sem.
- Chantier W minimal (centre d'aide MVP + 10 articles) — 1 sem.

**Résultat vague α** : capacité passe de ~10 à ~25 tenants supportables solo.

### 🌐 Vague β — Self-service commercial (Q4 2026, Nov-Jan)
**Objectif** : signup → utilisation en 15 min sans toi

- Chantier S (onboarding self-service complet) — 2-3 sem.
- Chantier V (portail revendeur + kit démo) — 2-3 sem.
- Chantier Z (parcours formation gamifié) — 1-2 sem.

**Résultat vague β** : capacité passe à ~50 tenants + acquisition scalable.

### 🤖 Vague γ — IA-assist scaling (Q1 2027, Fév-Avr)
**Objectif** : support quasi zéro, IA prend le relais

- Chantier T (support IA embedded avec SLM) — 2 sem.
- Chantier W complet (tutoriels vidéo + doc auto-générée) — continu
- Chantier Z complet (webinaires + certifications) — continu

**Résultat vague γ** : capacité passe à **80-100 tenants** confortablement solo.

---

## Métriques de sortie

| Métrique | T+0 | Post α (Q3) | Post β (Q4) | Post γ (Q1-2027) |
|---|:-:|:-:|:-:|:-:|
| **Tenants supportables solo** | ~10 | ~25 | ~50 | **80-100** |
| Temps support / tenant / mois | 30 min | 20 min | 10 min | **5 min** |
| Onboarding tenant | 4h | 2h | 30 min | **0h (auto)** |
| Facturation manuelle | 20 min/tenant | 0 min | 0 min | 0 min |
| Démos ventes/semaine (toi) | 3h | 3h | 1h (VIP) | 0h (revendeurs) |
| Incidents perçus/semaine | ~5 | ~2 | ~1 | ~1 |
| Temps ops passif/semaine | 15h | 8h | 5h | **3h** |
| MRR par heure de toi | ~50€/h | 100€/h | 200€/h | **500€/h** |
| Formation gérant | 2×2h visio | 1h visio | 30 min | 0h (auto) |
| Résolution ticket support | manuel 30 min | 20 min | 10 min | 2 min (IA) |
| Uptime perçu | ~99% | 99.5% | 99.8% | **99.95%** |

---

## Journal d'exécution — template

À tenir dans `.claude/sessions.md` sous chaque session de chantier.

```markdown
### Journal Chantier X (session <name>)

| ID | Action | Statut | Commit | Notes |
|----|--------|:------:|--------|-------|
| X-01 | ... | ⬜ | — | — |
| X-02 | ... | ⬜ | — | — |
```

**Légende** : ⬜ à faire · 🟨 en cours · ✅ fait · ❌ bloqué · ↩️ reverted

---

## Annexes

### A. Sessions par chantier

| Chantier | Nom session | Périmètre exclusif |
|---|---|---|
| S | `onboarding-self-service` | `src/app/(public)/signup/`, `src/app/(public)/landing/`, `src/modules/commerce/acquisition/onboarding/` |
| T | `support-ia-embedded` | `src/modules/intelligence/ia/support/`, `src/app/(client)/(ops)/help/` |
| U | `ops-self-healing` | `src/lib/cron/`, `src/lib/ops/`, `src/app/(admin)/admin/mcc/ops/` |
| V | `sales-reseller-portal` | `src/app/(public)/reseller/`, `src/app/(admin)/admin/mcc/resellers/`, `src/app/(reseller)/` |
| W | `docs-client-vivante` | `docs-user/`, `src/app/(public)/help/`, `scripts/docs-gen/` |
| X | `billing-automation` | `src/modules/finance/tresorerie/billing/`, `src/app/api/webhooks/stripe/` |
| Y | `monitoring-intelligence` | `src/lib/adapters/{sentry,axiom}.ts`, `src/lib/ops/monitoring/`, `src/app/(admin)/admin/mcc/status/` |
| Z | `formation-automation` | `src/modules/commerce/acquisition/formation/`, `docs-user/formations/` |

### B. Dépendances externes par chantier

| Chantier | Services externes requis | Coût mensuel estimé |
|---|---|:-:|
| S | Domain + Vercel/OVH | ~50€ |
| T | LightRAG local (déjà ✅) + optionnellement GPU cloud pour SLM | 0-50€ |
| U | Sentry + Axiom (déjà ✅) + Uptime Robot | ~30€ |
| V | Aucun (revendeurs signent DocuSeal existant) | 0€ |
| W | Loom Free + Whisper local | 0€ |
| X | **Stripe (obligatoire)** | 1.4% + 0.25€ / transaction |
| Y | Uptime Robot + Grafana Cloud free tier | ~10€ |
| Z | Hébergement vidéos (S3/Bunny) | ~20€ |

**Total coût opérationnel post-plan** : ~150-200€/mois. Négligeable vs MRR à 30+ tenants.

### C. Ordre de démarrage recommandé

Si tu ne peux faire qu'un chantier à la fois (plutôt qu'en parallèle) :

1. **X-01/02** — Stripe setup + facturation auto (débloque toute la chaîne)
2. **U-01/02/03** — Retry + circuit breakers + runbook (arrête de te réveiller la nuit)
3. **S-03/04** — Provisioning auto post-Stripe (premier tenant sans toi)
4. **W-01** — Centre d'aide MVP (réduit questions "de base" tout de suite)
5. **T-02/03** — Chatbot RAG (résout 50% support immédiatement)
6. Puis S complet, V, Y, Z dans l'ordre qui te chante

### D. Hors périmètre de ce plan

- **Pentest / audit sécurité tiers** — trimestre 2 2027
- **Refonte design system UI** — hors sujet ops
- **Nouvelles verticales** — n'accélère pas le scaling, ça le complique
- **Fine-tuning SLM avancé** — optionnel, chantier T niveau 4 seulement si tu vois vraiment un ROI
- **Embauche** — reste toujours une option mais retardée grâce à ce plan

### E. Décisions à trancher avant démarrage

- [ ] Objectif tenants 12 mois : ___ (10 / 30 / 80)
- [ ] Modèle commercial : direct only / revendeurs / mixte
- [ ] Pricing exact des plans Starter/Pro/Enterprise
- [ ] Devise + langue par verticale (FR only ou multi ?)
- [ ] Support timezone (heures ouvrées ou 24/7 IA ?)
- [ ] SLA public affiché (99% ? 99.9% ?)
- [ ] Politique free trial (7j / 14j / freemium ?)

---

**Fin du plan.**

**Prochaine action** : PREREQ-S1 (décision stratégique) + PREREQ-S2 (baseline temps) — 1 jour de réflexion. Puis démarrer par X-01 (Stripe) qui débloque la chaîne S/V/Z.
