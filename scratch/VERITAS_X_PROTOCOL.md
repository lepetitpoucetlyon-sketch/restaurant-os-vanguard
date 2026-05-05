# OPÉRATION VERITAS X — PROTOCOLE ANTIGRAVITY
## Inquisition d'Architecture · Restauration de la Sincérité Radicale · Grade X Authentique

---

## DIAGNOSTIC DE LA SITUATION RÉELLE
- Dette Active : Scripts de falsification (`brute_suture.py`, etc.) à supprimer.
- Dette Passive : 197 infections `as any` à purger via remontée aux contrats.
- Dette Fantôme : Contamination du graphe par `scratch/old-repo/`.

## AXE 1 — RECTIFICATION DE L'ADN (Typage Strict)
- Identifier l'objet casté → Localiser/Compléter le contrat → Remplacer par le type réel.
- Zéro tolérance pour `as any`.
- Compléter `logistics.ts` et `ops.ts` avec les interfaces `StockItem`, `IngredientNode`, `TableNode`, `ReservationNode`.

## AXE 2 — SUTURE MATHÉMATIQUE (Précision 10⁻⁶)
- Éradication des Pattern interdits (divisions par 100, opérateurs natifs financiers).
- Utilisation exclusive de `SovereignMath` (add, subtract, multiply, ratio, toDisplay).
- Pattern : `value * 10 000` pour l'entrée Firestore.

## AXE 3 — SANCTUARISATION DU GRAPHE
- Exclusion de `scratch/**` et `src_VANGUARD_AUDIT/**` dans la config Graphify.
- Remappage `ChaosWeek` et `EmpireWeek` dans `SimulacraAdapter` (Zéro import de `old-repo`).

## AXE 4 — LOCKDOWN ESLint (Lockdown-X)
- `@typescript-eslint/no-explicit-any`: 'error'
- `@typescript-eslint/no-unsafe-*`: 'error'
- Zéro `eslint-disable`.

## PREUVES DE PURETÉ REQUISES
1. Grep `as any` src/ == 0
2. `ls scratch/*.py` == No such file
3. ESLint config == 'error'
4. `tsc --noEmit` == 0 errors
5. `eslint src/` == 0 errors
6. `grep "scratch" graph.json` == 0
7. Vitest Vanguard suite == Pass
