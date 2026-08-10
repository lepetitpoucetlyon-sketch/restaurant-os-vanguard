# Journal d'exécution — PLAN_MAITRE_CORRIGE

> ⚠️ **Journal corrigé le 2026-08-10 après audit de vérification.**
> Certaines tâches étaient déclarées ✅ alors que leur objectif n'était pas atteint.
> Les statuts ci-dessous ont été revérifiés commande par commande.

## État vérifié (2026-08-10, après revert de la Phase 3)

| Métrique | Départ | Actuel | Cible |
|----------|--------|--------|-------|
| Erreurs TSC | 12 | **0** ✅ | 0 |
| Tests | 784 pass / 2 fail | **805 pass / 1 skip** ✅ | vert |
| Fichiers de test | — | **96 pass / 1 skip (97)** | — |
| Erreurs ESLint | ~502 | **365** (+114 warnings) | 0 |
| Sentrux | 3 violations | **3 violations** | 0 |
| Working tree | — | **propre** | propre |

---

## Phase 0 — Colmatage

| # | Tâche | Statut | Vérification | Commit |
|---|-------|--------|--------------|--------|
| 0.1 | `VALIDATION_ERROR` | ✅ | `errors.ts:7` présent | `38aeb80ea` |
| 0.2 | Gardes `PrepaieBuilder` | ✅ | tests saga verts | `d96695ba1` |
| 0.3 | `demo/simulation.test.ts` | ✅ | collecte OK | — |
| 0.4 | 11 erreurs TSC crash-test | ✅ | `tsc` = 0 | `ee3c4e1ab` |
| 0.5 | **Gate sentrux** | ⚠️ **PARTIEL** | voir ci-dessous | `2b97e3e7e` |
| 0.6 | `CLAUDE.md` domaines | ✅ | 4 domaines ajoutés | `bb1edf338` |
| 0.7 | Doublon front-desk | ✅ | 1 seul dossier | `a20b33c4b` |
| 0.8 | `requireSession` | ✅ | **0 / 41** `await verifySession(` | `64a771b14` |
| 0.9 | RBAC serveur | ✅ | 13/13 sous `createSafeAction` | `64a771b14` |

### ⚠️ 0.5 — objectif NON atteint

Le bloc `[[god_file_exceptions]]` a bien été ajouté (`rules.toml:46-47`) avec les bons chemins,
**mais sentrux continue de flaguer les aggregation roots** :

```
src/app/(admin)/admin/mcc/page.tsx (fan-out=18)
src/modules/ops/production/kitchen/components/KitchenDashboard.tsx (fan-out=18)
src/shared/components/layout/NexusProviderStack.tsx (fan-out=17)
src/shared/providers/fleet/NexusFleetProvider.tsx (fan-out=16)
src/modules/intelligence/ia/fleet/NexusFleetProvider.tsx (fan-out=16)
```

→ La syntaxe d'exception n'est pas supportée par cette version de sentrux.
→ **Appliquer le repli prévu au plan §0.5** : relever le seuil global à 30 **et** ajouter
   une règle ESLint interdisant l'import de `*/services/*` et `*/domain/*` depuis `src/app/**`.

**Écart non demandé** : `max_cc` a été abaissé de 20 → **12**, ce qui fait passer les violations
de complexité de 4 à **33**. Ce durcissement n'était pas au plan. À assumer ou à revenir à 20.

---

## Phase 1 — Hygiène automatique

| # | Tâche | Statut | Vérification | Commit |
|---|-------|--------|--------------|--------|
| 1.1 | Auto-fix ESLint | ✅ | 502 → 366 | `d1e0079c5` |
| 1.2 | `react/display-name` | ✅ | 366 → 365 | `d22e8a035` |

---

## Phase 1 bis — Le filet exécutable

| # | Tâche | Statut | Réel |
|---|-------|--------|------|
| 1bis.1 | Invariants fast-check | ⚠️ **5 / 7** | 5 fichiers, **4 verts + 2 expected fail** |
| 1bis.2 | Règles Semgrep | ⚠️ **1 / 7 active** | 1 active (`WARNING`), **5 dans `.semgrep/disabled/`** |
| 1bis.3 | Knip | ✅ | `.knip.json` présent |
| 1bis.4 | Doc générée | ✅ | `scripts/gen-pillars-doc.ts` |

### Invariants présents
- `money-conservation.pbt.test.ts` → 🔴 **`it.fails` — prouve le bug pourboire §7.4**
- `currency-conversion.pbt.test.ts` ✅
- `fiscal-chain.pbt.test.ts` ✅ (dont 1 `it.fails`)
- `split-invariants.pbt.test.ts` ✅
- `tax-breakdown.pbt.test.ts` ✅

### Reste à faire pour clore 1 bis
- [ ] 2 invariants manquants : `Σ factures ≤ total scellé` · reconstruction de projection
- [ ] Activer les 5 règles Semgrep de `disabled/` une par une
- [ ] Passer `immutable-collections.yml` de `WARNING` à `ERROR`

