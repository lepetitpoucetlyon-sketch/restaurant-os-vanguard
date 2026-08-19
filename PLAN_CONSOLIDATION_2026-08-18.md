# 🏗️ PLAN CONSOLIDATION MASTER 2026-08-18 → 2027 Q3

> **Date de rédaction initiale** : 2026-08-18
> **Fusion MASTER** : 2026-08-19 (intégration finition qualité + roadmap unifiée)
> **Auteur** : sessions `plan-consolidation-post-cycles` + `plan-master-restant`
> **Portée** : plan unique consolidant TOUS les chantiers structurels + ops + scaling restants
> **Non-objectif** : ré-analyser les cycles (couverts par `PLAN_CYCLES_MADGE.md`) ni les régressions livrées 15-17 août (couvertes par `PLAN_CORRECTION_2026-08-18.md`)
> **Précondition** : plan cycles au moins en Vague A (ratchet actif)

---

## Table des matières

- [0. Préambule opérationnel](#0-préambule-opérationnel)
- [0-bis. Où on en est (état 2026-08-19)](#0-bis-où-on-en-est-état-2026-08-19)
- [1. Prérequis](#1-prérequis)
- [**Vague α — Finition qualité (nouvelle, 2026-08-19)**](#vague-α--finition-qualité-nouvelle-2026-08-19)
  - [α-1 · Barrel debt 150 → < 50](#α-1--barrel-debt-150--50)
  - [α-2 · God files 13 → 5](#α-2--god-files-13--5)
  - [α-3 · Consolidation NexusFleetProvider doublons](#α-3--consolidation-nexusfleetprovider-doublons)
  - [α-4 · Test teardown final purge](#α-4--test-teardown-final-purge)
  - [α-5 · Kernel/contracts finalisation (préalable γ-1)](#α-5--kernelcontracts-finalisation-préalable-γ-1)
- [Chantier F — Restructuration finale shared/](#chantier-f--restructuration-finale-shared)
- [Chantier G — Test coverage flows critiques (P0)](#chantier-g--test-coverage-flows-critiques-p0)
- [Chantier H — DB-agnostic pour de vrai (P0)](#chantier-h--db-agnostic-pour-de-vrai-p0)
- [Chantier I — DLQ dashboard (P0)](#chantier-i--dlq-dashboard-p0)
- [Chantier J — God files 18 → 0 (P1)](#chantier-j--god-files-18--0-p1)
- [Chantier K — Fragmentation eventBus regroupée (P1)](#chantier-k--fragmentation-eventbus-regroupée-p1)
- [Chantier L — RBAC 5 sources → 1 (P1)](#chantier-l--rbac-5-sources--1-p1)
- [Chantier M — Décision i18n (P1)](#chantier-m--décision-i18n-p1)
- [Chantier N — Verticales asymétriques (P2)](#chantier-n--verticales-asymétriques-p2)
- [Chantier O — Bundle size monitoring (P2)](#chantier-o--bundle-size-monitoring-p2)
- [Chantier P — Teardown warnings tests (P2)](#chantier-p--teardown-warnings-tests-p2)
- [Chantier Q — Legacy re-exports (P3)](#chantier-q--legacy-re-exports-p3)
- [Chantier R — Doublons verticals/modules (P3)](#chantier-r--doublons-verticalsmodules-p3)
- [Matrice des dépendances](#matrice-des-dépendances)
- [Roadmap trimestrielle](#roadmap-trimestrielle)
- [Métriques de sortie](#métriques-de-sortie)
- [Journal d'exécution — template](#journal-dexécution--template)

---

## 0. Préambule opérationnel

### 0.1 Contexte (mis à jour 2026-08-19)

Après le plan cycles (966 → 0), la session `rbac-desambiguation-final` (RBAC MCC désambigué), la session `barrel-godfiles-purge` (5 god files fragmentés + 43 violations Barrel Contract éliminées), il reste :

- **Vague α (NOUVEAU)** — finition qualité : barrel debt 150 → <50, god files 13 → 5, doublons fleet, teardown final, création de la couche `kernel/`
- **Vagues F→R** — 13 chantiers structure + ops + scaling détaillés (contenu original de ce plan)
- **Chantiers β/γ/δ (fusionnés depuis PLAN_MASTER_RESTANT + PLAN_SCALING_SOLO)** — orchestration temporelle unifiée (voir Roadmap trimestrielle)

Ce plan est désormais **LA source unique** de la trajectoire restante (fusion effectuée le 2026-08-19).

### 0.2 Convention effort

| Symbole | Charge |
|:-:|---|
| **XS** | < 1 h |
| **S** | < 1 jour |
| **M** | 1-3 jours |
| **L** | 3-7 jours |
| **XL** | > 1 semaine |

### 0.3 Convention priorité

- 🔴 **P0** = bloquant business ou risque prod imminent
- 🟠 **P1** = dette qui grossit vite, à traiter dans le trimestre
- 🟡 **P2** = inconvénient réel mais gérable, 6 mois
- 🔵 **P3** = cosmétique, opportuniste

### 0.4 Numérotation

Chaque action porte un identifiant stable `[<CHANTIER>-<seq>]` (ex : `G-03`). À tracer dans `sessions.md`, PR, journal.

### 0.5 Convention session

Chaque chantier = une session distincte dans `.claude/sessions.md`. Périmètres exclusifs indiqués dans chaque section — collision session bloque le hook.

---

## 1. Prérequis

### [PREREQ-C] Plan cycles terminé (au minimum Vague A + ratchet)

Sans le ratchet madge en place, les chantiers J (god files) et K (eventBus) vont recréer des cycles.

**Vérification** :
```bash
grep "MADGE_CYCLES_MAX" scripts/preflight.sh
# doit renvoyer une ligne active
```

- ✅ Vague A minimum (ratchet 966) OK → OK pour lancer G/H/I/M
- ✅ Vague C (kernel/) fini → OK pour lancer F/J/K/L (fusion + regroupement plus safe)

### [PREREQ-D] Sessions.md à jour, aucune fantôme

Cf. PLAN_CORRECTION § 1 PREREQ-06. Nécessaire pour éviter collision inter-session sur les chantiers K, L (touchent 100+ fichiers).

### [PREREQ-E] Baseline tests coverage mesurée

```bash
npx vitest run --coverage 2>&1 | tail -20 > .coverage-baseline.txt
```

Nécessaire pour tracker la progression du Chantier G (aujourd'hui ~4.4%).

### [PREREQ-F] Baseline bundle size mesurée

```bash
npx next build 2>&1 | grep -E "First Load JS|Page" > .bundle-baseline.txt
```

Nécessaire pour tracker Chantier O.

---

## 0-bis. Où on en est (état 2026-08-19)

### Ce qui EST déjà fait (vérifié runtime)

| Chantier | Statut | Preuve |
|---|:-:|---|
| **PLAN_CORRECTION** (10 régressions semaine 15-17 août) | ✅ | commits `48ba55a41`, `2397f908e`, `d92aad565` |
| **PLAN_CYCLES_MADGE** (966 → 0) | ✅ | commit `baf493fbd`, 317 fichiers, +3959/-643 |
| **RBAC MCC désambiguation** (`super_admin` → `mcc_super_admin`) | ✅ | commit `d92aad565` + session `rbac-desambiguation-final` |
| **LLM-agnostic** (4 fuites Gemini éradiquées) | ✅ | commit `2397f908e`, AgentEngine −109 LOC |
| **Cycles ratchet à 0 verrouillé** | ✅ | commit `9be53dd3e`, preflight bloquant |
| **`as any` production purgé** | ✅ | commit `883864846` (3 restants tous en `src/e2e/`) |
| **Oracle route CC=123 réduit** | ✅ | commit `0aa197bc4`, `OracleIntentAugmenter` extrait |
| **AutoProcurementEngine CC=37→1** | ✅ | commit `314f65f66`, 3 sub-services |
| **God files 18 → 13** | ✅ | session `barrel-godfiles-purge` (5 fragmentés) |
| **Barrel debt 193 → 150** | ✅ | session `barrel-godfiles-purge` (−43) |
| **Chantier P — Teardown warnings vitest** | ✅ | commit `9be53dd3e` |

### État runtime confirmé aujourd'hui

- TSC : **0 erreur**
- Cycles Madge : **0**
- Vitest : **1165 passed** / 1 skipped (188 files)
- Sentrux gate : **No degradation** (quality 3346 → 4587, +37%)
- Barrel Contract : **150 / 210** (ratchet vert)
- Fuites LLM hardcoded : **0**

### Ce qui reste dans ce plan

- **Vague α** (nouvelle, ci-dessous) — finition qualité, 5 chantiers, 2-3 semaines
- **Chantiers F, K, L** (partiellement fait pour L, reste table unique)
- **Chantiers G, H, I, J, M, N, O, Q, R** — inchangés
- **Vague β** (chantiers G/I + β nouveaux depuis PLAN_SCALING_SOLO) — voir Roadmap
- **Vague γ** (chantiers F/K/L complétés + S/V/N/O) — voir Roadmap
- **Vague δ** (H/T/W/Z/Q/R) — voir Roadmap

---

## Vague α — Finition qualité (nouvelle, 2026-08-19)

**Objectif** : finir le nettoyage structurel entamé par session `barrel-godfiles-purge`. Vague indépendante, démarrable immédiatement.
**Précondition** : Aucune. Working tree actuel est le point de départ.
**Durée** : 2-3 semaines.

---

### α-1 · Barrel debt 150 → < 50

**Priorité** : 🟠 P1
**Effort total** : L (5 jours)
**Session** : `barrel-debt-finition`
**Périmètre exclusif** : `src/modules/**` (imports profonds intra-pilier) + barrels racines

#### Objectif

Passer de 150 violations Barrel Contract à moins de 50, en attaquant les 5 patterns dominants restants (mesure fraîche 2026-08-19).

#### Distribution actuelle mesurée

| Pattern d'import interdit | Occurrences | Solution |
|---|:-:|---|
| `service/printers/hardware/*` | 8 | Compléter barrel `@/modules/ops/service/printers/index.ts` (déjà créé — restants ailleurs) |
| `service/pos/infrastructure/*` | 8 | Barrel `@/modules/ops` (fait pour cash-drawer + terminal, ajouter adapters/repositories) |
| `comptabilite/services/*` | 8 | Barrel `@/modules/finance` (partiellement fait, compléter) |
| `workflow/engine/types` | 6 | Créer barrel `@/modules/ops/workflow/engine/index.ts` avec exports types |
| `domain/schemas/pos, orders, commerce, rbac, supplier-invoice` | 24 | Migration vers `kernel/contracts/` (voir α-5) OU barrel `@/shared/schemas` |
| `services/FiscalEngine` | 5 | Barrel `@/modules/finance` |
| `ia/ai/LLMManager, LLMProviderFactory` | 6 | Barrel `@/modules/intelligence` |
| `effectifs/hr/components/*` | 4 | Barrel `@/modules/human` |
| `migration/*` | 5 | Barrel `@/modules/commerce/acquisition/onboarding` |
| Autres (long-tail) | 76 | Fix au cas par cas |

#### Actions détaillées

- **[α-1-01]** (S) Créer barrel `@/modules/ops/workflow/engine/index.ts` + fix 6 imports
- **[α-1-02]** (S) Étendre `@/modules/finance` avec `FiscalEngine` + fix 5 imports
- **[α-1-03]** (S) Étendre `@/modules/intelligence` avec `LLMManager` + `LLMProviderFactory` + fix 6 imports
- **[α-1-04]** (S) Étendre `@/modules/human` avec exports `hr/components/*` + fix 4 imports
- **[α-1-05]** (S) Créer barrel `@/modules/commerce/acquisition/onboarding/index.ts` + fix 5 imports migration
- **[α-1-06]** (S) Nettoyer les 8 imports `pos/infrastructure/*` restants (adapters, repositories, api)
- **[α-1-07]** (S) Nettoyer les 8 imports `printers/hardware/*` restants (hors printers/components déjà fait)
- **[α-1-08]** (S) Nettoyer les 8 imports `comptabilite/services/*` restants
- **[α-1-09]** (M) Long-tail — 76 violations dispersées, batch par sed + rewrite
- **[α-1-10]** (XS) Baisser `BARREL_DEBT_MAX` du preflight à 50 (ratchet)

**Sortie** : 150 → < 50 violations. Ratchet à 50.

**Régression possible** : nouveaux cycles créés par barrels étendus (comme cas `menu-builder → finance` de session `barrel-godfiles-purge`). **Mitigation** : après chaque action, `npx madge --circular` + fix cycle si créé (souvent `import type` ou inline).

---

### α-2 · God files 13 → 5

**Priorité** : 🟡 P2 (dette technique, pas bloquant business)
**Effort total** : L (5 jours)
**Session** : `god-files-terminal-purge`
**Périmètre exclusif** : `src/shared/eventBus/registerHandlers/*.ts`
**Note** : anticipe le Chantier K (fragmentation eventBus).

#### Objectif

Passer de 13 god files à ≤ 5. Cible : les 5 `registerHandlers/*.ts`.

Les **6 tests helpers** (`saga.*.test.ts`) sont **intentionnellement god files** — tests d'intégration cross-pilier. À accepter et documenter dans `.sentruxignore` avec commentaire (déjà fait).

Les **2 `NexusFleetProvider`** sont traités séparément par `[α-3]`.

#### Actions détaillées

Fragmentation par event domain :

- **[α-2-01]** (M) `registerHandlers/ops.ts` (fan-out 25) → fragmenter par event :
  - `handlers/order/register.ts` (order.paid, order.refunded, order.cancelled)
  - `handlers/kds/register.ts` (kds.item.ready, kds.course.completed)
  - `handlers/inventory/register.ts` (stock.deducted, stock.restored)
  - `handlers/tables/register.ts` (table.locked, table.transferred)
  - `registerHandlers/ops.ts` → assembly (fan-out ≤ 4)
- **[α-2-02]** (S) `registerHandlers/human.ts` (fan-out 18) → `contract/`, `planning/`, `payroll/`
- **[α-2-03]** (S) `registerHandlers/finance.ts` (fan-out 17) → `billing/`, `journal/`, `payout/`
- **[α-2-04]** (S) `registerHandlers/intelligence.ts` (fan-out 17) → `analytics/`, `ai/`, `rag/`
- **[α-2-05]** (S) `registerHandlers/compliance.ts` (fan-out 16) → `haccp/`, `rgpd/`, `audit/`
- **[α-2-06]** (XS) `registerHandlers.ts` racine appelle chaque `registerXxxHandlers()` extrait
- **[α-2-07]** (XS) Sentrux règle `eventbus_domain_isolation` : les handlers ne peuvent être importés que par leur `register.ts`

**Sortie** : 13 → 5-6 (les 6 tests helpers légitimes restent). Chantier J du plan initial (fragmenté ici différemment) devient obsolète — voir Note ci-dessous.

**Note** : Le Chantier J original (god files 18 → 0) est remplacé par cette Vague α-2 qui traite la même cible avec approche plus focalisée (les registerHandlers uniquement, les autres god files code métier ayant été traités par session `barrel-godfiles-purge`).

---

### α-3 · Consolidation NexusFleetProvider doublons

**Priorité** : 🟡 P2 (2 doublons quasi-identiques, dette cognitive)
**Effort total** : M (2 jours)
**Session** : `fleet-provider-consolidation`
**Périmètre exclusif** : `src/shared/providers/fleet/NexusFleetProvider.tsx`, `src/modules/intelligence/ia/fleet/NexusFleetProvider.tsx`

#### Objectif

Fusionner les 2 `NexusFleetProvider.tsx` en 1 seul (293 LOC chacun, ~99% identique — imports slightly différents mais logique métier identique).

#### Actions détaillées

- **[α-3-01]** (M) Fusion : garder version `src/modules/intelligence/ia/fleet/NexusFleetProvider.tsx` (source canon, cluster intelligence 392 confirmé par graphify)
- **[α-3-02]** (S) `src/shared/providers/fleet/NexusFleetProvider.tsx` devient un re-export : `export { NexusFleetProvider } from '@/modules/intelligence'`
- **[α-3-03]** (S) Grep + fix des imports amont pour tous pointer vers `@/modules/intelligence` (barrel)
- **[α-3-04]** (XS) Après période transition, supprimer `src/shared/providers/fleet/NexusFleetProvider.tsx` (Q4)

**Sortie** : -1 god file, -1 doublon, cluster intelligence renforcé.

**Régression possible** : les 2 fichiers ont peut-être des customisations subtiles. **Mitigation** : diff détaillé + tests visuels sur `/admin/mcc` avant fusion.

---

### α-4 · Test teardown final purge

**Priorité** : 🟡 P2 (bruit CI résiduel)
**Effort total** : S (1 jour)
**Session** : `test-teardown-final`
**Périmètre exclusif** : `src/__tests__/**` avec `afterAll`/`beforeAll` async

#### Objectif

Purger tous les `EnvironmentTeardownError` restants pour permettre `npm run preflight` de passer 8/8 gates propres.

Le Chantier P a fait `provisioning-saga-rollback.test.ts`. Reste à purger les autres warnings similaires.

#### Actions détaillées

- **[α-4-01]** (S) Grep tests avec `afterAll` async + `Promise` non-await
- **[α-4-02]** (S) Fix par test (proprement await + close mocks)
- **[α-4-03]** (XS) Activer `--reporter=verbose --bail` dans vitest config CI (catch warnings comme erreurs)

**Sortie** : `npm run preflight` termine les 8 gates sans exit 1 sur teardown warning.

---

### α-5 · Kernel/contracts finalisation (préalable γ-1)

**Priorité** : 🟡 P2 (préalable à Chantier F restructuration shared/)
**Effort total** : M (5-7 j)
**Session** : `kernel-contracts-finalisation`
**Périmètre exclusif** : `src/kernel/contracts/**` + migration schemas domain

#### Objectif

Créer proprement la couche `src/kernel/` (aujourd'hui inexistante — 0 fichiers) qui deviendra le socle "vocabulaire pur" évoqué dans Chantier F + Chantier L.

Cette couche est **la brique manquante** pour :
- Casser les cycles émergents (menu-builder → finance signalé en α-1)
- Migrer les 24 imports `domain/schemas/*` violés
- Extraire les types Nexus contracts hors de `shared/`
- Fournir la source pour le RBAC table unique (γ-3 / Chantier L compléter)

#### Actions détaillées

- **[α-5-01]** (S) Créer arborescence `src/kernel/contracts/` avec règle sentrux `kernel_purity` (zéro import sortant)
- **[α-5-02]** (M) Migrer `shared/nexus/contracts/nexus.types.ts` + `common.types.ts` → `kernel/contracts/core.ts` (~715 imports impactés — pattern déjà validé par PLAN_CYCLES_MADGE Vague C)
- **[α-5-03]** (M) Migrer `domain/schemas/pos, orders, commerce, rbac, supplier-invoice` → `kernel/schemas/`
- **[α-5-04]** (S) Migrer `shared/eventBus/events/*.ts` → `kernel/events/` (fait ce que γ-1 F-01 aurait fait — désormais préalable)
- **[α-5-05]** (S) Sentrux règles : `kernel_purity` + `shared_no_modules` + deprecation `domain/schemas/*`
- **[α-5-06]** (S) ADR-006 : Kernel Contracts Layer

**Impact** : débloque Chantier F (restructuration finale shared/) + résout les 24 violations barrel `domain/schemas/*` (α-1) + fournit socle pour Chantier L (RBAC table unique).

---

## Chantier F — Restructuration finale shared/

**Priorité** : 🟡 P2 (cosmétique après cycles)
**Effort total** : M (2-3 j)
**Précondition** : Plan cycles Vague C terminée (kernel/ existe)
**Session** : `restructure-shared-final`
**Périmètre exclusif** : `src/shared/**`, `src/kernel/**`

### 🎯 Objectif

Après la Vague C du plan cycles, `kernel/contracts/` existe et contient les types. `shared/` a été allégée. Il reste à :
1. Regrouper `shared/` par **nature** (UI, runtime, react)
2. Sortir les schemas eventBus vers `kernel/events/`
3. Purger les legacy re-exports
4. Formaliser les frontières via ADR + sentrux

### 📦 Actions détaillées

#### [F-01] Extraire `shared/eventBus/events/` → `kernel/events/`

**Effort** : S (4 h)
**Périmètre** : ~150 schemas Zod dans `shared/eventBus/events/*.ts`

**Justification** : Les schemas d'events sont du **vocabulaire**, pas du runtime. Ils décrivent le contrat, pas l'exécution. Ils appartiennent à `kernel/`.

**Actions** :
1. `git mv src/shared/eventBus/events src/kernel/events`
2. Rewrite imports : `@/shared/eventBus/events` → `@/kernel/events` (grep + sed)
3. Le fichier `shared/eventBus/registerHandlers/*.ts` continue d'exister — il enregistre les handlers runtime pour les events déclarés dans `kernel/events/`
4. Ajouter test de contrat : `kernel/events/*.ts` ne doit importer QUE d'autres `kernel/**`

**Tests** :
```typescript
// scripts/verify-kernel-purity.ts
// vérifie que kernel/ ne contient AUCUN import vers modules/, shared/, lib/, app/
```

**Conséquence** :
- ✅ Cycles réduits (les events ne créent plus de couplage cross-pilier)
- ✅ Les schemas events deviennent lisibles hors contexte

**Régression possible** : imports profonds (`@/shared/eventBus/events/order.events`) doivent aussi être migrés. Grep + sed obligatoire.

#### [F-02] Purger `shared/nexus-contract.ts` (legacy re-export)

**Effort** : XS (15 min)
**Périmètre** : 1 fichier + imports amont

**Justification** : Ce fichier était un re-export pour compat rétro pendant la migration Nexus. Après Vague C il devient un pont mort.

**Actions** :
1. Grep les imports : `grep -rn "from '@/shared/nexus-contract'" src/`
2. Remplacer chaque import par la source canonique (`@/kernel/contracts/core` ou équivalent)
3. `git rm src/shared/nexus-contract.ts`

**Régression possible** : imports amont oubliés → TSC rougit. Gate 1 preflight coupe la PR.

#### [F-03] Regrouper `shared/` par nature — 3 sous-dossiers

**Effort** : M (1-2 j)
**Périmètre** : `src/shared/` post-extraction kernel

**Justification** : Aujourd'hui `shared/` = 15 sous-dossiers mixtes (types, runtime, React, seeds, security). Regrouper par nature = mental model clair.

**Structure cible** :
```
src/shared/
├── ui/                       ← UI React (components + hooks)
│   ├── components/           (déplacé depuis shared/components/)
│   └── hooks/                (déplacé depuis shared/hooks/)
│
├── runtime/                  ← Code exécutable non-React
│   ├── eventBus/             (NexusEventBus, handlers, DLQ)
│   ├── nexus/                (guards, engines, state, vault)
│   ├── security/             (déplacé)
│   └── validation/           (déplacé)
│
├── react/                    ← React infrastructure
│   ├── providers/            (contexts globaux)
│   └── contexts/             (déplacé)
│
├── data/                     ← Data & schemas non-events
│   ├── seeds/                (DNA templates)
│   ├── schemas/              (Zod business — pas events)
│   └── constants/            (déplacé)
│
└── (autres à évaluer : plugins, connector-manifest, atoms, store, utils, types)
```

**Actions** :
1. Créer la nouvelle structure (dossiers vides)
2. `git mv` par sous-dossier (préserve blame)
3. Rewrite imports en masse (une passe par sous-dossier)
4. `npx tsc --noEmit` après chaque mv → sanity check
5. Vitest full après tous les mv

**Barrels à ajuster** : chaque sous-dossier a son `index.ts` propre. Le `shared/index.ts` racine re-export l'ensemble.

**Régression possible** :
- Imports profonds oubliés → TSC coupe
- Alias tsconfig `@/shared/*` doit continuer de résoudre — vérifier `tsconfig.paths`

**Rollback** : chaque `git mv` = commit atomique séparé → revert 1 mv à la fois si problème.

#### [F-04] ADR-007 : "shared/ = runtime réutilisable, kernel/ = vocabulaire pur"

**Effort** : XS (30 min)
**Fichier** : `docs/adrs/ADR-007-shared-kernel-boundary.md`

**Contenu** :
- Contexte : post-plan-cycles, séparation kernel vs shared
- Décision : `kernel/**` = zéro import vers autres couches ; `shared/**` = import kernel + lib OK, import modules INTERDIT
- Conséquences
- Alternatives rejetées (garder shared/ tel quel, faire kernel/ dans un package npm séparé)

#### [F-05] Sentrux rules pour `shared/**` et `kernel/**`

**Effort** : XS (30 min)
**Fichier** : `.sentrux/rules.toml`

**Actions** :
```toml
[[rules]]
name = "kernel_purity"
description = "kernel/** ne peut importer que kernel/**"
from = "src/kernel/**"
allowed = ["src/kernel/**"]
severity = "error"

[[rules]]
name = "shared_no_modules"
description = "shared/** ne peut PAS importer depuis modules/**"
from = "src/shared/**"
forbidden = ["src/modules/**"]
severity = "error"
```

**Test** : `sentrux check .` doit renvoyer 0 violation.

### 📊 Sortie Chantier F

- ✅ `shared/` = 3 sous-dossiers thématiques clairs (ui/runtime/react/data)
- ✅ `kernel/events/` créé, ~150 schemas déplacés
- ✅ `shared/nexus-contract.ts` supprimé
- ✅ ADR-007 publié
- ✅ Sentrux 2 nouvelles règles bloquantes

---

## Chantier G — Test coverage flows critiques (P0)

**Priorité** : 🔴 P0 (le risque #1 si tu ne fais rien — 4.4% coverage sur du code fiscal/multi-tenant)
**Effort total** : L (5-7 j étalés sur 3 semaines)
**Précondition** : PREREQ-E (baseline mesurée)
**Session** : `test-coverage-critical`
**Périmètre exclusif** : `src/__tests__/**` + fichiers testés (lecture seule)

### 🎯 Objectif

Passer de 4.4% à **15% de coverage** sur les **10 flows critiques** identifiés — pas 15% partout (coverage vanity), mais 100% sur les zones qui font perdre de l'argent si elles cassent.

### 📦 Actions détaillées

#### [G-01] Test end-to-end POS : commande → paiement → scellement → journal

**Effort** : M (1-2 j)
**Fichier** : `src/__tests__/e2e/pos-full-flow.test.ts` (nouveau)

**Scénarios** :
1. Créer un ticket avec 3 lignes (dont 1 TVA 5.5%, 1 TVA 10%, 1 TVA 20%)
2. Appliquer une réduction 10%
3. Valider le paiement (espèces + CB split)
4. Vérifier :
   - Ticket a un numéro séquentiel (T-YYYY/NNNN)
   - JournalEntry créé avec hash SHA-256 chaîné au précédent
   - FiscalSeal existe et non-modifiable (test SET → erreur)
   - Stock déduit atomiquement (invariant #2)
   - Event `order.paid` émis avec eventId unique
5. Vérifier que le ticket imprimé contient SIRET + hash NF525

**Impact business** : si ça casse silencieusement, la comptabilité est fausse → risque contrôle DGFiP.

#### [G-02] Test clôture Z + TVA

**Effort** : S (4-6 h)
**Fichier** : `src/__tests__/e2e/clotureZ-tva.test.ts`

**Scénarios** :
1. Enregistrer 20 tickets sur une journée avec TVA mixée
2. Déclencher clôture Z
3. Vérifier :
   - Totaux HT/TTC/TVA par taux corrects (invariant BigInt)
   - Ticket Z scellé (immuable)
   - Period lock actif (aucun ajout de ticket sur date antérieure)
   - Event `zTicket.closed` émis
4. Tenter de créer un ticket sur date fermée → erreur `PeriodLockGuard`

#### [G-03] Test provisioning tenant end-to-end

**Effort** : M (1 j)
**Fichier** : `src/__tests__/mcc/provisioning-full-flow.test.ts`

**Scénarios** :
1. MCC super_admin provisionne un tenant `variant='gym'`
2. Vérifier :
   - Tenant créé avec role `admin` (post RBAC-C1)
   - PIN owner généré + envoyé dans email
   - DNA gym chargée (capabilities filtrées)
   - Provider Firestore path `tenants/{new}/{...}` initialisé
   - SovereignGuard actif dès la 1ère écriture
3. Owner se connecte avec PIN → passe requireTenantAdmin

#### [G-04] Test HACCP corrective action

**Effort** : S (4-6 h)
**Fichier** : `src/__tests__/e2e/haccp-corrective-action.test.ts`

**Scénarios** :
1. IoT sensor température frigo remonte -8°C (au lieu de -18°C)
2. Vérifier :
   - Event `haccp.temp.alert` émis
   - Handler crée corrective action + notification
   - Handler idempotent (2ème émission ne double pas)
   - Persistance dans WORM archive
   - Aucun cross-tenant leak (autre tenant ne voit pas cette alerte)

#### [G-05] Test DLQ replay

**Effort** : S (4 h)
**Fichier** : `src/__tests__/eventbus/dlq-replay.test.ts`

**Scénarios** :
1. Émettre `order.paid` avec handler qui throw
2. Après 3 retries → event part en DLQ
3. Fix le handler
4. Rejouer manuellement l'event depuis DLQ
5. Vérifier : handler exécute une seule fois (idempotence via eventId)

#### [G-06] Test RBAC membrane cross-tenant

**Effort** : S (4-6 h)
**Fichier** : `src/__tests__/rbac/cross-tenant-isolation.test.ts`

**Scénarios** :
1. Créer 2 tenants A et B avec des orders
2. User admin de A tente `GET /api/tenant/orders?tenantId=B` → 404 (hidden door)
3. User admin de A tente `Nexus.adapter.get('tenants/B/orders/xyz')` → SovereignGuard bloque
4. Super_admin MCC accède aux 2 tenants via `x-nexus-tenant-id`
5. Assistant IA (tools) : waiter du tenant A ne voit pas les tools admin

#### [G-07] Test rotation PIN owner

**Effort** : S (3-4 h)
**Fichier** : `src/__tests__/mcc/pin-rotation.test.ts`

**Scénarios** :
1. Owner reçoit PIN initial dans email (test template)
2. Owner login → prompt rotation obligatoire J+7
3. Rotation : ancien PIN invalide immédiatement
4. Audit log de la rotation

#### [G-08] Test crash-safe outbox

**Effort** : M (1 j)
**Fichier** : `src/__tests__/eventbus/outbox-crash-safe.test.ts`

**Scénarios** :
1. `emitDurable('order.paid', ...)` avec kill process entre insert outbox et dispatch
2. Restart process → `replayPendingEvents()`
3. Vérifier : event dispatché exactement une fois (dedup via IdempotencyGuard)
4. Vérifier : outbox status passe `pending` → `done`

#### [G-09] Test smoke 12 verticales

**Effort** : M (1-2 j)
**Fichier** : `src/__tests__/verticals/smoke-all-verticals.test.ts`

**Scénarios** :
```typescript
describe.each(['restaurant', 'hotel', 'bakery', 'clinic', 'coworking',
              'florist', 'garage', 'gym', 'retail', 'salon',
              'veterinary', 'custom'])('%s vertical', (slug) => {
  it('resolves DNA without falling back to restaurant', () => {
    const dna = resolveDNA(slug);
    expect(dna).toBeDefined();
    if (slug !== 'restaurant') expect(dna).not.toBe(RESTAURANT_FULL_DNA);
  });

  it('provisions a tenant without throwing', async () => {
    const t = await provisionTenant({ variant: slug, ... });
    expect(t.tenantId).toBeDefined();
  });

  it('registers vertical plugin without cycles', () => {
    const plugin = getVerticalPlugin(slug);
    expect(plugin?.slug).toBe(slug);
  });
});
```

**Impact business** : chaque go-to-market d'une nouvelle verticale sécurisé.

#### [G-10] Consolidation coverage report

**Effort** : XS (30 min)
**Fichier** : `.coverage-baseline.txt` + `docs/COVERAGE.md`

**Actions** :
1. Ajouter `vitest --coverage` dans preflight (rapport, non-bloquant initialement)
2. Documenter les 10 flows critiques dans `docs/COVERAGE.md` avec liens fichier
3. Créer un badge coverage dans README

### 📊 Sortie Chantier G

- ✅ 4.4% → 15% coverage sur les flows critiques
- ✅ 10 nouveaux tests d'intégration (~2000 LOC de tests)
- ✅ Documentation coverage à jour
- ✅ Preflight rapport coverage (non-bloquant)

**Ratchet futur** : monter à 25% en Q2, 40% en Q3.

---

## Chantier H — DB-agnostic pour de vrai (P0)

**Priorité** : 🔴 P0 (promesse marketing non tenue = risque commercial)
**Effort total** : XL (2 semaines)
**Précondition** : Aucune
**Session** : `db-agnostic-real`
**Périmètre exclusif** : `src/lib/nexus/adapters/**`, `src/lib/nexus/NexusInfra.ts`, tests d'intégration

### 🎯 Objectif

Aujourd'hui `NexusInfra` supporte 4 providers **sur le papier** (firestore/postgres/mongo/sqlite). En réalité seul Firestore est fonctionnel. Les autres throw `Error: non implémenté`.

Deux issues :
1. Livrer les vraies implémentations
2. **OU** retirer la promesse marketing

Ce plan choisit l'option 1 (livrer) car la Vague B du plan cycles ne suffira pas à débloquer les prospects Postgres.

### 📦 Actions détaillées

#### [H-01] PostgresAdapter réel

**Effort** : L (3-5 j)
**Fichier** : `src/lib/nexus/adapters/PostgresAdapter.ts` (nouveau)

**Périmètre** :
- Implémenter `INexusAdapter` complet : `get`, `set`, `delete`, `query`, `increment`, `transaction`, `snapshot`
- Utiliser `postgres.js` (léger) ou `pg` (mature)
- Schema mapping : `tenants/{tenantId}/{collection}/{id}` → table `nexus_docs (tenant_id, collection, id, data JSONB, updated_at)`
- Support des `where` complexes via JSONB queries
- Realtime subscriptions via `LISTEN/NOTIFY` (ou polling initial)

**Tests d'intégration** : docker-compose spin postgres, replay les invariants #2, #3, #4.

**Impact** : débloque prospects avec exigence RGPD/souveraineté DE/CH.

#### [H-02] MongoAdapter réel

**Effort** : M (2-3 j)
**Fichier** : `src/lib/nexus/adapters/MongoAdapter.ts` (nouveau)

**Périmètre** : similaire H-01, avec `mongodb` driver officiel. Collections mappées 1:1 par pilier + `tenantId` en index.

**Tests** : docker-compose spin mongo, replay invariants.

#### [H-03] SqliteAdapter production-ready

**Effort** : M (1-2 j)
**Fichier** : `src/lib/adapters/SqliteMemoryAdapter.ts` (existe, à étendre)

**Périmètre** :
- Aujourd'hui : `SqliteMemoryAdapter` in-memory
- Étendre : `SqliteFileAdapter` avec `better-sqlite3`, persistence disque, WAL mode
- Cas d'usage : single-node prod, dev local, tests d'intégration

#### [H-04] Migration scripts par provider

**Effort** : M (1-2 j)
**Fichier** : `scripts/migrate/{postgres,mongo,sqlite}/init.ts`

**Périmètre** : chaque provider a un script d'init de schéma + un runner de migrations idempotentes.

**Structure** :
```
scripts/migrate/
├── postgres/
│   ├── 001-init-nexus-docs.sql
│   ├── 002-jsonb-indexes.sql
│   └── runner.ts
├── mongo/
│   ├── 001-init-collections.ts
│   └── runner.ts
└── sqlite/
    ├── 001-init.sql
    └── runner.ts
```

Runner appelé au démarrage app OU manuellement via CLI.

#### [H-05] Tests contract-based cross-provider

**Effort** : M (1-2 j)
**Fichier** : `src/__tests__/nexus/adapter-contract.test.ts`

**Périmètre** :
```typescript
describe.each([
  { name: 'firestore', adapter: () => new FirestoreAdapter() },
  { name: 'postgres', adapter: () => new PostgresAdapter() },
  { name: 'mongo', adapter: () => new MongoAdapter() },
  { name: 'sqlite', adapter: () => new SqliteFileAdapter(':memory:') },
])('$name adapter compliance', ({ adapter }) => {
  it('supports get/set/delete', ...);
  it('atomic increment (invariant #2)', ...);
  it('CAS transactions (invariant #3)', ...);
  it('UTC timestamps (invariant #4)', ...);
  it('SovereignGuard cross-tenant blocked', ...);
  it('immutable collections SET blocked', ...);
});
```

Ces tests garantissent qu'un adapter changé ne casse pas les invariants fondamentaux.

#### [H-06] Documentation matrix provider × invariant

**Effort** : XS (30 min)
**Fichier** : `docs/PROVIDER_COMPATIBILITY.md`

**Contenu** :
```markdown
| Feature | Firestore | Postgres | Mongo | SQLite |
|---|:-:|:-:|:-:|:-:|
| get/set/delete | ✅ | ✅ | ✅ | ✅ |
| Atomic increment | ✅ | ✅ | ✅ | ✅ |
| CAS transactions | ✅ | ✅ | ✅ | ⚠️ single-conn |
| Realtime snapshots | ✅ native | ⚠️ polling | ⚠️ change streams | ❌ |
| PITR restore | ✅ | ✅ Supabase | ✅ Atlas | ❌ manuel |
| Recommandé pour | prod cloud | prod RGPD | prod NoSQL | dev/single-node |
```

### 📊 Sortie Chantier H

- ✅ 4 providers Nexus **fonctionnels** (pas juste skeleton)
- ✅ Tests d'intégration cross-provider automatisés
- ✅ Docker-compose profiles (déjà fait par bootstrap) actifs par provider
- ✅ Doc matrix pour aider commercial/dev à choisir

---

## Chantier I — DLQ dashboard (P0)

**Priorité** : 🔴 P0 (silence killer — un handler qui échoue = incident invisible)
**Effort total** : S (1-2 j)
**Précondition** : Aucune
**Session** : `dlq-dashboard`
**Périmètre exclusif** : `src/app/(admin)/admin/mcc/dlq/`, `src/app/api/admin/dlq/`

### 🎯 Objectif

Le bus événementiel a une DLQ (bien). Mais aucune interface pour la voir/vider. Si `FiscalSealer` échoue 3 fois, la clôture Z est incomplète et personne ne le sait.

### 📦 Actions détaillées

#### [I-01] Route `/admin/mcc/dlq`

**Effort** : S (4-6 h)
**Fichier** : `src/app/(admin)/admin/mcc/dlq/page.tsx` (nouveau)

**Contenu UI** :
- Tableau des events en DLQ (colonnes : event name, tenantId, error, attempt count, timestamp)
- Filtres : par event name, par tenant, par timestamp
- Actions par ligne : "Rejouer", "Supprimer", "Voir payload"
- Bandeau alerte si count > seuil

**RBAC** : requireMccLevel('mcc_senior_dev') minimum.

#### [I-02] API `/api/admin/dlq/list`

**Effort** : XS (1 h)
**Fichier** : `src/app/api/admin/dlq/list/route.ts`

**GET** : retourne les events en DLQ avec pagination.

#### [I-03] API `/api/admin/dlq/replay`

**Effort** : S (2-3 h)
**Fichier** : `src/app/api/admin/dlq/replay/route.ts`

**POST** `{ eventId }` : rejoue un event depuis DLQ via IdempotencyGuard (safe re-emit).

Après replay success → event supprimé de DLQ. Après replay fail → reste en DLQ avec incrémentation attempt.

#### [I-04] Alertes automatiques DLQ threshold

**Effort** : S (3-4 h)
**Fichier** : `src/lib/cron/DlqThresholdMonitor.ts`

**Comportement** :
- Cron toutes les 5 min
- Compte les events en DLQ par tenant
- Si > 10 events sur 1h → alerte MCC (email + inApp notification via webpush)
- Si > 100 events sur 1j → alerte critique (SMS optionnel)

**Envoi** : réutilise `SmsGatewayService` + email transactional.

#### [I-05] Tests DLQ dashboard

**Effort** : S (2-3 h)
**Fichier** : `src/__tests__/dlq/dashboard-api.test.ts`

**Scénarios** :
- List avec filtres
- Replay success → event supprimé DLQ
- Replay fail → attempt count incrémenté
- RBAC : tenant admin ne voit pas la DLQ
- Threshold alert déclenchée à 10 events/h

### 📊 Sortie Chantier I

- ✅ Route MCC DLQ accessible
- ✅ Replay manuel opérationnel
- ✅ Alertes automatiques configurées
- ✅ Silence killer → visible

---

## Chantier J — God files 18 → 0 (P1)

**Priorité** : 🟠 P1 (dette contradictoire avec chantier `9260dad5e` "0 god file")
**Effort total** : L (3 semaines fil rouge, 1 god file/semaine)
**Précondition** : Plan cycles Vague C (kernel/) — sinon la fusion recrée des cycles
**Session** : `god-files-eradication` (fil rouge continu)
**Périmètre** : varie par action

### 🎯 Objectif

Sentrux détecte 18 god files (fan-out > 15) qui trahissent le principe "1 fichier = 1 responsabilité". Certains sont légitimes (test helpers, registerHandlers) mais 6 sont vraiment problématiques.

### 📦 Actions détaillées

#### [J-01] `app/(admin)/admin/mcc/page.tsx` (fan-out 17)

**Effort** : M (1-2 j)
**Périmètre** : page MCC cockpit

**Actions** :
1. Extraire logique métier vers `lib/mcc/services/MccDashboardService.ts`
2. Fragmenter UI en 4-6 composants dans `modules/system/components/mcc/` :
   - `<FleetOverviewPanel />`
   - `<ActiveIncidentsPanel />`
   - `<TenantHealthGrid />`
   - `<RevenueOverviewChart />`
   - `<QuickActionsBar />`
3. Le fichier `page.tsx` devient un shell < 100 lignes qui assemble les composants

**Tests** : mount panel + service unit tests.

#### [J-02] `modules/finance/components/FinanceDashboard.tsx` (fan-out 17)

**Effort** : M (1-2 j)

**Pattern identique** : extraire les 6-8 widgets métier en composants séparés :
- `<CashflowKPICards />`
- `<PnLQuickView />`
- `<TVAQuarterlyPanel />`
- `<PayoutsCalendar />`
- `<AccountingDocsInbox />`
- `<RiskyOperationsAlerts />`

#### [J-03] `shared/providers/fleet/NexusFleetProvider.tsx` (fan-out 16)

**Effort** : M (1 j)

**Actions** :
1. Décomposer en 3 providers thématiques :
   - `<NexusFleetTenantsProvider />` (list, active tenant)
   - `<NexusFleetPermissionsProvider />` (RBAC scope)
   - `<NexusFleetTelemetryProvider />` (health, incidents)
2. Provider parent `<NexusFleetProvider />` assemble les 3

#### [J-04] `lib/NexusSyncService.ts` (fan-out 16)

**Effort** : M (1-2 j)

**Actions** :
1. Extraire par phase de sync :
   - `NexusSyncBootstrap.ts` (init + hydration cache)
   - `NexusSyncRealtime.ts` (subscribers snapshot)
   - `NexusSyncCronService.ts` (background refresh)
2. `NexusSyncService.ts` devient l'orchestrateur (< 200 lignes)

#### [J-05] `shared/components/layout/NexusProviderStack.tsx` (fan-out 16)

**Effort** : S (4-6 h)

**Actions** :
1. Grouper les providers par domaine :
   - `<NexusCoreProviders>` (nexus, tenant, auth)
   - `<NexusDomainProviders>` (fiscal, hardware, ai)
   - `<NexusUIProviders>` (theme, i18n placeholder, notifications)
2. `NexusProviderStack.tsx` = shell qui empile les 3 groupes

#### [J-06] `lib/mcc/provisioning/TenantProvisioningService.ts` (fan-out 16)

**Effort** : M (1-2 j)

**Actions** :
1. Extraire par étape saga :
   - `steps/createTenantDocStep.ts`
   - `steps/setupOwnerAccountStep.ts`
   - `steps/seedDnaStep.ts`
   - `steps/setupFiscalStep.ts`
   - `steps/dispatchWelcomeStep.ts`
2. `TenantProvisioningService.ts` = orchestrateur saga

Attention : ne pas recréer de cycles — chaque step ne doit importer QUE `kernel/` + `lib/`.

#### [J-07 → J-11] `shared/eventBus/registerHandlers/{ops,human,finance,intelligence,compliance}.ts`

**Effort** : S par fichier (5 × S = M total)

**Actions** :
1. Fragmenter par event domain :
   - `registerHandlers/ops/order-handlers.ts`
   - `registerHandlers/ops/inventory-handlers.ts`
   - `registerHandlers/ops/kds-handlers.ts`
   - etc.
2. `registerHandlers/ops.ts` réduit à l'assembly des sub-registrations

### 📊 Sortie Chantier J

- ✅ 18 god files → 0 (voire quelques légitimes documentés dans `.sentruxignore`)
- ✅ Fan-out global du repo baissé
- ✅ Testabilité de chaque unité améliorée
- ✅ Baseline sentrux mise à jour à chaque merge

---

## Chantier K — Fragmentation eventBus regroupée (P1)

**Priorité** : 🟠 P1 (mental model cassé, sauts de dossier constants)
**Effort total** : M (3 j)
**Précondition** : Chantier F (kernel/events/) fini
**Session** : `eventbus-regroupement`
**Périmètre exclusif** : `src/shared/eventBus/**` (déjà réduit post-F-01)

### 🎯 Objectif

Aujourd'hui pour comprendre "que se passe-t-il quand `order.paid` est émis ?", tu sautes entre :
- `kernel/events/order.events.ts` (schema)
- `shared/eventBus/handlers/order-paid-handler.ts` (handler)
- `shared/eventBus/registerHandlers/ops.ts` (registration)
- `shared/eventBus/middleware/some-middleware.ts` (middleware ?)

**Solution** : regrouper par event domain, pas par technicalité.

### 📦 Actions détaillées

#### [K-01] Structure cible

```
src/shared/eventBus/
├── NexusEventBus.ts             (core inchangé)
├── ServerEventBus.ts            (core inchangé)
├── IdempotencyGuard.ts          (core inchangé)
├── DLQRetryService.ts           (core inchangé)
├── PayloadMigrator.ts           (core inchangé)
│
├── domain/                      ← NOUVEAU regroupement par event
│   ├── order-paid/
│   │   ├── handler.ts           (déplacé depuis handlers/)
│   │   ├── register.ts          (extrait de registerHandlers/ops.ts)
│   │   └── handler.test.ts
│   ├── ticket-z-closed/
│   ├── haccp-temp-alert/
│   ├── stock-deducted/
│   └── ...
│
├── middleware/                  (inchangé — vraiment global)
└── registerAll.ts               (assemble tous les domain/*/register.ts)
```

**Note** : les schemas restent dans `kernel/events/` (post-F-01), les handlers/registrations dans `shared/eventBus/domain/`.

#### [K-02] Migration atomique par event

**Effort** : S par event × ~50 events principaux ≈ M total

**Actions** (par event) :
1. Créer `shared/eventBus/domain/<event-name>/`
2. Déplacer handler depuis `shared/eventBus/handlers/`
3. Extraire le bloc de registration depuis `registerHandlers/<pilier>.ts`
4. Créer `register.ts` qui exporte une fonction `registerXxxHandlers(bus)`
5. Assembler dans `registerAll.ts`

**Rewrite imports** : sed par event.

#### [K-03] Sunset des anciens dossiers

**Effort** : XS (30 min par pilier)

**Actions** : quand tous les events d'un pilier sont migrés, `git rm` :
- `shared/eventBus/handlers/` (vide)
- `shared/eventBus/registerHandlers/{pilier}.ts` (vide)

Garder `registerHandlers.ts` racine qui appelle `registerAll()`.

#### [K-04] Sentrux règle "1 domain = 1 dossier"

**Effort** : XS (15 min)

**Règle** :
```toml
[[rules]]
name = "eventbus_domain_isolation"
description = "shared/eventBus/domain/<X>/ ne peut être importé que par registerAll.ts"
from = "src/shared/eventBus/domain/**"
allowed = ["src/shared/eventBus/registerAll.ts"]
severity = "error"
```

### 📊 Sortie Chantier K

- ✅ 1 event = 1 dossier avec handler + register + tests
- ✅ Comprendre un flow = 1 lecture au lieu de 4 sauts
- ✅ Barrel fragmentation réduite
- ✅ Onboarding dev : "cherche `order-paid/`" au lieu de "cherche partout"

---

## Chantier L — RBAC 5 sources → 1 (P1)

**Priorité** : 🟠 P1 (source d'erreurs à chaque ajout de rôle)
**Effort total** : M (3-4 j)
**Précondition** : Chantier F terminée idéalement (kernel/ pour les enums)
**Session** : `rbac-unification`
**Périmètre exclusif** : `src/lib/AccessPolicyManager.ts`, `src/lib/server/adminAuthGuard.ts`, `src/modules/intelligence/services/UniversalSystemPromptBuilder.ts`, `src/kernel/contracts/rbac.ts` (nouveau)

### 🎯 Objectif

Aujourd'hui 5 sources déclarent "qui peut faire quoi" :
1. `PermissionRole` enum
2. `PERMISSION_ROLE_LEVELS` map
3. `TENANT_ADMIN_ROLES` liste
4. `FLEET_ROLES` liste
5. `resolveRoleLevel` (Assistant IA)

Ajouter un rôle = 5 updates + risque énorme d'oubli.

### 📦 Actions détaillées

#### [L-01] Table déclarative unique

**Effort** : S (4-6 h)
**Fichier** : `src/kernel/contracts/rbac.ts` (nouveau)

**Structure** :
```typescript
export const RBAC_ROLES = {
  // Fleet (MCC)
  mcc_super_admin: {
    scope: 'fleet',
    level: 1000,
    label: 'Super Admin MCC',
    canManage: ['*'],
  },
  mcc_senior_dev: { scope: 'fleet', level: 900, ... },
  mcc_junior_dev: { scope: 'fleet', level: 800, ... },

  // Tenant
  admin: { scope: 'tenant', level: 100, label: 'Admin tenant', canManage: ['*'] },
  manager: { scope: 'tenant', level: 80, ... },
  chef: { scope: 'tenant', level: 60, ... },
  serveur: { scope: 'tenant', level: 40, ... },
  employé: { scope: 'tenant', level: 20, ... },
} as const;

export type RbacRole = keyof typeof RBAC_ROLES;
```

#### [L-02] Générateurs pour les 4 anciennes sources

**Effort** : S (2-4 h)
**Fichier** : `src/lib/rbac/generated.ts`

**Actions** :
```typescript
export const PermissionRole = Object.keys(RBAC_ROLES) as [RbacRole, ...RbacRole[]];

export const PERMISSION_ROLE_LEVELS: Record<RbacRole, number> =
  Object.fromEntries(Object.entries(RBAC_ROLES).map(([k, v]) => [k, v.level]));

export const TENANT_ADMIN_ROLES = Object.entries(RBAC_ROLES)
  .filter(([_, v]) => v.scope === 'tenant' && v.level >= 80)
  .map(([k]) => k);

export const FLEET_ROLES = Object.entries(RBAC_ROLES)
  .filter(([_, v]) => v.scope === 'fleet')
  .map(([k]) => k);
```

Les autres fichiers importent depuis `generated.ts` = zéro duplication.

#### [L-03] Suppression `resolveRoleLevel` Assistant IA

**Effort** : XS (30 min)
**Fichier** : `src/modules/intelligence/services/UniversalSystemPromptBuilder.ts`

**Action** : remplacer la matrice locale par un `import { PERMISSION_ROLE_LEVELS } from '@/lib/rbac/generated'`.

Supprimer les rôles fantômes (`owner`, `proprietaire`, `receptionniste`, etc.) qui n'existent dans aucune source canonique.

#### [L-04] ADR-008 : "RBAC single source of truth"

**Effort** : XS (30 min)
**Fichier** : `docs/adrs/ADR-008-rbac-single-source.md`

#### [L-05] Tests RBAC canoniques

**Effort** : S (2-3 h)
**Fichier** : `src/__tests__/rbac/canonical-source.test.ts`

**Scénarios** :
- Tous les rôles de `PermissionRole` ont un niveau
- Tous les `TENANT_ADMIN_ROLES` ont scope `tenant`
- Tous les `FLEET_ROLES` ont scope `fleet`
- Le rôle canonique le plus haut est `mcc_super_admin` (1000)
- Aucun rôle n'a le même niveau qu'un autre (unicité)

### 📊 Sortie Chantier L

- ✅ 1 seule source de vérité RBAC dans `kernel/contracts/rbac.ts`
- ✅ Impossible d'ajouter un rôle sans que les 4 générateurs suivent
- ✅ Assistant IA aligné sur canon
- ✅ ADR + tests garantissent la non-régression

---

## Chantier M — Décision i18n (P1)

**Priorité** : 🟠 P1 (dette qui ne coûte pas mais qui bloque le futur)
**Effort total** : XS (décision) + variable (implémentation)
**Précondition** : Aucune
**Session** : `i18n-decision`
**Périmètre** : `src/i18n/**` + tous composants (si activation)

### 🎯 Objectif

`src/i18n/` = 464 lignes d'infrastructure inactive. Décider explicitement :
- **Option A — Purger** : gain ~500 LOC, moins de graisse, mais impossible go-to-market international
- **Option B — Activer** : chantier L (2-3 semaines), débloque marchés DE/CH/BE/UK

### 📦 Actions détaillées

#### [M-01] Décision explicite (session avec user)

**Effort** : XS
**Livrable** : ADR-009 ou note dans CLAUDE.md

**Questions à trancher** :
- Marché prioritaire 12 prochains mois ? (FR only / EU / world)
- Ressources humaines pour traduire ? (bénévoles / agence / DeepL API)
- Verticales prioritaires en international ? (hotel = obvious, gym/coworking peuvent l'être)

#### [M-02a] Option Purger

**Effort** : S (3-4 h)
**Actions** :
1. `git rm -r src/i18n/`
2. Grep références orphelines et nettoyer
3. Retirer deps package.json si dedicated
4. Note dans CLAUDE.md : "i18n retiré 2026-08-18, à réintroduire si go-to-market international"

#### [M-02b] Option Activer

**Effort** : XL (2-3 semaines)
**Actions** :
1. Choisir librairie (next-intl recommandé pour App Router)
2. Extraire tous les strings hardcodés (script automatique via ts-morph)
3. Créer catalogue `en/fr/de/es` (traduction machine + review)
4. Wrapper composants avec `useTranslations()`
5. Configurer routing localisé (`/en/pos`, `/fr/pos`, ...)
6. Tests E2E pour chaque langue

### 📊 Sortie Chantier M

- ✅ Décision explicite documentée
- ✅ Soit gain LOC, soit vraie i18n en route

---

## Chantier N — Verticales asymétriques (P2)

**Priorité** : 🟡 P2 (vaporware qui peut nuire à la crédibilité si prospect teste `variant='gym'`)
**Effort total** : S (retrait) ou XL (implémentation complète des 4 verticales orphelines)
**Précondition** : Aucune
**Session** : `verticales-asymetrie`
**Périmètre** : `src/verticals/{gym,coworking,veterinary,florist}/`

### 🎯 Objectif

`hotel` a 6 KB d'adapters. `gym`, `coworking`, `veterinary`, `florist` sont quasi vides mais dans le registry. Provisionner un tenant avec ces variants crash à runtime.

### 📦 Actions détaillées

#### [N-01] Audit du statut réel de chaque verticale

**Effort** : XS (2 h)
**Livrable** : `docs/VERTICALS_STATUS.md`

**Tableau** :
| Verticale | Plugin | Adapters | DNA | Capabilities | Statut |
|---|:-:|:-:|:-:|:-:|---|
| restaurant | ✅ | ✅ | ✅ | ✅ | Prod ready |
| hotel | ✅ | ✅ | ✅ | ✅ | Prod ready |
| bakery | ? | ? | ✅ | ✅ | ? |
| ... | | | | | |
| gym | ⚠️ | ❌ | ⚠️ | ⚠️ | Skeleton |
| ...

#### [N-02] Décision par verticale

**Effort** : XS (30 min)

Pour chaque verticale en skeleton :
- **Option A — Retirer** du registry : libère la promesse, évite les tests smoke qui rougissent
- **Option B — Implémenter minimum viable** : effort L par verticale = 4 × L = XL

**Recommandation** : retirer temporairement gym/coworking/veterinary/florist du `DNA_REGISTRY` (marker `disabled: true`) + retirer du `VerticalBlueprintRegistry`. À réactiver quand un prospect concret arrive.

#### [N-03] Update CLAUDE.md avec statut réel des verticales

**Effort** : XS (15 min)

Documenter le statut par verticale pour éviter faux marketing.

### 📊 Sortie Chantier N

- ✅ Statut clair par verticale
- ✅ Aucun crash runtime sur `variant='gym'`
- ✅ Roadmap réaliste pour les verticales à ré-activer

---

## Chantier O — Bundle size monitoring (P2)

**Priorité** : 🟡 P2 (dérive silencieuse possible)
**Effort total** : S (1 j)
**Précondition** : PREREQ-F (baseline mesurée)
**Session** : `bundle-monitoring`

### 🎯 Objectif

Le preflight ne mesure pas la taille du bundle. Il peut doubler sans alerte.

### 📦 Actions détaillées

#### [O-01] Intégrer `next-bundle-analyzer`

**Effort** : XS (30 min)
**Fichier** : `next.config.js`

**Actions** :
```bash
npm i -D @next/bundle-analyzer
```

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer(nextConfig);
```

#### [O-02] Ratchet bundle size dans preflight

**Effort** : S (2-4 h)
**Fichier** : `scripts/preflight.sh` (nouvelle gate 9)

**Actions** :
```bash
step "📦 [9/9] Bundle size ratchet"
BUNDLE_MAX_KB=1500  # baseline à mesurer
JS_SIZE=$(du -sk .next/static/chunks | awk '{print $1}')
if [ "$JS_SIZE" -gt "$BUNDLE_MAX_KB" ]; then
  fail "Bundle JS $JS_SIZE KB > seuil $BUNDLE_MAX_KB KB"
  exit 1
fi
```

#### [O-03] Alerte pré-commit sur ajout deps lourdes

**Effort** : XS (30 min)

Hook husky pre-commit qui warn si `package.json` ajoute une dep > 500 KB (via `npm-check-updates` ou grep `bundlephobia`).

### 📊 Sortie Chantier O

- ✅ Gate 9 preflight bloquant sur bundle > baseline
- ✅ Visibilité continue via `ANALYZE=true npm run build`
- ✅ Empêche la dérive silencieuse

---

## Chantier P — Teardown warnings tests (P2)

**Priorité** : 🟡 P2 (fait rougir preflight à cause de warnings non-erreurs)
**Effort total** : S (1 j)
**Précondition** : Aucune
**Session** : `test-teardown-cleanup`

### 🎯 Objectif

`provisioning-saga-rollback.test.ts` (et probablement 2-3 autres) causent `EnvironmentTeardownError` qui fait exit 1 le preflight malgré 100% tests passants.

### 📦 Actions détaillées

#### [P-01] Audit des tests avec async lifecycle

**Effort** : S (2-4 h)

**Commande** :
```bash
grep -rn "afterAll\|afterEach\|beforeAll\|beforeEach" src/__tests__ | grep -c "async"
```

Identifier ceux qui ont des `Promise` non-await dans le teardown.

#### [P-02] Fix par test

**Effort** : S (3-4 h)

Pour chaque test problématique :
1. Awaiter proprement toutes les Promises dans `afterAll`
2. Fermer explicitement les connexions Dexie/Firestore mocks
3. Clear timers/intervals

#### [P-03] Warn-as-error dans preflight (optionnel)

**Effort** : XS

Ajouter `--reporter=verbose --bail` dans vitest CI pour catcher les warnings comme erreurs. Recommandé après P-02.

### 📊 Sortie Chantier P

- ✅ Preflight ne s'arrête plus sur teardown warnings
- ✅ Tests plus fiables (moins de fuites d'état)

---

## Chantier Q — Legacy re-exports (P3)

**Priorité** : 🔵 P3 (cosmétique, mais chaque legacy = 1 chance de confusion)
**Effort total** : XS (2-3 h)
**Précondition** : Chantiers F + K terminés (sinon on retire des re-exports encore utilisés)
**Session** : `legacy-purge`

### 🎯 Objectif

Supprimer les fichiers "pont" créés pour compat rétro pendant des migrations passées.

### 📦 Actions détaillées

#### [Q-01] Audit re-exports morts

**Commande** :
```bash
grep -rln "^export \* from\|^export {" src/ --include="*.ts" | \
  xargs -I{} sh -c 'if [ $(wc -l < {}) -lt 20 ]; then echo {}; fi'
```

Fichiers < 20 lignes qui ne font que re-exporter = candidats.

#### [Q-02] Purge un par un

Pour chaque candidat :
1. Grep les imports
2. Remplacer par l'import canonique
3. `git rm`
4. TSC + vitest

### 📊 Sortie Chantier Q

- ✅ Structure du repo plus honnête (chaque fichier = vraie unité)
- ✅ Onboarding dev : moins de "pourquoi ce fichier fait 2 lignes ?"

---

## Chantier R — Doublons verticals/modules (P3)

**Priorité** : 🔵 P3 (dette signalée dans memory `handoff-plan`, jamais adressée)
**Effort total** : audit + variable
**Précondition** : Chantier N (statut verticales clair)
**Session** : `verticals-doublons-audit`

### 🎯 Objectif

Selon la mémoire projet, il y a des doublons entre `src/verticals/` et `src/modules/`. Auditer et rationaliser.

### 📦 Actions détaillées

#### [R-01] Audit doublons

**Effort** : S (4-6 h)
**Livrable** : `docs/VERTICALS_VS_MODULES_AUDIT.md`

**Méthode** :
- Pour chaque fichier `src/verticals/**/*.ts`, chercher s'il existe un équivalent `src/modules/**/*.ts`
- Cataloguer : (doublon exact, doublon avec drift, unique vertical, unique module)

#### [R-02] Décision par doublon

**Règle** : la version qui reste doit être **dans `modules/`** (les verticales sont des plugins, pas des propriétaires du code métier).

Pour chaque doublon :
- Si équivalent exact → supprimer la copie verticals/, garder la version modules/
- Si drift → merger et supprimer

#### [R-03] Update CLAUDE.md

**Contenu** : "Une verticale (`src/verticals/<slug>/`) NE contient QUE le plugin (`IVerticalPlugin`), les adapters (branchement piliers) et le DNA. Le code métier reste dans `src/modules/`."

### 📊 Sortie Chantier R

- ✅ 0 doublon verticals/modules
- ✅ Règle claire pour les futures verticales

---

## Matrice des dépendances

```
PREREQ-C (cycles Vague A minimum)
  └── OK pour lancer G, H, I, M (indépendants)
  └── Cycles Vague C terminée
        └── OK pour lancer F (extraction propre)
              └── OK pour lancer K (regroupement eventBus)
                    └── OK pour lancer L (RBAC — utilise kernel/)
                          └── OK pour lancer J (god files sans risque cycles)
                                └── OK pour lancer Q (purge legacy)
                                      └── OK pour lancer R (audit doublons)

Chantiers **indépendants** (peuvent démarrer maintenant si PREREQ OK) :
  - G (tests coverage)
  - H (DB-agnostic real)
  - I (DLQ dashboard)
  - M (décision i18n)
  - N (statut verticales)
  - O (bundle size)
  - P (teardown warnings)
```

**Chemin critique** :
```
Cycles A → G (tests) → visibilité + safety net pour tout le reste
```

## Roadmap trimestrielle (mise à jour 2026-08-19 — 4 vagues)

### Q3 2026 (Août - Octobre) — Vague α + β

**Priorité absolue** : ne pas se laisser dépasser techniquement + débloquer scaling ops.

**Vague α — Finition qualité (2-3 sem.)**
- 🟠 α-1 (barrel debt 150 → <50) — L
- 🟡 α-2 (god files 13 → 5, registerHandlers fragmentés) — L
- 🟡 α-3 (NexusFleetProvider doublons consolidation) — M
- 🟡 α-4 (test teardown final purge) — S
- 🟡 α-5 (kernel/ contracts finalisation) — M

**Vague β — Ops immédiate (4-6 sem., en parallèle si équipe)**
- 🔴 Chantier G (test coverage flows critiques) — L, CRITIQUE risque #1
- 🔴 Chantier I (DLQ dashboard MCC) — S, quick win 1-2 j
- 🔴 **Chantier X** (Stripe billing, depuis PLAN_SCALING_SOLO) — M, débloque acquisition
- 🔴 **Chantier U** (ops self-healing, depuis PLAN_SCALING_SOLO) — L, post-I
- 🟠 **Chantier Y** (monitoring intelligent, depuis PLAN_SCALING_SOLO) — M
- 🟠 Chantier M (décision i18n) — XS + variable

**Résultat visé Q3** : capacité solo passe de ~10 à **~25-30 tenants**.

### Q4 2026 (Novembre - Janvier) — Vague γ

**Priorité** : self-service acquisition + structure définitive.

- 🟡 Chantier F (restructure shared/) — post α-5 (kernel/ existe)
- 🟠 Chantier K (eventBus regroupé par event domain) — post α-2
- 🟠 Chantier L (RBAC finalisation table unique) — post α-5
- 🔴 **Chantier S** (onboarding self-service complet, depuis PLAN_SCALING_SOLO) — XL, post-X
- 🟠 **Chantier V** (sales reseller portal, depuis PLAN_SCALING_SOLO) — L, post-S
- 🟡 Chantier N (verticales asymétriques statut)
- 🟡 Chantier O (bundle size monitoring)

**Résultat visé Q4** : capacité solo passe à **~50 tenants** + acquisition scalable.

### Q1 2027 (Février - Avril) — Vague δ partie 1

**Priorité** : DB agnostic réel + fondations support IA.

- 🔴 Chantier H (DB-agnostic Postgres/Mongo réel) — XL 2 semaines
- 🟠 **Chantier W** (docs client vivante, depuis PLAN_SCALING_SOLO) — M, préalable T
- 🔴 **Chantier T** (support IA embedded LLM-agnostic, depuis PLAN_SCALING_SOLO) — L, post-W

**Résultat visé Q1 2027** : différenciateur commercial (data residency + IA souverain).

### Q2 2027 (Mai - Juillet) — Vague δ partie 2

**Priorité** : formation + polish final.

- 🟠 **Chantier Z** (formation gérant auto, depuis PLAN_SCALING_SOLO) — M
- 🔵 Chantier Q (legacy purge)
- 🔵 Chantier R (doublons verticals/modules audit)

**Résultat visé Q2 2027** : capacité solo à **~80-100 tenants** confortablement.

### Q3 2027 — Réserve / itération

Chantiers repoussés + itération sur retours terrain.

**Charge totale estimée** : ~25-30 semaines de dev focus. Étalable sur 12-18 mois en fil rouge.

---

## Métriques de sortie (4 vagues)

| Métrique | T+0 (2026-08-19) | Post α (Q3) | Post β (Q3) | Post γ (Q4) | Post δ (Q1-Q2 2027) |
|---|:--:|:--:|:--:|:--:|:--:|
| **Cycles madge** | 0 | 0 | 0 | 0 | 0 stable |
| **God files** | 13 | ≤ 6 | ≤ 6 | ≤ 3 | 0 |
| **Barrel Contract** | 150 | < 50 | < 30 | 0 | 0 stable |
| **Test coverage global** | 4.4% | 4.4% | 15% | 20% | 40% |
| **Tenants supportables solo** | ~10 | ~10 | **~25-30** | **~50** | **~80-100** |
| **Support automatisé** | 0% | 0% | ~30% (self-healing) | ~50% (docs) | **~80% (IA)** |
| **Onboarding tenant (temps toi)** | 4h | 4h | 4h | **0h** | 0h |
| **DB providers réellement fonctionnels** | 1 | 1 | 1 | 1 | **4** |
| **Ventes via revendeurs** | 0% | 0% | 0% | ~30% (portail) | ~50% |
| **RBAC sources** | 1 MCC + fragmenté tenant | idem | idem | **1 unique** | 1 unique |
| **DLQ dashboard opérationnel** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Stripe recurring billing** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Support IA embedded** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **i18n statut** | dormant | dormant | décidé | résolu | résolu |
| **12 verticales fonctionnelles** | 2/12 | 2/12 | 2/12 | statut clair | 6-8/12 |
| **Bundle size gate** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **shared/ structuré** | 15 dossiers mixtes | 15 | 15 | 3 catégories | 3 stable |
| **Kernel/** | 0 fichiers | ~200 (α-5) | ~200 | ~250 | ~300 |
| **Legacy re-exports** | ~10 | ~10 | ~10 | ~5 | 0 |
| **Sentrux quality** | 4587 | 5000 | 5200 | 5500 | 6000+ |
| **Ratchet ESLint barrel-debt** | 210 | **50** | **30** | **10** | **10 stable** |

## Journal d'exécution — template

À tenir dans `.claude/sessions.md` sous chaque session de chantier.

```markdown
### Journal Chantier X (session <name>)

| ID | Action | Statut | Commit | Notes |
|----|--------|:------:|--------|-------|
| X-01 | ... | ⬜ | — | — |
| X-02 | ... | ⬜ | — | — |
| ... | ... | ... | ... | ... |
```

**Légende** : ⬜ à faire · 🟨 en cours · ✅ fait · ❌ bloqué · ↩️ reverted

---

## Annexes

### A. Correspondance chantier → session sessions.md

| Chantier | Nom session | Périmètre exclusif |
|---|---|---|
| F | `restructure-shared-final` | `src/shared/**`, `src/kernel/**` |
| G | `test-coverage-critical` | `src/__tests__/**` |
| H | `db-agnostic-real` | `src/lib/nexus/adapters/**`, `src/lib/nexus/NexusInfra.ts` |
| I | `dlq-dashboard` | `src/app/(admin)/admin/mcc/dlq/`, `src/app/api/admin/dlq/` |
| J | `god-files-eradication` | varie (voir action) |
| K | `eventbus-regroupement` | `src/shared/eventBus/**` |
| L | `rbac-unification` | `src/lib/rbac/**`, `src/kernel/contracts/rbac.ts`, guards |
| M | `i18n-decision` | `src/i18n/**` |
| N | `verticales-asymetrie` | `src/verticals/{gym,coworking,veterinary,florist}/` |
| O | `bundle-monitoring` | `next.config.js`, `scripts/preflight.sh` |
| P | `test-teardown-cleanup` | `src/__tests__/**` (async lifecycle) |
| Q | `legacy-purge` | fichiers re-export courts |
| R | `verticals-doublons-audit` | `src/verticals/**` + `src/modules/**` |

### B. ADRs à produire

- ADR-006 : Kernel Contracts Layer (plan cycles Vague E)
- **ADR-007** : shared/ = runtime réutilisable, kernel/ = vocabulaire pur (chantier F)
- **ADR-008** : RBAC single source of truth (chantier L)
- **ADR-009** : Décision i18n (chantier M)

### C. Hors périmètre (à programmer séparément)

- **Pentest offensif** — trimestre 2 2027, dossier séparé
- **Audit LNE/AFNOR NF525** — dossier d'homologation tiers
- **Refonte design system** — audit UI global du 07/08/2026 déjà couvert
- **Migration cloud provider** — pas de signal métier
- **Fine-tuning SLM** — projet parallèle, session dédiée

---

**Fin du plan.**

**Prochaine action** : décider quel(s) chantier(s) démarrer en Q3 en parallèle du plan cycles. Reco = G (tests) + I (DLQ) + M (i18n) + P (teardown).
