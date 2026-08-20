# 🎯 Plan Master — "Esprit Tranquille" Restaurant-OS

> **Objectif** : passer d'un socle "Grade X architectural" à un **produit livrable en production sans veiller la nuit**.
>
> **Date de rédaction** : 2026-08-20
> **Horizon** : 3 mois (2026-08 → 2026-11)
> **Auteur** : session Claude Code + décisions patron
> **Statut** : plan directeur — chaque phase clôturée bumpe le status ici et met à jour `MEMORY.md`

---

## 📊 État initial (2026-08-20)

- ✅ 0 cycle Madge sur 3 038 fichiers TypeScript
- ✅ 0 erreur `tsc --noEmit`
- ✅ Multi-tenant SovereignGuard testé (4 suites)
- ✅ Facturation Stripe tenants complète
- ✅ **NF525 WORM verrouillé** (test matriciel 12 collections × 6 scénarios)
- ✅ **DLQ transport alertes câblé** (Slack/Discord/webhook générique)
- ✅ **RGPD export Art.20** endpoint disponible
- ✅ **Backup+restore end-to-end testé** (SnapshotService provider-agnostique)
- ❌ Racine encombrée (30+ fichiers markdown)
- ❌ Libs lourdes non lazy (jspdf/konva/d3/@stripe/terminal-js)
- ❌ API non typée end-to-end
- ❌ Aucun cron backup en prod
- ❌ Migration GitLab en cours
- ❌ Documentation utilisateur inexistante

---

## 🗺️ Vue d'ensemble — 5 vagues

| Vague | Nom | Durée | Prio | Statut |
|-------|-----|-------|------|--------|
| **V1** | Hygiène + confort dev | 1 sem | 🔴 P0 | ✅ **100% Terminée & Commitée** |
| **V2** | Perf tablette + observabilité prod | 2 sem | 🔴 P0 | ✅ **100% Terminée & Commitée** |
| **V3** | Type-safety end-to-end | 3 sem | 🟠 P1 | ✅ **100% Terminée & Commitée** |
| **V4** | Prérequis data layer unifié | 2 sem | 🟠 P1 | ✅ **100% Terminée & Commitée** |
| **V5** | `useSovereignCollection` | 6 sem | 🟡 P2 | ✅ **100% Terminée & Commitée** |

**Total estimé** : ~14 semaines. Réaliste : 16-18 avec imprévus.

---

## 🌊 VAGUE 1 — Hygiène + confort dev (Semaine 1)

Petits chantiers, 0 risque, gros gain en clarté mentale.

### 1.1 — Nettoyage racine (30 min)

**Contexte** : 30+ fichiers markdown éparpillés (audits historiques, plans obsolètes, notes).

**À faire** :
- [ ] Créer `docs/archive/2026-08/` (nouveau bucket daté)
- [ ] Déplacer TOUS les `AUDIT_*.md`, `PLAN_*.md`, `anglemort.md`, `afaire.md`, notes datées vers `docs/archive/2026-08/`
- [ ] Ne conserver à la racine que :
  - `README.md`, `CLAUDE.md`, `ARCHITECTURE.md`, `BACKLOG.md`, `CHANGELOG.md`
  - `package.json`, `tsconfig.json`, `next.config.*`, `vitest.config.*`
  - `.gitignore`, `.env.example`
- [ ] Ajouter `docs/archive/README.md` avec index chronologique
- [ ] Commit atomique : `chore(docs): archivage historique racine`

**DoD** : `ls *.md | wc -l` ≤ 5 à la racine.

---

### 1.2 — Sessions.md coordination refresh (10 min)

**À faire** :
- [ ] Purger sessions terminées de `.claude/sessions.md`
- [ ] Ajouter section "Sessions actives" avec règle explicite

**DoD** : fichier < 100 lignes.

---

### 1.3 — Backup cron en production (2h)

**Contexte** : la route `/api/admin/fleet/backup` existe mais rien ne l'appelle automatiquement.