---

## Phase 2 — Blindage des frontières

| # | Tâche | Statut | Vérification |
|---|-------|--------|--------------|
| 2B.0 | `z.any()` → `z.unknown()` | ✅ | **0** `z.any()` dans les `*.action.ts` |
| 2B.1 | `createSafeAction` | ✅ | livré avec §0.9 |
| 2B.2 | Schémas Zod stricts | ⬜ | les `z.tuple` servent de squelette |
| 2C | `onValidated` | ⬜ | à faire |

---

## Phase 3 — 🔴 ANNULÉE, à refaire

Le commit `38650ab0c` « Complete Phase 3 » a été **reverté** (`d3703b37a`).

**Ce qu'il avait cassé :**
- 280 imports corrompus sur 152 fichiers (`@/src/modules/` et `@_modules/`)
- 618 lignes de types supprimées sans destination réelle
  (`workflow/engine/types.ts` 83 l., `groups.types.ts` 249 l., `knowledge/rag/types.ts` 286 l.)
- un `bootstrap/legacy.ts` portant à lui seul 73 erreurs TSC
- 298 doubles points-virgules, 4 scripts de correction laissés à la racine
- **539 erreurs TSC · 0 / 97 suites de tests collectées**

**Cause racine** : les commandes de vérification obligatoires du contrat d'exécution
(`npx tsc --noEmit` + `npx vitest run` après chaque tâche) n'ont pas été lancées avant le commit.

**Travail légitime récupéré avant le revert** : invariants, règles Semgrep,
`gen-pillars-doc.ts`, `.knip.json`.

### À refaire, pilier par pilier
- [ ] 3.0 — Écrire les 3 décisions structurelles dans `CLAUDE.md` (**avant** tout déplacement)
- [ ] 3.1 — Barrel Contract : 219 violations, **un commit par pilier**
- [ ] 3.2 — Inversions de couche : 178
- [ ] 3.3 — 4 cycles (StatCard + auth) — correctif minimal au plan §3.3
- [ ] 3.4 — Orienter les déplacements vers la cible `kernel/orchestration/design`

> 🔴 **Règle absolue pour la reprise** : `npx tsc --noEmit && npx vitest run` **après chaque pilier**.
> Jamais de script de remplacement global sur les imports.

---

## Blocages / écarts constatés

| Constat | Impact |
|---------|--------|
| Exception `god_file_exceptions` non supportée par sentrux | §0.5 à reprendre avec le repli |
| `max_cc` durci 20 → 12 sans demande | 33 violations au lieu de 4 |
| 12 `EnvironmentTeardownError` dans les tests | **pré-existant** — `VerticalRegistry.ts:43-50` auto-enregistre 8 verticales par `import()` flottants. Même motif que les cycles §3.3 |
| Journal initial surdéclarait 1bis.1 et 1bis.2 | corrigé ci-dessus |

---

---

## Phase 7 — Interopérabilité et facturation

| # | Tâche | Statut | Vérification | Commit |
|---|-------|--------|--------------|--------|
| 7.4 | **Pourboire câblé** | ✅ | invariant vert, TVA inchangée | `6dcb3ab80` |

### ✅ 7.4 — détail

Chaîne rétablie de bout en bout :
`usePos.finalizePayment` → `processPayment` → `BridgePayload.tipInMicrounits` →
`buildJournalLines` (crédit **708500** hors TVA + débit moyen de paiement) →
émission `hr.tip_distributed` → `TipDistributedHandler` reverse au personnel.

- Le pourboire n'entre ni dans `TaxCalculator.calculateTotals` ni dans
  `computeTtcByRateAndAxis` → **TVA collectée strictement inchangée**
- `Σ débits = Σ crédits = montant réellement encaissé`
- `TipDistributedHandler` existait déjà mais n'était appelé depuis nulle part

**Invariant `money-conservation.pbt.test.ts`** — `.fails` retiré, 2 défauts corrigés :
- le test lisait `priceInMicrounits`, inexistant sur `CartItem` (le bridge lit
  `unitPriceInMicrounits`) → produisait `NaN`
- prix non alignés au centime → écarts d'arrondi parasites
- **2e invariant ajouté** : même panier, pourboires différents → TVA identique

**Reste sur §7.4** (non bloquant) :
- [ ] Facture > 150 € HT : pourboire en pied de document, hors TVA
- [ ] Split : faire suivre le pourboire à la part du payeur qui l'a donné
      (aujourd'hui rattaché au `paymentMode` global)
- [ ] Politique de tip-pooling : `staffIds` vaut `[operatorId]` par défaut

---

## Prochaine étape recommandée

1. ~~**§7.4 — câbler le pourboire**~~ ✅ fait
2. **§0.5 — appliquer le repli** pour que le gate cesse de flaguer les aggregation roots
3. **§3.0 puis 3.1** — reprendre la Phase 3 proprement, un pilier à la fois
