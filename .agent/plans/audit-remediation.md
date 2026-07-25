# Plan Profond — Remédiation Audit RESTAURANT-OS-CORE

> Audit réalisé le **2026-07-18**. Base : 139 755 LOC, 1 215 fichiers, 0 erreur TS, 239/240 tests verts.
> Traitement **1 par 1**, du plus critique au plus léger. Chaque item coché est vérifié (tsc + test si applicable).

---

## 🎯 Objectif
Corriger les 4 failles de sécurité réelles, casser le cycle d'architecture, réaligner les conventions (microunits, scratch/, test seeder) remontées par l'audit multi-axes (vitest + sentrux + scans statiques).

---

## ✅ Checklist de remédiation

### 🔴 Sécurité (priorité 1)
- [x] **S1 — SSRF `/api/print/network`** ✅ : ajout `requireTenantUser` + allowlist IPv4 RFC1918 (bloque loopback + metadata cloud 169.254.169.254) + allowlist ports impression (515/631/9100-9109). Callers client (`NetworkAdapter.ts`, `CashDrawerService.ts`) passés en `authedFetch`. tsc ✅.
- [x] **S2 — `/api/crm/campaign` sans guard** ✅ : ajout `requireTenantAdmin` + query scopée `tenants/${tenantId}/customers` (corrige aussi une fuite cross-tenant). Callers (`EmailCampaign.tsx`, `MigrationEmailTemplate.tsx`) en `authedFetch`. tsc ✅.
- [x] **S3 — `/api/email/reservation-confirm` sans guard** ✅ : double autorisation — secret interne `INTERNAL_API_SECRET` (widget booking serveur) OU `requireTenantUser` (staff). Widget passe le header, page staff en `authedFetch`. tsc ✅. ⚠️ **env à définir** : `INTERNAL_API_SECRET`.
- [x] **S4 — `/api/ai/review-response` sans guard** ✅ : ajout `requireTenantUser`. Caller (`GoogleReviews.tsx`) en `authedFetch`. tsc ✅.
- [x] **S5 — `npm audit`** ✅ : `npm audit fix` non-breaking appliqué → **42 → 20 vulns** (critique + 7 hautes résolues). Restantes = 20 moderate en deps transitives Google Cloud (`teeny-request`/`uuid`/`retry-request`) nécessitant `--force` (risque Firestore) → **laissé en attente d'arbitrage**.

### 🟠 Architecture (priorité 2)
- [x] **A1 — Cycle télémétrie** ✅ : cassé par **inversion de dépendance** sur l'arête `shared/telemetry → domain/telemetry`. Le wrapper shared (importé par `NexusInterceptor`) n'importe plus le service domaine ; il expose `registerAuditPulseSink()` et le service domaine s'enregistre à son init. Executor restauré en import statique. sentrux `max_cycles` = **0** ✅, tsc ✅, tests télémétrie 17/17 ✅. *(Note : sentrux compte les `import()` dynamiques comme arêtes — le lazy import ne suffisait pas, d'où l'inversion.)*
- [ ] **A2 — God files** (fan-out > 15) : `settings/page.tsx` (19), `pos/page.tsx` (18), `NexusSyncService.ts` (16), `PaymentTerminalService.ts` (16). *(chantier lourd — à planifier séparément, pas dans ce sprint)*
- [ ] **A3 — Complexité cyclomatique** : 14 fonctions cc>20, majorité Python RAG (`retrieval.py:query` cc=116). *(chantier séparé)*

### 🟡 Conventions (priorité 3)
- [x] **C1 — `as Microunits` direct** ✅ : `FinanceTool.ts` → `toMicrounits()` (import `Microunits` inutile retiré). tsc ✅.
- [x] **C2 — `scratch/` commité** ✅ : ajouté à `.gitignore` + `git rm -r --cached scratch/` (13 fichiers désindexés, conservés sur disque). Opération locale.
- [x] **C3 — `deleteJournalEntry`** ✅ : 0 impl / 0 appelant → retiré des 2 interfaces (finance.types.ts, modules/finance/types.ts) avec commentaire NF525. **Observation suivi** : `updateJournalEntry` est aussi mort (0 appelant) — laissé en place (updates de brouillons non-scellés potentiellement légitimes, hors périmètre).

