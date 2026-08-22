# 🎯 Plan — Reliquat Profondeur (post-session relais Antigravity)

> Rédigé le 2026-08-22 (soir), après exécution de Track 1.3 + Track 2 + Track 3.2 + une passe Track 3.1.
> Ce document couvre les **4 items non terminés**, avec l'état **vérifié dans le code** (pas recopié des docs
> de plan, qui sont périmés). À relire avant reprise ; ne pas se fier aux compteurs de
> `TASKS-PROFONDEUR-ANTIGRAVITY.md` sans re-mesurer.

## ✅ Constat — Preflight complet 100% VERT (Preuve brute certifiée)

Toutes les 10 gates de `scripts/preflight.sh` sont **VERTES** en sortie brute :
- TypeScript : 0 erreur
- Logique métier (fetch nu & auth guards) : 0 violation
- ESLint : 0 barrel-debt, 0 violation inter-module (`INTER_MODULE_MAX=0`)
- Tests Vitest : 1942 passés, 1 skipped (0 échec)
- Madge cycles : 0 cycle
- Build Next.js Turbopack : OK (100% des routes compilées)
- sentrux check & gate : 0 violation de frontières
- Gate integrity : baseline anti-desserrement vérifiée (`interModule` inclus)

---

## Item 1 — Les 3 imports inter-module (débloque le preflight) · **P0 — ✅ TERMINÉ**

### État résolu
| Fichier | Résolution ADR-015 canonique | Canal utilisé |
|---|---|---|
| `src/modules/intelligence/ia/ai/HermesEngine.ts` | Émission de `compliance.critical_waste_detected` | **NexusEventBus** (handler `CriticalWasteFiscalHandler` côté finance) |
| `src/modules/logistics/hooks/useStockPrediction.ts` | Contrat neutre `IStockOracle` + singleton `StockOracleRegistry` | **Contrat neutre / DI** (`@/kernel/contracts/oracle.ts`) |
| `src/modules/ops/production/kitchen/components/KitchenDashboard.tsx` | Déplacement d'`ExpertHub` vers `src/shared/components/ai/` | **Shared Components** (`@/shared/components/ai/ExpertHub`) |

### Étapes
- [x] Tranché les 3 canaux conformément à l'ADR-015 (Bus pour effet de bord, Contrat neutre pour requête synchrone, Composant partagé pour UI).
- [x] Implémenté cas 1 (bus + handler finance) → ESLint `no-inter-module-imports` : 3 → 2, cycles = 0.
- [x] Implémenté cas 2 (contrat neutre `IStockOracle` / `StockOracleRegistry`) → 2 → 1, cycles = 0.
- [x] Implémenté cas 3 (composants AI partagés `src/shared/components/ai/`) → 1 → 0, cycles = 0.
- [x] `npm run preflight` **100% VERT en sortie brute**.

### DoD
`INTER_MODULE_COUNT = 0` · cycles = 0 · tsc = 0 · vitest 1942 passés · preflight complet vert. ✅


### Risque
Moyen. Cas 1 change une synchronicité (boucle HACCP) → couvrir par un test d'idempotence. Cas 2/3 sont du
recâblage structurel — vérifier qu'aucun consommateur ne casse (grep des call-sites avant/après).

---

## Item 2 — Bundle JS ~12 Mo · **P2 (perf, non bloquant)**

### État vérifié
`du -sk .next/static/chunks` ≈ **12 000 KB** vs `BUNDLE_MAX_KB=2000`. Mais dans `preflight.sh` (l.212-221) le
dépassement est un **`warn`, pas un `fail`** → ne bloque pas le preflight. Baseline `.gate-baseline.json`
`ratchets.bundle = 2000`.

### Plan
- [ ] `ANALYZE=true npm run build` → identifier les gros chunks (attendus : konva, jspdf, xlsx, d3, dashboards).
- [ ] Lazy-load via `next/dynamic` / `import()` les gros modules non critiques au premier paint.
- [ ] Vérifier qu'aucun barrel ne tire un pilier entier côté client (les barrels type-only aident déjà).
- [ ] Mesurer, puis **abaisser `BUNDLE_MAX_KB` par paliers** (12000 → viser < 5000, puis < 3000…) et
      re-freeze `verify-gate-integrity`. Ne jamais l'augmenter.
- [ ] (Optionnel) passer le gate bundle de `warn` à `fail` une fois sous un seuil réaliste tenu.

### DoD
Bundle sous un seuil réaliste tenu + `BUNDLE_MAX_KB` abaissé au niveau atteint + baseline re-figée.

### Risque
Faible techniquement, mais chronophage (bisection des chunks). Indépendant des autres items.

---

## Item 3 — Parité complète des 4 verticales · **P2**

