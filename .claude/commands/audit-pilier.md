---
description: Audit exhaustif d'un pilier (ops/commerce/finance/compliance/human/logistics/intelligence/facility) via routage NexusCoder optimal.
---

# /audit-pilier $ARGUMENTS

Audit exhaustif du pilier `$ARGUMENTS` en minimisant les tokens.

## Séquence obligatoire

**1. Charger le contexte projet** (memory Restaurant OS)
- Lire `~/.nexuscoder/domain-facts.yml` (section `auto_inject` pour `src/modules/$ARGUMENTS/`)
- Lire `.claude/sessions.md` pour voir les audits précédents sur ce pilier

**2. Structure — Graphify d'abord** (jamais grep, jamais Read)
```
graphify query "communities and public API of pilier $ARGUMENTS in src/modules/$ARGUMENTS"
```
→ Identifie les modules du pilier, leurs domaines, leurs points d'entrée (barrel exports).

**3. Dette architecturale — ast-grep** (structural, pas textuel)
```
ast-grep -p "from '@/modules/$ARGUMENTS/$$_/$$_'" -l ts src/    # violations barrel
ast-grep -p 'as Microunits' -l ts src/modules/$ARGUMENTS/       # casts illégaux
ast-grep -p 'priceInCents' -l ts src/modules/$ARGUMENTS/        # legacy cents
```

**4. Impact/refs des exports publics — Serena**
Pour chaque symbole exporté du barrel : `find_references` (pas de source, juste positions).

**5. Sources verbatim — CodeGraph SEULEMENT si édition nécessaire**
Si l'audit doit **modifier** du code : `codegraph_explore` sur les symboles précis.
Sinon SKIP CodeGraph (économie 15-24k tok).

**6. Synthèse priorisée + certitude qualifiée**
Format : P0 (bloquants) → P1 (dette critique) → P2 (dette architecturale) → P3 (cosmétique).
Chaque finding DOIT porter un niveau de certitude :
- 🎯 **CONFIRMÉ** : bug visible dans le source, actionnable
- 🔍 **PROBABLE** : pattern suspect, exige vérification (nommer laquelle)
- ❓ **HYPOTHÈSE** : soupçon, à valider avant d'agir (nommer comment)

Format ligne : `### [emoji] N. Titre — [file:line](path#Lxx)` + explication 2-3 lignes + action requise si non-CONFIRMÉ.

## Discipline

- Interdiction : `Read` sur les fichiers déjà retournés par CodeGraph.
- Interdiction : `grep` sur `src/` complet — toujours scoper à `src/modules/$ARGUMENTS/`.
- Interdiction : synthèse >2000 tokens sauf demande explicite.
- Auto-injection des facts pertinents (nf525-chain si finance, event-bus-priorities si orchestration, etc.)