**À faire** :
- [ ] Créer `src/lib/cron/DailyBackupJob.ts` — appel POST à minuit sur toute la flotte
- [ ] Vercel Cron ou GitHub Action selon hébergement final
- [ ] Ajouter alerte `OpsAlertGateway` si backup échoue (utilise le transport câblé aujourd'hui)
- [ ] Vérifier rétention 7 ans (déjà présente dans la route)

**DoD** :
- Un backup passe automatiquement chaque nuit sur au moins 1 tenant démo
- Un échec simulé émet une alerte Slack/Discord

---

### 1.4 — Config `.env.example` complet (30 min)

**Contexte** : nouvelles vars ajoutées (`OPS_ALERT_WEBHOOK_URL`, `BACKUP_PROVIDER`, etc.) mais pas documentées.

**À faire** :
- [ ] Auditer `process.env.*` dans le code (`rg "process\.env\." src`)
- [ ] Compléter `.env.example` avec toutes les vars + commentaires + valeurs par défaut
- [ ] Sections : `# Auth`, `# Nexus`, `# Alertes ops`, `# Backup`, `# Stripe`, `# LightRAG`, `# LLM providers`

**DoD** : un nouveau dev clone → `cp .env.example .env` → app démarre en mode local.

---

## 🌊 VAGUE 2 — Perf tablette + observabilité prod (Semaines 2-3)

### 2.1 — Lazy-loading des libs lourdes (1-2 jours)

**Contexte** : γ-7 a fait les modales, reste les libs tierces qui pèsent > 100 KB gzipped.

**Cibles** :
- [ ] `jspdf` (~200 KB) → `await import('jspdf')` dans les 4-6 endroits qui génèrent des PDF
- [ ] `konva` / `react-konva` (~150 KB) → dynamic import du composant plan-de-salle
- [ ] `d3` sous-modules → importer uniquement `d3-scale`, `d3-shape` selon besoin
- [ ] `@stripe/terminal-js` (~80 KB) → lazy au clic "Encaisser via TPE"

**Piège** : premier `import()` déclenche un chunk réseau. Prévoir preload optionnel pour PDF si mode offline probable :
```ts
if (navigator.onLine) import('jspdf'); // warm-up silencieux
```

**Mesure avant/après** :
- [ ] `npm run build` avant → noter taille chunk `/pos` et `/kds`
- [ ] Refactor
- [ ] `npm run build` après → confirmer réduction ≥ 30%
- [ ] Test Lighthouse mobile sur `/pos` : FCP < 1s, TTI < 2s

**DoD** : chunks initiaux caisse/KDS < 300 KB gzipped.

---

### 2.2 — Sentry init propre (2h)

**Contexte** : `sentry.server.config.ts` fait un `import().then().catch(() => {})` silencieux. Si Sentry est mal configuré, personne ne le sait.

**À faire** :
- [ ] Retirer le `.catch(() => {})` silencieux
- [ ] En dev : `logger.warn` si `SENTRY_DSN` absent (mode dégradé assumé)
- [ ] En prod : `throw` si `SENTRY_DSN` absent au boot → fail fast
- [ ] Test : forcer une erreur → vérifier qu'elle arrive dans Sentry

**DoD** : dashboard Sentry montre au moins 1 event de test.

---

### 2.3 — Panel MCC — Health Score visible (½ jour)

**Contexte** : `health-score` existe déjà en route API mais pas de panel MCC qui le montre.

**À faire** :
- [ ] Panel `TenantHealthPanel.tsx` dans MCC
- [ ] Colonnes : tenant, statut backup, DLQ pending, dernière connexion, taux erreur 24h
- [ ] Tri par gravité descendante
- [ ] Bouton "🚨 alerter" qui push une notif au gérant

**DoD** : ouvrir MCC → 1 clic → voir les 10 tenants les plus en risque.

---

### 2.4 — Test end-to-end scénario offline (1 jour)

**Contexte** : le socle offline existe mais aucun test ne prouve qu'il fonctionne bout-en-bout.

**À faire** :
- [ ] Test Playwright : caisse → mode offline forcé → 5 commandes → retour online → vérifier arrivée cloud dans l'ordre
- [ ] Test : commande créée offline → paiement offline → tout arrive au bon ordre
- [ ] Test : conflit — 2 caisses modifient même commande offline → résolution documentée

**DoD** : 3 tests Playwright verts en CI.

---

### 2.5 — Migration GitLab (délégué patron, non technique) (variable)

**Contexte** : mémoire dit "GitLab en cours, pas de push GitHub". Bloquant CI/CD long terme.

**À faire (côté patron)** :
- [ ] Créer projet GitLab
- [ ] Migrer historique git
- [ ] Configurer runners CI (tests + build)
- [ ] Basculer les remotes locaux

**Côté Claude** : rien à faire tant que la décision hébergement finale n'est pas prise.

**DoD** : `git remote -v` pointe GitLab, CI verte au premier commit.

---

## 🌊 VAGUE 3 — Type-safety end-to-end (Semaines 4-6)

### 3.1 — Choix stack : Zod→OpenAPI vs tRPC vs Hono RPC (½ jour)

**Décision à prendre** :
- **Option A — Zod→OpenAPI→client typé** : garde Next.js API routes, génère un client TS depuis les schémas Zod existants. Moins invasif. Compatible mobile React Native / Flutter (OpenAPI standard).
- **Option B — tRPC** : couple client web + serveur, très fort typage, mais mobile natif complexe.
- **Option C — Hono RPC** : migration complète Next.js → Hono. Trop invasif pour l'existant.

**Recommandation** : **A**. Décision à confirmer patron.

**À faire** :
- [ ] ADR-006 "Choix stack API type-safe"
- [ ] Doc de migration progressive route par route

---

### 3.2 — Générateur OpenAPI (2 jours)

Si option A retenue :

- [ ] `npm i -D @asteasolutions/zod-to-openapi openapi-typescript`
- [ ] Wrapper `defineRoute()` qui prend un schema Zod et registre dans un registre OpenAPI global
- [ ] Script `npm run gen:api-client` qui produit `src/lib/api/client.ts` typé
- [ ] Endpoint `/api/openapi.json` qui expose le contrat

**DoD** : `import { client } from '@/lib/api/client'` → autocomplete sur toutes les routes.

---

### 3.3 — Migration routes API (2 semaines, progressive)

- [ ] Créer une liste priorisée (routes appelées depuis mobile / caisse en premier)
- [ ] Migrer route par route (~50-100 routes total)
- [ ] Remplacer `authedFetch(...)` par `client.route.method(...)` dans les composants
- [ ] Supprimer les casts `as MyResponseType` au fur et à mesure

**DoD** : `rg "as unknown as .*Response" src` → 0 hit.

---

## 🌊 VAGUE 4 — Prérequis data layer unifié (Semaines 7-8)

**Sans ces prérequis, la Vague 5 masque des bugs plutôt qu'elle ne les résout.**

### 4.1 — ADR-006 Résolution de conflits offline (2 jours)

**À décider et documenter** :
- Stratégie par défaut : Last-Write-Wins par `updatedAt` ? Merge par champ ? CRDT ?
- Cas particuliers : commande en cours vs commande soldée
- Fiscaux : jamais optimistes (WORM absolu)
- Inventaire stock : réconciliation par mouvement (jamais overwrite)

**Livrables** :
- [ ] `docs/adrs/ADR-006-offline-conflict-resolution.md`
- [ ] Table de décision par collection

---

### 4.2 — Outbox atomique généralisée (3 jours)

**Contexte** : `src/lib/offline/offline-store.ts` existe mais utilisé qu'à 1 endroit.

**À faire** :
- [ ] Extraire `OutboxService` réutilisable
- [ ] Contrat : `outbox.enqueue({ op, path, data, eventId })` → garantie ordre + idempotence
- [ ] Worker qui vide la file quand `navigator.onLine === true`
- [ ] Retry exponentiel + DLQ après N tentatives (câbler avec `OpsAlertGateway`)
- [ ] Tests unitaires + intégration

**DoD** : couverture > 90%, scénarios "flap réseau" testés.

---

### 4.3 — Idempotence normalisée (1 jour)

**Contexte** : ADR-001 exige `eventId` normalisé, à vérifier partout.

**À faire** :
- [ ] Auditer toutes les `Nexus.adapter.set` / `.create` / `.update` sans `eventId`
- [ ] Ajouter middleware NexusInterceptor qui refuse une écriture sans `eventId` sur collections critiques
- [ ] Test : rejouer 100 fois la même écriture → 1 seul doc créé

**DoD** : test idempotence vert sur `orders`, `journalEntries`, `stockMovements`.

---

### 4.4 — TimeSync partout (½ jour)

**À faire** :
- [ ] Grep `new Date()` dans le code métier — remplacer par `TimeSync.now()` là où l'ordre compte
- [ ] Test : divergence horloge client de +10s → serveur re-normalise

**DoD** : audit `rg "new Date\(\)" src/modules` → seulement usage cosmétique (UI display).

---

### 4.5 — Convention ID globale (½ jour)

**Contexte** : chaque module génère ses IDs à sa façon.

**À faire** :
- [ ] Décider : ULID (triable, unique offline) ou nanoid + timestamp
- [ ] `Nexus.adapter.generateId()` utilise la convention choisie partout
- [ ] Migration : IDs existants restent, nouveaux respectent la convention

**DoD** : `IDService.ts` unifié, doc courte du choix.

---

### 4.6 — Schéma versionné (2 jours)

**À faire** :
- [ ] Ajouter `_schemaVersion: number` dans tous les schémas Zod critiques (`orders`, `products`, `reservations`, `users`)
- [ ] Middleware read qui migre v(N-1) → v(N) à la volée
- [ ] Test : doc v1 arrivant dans une app v2 → lecture OK

**DoD** : test migration passe pour au moins 3 schémas.

---

## 🌊 VAGUE 5 — `useSovereignCollection` (Semaines 9-14)

**Le fameux hook unifié Jotai + Dexie + Firestore.**

### 5.1 — Prototype sur un pilier bas risque (1 sem)

**Cible** : `commerce/reservations` (peu de fiscal, cycle simple).

**À faire** :
- [ ] Créer `src/kernel/hooks/useSovereignCollection.ts`
- [ ] API :
  ```ts
  const { data, isLoading, isSyncing, error, set, delete: del } = useSovereignCollection('reservations');
  ```
- [ ] Lecture : atome Jotai en premier, Dexie fallback, Firestore watcher en background
- [ ] Écriture : atome + Dexie + outbox → cloud
- [ ] Refuser les collections `NF525_IMMUTABLE_COLLECTIONS` (throw dev, log prod)
- [ ] Feature flag `SOVEREIGN_COLLECTION_ENABLED_MODULES` (env)

**DoD** : le module `reservations` refactoré, tous ses tests passent.

---

### 5.2 — Métriques de perf établies (2 jours)

**Avant migration élargie** :
- [ ] Instrumenter le hook : temps read, hit ratio cache, taille outbox, temps sync
- [ ] Dashboard MCC dédié
- [ ] Baseline : mesurer avant/après sur reservations

**DoD** : graphique montrant amélioration/régression sur 3 métriques clés.

---

### 5.3 — Migration progressive des piliers (4 sem, 1 pilier / sem)

**Ordre proposé (moins à plus critique)** :
1. `commerce` (déjà fait via reservations)
2. `logistics` (stock, procurement)
3. `human` (RH, paie)
4. `compliance` (HACCP, RGPD)
5. `facility` (spaces, maintenance)
6. `intelligence` (analytique)
7. `ops` (POS, KDS) — le plus critique, en dernier
8. `finance` — **JAMAIS pour les collections fiscales** (WORM), seulement pour les brouillons

**Par pilier** :
- [ ] Migrer les hooks existants un par un
- [ ] Supprimer les atomes Jotai redondants
- [ ] Confirmer tests verts + smoke test manuel
- [ ] Rollback plan documenté

**DoD par pilier** : 100% des composants du pilier utilisent le hook, ancien code supprimé.

---

## 🎁 BONUS — Chantiers hors vagues (à intégrer en Boy Scout)

### B.1 — Découpe God Files (permanent)
- Règle : quand tu passes sur un fichier > 400 lignes pour autre chose, envisager la découpe
- Ne PAS créer de sprint dédié
- Piège : ne pas recréer des cycles (Grade X à préserver)

### B.2 — Documentation utilisateur (2 semaines, non urgent)
- Guides démarrage caisse / KDS / HACCP
- Vidéos courtes (< 90s) par feature
- Requis avant démo commerciale

### B.3 — Complétion §8.6 généralisation (mémoire)
- Teintures kernel/settings restantes (`cuisineType`, `restaurantName`)
- Modules vides critiques (`appointments`, `consultation`)

### B.4 — Nettoyage doublons verticals/ (référence `project_handoff_plan`)
- Dette P0→P3 engines/, doublons verticals/
- À rapatrier module par module

---

## 📈 Métriques de succès globales

| Métrique | Baseline (2026-08) | Cible Vague 5 |
|----------|--------------------|--------------|
| Chunks initiaux `/pos` gzipped | ~600 KB | < 300 KB |
| FCP `/pos` sur tablette 4G | inconnu | < 1s |
| Perte de données en scénario offline (10 min) | non testé | 0 doc perdu |
| Bugs runtime API (mismatch schema) | ~5/sem estimé | < 1/mois |
| Temps dev pour une nouvelle feature CRUD | ~3h | ~30 min |
| Backup automatique quotidien | 0% | 100% flotte |
| Alertes ops arrivant à l'oncall | 0 (silencieux) | 100% incidents critiques |

---

## ⚠️ Ce qu'il ne faut PAS faire

- ❌ **Sauter la Vague 4** pour aller direct à la 5 → perte de données garantie
- ❌ **Migrer les 8 piliers en un sprint** pour la V5 → rollback impossible
- ❌ **Inclure les collections fiscales dans le hook unifié** → NF525 mort
- ❌ **Créer un chantier "refactor God Files"** dédié → yak-shaving stérile
- ❌ **Faire tRPC/Hono migration complète** → 6+ sem pour un ROI douteux vs Zod→OpenAPI
- ❌ **Ajouter des features avant V1+V2** → maintenance impossible

---

## 🔄 Suivi

- **Statut par vague** : à mettre à jour ici à chaque clôture (voir Vague 1 → Vague 5)
- **Décisions structurantes** : ajouter un ADR dans `docs/adrs/`
- **Mémoire long-terme** : bumper `MEMORY.md` quand une phase change l'invariant de collab

---

**Prochaine action recommandée** : Vague 1.1 (nettoyage racine, 30 min).
