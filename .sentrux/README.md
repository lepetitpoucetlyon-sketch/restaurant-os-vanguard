# sentrux — gouvernance architecturale RESTAURANT-OS-CORE

[sentrux](https://github.com/sentrux/sentrux) est un capteur structurel temps réel.
Il observe le graphe de dépendances du code (pas les diffs) et donne un score de
qualité, un treemap visuel et un *quality gate* qui détecte la dégradation
architecturale pendant les sessions d'agent IA.

> Source : https://github.com/sentrux/sentrux — binaire Rust, 52 langages (dont TS) via tree-sitter.
> ✅ **Exécuté et vérifié le 2026-06-15 sur Mac** : `sentrux check .` → **Quality 7011/10000,
> 14 règles, toutes au vert, 0 cycle** (1259 fichiers). Le « 4884 » d'anciennes notes était un
> chiffre inventé : la vraie valeur est 7011.

## 1. Installer (sur ton Mac)

```bash
brew install sentrux/tap/sentrux
sentrux --version   # vérifier
```

## 2. Premier scan

```bash
cd ~/RESTAURANT-OS-CORE
sentrux                 # GUI : treemap live des piliers
sentrux check .         # vérifie .sentrux/rules.toml (exit 0/1, CI-friendly)
```

⚠️ sentrux parse via tree-sitter (analyse syntaxique). Vérifie au 1er scan qu'il
suit bien les alias `@/...` du tsconfig et qu'il cartographie correctement les
piliers `src/modules/*`. Sinon, ajuste les `paths` dans `rules.toml`.

## 3. Calibrer les règles

`rules.toml` est volontairement prudent. Après le 1er `sentrux check .` :
- ajuste `max_coupling` / `max_cc` au niveau réel du repo, puis resserre ;
- vérifie que les `[[boundaries]]` entre piliers ne génèrent pas de faux positifs
  (le couplage légitime POS→Finance doit passer par `FinancialNexusBridge`) ;
- ajoute les paires de piliers manquantes si besoin (intelligence, kds, sovereign…).

## 4. Quality gate autour des sessions d'agent

Baseline actuelle protégée : **7011/10000** (figée le 2026-06-15).

```bash
./scripts/sentrux-baseline.sh   # fige la baseline (= sentrux gate --save .) — à lancer 1 fois
# ... session agent ...
sentrux gate .                  # signale toute dégradation sous la baseline
```

Intégré dans `scripts/preflight.sh` : étape 4 = `sentrux check .` (bloquant), étape 5 =
`sentrux gate .` (échoue si l'archi a régressé sous la baseline). Relance
`./scripts/sentrux-baseline.sh` seulement après une amélioration **volontaire**.

## 5. Brancher Claude Code (MCP)

```bash
/plugin marketplace add sentrux/sentrux
/plugin install sentrux
```

L'agent accède alors à : scan · health · session_start · session_end · rescan ·
check_rules · evolution · dsm · test_gaps.

## 6. CI / preflight

`scripts/preflight.sh` lance `sentrux check .` en étape 4 (non bloquant par
défaut). Retire le `|| true` une fois la config calibrée pour bloquer les PR qui
dégradent l'architecture.

## Limites (à garder en tête)

- sentrux regarde la **structure** (cycles, couplage, frontières), PAS les règles
  métier : il ne vérifie pas `toMicrounits()`, l'immuabilité NF525, ni le
  multi-tenancy `tenants/{tenantId}/...`. Ça reste du ressort de tsc, Vitest et
  tes lint rules custom.
- Projet jeune (v0.5.x) : attends-toi à des limites et vérifie chaque résultat.
