# Sessions Actives (TOUS agents : Antigravity · Claude Code · Cursor · Copilot)

> **Protocole obligatoire — cf. AGENTS.md Loi 6.** Tout agent qui écrit ici doit :
> 1. **Lire** ce fichier AVANT toute action.
> 2. **S'inscrire** : nom court, périmètre **avec chemins explicites** (`src/modules/...`, `scripts/...`) — un périmètre en prose sans chemin ne protège rien, date, status `active`.
> 3. **Vérifier les collisions** : si une autre session `active` déclare un chemin que tu vas toucher → STOP, se coordonner ou demander à l'humain. Ne jamais écraser.
> 4. **Tenir les autres au courant** : mettre à jour ta ligne au fil de l'eau (progrès, fichiers clés), pas seulement au début. Passer à `terminée` à la fin.
> 5. **Claude Code uniquement** : écrire son nom dans `.claude/.active-session` (gitignoré). Le hook `PreToolUse` `.claude/hooks/check-session-collision.sh` (branché dans `.claude/settings.json`) **BLOQUE** (exit 2) toute écriture dans le périmètre d'une autre session active.
>
> Garde inter-agents commune = hook `pre-commit` (tout `git commit`) + ce fichier + `AGENTS.md`.

---

## 🟢 Sessions Actives

| Session | Périmètre | Démarrage | Status |
|---|---|---|---|
| `antigravity-profondeur` | Items 1 & 4 faits & committés. Aucune activité/commit observés depuis → mis en pause pour reprise des items 2/3 par Claude Code (accord utilisateur "go"). | 2026-08-22 | en pause |
| `item2-3-perf-parite` (Claude Code) | Item 2 (bundle : `scripts/preflight.sh`, `.gate-baseline.json`, lazy-load modules lourds) + Item 3 (parité verticales : `src/verticals/gym|coworking|florist|veterinary/`, `docs/PLAN-RESTE-PROFONDEUR-2026-08-22.md`). | 2026-08-22 | active |
| `coordination-hooks` (Claude Code) | Synchro inter-agents : hook bloquant `PreToolUse` branché+testé, `AGENTS.md` Loi 6, protocole `sessions.md`. Vérif Antigravity items 1&4 (tsc 0, inter-module 0, cycles 0, 1968 tests). | 2026-08-22 | terminée |
| `profondeur-track1-track4` (relais Claude Code, Antigravity à l'arrêt) | Track 1.3 + Track 2 + Track 3 (4 verticales + démos) faits — reste 1.1 (ADR bloquant), 1.2 (bundle), 4.1/4.3 (doc+freeze) | 2026-08-22 | terminée (partielle, cf. commits) |
| `plan-master-v1` | Vague 1 : Hygiène, Backup Cron, Env Example, Sessions | 2026-08-20 | terminée |
| `valo-ip-groundtruth` | Analyse lecture seule métriques codebase + rédaction valorisation IP/financière (docs/ uniquement) | 2026-08-22 | terminée |
| `audit-holistique-readonly` | Audit global lecture seule (rapport AUDIT-HOLISTIQUE-2026-08-22.md) — preflight ROUGE [1]tsc+[3]barrel, reste vert | 2026-08-22 | terminée |
| `angles-morts-m101-m110` | Matrice M101-M110 + batch2 (35 services) + batch3 (19 services) — 71 items clos, 169 tests, 0 erreur TS | 2026-08-21 | **terminée** |
| `verif-plan-deteinture` | Vérification lecture seule état plan Dé-Teinture Sectorielle (§8.6) — pas d'édition de code | 2026-08-22 | terminée |
| `forge-stack-p0-p1` (Claude Code) | MEGA-PLAN Forge Stack — P0 (scrape réel : `CompanyScrapeAgent.ts`, `companyProfile.ts`, route preview-only, suppression `DigitalDnaCrawlerService.ts` + test) + P1 (`CapabilityWiring.ts` 45 caps, `SectorStudyStore.ts` persistance MCC, `--persist` sur `study-sector.ts`). 65 tests ajoutés (42 scrape + 11 wiring + 12 store). Preflight vert (tsc 0, 2024/2025 tests, sentrux baseline inchangé). | 2026-08-22 | terminée |
| `forge-stack-p2-p6` (Claude Code) | MEGA-PLAN Forge Stack — refonte plan (§C.9 BlindSpotDetector + §C.10 Couche de Dérivation) puis exécution linéaire : P2bis (`src/verticals/_shared/blind-spot/`), P2a (`src/verticals/_shared/derivation/`, `src/modules/commerce/acquisition/onboarding/qualification/`), P2b/c/d (13 dériveurs), P3 (`src/verticals/_shared/forge/templates/`, extension `generateVertical`), P4 (`src/shared/plugins/`, `resolveUI`), P4bis (`src/kernel/settings/displayDepth.ts`), P5 (`src/verticals/_shared/catalog/derivations.ts`), P6 (`scripts/certify-vertical.ts`). Ne touche PAS `scripts/preflight.sh` ni `src/verticals/{gym,coworking,florist,veterinary}/*.blueprint.ts` (protégé par `item2-3-perf-parite`). | 2026-08-23 | active |

---

## 📦 Historique Récent (Dernières sessions clôturées)

| Session | Périmètre | Date | Status |
|---|---|---|---|
| `angles-morts-prereq` | ADR-014 : 4 fondations consolidées (CrossScope persist, Outbox P2/P3, AuditLogger hash chain, DLQ batch/export) — 26 tests | 2026-08-21 | terminée |
| `sovereign-migration-phase-3-4-5` | ADR-011/012/013 : logistics (2) + commerce (3) + facility (2) migrés — 35 tests, migration progressive TERMINÉE | 2026-08-21 | terminée |
| `public-access-toggle` | MCC kill-switch landing + signup public (schema + route + Gate + panel + 9 tests) | 2026-08-21 | terminée |
| `ops-sovereign-migration` | ADR-010 Phase 2 : 3 adapters ops (orders + tables + reservations) + OrdersLiveBoard KDS + 22 tests | 2026-08-21 | terminée |
| `finance-sovereign-migration` | ADR-009 Phase 1 : useSovereignExpenseClaims + ExpenseClaimsList + 8 tests (1er pilier migré) | 2026-08-21 | terminée |
| `signup-tests-coverage` | Tests unitaires /api/signup (13) + /api/billing/signup (14) — Plan Master P1.3, 27 tests verts | 2026-08-21 | terminée |
| `ai-scope-isolation-finish` | Phase C+E ADR-008 : 5 callers tenant migrés, TenantAIConfigPanel, tests multi-vertical + E2E (135 tests IA verts) | 2026-08-21 | terminée |
| `h2-h3-certif` | Chantiers H2 & H3 : API v1, QR Ordering, Multi-Verticales | 2026-08-20 | terminée |
| `zero-cycles-sovereignty` | Éradication totale des 427 cycles de dépendances (Madge = 0) | 2026-08-20 | terminée |
| `code-splitting-dlq-rbac` | Chantiers γ-7, β-2, γ-3 (Code Splitting, DLQ, Matrice RBAC) | 2026-08-19 | terminée |
| `mcc-sprint-finish` | AdminLayout roles, fiscal emit, health ping, CLI | 2026-08-06 | terminée |
| `onboarding-finish` | Guides export, tests importers, floor-plan wizard, E2E | 2026-08-06 | terminée |
| `nf525-remediation` | Remédiation NF525 Grade X : FiscalSealer, TicketZHandler | 2026-08-06 | terminée |
