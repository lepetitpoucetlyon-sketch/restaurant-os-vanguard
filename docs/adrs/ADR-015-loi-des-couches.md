# ADR-015 — La loi des couches (kernel / lib / shared / modules)

- **Statut** : Accepté — 2026-08-22
- **Contexte source** : `AUDIT-HOLISTIQUE-2026-08-22.md` + `PLAN-RECOLLAGE-2026-08-22.md`

## Problème
Trois couches transversales — `src/kernel/`, `src/lib/`, `src/shared/` — hébergent les **mêmes** concepts (`contracts`, `schemas`, `events`, `hooks`, `providers`, `nexus`). Conséquence : « où va X ? » est indécidable → les imports fuient. Mesuré à l'audit : **323 violations de frontière** en production. `src/shared/` a atteint ~640 fichiers alors qu'un chantier (branche `agent/antigravity-exec`) l'avait vidé à 3 — vidage **jamais mergé** sur `main`, écrasé par la « REBIRTH ».

## Décision — on passe de TROIS cœurs à DEUX

| Couche | Responsabilité UNIQUE | Peut importer | Ne contient JAMAIS |
|---|---|---|---|
| `kernel/` | Machine Nexus : adapter, guards, contrats runtime, primitives, types d'events, hooks & providers **core** | (rien de `modules/`, `lib/`, `shared/`) | logique métier |
| `lib/` | Services transversaux non-métier (cron, sync, seeds, mcc, adapters, services outils) | `kernel/`, autres `lib/` | UI, atomes de pilier, contrats |
| `modules/<pilier>/` | Métier, exposé via le barrel racine `@/modules/<pilier>` | `@/modules/<autre>` (barrel), `kernel/`, `lib/` | import profond d'un autre pilier |
| `shared/` | **EN EXTINCTION** — à terme : `schemas/` (primitives gelées) + `components/` (design system) uniquement | — | `nexus`, `hooks`, `providers`, `eventBus` (→ à migrer) |

### Sort de `src/shared/` (dérivé de la move-map de la branche + audit)
- `shared/nexus/` (127) → `kernel/nexus/` — **règle prouvée compilable** par la branche.
- `shared/eventBus/` (212) → `src/orchestration/` (couche assumée et **nommée**), sinon figée.
- `shared/components/` (163) → `src/design/` (design system assumé), sinon figée.
- `shared/hooks/` (46) · `shared/providers/` (27) → trier core→`kernel/`, métier→`modules/`.
- `shared/schemas/` (3) → **reste** (primitives gelées).

## Enforcement (non négociable)
1. `no-restricted-imports` (Barrel) et `vanguard/no-inter-module-imports` = **`error`**. Ratchet à **0**, ne peut que **descendre**.
2. **Interdit de faire passer une gate en la desserrant.** Ajouter un chemin à une exemption `no-restricted-imports: "off"`, relever un ratchet, poser `@ts-ignore`/`eslint-disable`/`as any` pour masquer une erreur, `skip`/supprimer un test, ou éditer à la main un tableau de résultats → **violation**, détectée par `scripts/verify-gate-integrity.mjs`. Voir `AGENTS.md`.
3. Les exemptions barrel **actuelles** (`src/kernel/ai/**`, `src/shared/eventBus/**`, `src/shared/hooks/**`, `NexusTelemetryService`, `MaintenanceAgent`) sont de la **DETTE à supprimer** — pas un acquis. Le baseline `.gate-baseline.json` ne peut que diminuer.

## Conséquences
- **+** « où va X ? » a une seule réponse ; les fuites deviennent impossibles (gate) ; une IA qui code repart d'une carte vraie.
- **−** chantier de rapatriement étalé (voir `PLAN-RECOLLAGE`), gate verte entre chaque étape.
