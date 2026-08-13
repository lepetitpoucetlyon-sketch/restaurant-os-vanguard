---
description: Comprendre un flux métier — Graphify d'abord (structure), CodeGraph seulement si édition prévue.
---

# /comprendre $ARGUMENTS

Explique le flux/mécanisme `$ARGUMENTS` en minimisant les tokens.

## Séquence en 2 phases

**Phase 1 — Graphify structure (~500-2k tok)**
```
graphify query "$ARGUMENTS"
graphify path <entry_point> <end_point>   # si flux A→B identifiable
```
- Retourne : sous-graphe scopé (nœuds + relations), pas de source.
- Suffit pour 70% des questions "comment ça marche".

**Phase 2 — CodeGraph source (15-24k tok) UNIQUEMENT SI :**
- L'utilisateur va **modifier** du code après cette explication
- Un détail d'implémentation critique n'est pas déductible du graphe (hash, algorithme, formule)
- Sinon **STOP à Phase 1**

## Synthèse attendue

- Diagramme ASCII ou liste des étapes (5-10 étapes max)
- Symboles clés cliquables `[FunctionName](file:line)`
- Invariants domaine pertinents (auto-injectés depuis `domain-facts.yml`)
- SI Phase 2 : extraits de source verbatim ligne-numérotés

## Interdiction

- Pas de `Read` complet en Phase 1.
- Pas de `codegraph_explore` avec `maxFiles > 6` (budget serré).
- Pas de synthèse >3000 tokens sauf demande explicite.
