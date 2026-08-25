# Health Dashboard — RESTAURANT-OS-CORE

> Auto-généré le **2026-08-25 07:19 UTC** · commit `727373f34`
> Source : `scripts/health-snapshot.sh` (hook post-commit)

## Gate sécurité structurelle

| Métrique | Valeur | Gate |
|---|---|---|
| Sentrux gate vs baseline | ✅ | bloquant au push |
| Score qualité | 3258 -> 3259 | |
| Couplage | 0.45 → 0.45 | |
| Cycles import | 2 → 2 | max = 0 |
| God files | 18 → 18 | max = 0 |
| TypeScript erreurs | 0 | bloquant au push |

## Indicateurs de dette technique

| Dette | Mesure |
|---|---|
| Fichiers encore en `*InCents` (migration microunits) | ~496 occurrences |
| Imports profonds (barrel violations) | ~48 |
| Tests | (voir CI) |

## Lectures utiles

- Architecture complète : `ARCHITECTURE.md`
- Conventions et règles : `CLAUDE.md`
- Sessions en cours : `.claude/sessions.md`
- Plan audit 2026-08-25 : `docs/plans/GRAPHIFY-CODEGRAPH-AUDIT-2026-08-25.md`

## Interprétation rapide

```
Sentrux gate ✅ + tsc 0 erreurs = codebase stable, commit sûr
Sentrux gate ❌ = régression structurelle introduite → à corriger avant push
Cycles > 0     = risque TDZ en SSR (Cannot access X before initialization)
InCents élevé  = migration microunits incomplète (P2 en cours)
```
