---
description: Blast-radius d'un symbole via Serena LSP (léger, ~400 tok au lieu de 15-24k avec CodeGraph).
---

# /impact $ARGUMENTS

Analyse d'impact du symbole `$ARGUMENTS` — callers, callees, tests couvrants.

## Séquence

**1. Serena find_references** — retourne les positions (file:line), pas la source.
```
serena find_references "$ARGUMENTS"
```

**2. Serena find_symbol** — définition + type signature seulement.

**3. Regroupement**
- Callers (qui appelle ce symbole)
- Callees (que ce symbole appelle)
- Tests trouvés dans `__tests__/`, `*.test.ts`, `*.spec.ts`
- Fichiers dans lesquels ce symbole apparaît

**4. Verdict blast-radius**
- 🟢 Local (1-3 callers) : safe à modifier
- 🟡 Modéré (4-15 callers) : vérifier chaque caller
- 🔴 Étendu (>15 callers) : plan de refactor progressif

## Interdictions

- **Pas** de `codegraph_explore` — Serena suffit pour cette question.
- **Pas** de `Read` sur les callers — la liste des `(file:line)` suffit à décider.
- **Pas** de source verbatim sauf si l'utilisateur demande explicitement.
