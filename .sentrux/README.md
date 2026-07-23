# sentrux — gouvernance architecturale RESTAURANT-OS-CORE

[sentrux](https://github.com/sentrux/sentrux) est un capteur structurel temps réel.
Il observe le graphe de dépendances du code (pas les diffs) et donne un score de
qualité, un treemap visuel et un *quality gate* qui détecte la dégradation
architecturale pendant les sessions d'agent IA.

> Source : https://github.com/sentrux/sentrux — binaire Rust, 52 langages (dont TS) via tree-sitter.

## Baseline

| Date | Score | Règles | Cycles | max_cc |
|---|---|---|---|---|
| 2026-06-15 | **7011**/10000 | 14 | 0 | 25 |
| 2026-07-04 | À mesurer | **67** (63 boundaries + 4 constraints) | 0 cible | **20** |

Après `sentrux check .` avec les nouvelles règles, relancer `./scripts/sentrux-baseline.sh`
pour figer la nouvelle baseline.

## 1. Installer

```bash
brew install sentrux/tap/sentrux
sentrux --version
```

## 2. Lancer

```bash
sentrux                 # GUI treemap interactif
sentrux check .         # vérifie rules.toml — exit 0/1 (CI-friendly)
sentrux gate .          # compare vs baseline (bloquant si régression)
```

## 3. Groupes de règles (v2.0)

| # | Groupe | Règles | Ce que ça protège |
|---|---|---|---|
| 1 | Contraintes globales | 4 | max_cycles=0, max_cc=20, no_god_files |
| 2 | Couches (layers) | 12 | Hiérarchie app→pillars→nexus→domain |
| 3 | Nexus bypass | 5 | Rien ne court-circuite SovereignGuard |
| 4 | SSR / Store purity | 6 | store/pillars → atoms sources uniquement |
| 5 | Matrice piliers | 35 | Isolation complète 8×8 entre piliers |
| 6 | Purété domaine | 6 | Schémas Zod ne remontent jamais |
| 7 | Ségrégation routes | 2 | (client) ↮ (admin) |
| 8 | Direction infra | 2 | Adapters ne descendent pas dans les piliers |
| 9 | Guards d'accès | 3 | adminAuthGuard réservé aux routes admin |

**Total : 67 règles** (63 boundaries + 4 constraints) — vs 14 en v1.0 (+378%).

## 4. Matrice piliers — logique

Chaque pilier (Ops, Finance, Commerce, Human, Logistics, Compliance, Intelligence, KDS)
est **étanche** aux autres. Le couplage légitime passe TOUJOURS par :
- `FinancialNexusBridge` (POS → NF525)
- `NexusAdapter` (read/write multi-tenant)
- `NexusEventBus` (événements asynchrones)

Exemple : Ops a besoin du stock Logistics → émet un événement `STOCK_DEDUCTION`
capté par `StockDeductionHandler` dans lib/events/handlers — jamais par import direct.

## 5. SSR / TDZ protection (groupe 4)

Le bug le plus fréquent sous agent IA : `store/pillars/ops.ts` importe
`src/modules/ops/index.ts` (barrel) qui importe un hook React qui importe
un atome → cycle qui se manifeste uniquement en SSR production (impossible à déboguer).

**Règle** : `store/pillars/*` → `*/index*` est interdit.
Les pillar files n'importent QUE les fichiers `*Atoms.ts` directement.

## 6. Quality gate autour des sessions d'agent

```bash
./scripts/sentrux-baseline.sh   # fige la baseline AVANT une session
# ... session agent IA ...
sentrux gate .                  # vérifie APRÈS — bloquant si régression
```

Intégré dans `scripts/preflight.sh` : étape 6 = check (bloquant) + étape 7 = gate (bloquant).

Ne jamais relancer `sentrux-baseline.sh` pour masquer une dégradation —
seulement après une amélioration **volontaire et vérifiée**.

## 7. Brancher Claude Code (MCP)

```bash
/plugin marketplace add sentrux/sentrux
/plugin install sentrux
```

L'agent accède alors à : `scan`, `health`, `session_start`, `session_end`,
`rescan`, `check_rules`, `evolution`, `dsm`, `test_gaps`.

## Limites (garder en tête)

- sentrux regarde la **structure** (cycles, couplage, frontières), PAS les règles métier :
  il ne vérifie pas `toMicrounits()`, l'immuabilité NF525, ni les chemins
  `tenants/{tenantId}/...`. Ça reste du ressort de `tsc`, Vitest et lint custom.
- Les alias `@/...` du tsconfig peuvent ne pas être résolus selon la version.
  Si les imports alias ne sont pas suivis, compléter avec madge (déjà dans preflight étape 4).
- Projet séniorux jeune (v0.5.x) : toujours vérifier manuellement les violations signalées.
