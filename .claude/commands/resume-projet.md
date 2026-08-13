---
description: Recharge le contexte projet en <5k tokens au lieu de ~30k de re-lecture.
---

# /resume-projet

Reprise rapide du contexte Restaurant OS Core.

## Séquence

**1. Sessions actives** (coordination multi-sessions)
```
cat .claude/sessions.md | head -60
```
- Identifier les sessions `active` et leur périmètre.
- Alerter si conflit potentiel avec la nouvelle demande.

**2. Dette actuelle** (via memory)
- Charger `~/.nexuscoder/domain-facts.yml` section `pieges-cours` (findings audit récent).
- Charger `MEMORY.md` (~/.claude/projects/.../memory/) pour préférences utilisateur.

**3. État git** — 1 seule commande
```
git status --short && echo "---" && git log --oneline -5
```

**4. Architecture rappel** — auto-injecté depuis `piliers-8` + `canaux-cross-module`.

**5. Verdict**
- Ce qui est en cours (sessions active)
- Ce qui bloque (pieges-cours, dette P0)
- Prêt à recevoir la demande utilisateur

## Interdiction

- **Aucun** `Read` de fichiers source pendant `/resume-projet`.
- **Aucun** `codegraph_explore` ni `graphify query`.
- Objectif : <5k tokens totaux pour la reprise.