### 🟢 Tests / Dette (priorité 4)
- [x] **T1 — Test seeder** ✅ : cause réelle = `'1234'` blacklisté par `validatePin`, remplacé par PIN aléatoire → assertion `pin:'1234'` ne matchait plus. Corrigé avec PIN valide `'2580'`. 4/4 tests verts.
- [ ] **T2 — Nettoyage** : 7 `console.log` prod, 3 `as any`, 29 TODO/FIXME. *(cosmétique, à traiter au fil)*

---

## 📊 Résumé exécutif de l'audit

| Axe | Résultat |
|-----|----------|
| TypeScript | ✅ 0 erreur |
| Tests | 🟡 239/240 (1 test obsolète, pas une régression) |
| Sentrux | 🔴 3 violations (1 cycle, 4 god files, 14 cc) |
| Sécurité routes | 🔴 4 routes sensibles non authentifiées + 1 SSRF |
| Dépendances | 🔴 42 vulns (1 critique) |
| NF525 | ✅ Immutabilité respectée |
| Multi-tenancy | ✅ Pas de tenantId hardcodé illégitime |
| Dette | 🟢 Faible (0 @ts-ignore, 3 as any) |

---

## 📝 Journal d'exécution

- **2026-07-18** — Plan créé, audit consolidé.
- **2026-07-18** — Remédiation exécutée 1 par 1 :
  - Sécurité : S1 (SSRF print/network), S2 (crm/campaign + fuite cross-tenant), S3 (email/reservation-confirm), S4 (ai/review-response), S5 (npm audit 42→20). ✅
  - Conventions : C1 (toMicrounits), C2 (scratch/ désindexé), C3 (deleteJournalEntry retiré). ✅
  - Tests : T1 (seeder PIN blacklist). ✅
  - Archi : A1 (cycle télémétrie cassé par inversion de dépendance). ✅
  - **État final : tsc 0 erreur · vitest 240/240 · sentrux cycles 0** (restent A2 god files + A3 complexité, différés).

## 🔜 Reste à arbitrer (chantiers séparés)
- **A2** — 4 god files (fan-out > 15) : découpage `settings/page.tsx`, `pos/page.tsx`, `NexusSyncService.ts`, `PaymentTerminalService.ts`.
- **A3** — 12 fonctions cc>20 (surtout Python RAG `retrieval.py` cc=116).
- **S5-bis** — 20 vulns moderate résiduelles (deps Google Cloud) → décision `npm audit fix --force` (risque Firestore).
- **Env** — définir `INTERNAL_API_SECRET` en prod (sinon l'email de confirmation widget public est skippé — booking non bloqué).
- **T2** — 7 console.log prod (aucun dans le code neuf), 3 as any, 29 TODO (cosmétique).
- **Lint** — 16 warnings `no-unused-vars` résiduels (non bloquants, `--quiet` OK) : args/vars à préfixer `_` ou retirer.

## 🔎 Passage qualité (2026-07-18)
Vérification complète du codebase après remédiation :
- **tsc** : 0 erreur ✅
- **vitest** : 240/240 ✅
- **ESLint** : **11 erreurs → 0** (10 imports/`prefer-const` auto-fixés ; 1 vraie anti-pattern React `react-hooks/static-components` dans `BarRecipeCard.tsx` corrigée via `createElement` pour l'icône dynamique). Reste 16 warnings non bloquants.
- **sentrux** : 0 cycle ✅ ; restent 4 god files + 12 fn cc>20 (A2/A3 différés).
- **release:check** : le gate ESLint (`--quiet`) passe désormais.
- **Observation** — `updateJournalEntry` mort (0 appelant), à évaluer vs NF525.
