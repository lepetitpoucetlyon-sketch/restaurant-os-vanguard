# Findings — run du 2026-06-15 — cible : « cycle de barrel des contrats »

## Contexte

Run de dogfood du workflow ICM sur la cible signalée en fin de session précédente :
une SCC de 8 fichiers dans la couche contrats
(`contracts/index ↔ nexus-internal-mapper ↔ finance.types ↔ pos ↔ ops/engine/types ↔ …`).

## Mesures

Reconstruction du graphe d'imports restreint aux 8 fichiers, puis recherche de cycle.

Cycle simple « trouvé » au départ :
```
domain/schemas/finance.ts
  → shared/nexus/contracts/index.ts        ← arête suspecte
  → shared/nexus/contracts/nexus-internal-mapper.ts
  → shared/nexus/contracts/finance.types.ts
  → domain/schemas/finance.ts              ← arête suspecte
```

## Verdict de l'audit : **FAUX POSITIF — aucun cycle réel**

Les deux arêtes « suspectes » n'existent pas dans le code exécuté : ce sont des
**exemples `import` dans des commentaires JSDoc**.

1. `src/domain/schemas/finance.ts` (~L18) :
   ```
    * Pour le type de stockage/affichage, utiliser :
    *   import type { JournalEntry } from '@nexus/contracts'   (finance.types.ts)
   ```
2. `src/shared/nexus/contracts/finance.types.ts` (~L45) :
   ```
    * Pour la validation d'entrée (API, Bridge NF525), utiliser :
    *   import { JournalEntrySchema } from '@/domain/schemas/finance'
   ```

Preuve mesurée : sur **2533** arêtes d'import du repo, **2 seulement** proviennent de
commentaires (ces deux-là). En les retirant (dépouillement des commentaires avant scan) :

```
SCC cycliques (>1) sur 1011 fichiers : 0
```

Les 2531 vraies arêtes sont conservées par le dépouillement → le scanner n'est pas trop
agressif ; ces 2 fausses arêtes suffisaient à fermer une SCC fantôme de 8 fichiers.

## Cause racine

L'outil de scan ad-hoc utilisé en fin de session précédente suivait les `export … from`
(bien) **mais ne dépouillait pas les commentaires** (mal). D'où une arête fantôme
`finance.ts → @nexus/contracts` lue dans un JSDoc.

⚠️ Correction d'honnêteté : l'affirmation « 1 cycle de barrel préexistant » du rapport
précédent était **erronée**. Le compte réel de cycles est **0**.

## Recommandation

- **Aucun refactor de code requis** : il n'y a pas de cycle. → *Dismissal* au gate (le run
  s'arrête ici, conformément au principe ICM « support efficient dismissal »).
- Les deux commentaires sont de la **documentation correcte et utile** : ne pas les mutiler
  pour plaire à un scanner naïf.
- Corriger `ARCHITECTURE.md §9` (retirer le faux cycle).
- Pour l'outillage : se fier à `sentrux` (qui parse le TS, pas du regex) comme autorité ;
  tout scanner maison doit dépouiller commentaires **et** chaînes avant de compter les arêtes.

## Gate humain

Rien à merger. Confirmer la lecture, mettre à jour la doc, clore le run.
