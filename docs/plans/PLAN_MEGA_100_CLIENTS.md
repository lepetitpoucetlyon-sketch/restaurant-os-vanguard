# 🚀 Plan Mega — de "socle 8,5/10" à "1000 clients en autonomie"

> **Objectif** : passer d'un socle Grade X **techniquement prêt** à une **machine commerciale + opérationnelle** qui absorbe 100+ clients, avec signup autonome, CI/CD industrielle et SRE solo augmenté par IA.
>
> **Date** : 2026-08-20 · **Horizon** : 6 mois · **Auteur** : session Claude Code
>
> **Rapport de base** : [PLAN_MASTER_ESPRIT_TRANQUILLE.md](PLAN_MASTER_ESPRIT_TRANQUILLE.md) — celui-ci l'étend avec les axes commerciaux + ops manquants.

---

## 🎯 Vision cible en 6 mois

| Aujourd'hui | Dans 6 mois |
|-------------|-------------|
| 0-5 clients pilotes | 50-100 clients payants |
| Onboarding manuel (patron le fait) | Signup Stripe en 5 min, autonome |
| Landing page inexistante | Landing + 8 pages verticales SEO-optimisées |
| Git local, pas de CI | GitLab CI + preview deploys automatiques |
| Toi + Claude sur incidents | Alertes → runbooks → auto-remédiation |
| Data layer manuel | `useSovereignCollection` déployé sur 4 piliers |
| Pas de doc utilisateur | Wiki client + 20 vidéos < 90s |

---

## 🗺️ 5 phases séquentielles

| Phase | Nom | Durée | Prérequis | Livrable clé |
|-------|-----|-------|-----------|--------------|
| **P0** | Débloquer aujourd'hui | ½ journée | Rien | Backup cron + Sentry propre |
| **P1** | Landing + Signup autonome | 3 semaines | P0 | Client peut s'inscrire seul via landing |
| **P2** | CI/CD industrielle | 2 semaines | Migration GitLab | Preview deploy par PR + tests auto |
| **P3** | SRE solo augmenté | 2 semaines | P1 en prod | Alertes → auto-remédiation Claude |
| **P4** | Data layer unifié | 6 semaines | Prérequis V4 précédent plan | `useSovereignCollection` sur 4 piliers |

**Total** : ~4 mois cumulés, avec livraison de valeur commerciale dès P1.

---

## 🎯 État réel au 2026-08-20 (mise à jour après exécution partielle)

