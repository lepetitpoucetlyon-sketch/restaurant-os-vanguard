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

## Item 2 — Bundle JS ~12 Mo · **P2 (perf, non bloquant) — 🔬 ANALYSÉ : chantier dédié, PAS de quick-fix**

### Analyse réelle (`ANALYZE=true npm run build` exécuté 2026-08-22)
- Chunks totaux ≈ **12 Mo**, plus gros chunks individuels ~792 KB. Non bloquant (`warn`, pas `fail`).
- **Profil des libs lourdes (imports statiques vérifiés) :**
  - `jspdf` : les 3 imports "statiques" sont en réalité `import **type**` → **effacés à la compilation, 0 impact bundle**. Les vraies utilisations sont déjà en `import()` dynamique (×5). ✅ rien à gagner.
  - `xlsx`, `recharts`, `@react-pdf` : **0 import** (pas dans le bundle).
  - `konva`/`react-konva` : quelques imports statiques (éditeur plan de salle) — candidat mineur.
  - **`framer-motion` : 357 imports statiques** = *l'éléphant*. Omniprésent (animations UI partout). **Non lazy-loadable mécaniquement** — le retirer/wrapper est un vrai refactor UI transverse.

### Action appliquée + mesure (2026-08-22)
`next.config.ts` : ajout de `experimental.optimizePackageImports: ['framer-motion']` (levier officiel Next, zéro changement de composant, zéro risque runtime). **Mesuré par build réel** : chunks `12288 → 12056 KB` = **−232 KB (−1,9 %)**, build vert. Gain **réel mais marginal** — ce qui **confirme** que le poids est structurel, pas un défaut de tree-shaking.

### Conclusion honnête
Le 12 Mo est **structurel** (framer-motion partout + konva + runtime Next), pas un oubli de code-splitting. Le seul quick-win sûr (optimizePackageImports ci-dessus) ne rend que ~2 %. **`BUNDLE_MAX_KB` reste inchangé (2000)** : le baisser sans réduction réelle OU le monter à 12056 seraient tous deux des desserrements interdits (AGENTS.md Loi 2). Le vrai levier (LazyMotion sur 357 sites) exige une QA runtime des animations impossible ici → chantier dédié, non shippé à l'aveugle.

### Reste à faire (chantier perf dédié, non couvert ici)
- [ ] Stratégie framer-motion : `LazyMotion` + `domAnimation` (features à la demande) OU wrapper maison, sur les 357 sites — mesurer l'impact réel.
- [ ] Rendre `konva`/`react-konva` dynamiques au niveau route plan-de-salle si pas déjà route-split.
- [ ] Ne baisser `BUNDLE_MAX_KB` + re-freeze **qu'après** une réduction MESURÉE (`du -sk .next/static/chunks`).

### Risque
Élevé (refactor UI transverse framer-motion) → à traiter isolément, jamais mélangé à un autre item.

---

## Item 3 — Parité des 4 verticales · **P2 — ✅ TERMINÉ (décision actée + profondeur ajoutée)**

### Décision architecturale ACTÉE
La factory partagée (`src/verticals/_shared/adapters/factories.ts`) **EST** le standard de parité — **pas**
9 fichiers d'adapters dupliqués par verticale. Dupliquer serait une régression vers la duplication que le
moteur `vertical-forge` a justement supprimée. Règle retenue : **un adapter concret par pilier UNIQUEMENT là
où la verticale a des events propres** (déjà le cas : `gym.class_booked`, `coworking.meeting_room_booked`,
`florist.arrangement_created`, `veterinary.pet_consultation_completed` — définis en ligne dans chaque
`adapters/index.ts` par-dessus la factory). Le reste des piliers reste sur la factory. La « parité 19 fichiers »
de restaurant est un objectif de forme, pas de valeur — écarté sciemment.

### Profondeur métier ajoutée (KPIs réels, calculés sur données Nexus déjà chargées — pas de code mort)
- **gym** → `MembersDashboard` : **Rétention de cohorte 30j** (membres inscrits ≥30j toujours actifs).
- **coworking** → `DeskMapPage` : **Part des bureaux privés** dans les réservations (mix produit / pricing).
- **florist** → `FloralArrangementsPage` : **CA des compositions livrées** ce mois.
- **veterinary** → `PetRecordsPage` : **Taux d'identification ICAD** (% animaux pucés — conformité vétérinaire).

Chaque verticale a donc : `domain/types.ts` + service analytique (vraies requêtes `Nexus.adapter.query`) +
2 dashboards câblés + adapters d'events propres. Structurellement complète pour son besoin réel.

### DoD ✅
Décision actée · KPI réel supplémentaire par verticale (aucun fichier-alibi) · tsc/cycles/eslint verts.

### Risque
Néant — enrichissement de dashboards existants (routes déjà câblées), aucune nouvelle surface morte.

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