### État vérifié
`restaurant` = **19 fichiers** dont **9 adapters concrets** (`RestaurantOpsAdapter.ts` … + `index.ts`).
`gym`/`coworking`/`florist`/`veterinary` = **9 fichiers** chacune : `Vertical.ts`, `blueprint.ts`, `index.ts`,
`adapters/index.ts` (factories partagées, pas 9 fichiers concrets), `ui.ts`, `domain/types.ts`,
`domain/<Service>.ts`, + 2 dashboards. La **logique métier est réelle** (services `Nexus.adapter.query`,
dashboards branchés, routes câblées) — ce ne sont plus des stubs. **Écart restant = structurel**, pas fonctionnel.

### Question à trancher AVANT de coder
La factory partagée (`src/verticals/_shared/adapters/factories.ts`) couvre déjà 8 piliers universels + MCC.
**Dupliquer 9 adapters concrets par verticale (comme restaurant) est-il vraiment souhaitable, ou est-ce une
régression vers la duplication que le moteur `vertical-forge` visait justement à tuer ?**
→ Recommandation : **ne créer un adapter concret par pilier QUE là où la verticale a des events propres**
(comme `gym.class_booked` déjà présent). Sinon garder la factory. La « parité 9 fichiers » du doc est un
objectif de forme, pas de valeur — à ne pas suivre aveuglément.

### Plan (si parité structurelle réellement voulue)
- [ ] Par verticale, éclater `adapters/index.ts` en fichiers concrets par pilier UNIQUEMENT pour les piliers
      avec deltas d'events ; laisser les autres pointer sur les factories.
- [ ] Ajouter un 2ᵉ/3ᵉ dashboard métier par verticale si un besoin réel existe (ex. gym : rétention cohortes ;
      coworking : taux de remplissage par créneau ; florist : marge par composition ; vet : rappels vaccins).
- [ ] Enrichir `domain/types.ts` au fil des besoins réels des dashboards.

### DoD
Décision « factory vs adapters concrets » actée ; chaque verticale a la profondeur métier justifiée par un
besoin réel (pas du fichier pour le compteur). tsc/vitest verts.

### Risque
Faible. Piège à éviter : gonfler le nombre de fichiers pour « atteindre 19 » sans valeur → anti-pattern.

---

## Item 4 — Doc + verrouillage final des ratchets · **P1 — ✅ TERMINÉ**

### État vérifié
- `verify-gate-integrity.mjs` inclut désormais `'interModule'` dans la boucle de vérification des ratchets (`for (const k of ['cycles', 'barrel', 'interModule', 'bundle'])`).
- Baseline gelée : `cycles:0, barrel:0, interModule:0, bundle:2000`, `globCount:15, off:2` (hash `604ffd204b8f8aed`).
- `CLAUDE.md` mis à jour avec les 5 canaux légitimes ADR-015 (EventBus, Contrats neutres, Shared Components, Nexus persistence, Barrel racine).
- Directives `'use client'` ajoutées sur les hooks UI/client pour garantir la compilation Next.js Turbopack (`useGeminiAgent.ts`, `useStrategicOracle.ts`, `useExpert.ts`).

### Plan & Réalisations
- [x] **Ajouté `interModule` à la boucle de garde** de `verify-gate-integrity.mjs` (l.66).
- [x] Rafraîchi `CLAUDE.md` sur les 5 canaux de communication inter-modules ADR-015.
- [x] `node scripts/verify-gate-integrity.mjs --freeze` exécuté avec intégrité validée.
- [x] Preflight complet 100% vert (10/10 gates validées).

### DoD
`interModule` gardé par l'intégrité ; doc synchronisée ; preflight complet vert certifié. ✅


### Risque
Faible, mais **à faire en dernier** : figer les ratchets avant que l'item 1 soit à 0 gèlerait un état rouge.

---

## Ordre recommandé & dépendances

```
Item 1 (P0, débloque preflight)  ──►  Item 4 (P1, verrouille ce qui est vert)
Item 2 (P2, perf)     ── indépendant, parallélisable
Item 3 (P2, parité)   ── indépendant, décision de forme à trancher d'abord
```

1. **Item 1** en premier (preflight rouge aujourd'hui) — c'est aussi la vraie décision ADR-015 en attente.
2. **Item 4** juste après (verrouiller l'état vert, patcher le trou `interModule` de l'intégrité).
3. **Items 2 et 3** quand voulu, indépendants, chacun précédé d'une petite décision (seuil bundle / factory vs
   adapters concrets).

## Règle non négociable (rappel AGENTS.md)
Chaque étape finit par `npm run preflight` vert **en sortie brute** (`rtk proxy`, jamais depuis un résumé RTK,
cf. mémoire piège RTK). Jamais `--no-verify`, jamais desserrer une gate pour en fermer une autre. On corrige le
code ; le ratchet ne fait que descendre.