Bilan concret des livrables présents dans le repo (analyse d'inventaire) :

| Phase | Livrables faits | Livrables manquants |
|-------|-----------------|---------------------|
| **P0** | ✅ Nettoyage racine · ✅ `.env.example` · ✅ `DailyBackupJob` + route `/api/cron/daily-backup` · ✅ Sentry propre (logue au lieu de silencer) | — |
| **P1** | ✅ `app/(marketing)/layout+page` · ✅ 5 composants marketing (Hero/Features/FAQ/Pricing/CTA) · ✅ `AnalyticsProvider` Posthog (dyn) · ✅ `verticales/[slug]` dynamique · ✅ `/pricing` · ✅ `/signup` + `/signup/success` · ✅ Routes `/api/signup` + `/api/billing/signup` · ✅ `robots.ts` + `sitemap.ts` · ✅ Schémas Zod signup | ❌ 6 pages légales (CGV/CGU/privacy/DPA/nf525/security) · ❌ Pages `vs-zelty` / `vs-lightspeed` · ❌ Tests unitaires signup route (dépendances Firebase/Stripe lourdes) |
| **P2** | ✅ `.gitlab-ci.yml` (5 stages) · ✅ `MigrationRunner` + route `/api/admin/fleet/migrate` · ✅ **Bug idempotence fixé** (getAppliedMigrations lisait le mauvais path) | ❌ Preview deploys Vercel/Cloud Run · ❌ Environnements dev/staging/prod séparés · ❌ Suite smoke post-deploy (seulement 1 fichier stub `tests/smoke/smoke.spec.ts`) |
| **P3** | ✅ `/api/health` · ✅ `/api/status/db` + `/api/status/nexus` · ✅ `/api/ops/incident-webhook` (routage auto-remédiation vs escalade humaine) · ✅ 5 runbooks écrits · ✅ Test webhook (13 tests couvrant auth/validation/human-only/auto-remédiation) | ❌ Stack observabilité complète (OpenTelemetry + Grafana Cloud + BetterStack) · ❌ Métriques custom Prometheus · ❌ Dashboard MCC "santé flotte" |
| **P4** | ✅ Prérequis pré-existants : `OutboxService`, `IDService`, `useSovereignCollection`, `SnapshotService` · ✅ **Tests renforcés** : useSovereignCollection 15 tests, OutboxService 17 tests, apiClient 14 tests, MigrationRunner 8 tests, incident-webhook 13 tests | ❌ ADR-006 résolution conflits (ADR-007 existe mais périmètre différent) · ❌ Migration progressive des 4 piliers (0 pilier migré au hook) · ❌ Métriques baseline avant migration élargie |

### Métriques socle au 2026-08-20
- **0 erreur TypeScript** sur tout le repo
- **0 cycle circulaire** Madge sur 3054 fichiers
- **1367 tests verts** / 1 skipped / 0 failed (Vitest full suite)
- **6 commits** structurés (V1 à V5 précédents + renforcement en cours)

### Ce qui reste vraiment critique pour l'"esprit tranquille"
1. **Coverage des routes signup** (P1.3) — aucun test unitaire, dépendances Firebase/Stripe à mocker
2. **6 pages légales** (P1.5) — bloqueur commercial, un DPO refuse de signer sans
3. **Preview deploys** (P2.2) — sans ça, un push casse la caisse d'un client sans qu'on le sache
4. **Migration effective d'un pilier vers useSovereignCollection** (P4.3) — pour l'instant, le hook existe mais n'est pas déployé
5. **CGV/CGU relues par avocat SaaS**

---

# 🌊 PHASE 0 — Débloquer aujourd'hui (½ journée)

**Objectif** : rendre le socle défendable contre les 3 vraies épines opérationnelles avant de mettre 1 seul vrai client dessus.

## P0.1 — Nettoyage racine (30 min)

- [ ] Créer `docs/archive/2026-08/`
- [ ] Déplacer tous les `AUDIT_*.md`, `PLAN_*.md` obsolètes, `anglemort.md`, `afaire.md`
- [ ] Ne garder à la racine que : `README.md`, `CLAUDE.md`, `ARCHITECTURE.md`, `BACKLOG.md`, `CHANGELOG.md` + configs
- [ ] Commit `chore(docs): archivage historique racine`

**DoD** : `ls *.md | wc -l` ≤ 5.

## P0.2 — Backup cron activé (2h)

- [ ] Créer `src/lib/cron/DailyBackupJob.ts`
- [ ] Choisir hébergement de cron : Vercel Cron (si Vercel) OU GitLab scheduled pipeline OU GitHub Action (temporaire)
- [ ] Appel POST à minuit sur toute la flotte via `/api/admin/fleet/backup`
- [ ] Câbler `OpsAlertGateway.send({ severity: 'critical' })` si échec
- [ ] Test manuel : forcer un échec → alerte Slack arrive

**DoD** :
- 1 backup nocturne réel qui tourne
- 1 alerte simulée reçue sur le canal ops

## P0.3 — Sentry propre (2h)

- [ ] Supprimer le `.catch(() => {})` silencieux dans `sentry.server.config.ts`
- [ ] Dev : `logger.warn` si `SENTRY_DSN` absent
- [ ] Prod : `throw` au boot si `SENTRY_DSN` absent → fail fast
- [ ] Créer route `/api/admin/debug/sentry-test` qui déclenche `throw new Error('sentry-canary')`
- [ ] Vérifier arrivée dans dashboard Sentry

**DoD** : dashboard Sentry montre le canary event, projet nommé `restaurant-os-prod`.

## P0.4 — `.env.example` complet (30 min)

- [ ] `rg "process\.env\." src` → extraire toutes les vars
- [ ] Compléter `.env.example` avec sections : `# Auth`, `# Nexus`, `# Alertes ops`, `# Backup`, `# Stripe`, `# LightRAG`, `# LLM providers`
- [ ] Ajouter valeurs par défaut sûres + commentaires

**DoD** : `cp .env.example .env` → app démarre en mode local sans crash.

---

# 🌊 PHASE 1 — Landing page + Signup autonome (3 semaines)

**Objectif** : un prospect découvre Restaurant OS, choisit sa verticale, paye, obtient son tenant provisionné, se connecte, importe ses produits — **sans intervention humaine**.

**Bénéfice business** : CAC ↘, cycle de vente en heures au lieu de semaines, scalabilité linéaire.

## P1.1 — Architecture landing publique (½ semaine)

### Décisions à prendre AVANT
- [ ] **Hébergement landing** : sous-domaine `www.restaurant-os.fr` ou racine ?
- [ ] **Framework** : Next.js App Router (existant) ou site séparé Astro ?
  - **Recommandation** : garder Next.js App Router, route `app/(marketing)/` — 0 friction, SEO OK, partage des composants UI
- [ ] **Analytics** : Plausible (privacy-first) ou Posthog (product analytics + funnels) ?
  - **Recommandation** : Posthog — tracker le funnel signup

### À faire
- [ ] Créer groupe de routes `src/app/(marketing)/` (séparé de `(admin)`, `(client)`, `(public)`)
- [ ] Layout marketing : `layout.tsx` avec header transparent + footer
- [ ] Middleware qui n'exige PAS d'auth sur ces routes
- [ ] Setup Posthog SDK côté client (via `<PosthogProvider>` en marketing layout uniquement)

**DoD** : `/` (racine) affiche placeholder marketing, `/pos` etc. continuent de fonctionner normalement.

## P1.2 — Landing racine + 8 landings verticales (1 semaine)

### Structure
- `/` — landing générique multi-vertical (choix de la verticale visible en héros)
- `/verticales/restaurant` — landing dédiée restaurant
- `/verticales/boulangerie` — dédiée boulangerie
- `/verticales/salon`, `/verticales/garage`, `/verticales/hotel`, `/verticales/clinique`, `/verticales/retail`, `/verticales/coworking`

### Chaque landing verticale contient (composants factorisés)
- `<VerticalHero>` — H1 spécifique métier ("Le logiciel de caisse pour boulanger")
- `<VerticalFeatures>` — 6 features prioritaires POUR ce métier (lecture du blueprint vertical)
- `<VerticalCompliance>` — badge conformité (NF525, HACCP, RGPD selon vertical)
- `<PricingTeaser>` — 3 plans (starter / pro / enterprise) avec CTA
- `<Testimonials>` — 2-3 témoignages (au début : placeholders honnêtes "Premiers clients pilotes")
- `<FAQ>` — 8 questions récurrentes par vertical
- `<FinalCTA>` — bouton signup

### SEO
- [ ] Metadata dynamique via `generateMetadata()` par verticale
- [ ] Sitemap automatique `app/sitemap.ts`
- [ ] robots.txt permissif
- [ ] Schema.org `SoftwareApplication` par landing verticale
- [ ] OG image dédiée par verticale (générée via `@vercel/og` ou statique)

**DoD** :
- 9 pages publiques indexables par Google
- Lighthouse Perf ≥ 90, SEO = 100, Accessibility ≥ 95
- Chaque landing peut être linkée en pub Google Ads

## P1.3 — Flow signup autonome (1 semaine)

### Étapes utilisateur cible
1. Clic "Commencer" sur landing → `/signup?vertical=restaurant`
2. Formulaire minimal (email, nom du resto, ville, verticale pré-remplie)
3. Redirection Stripe Checkout (essai 14 jours, CB requise pas prélevée)
4. Callback webhook → provision automatique du tenant
5. Email de bienvenue avec magic link → connexion
6. Onboarding guidé (5 étapes) → dans l'app

### Implémentation

**Backend** :
- [ ] Route `POST /api/signup` : valide email + crée un `SignupIntent` en attente
- [ ] Route `POST /api/signup/checkout` : crée session Stripe Checkout (mode `subscription`, `trial_period_days: 14`)
- [ ] Webhook Stripe `checkout.session.completed` → dans `handleSubscriptionEvents.ts`
  - Provisionner le tenant via `ProvisioningEngine.provisionNewTenant(...)`
  - Créer 1er user admin avec le mail donné
  - Générer magic link auth Firebase
  - Envoyer email de bienvenue via `NotificationGateway.send()`
- [ ] Route `GET /api/signup/status?intentId=xxx` : polling côté client pour savoir si la provision est terminée

**Frontend** :
- [ ] Page `/signup` — formulaire React Hook Form + Zod
- [ ] Page `/signup/checkout` — redirect vers Stripe
- [ ] Page `/signup/success?session_id=xxx` — polling status + confetti + magic link visible
- [ ] Page `/signup/error` — messages d'erreur clairs

**Onboarding in-app** (5 étapes après première connexion) :
- [ ] Étape 1 : Confirmer nom + logo (auto-branding via `BrandingService`)
- [ ] Étape 2 : Import produits (CSV upload OU saisie manuelle 3 produits)
- [ ] Étape 3 : Créer 1 table / 1 rendez-vous / 1 chambre (selon vertical)
- [ ] Étape 4 : Configurer TVA (dérivée du vertical)
- [ ] Étape 5 : Test 1 vente → ticket Z généré → NF525 sceau visible
- [ ] Composant `<OnboardingChecklist>` persistant tant que non terminé

### Sécurité
- [ ] Rate limit sur `/api/signup` (max 3 tentatives / IP / heure)
- [ ] Vérification email (double opt-in) avant provision réelle
- [ ] `SovereignGuard` : tenant provisionné va bien dans son namespace isolé
- [ ] Card Stripe validée mais pas prélevée pendant les 14 jours d'essai
- [ ] Alerte ops si > 10 signups/h (anti-abuse)

**DoD** :
- Test end-to-end : bot Playwright fait un signup complet → tenant existe + ticket Z passé sans intervention humaine
- Vidéo screencast de 3 min montrant le parcours
- 3 clients pilotes signés sans avoir demandé d'aide

## P1.4 — Page pricing + comparaison concurrents (½ semaine)

- [ ] `/pricing` — 3 plans (Starter 49€/mois, Pro 99€, Enterprise sur devis)
- [ ] Différenciateurs par plan (multi-caisse, MCC, franchise, verticales exotiques)
- [ ] `/pricing/vs-zelty`, `/pricing/vs-lightspeed` — pages comparatives (SEO gold)
- [ ] `/pricing/roi-calculator` — calculateur ROI (économie vs concurrent, gain temps saisie)

**DoD** : chaque page a un CTA vers signup, tracké dans Posthog.

## P1.5 — Legal & confiance (½ semaine)

- [ ] `/legal/cgv` — Conditions générales de vente (à faire relire par avocat SaaS)
- [ ] `/legal/cgu` — Conditions générales d'utilisation
- [ ] `/legal/privacy` — Politique de confidentialité RGPD
- [ ] `/legal/dpa` — Data Processing Agreement (obligatoire B2B RGPD)
- [ ] `/legal/nf525` — Page explicative certification NF525 + certificat téléchargeable
- [ ] `/legal/security` — Trust page : ISO27001 planifié, RGPD, chiffrement, backup 7 ans

**DoD** : un DPO client peut lire ces 6 pages et signer sans négocier.

---

# 🌊 PHASE 2 — CI/CD industrielle (2 semaines)

**Objectif** : chaque commit est testé, chaque PR a un preview deploy jetable, un rollback prend 30 secondes.

**Prérequis** : migration GitLab terminée (patron).

## P2.1 — Setup GitLab CI base (3 jours)

### Fichier `.gitlab-ci.yml`
Structure recommandée :

```yaml
stages:
  - lint      # ESLint + Prettier check
  - type      # tsc --noEmit
  - unit      # vitest
  - build     # next build
  - e2e       # Playwright (branche main + tags)
  - deploy    # deploy sur environnement selon branche
```

### À câbler
- [ ] Runners GitLab hébergés (SaaS) ou self-hosted (VPS OVH ~15€/mois)
- [ ] Cache `node_modules` entre stages (accélération 3-5x)
- [ ] Cache Next.js `.next/cache`
- [ ] Variables CI : `SENTRY_DSN`, `STRIPE_TEST_KEY`, `FIREBASE_TEST_CREDS`
- [ ] Badge CI dans le README

**DoD** : un push sur `main` fait tourner les 5 stages en < 8 min, badge vert visible.

## P2.2 — Preview deploys par MR (3 jours)

### Décision hébergement
- **Option A** : Vercel — le plus simple, gestion preview auto, mais coût qui grimpe
- **Option B** : Cloud Run (GCP) — plus contrôlé, tenants Firebase, cohérence stack
- **Option C** : Docker + Coolify (self-hosted VPS) — moins cher, plus de maintenance

**Recommandation** : Vercel pendant Phase 1-2 (rapidité), migration Cloud Run à 50+ clients (coût).

### À câbler
- [ ] Vercel integration GitLab → chaque MR = URL de preview `pr-42.restaurant-os.vercel.app`
- [ ] Comment auto sur MR avec l'URL + captures d'écran diff visuel
- [ ] Preview utilise base Firebase de dev (jamais prod)
- [ ] Rollback = redéployer commit précédent depuis Vercel dashboard (30s)

**DoD** : ouvrir une MR → 3 min plus tard, URL live commentée automatiquement.

## P2.3 — Tests smoke post-déploiement (2 jours)

- [ ] Suite Playwright `smoke` (10 tests critiques : signup, login, POS ticket, KDS, MCC)
- [ ] Trigger auto après chaque deploy prod
- [ ] Échec = alerte OpsAlertGateway + rollback semi-auto (bouton visible dans l'alerte)

**DoD** : 1 déploiement raté détecté en < 5 min sans intervention humaine.

## P2.4 — Migrations DB versionnées (2 jours)

**Contexte** : Firestore n'a pas de "migrations" au sens SQL, mais on a besoin d'un système pour appliquer des mutations schéma (renommage champs, backfill, split collections).

- [ ] Créer `src/lib/migrations/` avec pattern `20260820-add-schemaVersion.ts`
- [ ] `MigrationRunner.ts` qui applique dans l'ordre, écrit `_meta/migrations/{migrationId}` avec statut
- [ ] Route `POST /api/admin/fleet/migrate?target=all|tenantId&migration=xxx`
- [ ] Auto-run des migrations pending au boot en dev, manuel en prod (safety)

**DoD** : appliquer 1 migration dummy sur 1 tenant démo, statut visible dans MCC.

## P2.5 — Environnements dev / staging / prod (2 jours)

- [ ] 3 projets Firebase : `restaurant-os-dev`, `restaurant-os-staging`, `restaurant-os-prod`
- [ ] 3 projets Stripe : test / test / live
- [ ] Variables env par environnement dans GitLab
- [ ] Règle : les MR déploient toujours en preview, `main` → staging auto, tag `v*` → prod manuel

**DoD** : chaîne dev → staging → prod fonctionnelle, un smoke test sur staging bloque le déploiement prod.

---

# 🌊 PHASE 3 — SRE solo augmenté par IA (2 semaines)

**Objectif** : tu es 1 dev + Claude. Reproduire une équipe SRE de 5 avec :
- Alertes intelligentes (pas de bruit)
- Runbooks exécutables
- Auto-remédiation sur les incidents connus
- Playbook oncall pour Claude quand tu dors

## P3.1 — Observabilité complète (½ semaine)

### Stack recommandée (0 lock-in vendor)
- **Métriques** : OpenTelemetry → Grafana Cloud (free tier 10K series)
- **Logs** : Axiom (déjà présent en dep) — indexation gratuite jusqu'à 500 GB/mois
- **Traces** : Sentry Performance (déjà présent)
- **Uptime** : BetterStack (free jusqu'à 10 monitors)

### À faire
- [ ] Instrumenter les routes API avec OpenTelemetry (middleware Next.js)
- [ ] Métriques custom : `signups.completed`, `orders.per_tenant.per_hour`, `dlq.pending`, `backup.age_hours`
- [ ] Dashboard Grafana pour chaque vertical (CA/heure, latence P99, taux erreur)
- [ ] Dashboard MCC "santé flotte" : 1 ligne par tenant, feux rouge/orange/vert
- [ ] Uptime probes : `/api/health`, `/api/status/db`, `/api/status/nexus`

**DoD** : un dashboard unique montre à un instant T la santé des 100 clients cible.

## P3.2 — Alerting intelligent (½ semaine)

### Règles à câbler dans Grafana / Sentry
- [ ] Backup > 26h → critical
- [ ] DLQ pending > 50 events → warning
- [ ] Latence P99 API POS > 800ms → warning
- [ ] Taux erreur > 1% sur 5 min → critical
- [ ] Sovereign breach → critical + auto-lockdown déjà en place
- [ ] Signup rate > 20/h → info (bon signe ou attaque à investiguer)
- [ ] `journalEntries` non-scellés > 100 → critical (NF525 en danger)

### Canaux
- **critical** → Slack #ops + SMS Twilio + WebPush
- **warning** → Slack #ops uniquement
- **info** → Slack #metrics-daily

**DoD** : 0 alerte bruit sur 7 jours consécutifs (règles calibrées).

## P3.3 — Runbooks exécutables (½ semaine)

Runbook = doc + script exécutable Claude peut lancer.

### Runbooks prioritaires
- [ ] `runbook-tenant-corrupted.md` — Restore depuis backup (SnapshotService)
- [ ] `runbook-dlq-flooded.md` — Retry / quarantine / analyse pattern
- [ ] `runbook-signup-blocked.md` — Diagnostic funnel + rollback Stripe si nécessaire
- [ ] `runbook-fiscal-chain-broken.md` — Diagnostic + isolation tenant + audit forensique
- [ ] `runbook-billing-payment-failed.md` — Dunning check + email client

### Format standard
```markdown
# Runbook — Tenant corrompu

## Symptôme
Tenant signale que ses commandes ne se chargent plus.

## Diagnostic
1. `curl /api/admin/tenant/{id}/health` → JSON avec statut par module
2. Check DLQ pour ce tenant
3. Check dernier backup age

## Remédiation
1. Isoler : `curl -XPOST /api/admin/tenant/{id}/lock`
2. Restore : `curl -XPOST /api/admin/fleet/restore ...`
3. Vérifier chain fiscale

## Escalade
Si restore fail → contacter patron + freeze billing du tenant
```

**DoD** : 5 runbooks écrits, chacun testé en dry-run sur tenant de test.

## P3.4 — Auto-remédiation IA (½ semaine)

**Idée** : quand une alerte tombe, un webhook déclenche Claude en mode ScheduledAgent qui :
1. Lit le runbook correspondant
2. Exécute la remédiation automatique si sûre (retry DLQ, restart worker)
3. Escalade avec contexte si non-triviale

### Câblage
- [ ] Endpoint `POST /api/ops/incident-webhook` (secret partagé avec Grafana/Sentry)
- [ ] Payload : `{ alertType, severity, tenant?, context }`
- [ ] Router selon `alertType` vers runbook auto-exec ou notification patron
- [ ] Log toutes les auto-remédiations dans `mcc/incidents/{id}` pour audit
- [ ] Rule : jamais d'auto-remédiation sur `fiscal-*` ou `sovereign-*` → toujours humain

### Cas concrets à automatiser (low risk)
- DLQ event stuck → retry avec backoff exponentiel
- Signup email pas envoyé → renvoyer depuis outbox
- Backup raté → relancer immédiatement, notifier si 2e échec
- Session utilisateur expirée → refresh silencieux

**DoD** : sur 30 jours, au moins 5 incidents résolus sans réveiller le patron.

---

# 🌊 PHASE 4 — Data layer unifié (6 semaines)

**Objectif** : `useSovereignCollection` déployé sur 4 piliers. Zéro perte de commande en mode dégradé réseau. Multi-caisse concurrent sans corruption.

**Prérequis absolus** (à faire AVANT ce chantier) :

## P4.0 — Prérequis (2 semaines)

Repris du plan précédent, non négociable :
- [ ] ADR-006 : Stratégie résolution conflits (LWW ? merge ? CRDT ?)
- [ ] Outbox atomique généralisée (`OutboxService` réutilisable)
- [ ] Idempotence normalisée partout (`eventId` obligatoire NexusInterceptor)
- [ ] `TimeSync.now()` utilisé partout où l'ordre compte
- [ ] Convention ID globale (ULID recommandé)
- [ ] `_schemaVersion` sur schémas critiques + migrateur read
- [ ] Suite tests offline (Playwright : WiFi coupe → tout se rejoue dans l'ordre)

**Sans ces prérequis, le hook cache des bugs au lieu de les résoudre.**

## P4.1 — Prototype sur `commerce/reservations` (1 semaine)

- [ ] Créer `src/kernel/hooks/useSovereignCollection.ts`
- [ ] API stable :
  ```ts
  const { data, isLoading, isSyncing, error, set, delete: del } =
    useSovereignCollection('reservations');
  ```
- [ ] 3 couches câblées : Jotai (RAM) → Dexie (IndexedDB) → Firestore (cloud via Nexus)
- [ ] Refuse `NF525_IMMUTABLE_COLLECTIONS` (throw en dev, log en prod)
- [ ] Feature flag `SOVEREIGN_COLLECTION_MODULES` (comma-separated)
- [ ] Panneau MCC "État du hook" : par tenant, temps sync, outbox pending

**DoD** : module `reservations` refactoré, tous ses tests verts, comportement identique en online, résilient offline.

## P4.2 — Métriques avant migration élargie (½ semaine)

- [ ] Instrumenter le hook : temps read, hit ratio Jotai, taille outbox, temps sync end-to-end
- [ ] Comparer 1 semaine avec/sans le hook sur reservations
- [ ] Décider si on continue ou si on rollback

**DoD** : graphique montrant gain ou perte sur 3 métriques clés.

## P4.3 — Migration progressive (4 semaines, 1 pilier par sem)

Ordre du moins critique au plus critique :

**Semaine 1** : `logistics` (stock, procurement) — beaucoup de writes offline légitimes.
**Semaine 2** : `human` (RH, paie) — writes rares, faible risque.
**Semaine 3** : `compliance` (HACCP, RGPD sauf immutables) — attention aux `haccpLogs` WORM.
**Semaine 4** : `facility` (spaces, maintenance) — dernier facile.

**Non fait dans cette phase** :
- ❌ `ops` (POS, KDS) — chantier suivant à part, trop critique
- ❌ `finance` — collections fiscales WORM absolu, jamais optimiste

**Par pilier** :
- [ ] Migrer les hooks existants un par un
- [ ] Supprimer atomes Jotai redondants
- [ ] Test intégration verte
- [ ] Feature flag OFF par défaut, ON progressif tenant par tenant

**DoD par pilier** : composants tous migrés, ancien code supprimé, 0 régression fonctionnelle.

---

# 🎁 Chantiers transverses (à faire en parallèle des phases)

## T1 — Documentation utilisateur (permanent)

**Format 3 couches** :
1. **Wiki** (`docs.restaurant-os.fr`) — Docusaurus ou Mintlify, articles Markdown
2. **Vidéos courtes** — 20 clips < 90s hébergés sur Loom (embed dans wiki)
3. **Chatbot IA** in-app — Copilote existant qui répond aux questions "comment faire X"

**Backlog vidéos prioritaires** :
- [ ] Signup en 3 minutes
- [ ] Configurer TVA + micro-BIC
- [ ] Émettre un ticket Z
- [ ] Importer une carte depuis Excel
- [ ] Encaisser par TPE Stripe
- [ ] Gérer un cadeau / une remise / une note
- [ ] Faire un remboursement (procédure NF525)
- [ ] Consulter le FEC + envoyer à mon comptable
- [ ] Mode hors ligne : quoi se passe si WiFi coupe
- [ ] Sauvegarder / restaurer mon tenant

## T2 — Ajout de verticales (rythme business)

**Ordre stratégique** :
1. **Fleuriste** (facile, marché niche mais peu concurrentiel)
2. **Coworking** (moyen effort, SaaS B2B ARR élevé)
3. **Vétérinaire** (bon fit RGPD santé, ticket moyen élevé)
4. **Auto-école** (moyenne complexité, verticale bien couverte par le Copilote IA)
5. **Café** (variation resto, très rapide via blueprint)

**Rythme** : 1 vertical par mois maximum, chaque vertical = 1 vrai client pilote AVANT commercialisation.

## T3 — Refactoring Boy Scout (permanent)

- Continuer à découper les god files > 400L quand on y passe
- Continuer à nettoyer les compatibility shims (re-exports post-rapatriement)
- Ne JAMAIS faire un sprint dédié "refactor"

## T4 — Comptes payants pilotes (3 premiers mois)

- [ ] Signer 3 clients à 0€ (dogfood + testimonials)
- [ ] Signer 5 clients à 25€/mois (early adopters)
- [ ] Passer à 49€/mois (starter) pour tout nouveau signup après le 10e client

**Objectif MRR** : 5 000€ à M6.

---

# 📊 Métriques de succès globales

| Métrique | Baseline (2026-08) | M+3 mois | M+6 mois |
|----------|--------------------|---------|--------|
| Clients payants actifs | 0-3 | 15-20 | 50-100 |
| MRR | 0€ | 1 500€ | 5 000€ |
| Cycle signup → 1ère vente | Manuel, 3-5 jours | < 30 min | < 15 min |
| Backup auto quotidien | 0% | 100% flotte | 100% |
| Alertes ops arrivant à l'oncall | 0 | 100% incidents critiques | 100% |
| Bugs découverts par client | ~5/mois | < 2/mois | < 1/mois |
| Temps rollback prod | Manuel > 30 min | < 5 min | < 2 min |
| Tests CI verts sur main | Non mesuré | > 95% | > 99% |
| Perte données scénario offline | Non testé | 0 doc perdu | 0 doc perdu |
| Score Lighthouse landing | Non fait | ≥ 90 | ≥ 95 |
| Domain Authority SEO | 0 | 15 | 30 |
| Rank Google "logiciel caisse boulanger" | Pas indexé | Top 50 | Top 20 |

---

# ⚠️ Ce qu'il ne faut PAS faire

- ❌ **Skipper P0** pour aller vendre → 1 corruption tenant = fin
- ❌ **Faire les 8 landings verticales avant la 1ère** → itère sur 1, mesure, puis étend
- ❌ **Aller sur P4 (data layer) avant P0-P3** → tu masques des bugs sous une couche magique
- ❌ **Migrer sur Cloud Run avant 30 clients** → sur-ingénierie coûteuse
- ❌ **Vouloir un vrai SRE humain à M6** → l'IA + les runbooks suffisent à 100 clients
- ❌ **Refactorer plus au-delà des 3 god files traités** → le socle est prêt, va vendre
- ❌ **Tout coder en amont** → publie chaque phase et confronte au marché avant de continuer

---

# 🎯 Décisions structurantes à prendre CETTE SEMAINE

1. **Hébergement prod définitif** : Vercel ou Cloud Run ?
2. **Domaine principal** : `restaurant-os.fr` (déjà acheté ?) ou autre ?
3. **Nom commercial** : "Restaurant OS" ou pivoter vers "Business OS" pour couvrir 8 verticales ?
4. **Prix Starter** : 49€/mois OK ou ajuster ?
5. **Analytics** : Posthog (recommandé) ou Plausible ?
6. **Chat support client** : Crisp/Intercom OU Copilote IA in-app suffit ?
7. **Statut légal société** : SAS solo, SASU, autre ? (impact facturation)

Réponds à ces 7 questions et P1 démarre lundi.

---

# 🔄 Suivi

- **Statut par phase** : bumper le tableau global à chaque clôture
- **Décisions structurantes** : ajouter ADR dans `docs/adrs/`
- **Rétros hebdo** : chaque vendredi, mettre à jour ce fichier avec ce qui a été fait / bloqué
- **Mémoire long-terme** : bumper `MEMORY.md` quand une phase change l'invariant de collab

---

**Prochaine action recommandée** : P0.1 (nettoyage racine, 30 min) — puis décisions structurantes ci-dessus.

*Rédigé par session Claude Code · 2026-08-20 · aligne l'exécution technique sur l'ambition commerciale.*
