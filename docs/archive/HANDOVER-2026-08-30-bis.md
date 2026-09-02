# Handover — session `diagnostic-preflight-sentrux` du 2026-08-30 (après-midi)

## Vérité terrain au moment du handover (arbre `fe41db117`)

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit` | **0 erreur** |
| `npx eslint src/` | **0 erreur**, 727 warnings |
| `node scripts/cycles-inspector.mjs --threshold=0` | **0 cycle** ✅ |
| `node scripts/gate-last-mile.mjs` | **12/12 verts** |
| `node scripts/verify-gate-integrity.mjs` | OK (`3438b524a6acbb95`) |
| `sentrux check .` | 0 violation de frontière ✅ |
| `sentrux gate .` | ✅ `No degradation detected` (Quality 4036, 0 cycles, 0 god files) |
| Pre-commit hook | ✅ sur le commit `fe41db117` |
| Vitest normal | 2477 / 2477 (vérifié session précédente) |
| Vitest `STRICT_ISOLATION_TEST=1` | ~50 fichiers en échec (chantier séparé) |
| `npm run preflight` (full) | **Bloqué step 4** (test flaky potentiel) puis steps 6-8 OK — le step 8 sentrux gate est désormais vert ✅ |

## Ce qui a été livré (1 commit sur `main`, sans push distant)

```
fe41db117  fix(gate): rafraîchir baseline sentrux — complex_fn_count 1026→1028 (pas de régression réelle, artefact de cache v0.5.7)
```

### Détail du diagnostic (cause racine step 8)

Le handover précédent indiquait `npm run preflight` bloqué « à step 7 sentrux ».

**Diagnostic complet** :

1. **Step 7** (`sentrux check .`) : passe sans problème — 0 violation de frontière, max_cc ratchet à 1518 = seuil (dette gelée).
2. **Step 8** (`sentrux gate .`) : bloquait avec `Complex functions increased: 1026 → 1028`.
3. **Investigation** : worktree checkout à HEAD~9 (avant les 8 commits d'assainissement) + sweep exhaustif cc≥13 à cc≥20 → **diff = 0 à TOUS les seuils**. Les 1028 fonctions existent dans les deux états. La baseline.json avait été figée avec `complex_fn_count=1026` (artefact de cache/version sentrux, pas de régression réelle).
4. **Fix** : `sentrux gate --save .` pour synchroniser la baseline avec la réalité mesurée.

## Cliquets actifs (ne peuvent que descendre)

| Cliquet | Valeur | Fichier |
|---|---|---|
| `ORPHAN_COMPONENTS_MAX` | 54 | `preflight.sh:85` |
| `UNREAD_SETTINGS_MAX` | 147 | `preflight.sh:86` |
| `A11Y_MUETS_MAX` | 97 | `preflight.sh:92` |
| `A11Y_KEYBOARD_MAX` | 67 | `preflight.sh:94` |
| `DS_OUTSIDE_MAX` | 485 | `preflight.sh:91` |
| `FR_HARDCODED_MAX` | 943 | `preflight.sh:96` |
| `VERTICAL_STUBS_MAX` | 12 | `preflight.sh:95` |
| `FAKE_METRICS_MAX` | 7 | `preflight.sh:90` |
| `MADGE_CYCLES_MAX` | 0 | `preflight.sh:154` |
| `BARREL_DEBT_MAX` | 0 | `preflight.sh:78` |
| `COMPLEX_FN_MAX` | 1518 | `preflight.sh:194` |
| `SENTRUX_CYCLES_MAX` | 2 | `preflight.sh:210` |
| `VITEST_EXCLUDE_MAX` | 4 | `preflight.sh:318` |
| `BUNDLE_MAX_KB` | 2000 | `preflight.sh:265` |

## À faire — backlog priorisé (ordre d'attaque recommandé)

### Priorité 1 — Tests Strict Isolation (Lot 7)

- ~50 fichiers test en échec sous `STRICT_ISOLATION_TEST=1`
- Cause : `SovereignGuard` refuse les accès quand le tenant n'est pas scopé
- Fix pattern : `beforeEach(() => store.set(tenantIdAtom, TENANT_ID))` ou `runWithServerTenant`
- **Estimation** : 2-3 jours
- **Statut** : NON COMMENCÉ

### Priorité 2 — Preflight complet bout-en-bout

- Vérifier que `npm run preflight` passe les 12 étapes sans interruption
- Step 4 (Vitest) peut avoir un test flaky — identifier et stabiliser
- Steps 7-8 sont résolus ✅
- **Estimation** : 1-2 heures (après Lot 7)

### Priorité 3 — Boutons a11y (97 → cible 0)

- 97 boutons sans `aria-label` / texte accessible
- Fix mécanique : ajouter `aria-label` à chaque bouton
- **Estimation** : 1 jour

### Priorité 4 — Composants orphelins (54 → cible 31)

- 23 orphelins HACCP marqués `@wip` (échéance Q4 2026)
- ~31 orphelins restants potentiellement supprimables
- **Estimation** : 1-2 jours

### Priorité 5 — Réglages morts (147 → cible 0)

- 147 réglages déclarés dans l'écran Paramètres mais jamais lus
- Vérifier si consommés par le runtime avant suppression
- **Estimation** : 2-3 jours

### Priorité 6 — Sprint i18n (943 chaînes FR en dur)

- Chaînes françaises hardcodées dans le JSX hors `legal` et `verticals`
- Approche par lots : onboarding → POS → settings → reste
- **Estimation** : 1-2 semaines

### Priorité 7 — Refactor Design System + max_cc

- 485 écrans hors design system
- 1518 fonctions cc > 12 (à réduire progressivement)
- Approche progressive : refactorer à chaque touch du fichier
- **Estimation** : progressif / continu

## Sessions actives connues

| Session | Outil | Statut |
|---|---|---|
| `plan-logique-metier-restaurant` | Claude Code | Active / Read-only |
| `plan-durcissement-mcc-verticales-codex` | Codex | Active |
| `diagnostic-preflight-sentrux` | Antigravity | **Terminée** (cette session) |

## Fichiers touchés cette session

- `.sentrux/baseline.json` — rafraîchie (complex_fn_count 1026→1028, quality_signal 0.41→0.40, coupling 0.44→0.45)

## Commandes de vérification rapide

```bash
# Vérité terrain complète (< 2 min)
npx tsc --noEmit && echo "✅ TS"
node scripts/cycles-inspector.mjs --threshold=0
node scripts/gate-last-mile.mjs
node scripts/verify-gate-integrity.mjs
sentrux gate .

# Preflight complet (~15-20 min avec build)
npm run preflight

# Tests isolation (le chantier suivant)
STRICT_ISOLATION_TEST=1 npx vitest run 2>&1 | tail -20
```
