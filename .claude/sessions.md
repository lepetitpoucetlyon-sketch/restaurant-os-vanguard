# Sessions Claude Code Actives

> **Protocole automatique** — chaque session Claude Code doit :
> 1. Lire ce fichier AVANT toute action
> 2. Ajouter sa ligne au tableau ci-dessous
> 3. Vérifier qu'aucune session `active` ne couvre le même périmètre
> 4. Passer en `terminée` à la fin du travail
>
> Le hook `.claude/hooks/check-session-collision.sh` alerte en cas de collision sur Edit/Write.

---

## 🟢 Sessions Actives

| Session | Périmètre | Démarrage | Status |
|---|---|---|---|
| `plan-master-v1` | Vague 1 : Hygiène, Backup Cron, Env Example, Sessions | 2026-08-20 | **active** |
| `audit-holistique-readonly` | Audit global lecture seule (rapport AUDIT-HOLISTIQUE-2026-08-22.md) — preflight ROUGE [1]tsc+[3]barrel, reste vert | 2026-08-22 | terminée |
| `angles-morts-m101-m110` | Matrice M101-M110 + batch2 (35 services) + batch3 (19 services) — 71 items clos, 169 tests, 0 erreur TS | 2026-08-21 | **terminée** |

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
