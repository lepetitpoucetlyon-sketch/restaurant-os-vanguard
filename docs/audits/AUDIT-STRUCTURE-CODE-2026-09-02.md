# Audit complet — Structure du code (dépôt entier)

> Session `claude-audit-structure-code` (Claude Code) · 2026-09-02
> **LECTURE SEULE** sur `src/`, `scripts/`, `functions/`. N'écrit que ce fichier.
> Toutes les mesures sont **prises dans cette session** avec commande reproductible (Loi 7).
> Niveaux de certitude : 🎯 CONFIRMÉ (visible dans le source) · 🔍 PROBABLE (pattern à vérifier) · ❓ HYPOTHÈSE.
>
> **Plan correctif associé : [`docs/plans/PLAN-CORRECTIF-STRUCTURE-2026-09-02.md`](../plans/PLAN-CORRECTIF-STRUCTURE-2026-09-02.md)**

---

## 0 bis. Ré-analyse après les 4 commits correctifs (`988559f62` → `8e1c1901f`)

> Refait à `HEAD = 8e1c1901f` (l'audit initial était à `94d6a81ac`).

Les 4 commits (`988559f62` boucles infinies Lot 9 + file d'impression, `ad256ad65`
câblage des 3 derniers services verticale, `03e8bfb1e` casse un cycle barrel
*nouvellement introduit* par `ad256ad65`, `8e1c1901f` retrait de 2 handlers POS morts)
portent **uniquement sur le câblage de la verticale restaurant**. Effet mesuré :

| Métrique | Audit initial (`94d6a81ac`) | Ré-analyse (`8e1c1901f`) | Δ |
|---|---:|---:|---|
| `tsc --noEmit` | 0 | 0 | = |
| ESLint erreurs / warnings | 0 / 0 | 0 / 0 | = |
| **Cycles madge (`--threshold=0`)** | **8** | **8** | **= (inchangé — aucun des 8 traité)** |
| Seuil cycles `pre-commit` vs `preflight` | 430 vs 0 | 430 vs 0 | = (non corrigé) |
| `verticalServicesUnwired` | 41 | **36** | ✅ −5 (repasse sous le ratchet 40) |
| `frHardcoded` (JSX) | 772 | **773** | 🔴 +1 — **dépasse le ratchet 772** (arbre de travail non commité, anti-slop) |
| `responsive` (informatif) | 112 | 109 | −3 |
| `duplicates` (registre finance) | 6 | 6 | = |
| `FleetComplianceService.ts` doublon byte-identique | oui | **oui (toujours `diff` = 0)** | = |
| `DemoSeeder.ts` doublon | oui | oui | = |
| `src/modules/system/` (9ᵉ dossier) | oui | oui | = |
| `src/instances/` imports | 8 | 8 | = |

**Conclusion de la ré-analyse : les corrections apportées ne touchent aucun des constats
P0/P1 de structure.** `verticalServicesUnwired` s'améliore (bon signe pour la verticale),
mais :

1. **Les 8 cycles sont exactement les mêmes** (mêmes fichiers, mêmes chaînes). `03e8bfb1e`
   a corrigé un **9ᵉ cycle transitoire** créé la même journée par `ad256ad65`
   (`RecipeCostSummary → @/modules/ops` barrel → relatif) — il n'a jamais figuré dans l'audit.
2. **Un chantier cycle 8 est en cours dans l'arbre de travail** :
   `src/lib/mcc/provisioning/steps/provisioningSteps.ts` (non commité, +35 l.) introduit
   `registerCompanyScraper()` (DI) — bonne direction — **mais** garde un fallback
   `await import('@' + '/modules/commerce')` en **concaténation de chaîne pour berner madge**.
   C'est de l'évitement de mesure, pas une résolution : la dépendance runtime existe toujours.
   → traité dans le plan correctif §2.8.
3. `frHardcoded` 773 > 772 : l'arbre de travail (nettoyage AI-slop non commité) **franchit
   un ratchet**. `pre-commit` le bloquera au prochain `git commit` — à résorber avant.
4. `FiscalEngine`/`FiscalKeyService` sont maintenant importés via un **barrel de 2 lignes
   `src/lib/fiscal.ts`** (`export { FiscalEngine } from './mcc/fiscal/FiscalEngine'`), utilisé
   par 5 fichiers ; `@/lib/mcc/fiscal` en direct reste utilisé par 7 fichiers ; **l'implémentation
   physique est toujours sous `src/lib/mcc/fiscal/`** et `FiscalSealer` n'est pas dans le barrel.
   La reco P1.5 (déplacer physiquement `lib/mcc/fiscal/` → `lib/fiscal/`) reste entière.

Le reste du document (§1 → §10) reste valable tel quel à `HEAD = 8e1c1901f`.

---

## 0. Résumé exécutif

Le socle est **sain sur le fond** : 0 erreur `tsc`, ESLint 0 erreur / 0 warning,
Barrel Contract à 0, inter-module à 0, `lib→modules` (ADR-015) à 0, suite Vitest verte,
20 ADRs qui documentent les décisions de fond. L'architecture en 8 piliers + couche
Nexus + SovereignGuard est réellement en place et respectée par le linter.

Mais la **structure physique a divergé du modèle documenté** et une **régression de
cycles est entrée sur `main` sans être vue** :

| Sévérité | Constat | Preuve |
|---|---|---|
| 🔴 P0 | **8 cycles d'import** sur `main` contre un ratchet `preflight` de **0** → `npm run preflight` échoue à la gate 5 | `node scripts/cycles-inspector.mjs --threshold=0` → exit 1, `totalCycles: 8` |
| 🔴 P0 | Le **hook `pre-commit` teste les cycles à `--threshold=430`**, la gate `preflight` à `0` : les commits passent, la dette s'accumule invisible | `.githooks/pre-commit:35` vs `scripts/preflight.sh:190` |
| 🟠 P1 | `src/kernel/` **n'est pas** la « machine core Nexus » décrite dans `CLAUDE.md` : le vrai cœur est éclaté entre `lib/nexus/`, `shared/nexus/`, `shared/eventBus/`, `infrastructure/adapters/` | `find src/kernel` — aucun `nexus/{guards,engines,adapter}` |
| 🟠 P1 | **4 fichiers dupliqués** (dont 1 byte-identique) entre couches | §5.3 |
| 🟠 P1 | `src/infrastructure/` (46 f.) porte du cœur critique (adapters, `FiscalLedger`, `pillarSyncRegistry`) **et n'est pas mentionné** dans `CLAUDE.md` | §3 |
| 🟡 P2 | `src/lib/` racine = **59 fichiers fourre-tout** (services + utils + adapters + atomes + UI mélangés) — constat inchangé depuis l'audit du 2026-08-07 | `find src/lib -maxdepth 1 -type f` |
| 🟡 P2 | `src/modules/system/` = **9ᵉ dossier** dans `modules/` hors des 8 piliers | `find src/modules/system` |
| 🟡 P2 | `src/instances/` (configs tenant en dur) **toujours vivant** : 8 imports, dont `useNexusTenantLogic.ts` | §5.1 |
| 🟡 P2 | Sous-systèmes **écrits mais non câblés** : Vertical Forge derivation (`verticals/_shared/derivation/*`, `blind-spot/*`, `sector-study/*`) + `ServiceTicketService` — 41 services de verticale sans consommateur | mesure `verticalServicesUnwired = 41` |
| 🟢 P3 | **214 fichiers Markdown** (30 racine + 184 `docs/`) — dette documentaire, beaucoup d'audits/plans périmés non archivés | `ls *.md ; find docs -name '*.md'` |

**Note globale de structure : 13,5 / 20.** Le linter tient les frontières logiques ;
la topologie physique des couches transversales (`kernel` / `lib` / `shared` / `infrastructure`)
est incohérente et une gate de cycles est contournée par un seuil de hook périmé.

---

## 1. Cartographie mesurée

`find src -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l` → **3 745 fichiers**
(`npm run measure` en compte 3 405 hors tests).

| Couche | Fichiers | Rôle attendu | État |
|---|---:|---|---|
| `src/modules/` | 1 615 | Code métier — 8 piliers | ✅ conforme (+ 1 dossier parasite `system/`) |
| `src/shared/` | 734 | Composants, bus événementiel, Nexus « métier » | 🟠 fourre-tout partiel (`eventBus/` 224, `nexus/` 138, `components/` 203) |
| `src/app/` | 465 | Routes Next.js App Router | ✅ + 218 routes API |
| `src/__tests__/` | 267 | Tests unitaires / intégration | ✅ |
| `src/verticals/` | 255 | Plugins par industrie (types, adapters, skins UI) | 🟠 déborde de la charte (`ops/`, `finance/nf525/`, `handlers/` dans certaines verticales) |
| `src/lib/` | 238 | Services transversaux non-métier | 🟠 59 fichiers à la racine, sous-dossiers cibles à moitié remplis |
| `src/infrastructure/` | 46 | *(non documenté dans CLAUDE.md)* | 🔴 porte du cœur critique |
| `src/kernel/` | 39 | *(CLAUDE.md : « machine core Nexus »)* | 🔴 ne contient que `ai/`, `open-pencil/`, `contracts/`, `settings/`, `hooks/`, `routing/` |
| `src/e2e/` | 33 | Tests e2e vanguard | ✅ |
| `src/store/` | 24 | Atomes Jotai transverses | ✅ |
| `src/config/` | 9 | `navConfig.ts`, prompts, features | ✅ |
| `src/i18n/` | 6 | 5 locales | ✅ (parité 552 clés, 0 manquante) |
| `src/instances/` | 5 | *(dead code annoncé 2026-08-07)* | 🟡 encore importé |
| `src/constants/`, `src/types/`, `src/domain/` | 3 + 2 + 2 | reliquats | 🟢 quasi éteints (`domain/` : 50 → 2) |

### Répartition des piliers (`src/modules/`)

| Pilier | Fichiers | Domaines (fichiers) |
|---|---:|---|
| commerce | 348 | acquisition 166 (onboarding 85, marketing 69), relation 120, fidelite 17, ui 14, connectors 12 |
| ops | 293 | service 136, production 85, workflow 29, connectors 13, providers 10 |
| finance | 245 | comptabilite 86, tresorerie 42, components 34, fiscalite 22, services 21, connectors 16 |
| compliance | 184 | qualite 118, securite 20, legal 12, reglementaire 10, domain 9, services 7 |
| intelligence | 174 | ia 58, analytique 30, services 16, connectors 15, domain 15, knowledge 13 |
| logistics | 149 | stock 64, approvisionnement 56, connectors 8, services 6, hooks 5 |
| human | 141 | effectifs 78, remuneration 16, connectors 18, services 15, conventions 9 |
| facility | 74 | spaces 29, components 16, maintenance 15, services 7, assets 3, hooks 3 |
| **system** | **6** | ⚠️ hors des 8 piliers — voir §4.4 |

Les **9 barrels racine** existent (`src/modules/<pilier>/index.ts`, 34–113 lignes).

---

## 2. Ce qui est réellement conforme (le socle tient)

- 🎯 **`tsc --noEmit` : 0 erreur** (`npx tsc --noEmit`, gate 1).
- 🎯 **ESLint : 0 erreur, 0 warning** sur `src/` (aucune ligne `✖`).
- 🎯 **Barrel Contract = 0**, **no-inter-module-imports = 0**, **lib→modules (ADR-015) = 0** — les 3 règles de couches passent (commit `003a81af3` a résorbé la dette 33→0).
- 🎯 **Isolation multi-tenant** : `SovereignGuard` présent (`src/shared/nexus/guards/`, 29 fichiers), wrap auto via `NexusInterceptor`.
- 🎯 **Chaîne NF525** : `FinancialNexusBridge` (`modules/finance/comptabilite/`) → `FiscalSealer` → `FiscalEngine` en place ; collections immuables déclarées.
- 🎯 **Mesures « dernier kilomètre » toutes vertes** (`npm run measure`) : orphelins 0, réglages morts 0, clés i18n manquantes 0, parité locales 0, scellements non canoniques 0, métriques en dur 0, écrans hors DS 0, a11y (muets / modales / clavier) 0, stubs de verticale 0.
- 🎯 **20 ADRs** cohérents et référencés (`docs/adrs/ADR-001` → `ADR-020`).
- 🎯 **i18n actif** : 5 locales à parité (552 clés de référence) — le fait `i18n-inactif` de la mémoire NexusCoder est **périmé**.

---

## 3. 🔴 Incohérence des couches transversales (`kernel` / `lib` / `shared` / `infrastructure`)

`CLAUDE.md` et `~/.nexuscoder/domain-facts.yml` décrivent un modèle qui **n'est plus le code réel** :

| Ce que dit `CLAUDE.md` | Ce que montre le code |
|---|---|
| `src/kernel/` = machine core Nexus : `adapter/`, `adapters/`, `nexus/{guards,contracts,engines,telemetry}`, `providers/`, `ModuleRegistry.ts` | `src/kernel/` = `ai/` (routage LLM), `open-pencil/` (design-as-code), `contracts/` (5 f.), `settings/`, `hooks/` (3 f.), `routing/`. **Aucun `nexus/`, aucun adapter, aucun guard, pas de `ModuleRegistry.ts`.** |
| `src/lib/nexus/` et `src/shared/nexus/` « N'EXISTENT PLUS (rapatriés) » | `src/lib/nexus/` = **18 fichiers** (dont `NexusAdapter.ts`, `NexusInterceptor.ts`). `src/shared/nexus/` = **138 fichiers** (contracts 63, guards 29, tokens 23, vault 7…). |
| `src/infrastructure/` | **non mentionné** — pourtant 46 fichiers, dont `adapters/` (Firestore, Simulacra), `services/sovereign/fiscal/FiscalLedger.ts`, `services/sync/{pillarSyncRegistry,syncGates}.ts`, `bootstrapProviders.ts`. |

Localisation réelle des pièces « cœur » :

| Pièce | Emplacement réel |
|---|---|
| `NexusAdapter` / `NexusInterceptor` | `src/lib/nexus/` |
| `SovereignGuard` | `src/shared/nexus/guards/` |
| `NexusEventBus` | `src/shared/eventBus/` |
| `FiscalSealer` / `FiscalEngine` (implémentation) | `src/lib/mcc/fiscal/` — *shims de 5-6 lignes dans `modules/finance/`* |
| `FiscalLedger` | `src/infrastructure/services/sovereign/fiscal/` |
| Handlers e-bus (159) | `src/shared/eventBus/handlers/` (à plat) |
| `pillarSyncRegistry` / `syncGates` | `src/infrastructure/services/sync/` |
| Adapters (Firestore, Simulacra, Mock) | `src/infrastructure/adapters/` |

> 🎯 **Impact concret** : un agent qui suit `CLAUDE.md` cherche `SovereignGuard` dans
> `src/kernel/nexus/guards/` (n'existe pas), la mémoire NexusCoder l'oriente pareil.
> Les 12 entrées `auto_inject` de `domain-facts.yml` pointant vers `src/kernel/nexus/**`
> sont **toutes mortes**.

**Recommandation** : soit finir le rapatriement vers `src/kernel/`, soit — plus réaliste
— **réécrire la §« kernel-vs-lib » de `CLAUDE.md` + la carte NexusCoder** pour refléter
les 4 emplacements réels et acter `src/infrastructure/` comme couche officielle.

### 3.1 🎯 `src/lib/` racine — 59 fichiers non triés

`find src/lib -maxdepth 1 -type f` → 59. Mélange non résolu depuis l'audit du 2026-08-07 (point 7) :

- **Services** : `CryptoService.ts`, `TenantSeeder.ts`, `IdentityManager.ts`, `ProvisioningEngine.ts`, `BrandingProvider.tsx`, `GroupService.ts`, `CommunicationService.ts`, `SettingsManager.ts`, `MigrationService.ts`…
- **Utils** : `dates.ts`, `formatters.ts`, `helpers.ts`, `utils.ts`, `toError.ts`, `bloom-filter.ts`
- **Adapters** : `firebase.ts`, `firebase-admin-init.ts`, `axiom.ts`, `sentry.ts`, `email-service.ts`
- **Atomes Jotai** : `instanceGuardAtoms.ts` *(un fichier d'atomes à la racine de `lib/`)*
- **UI** : `ui.components.ts`, `ui.foundations.ts`, `BrandingUI.ts`
- **Dead** : `DemoSeeder.ts` (doublon — voir §5.3), `mock-data.ts`

Les barrels cibles (`lib/services/`, `lib/utils/`, `lib/adapters/`) existent mais ne sont
que partiellement peuplés (`lib/services/` = 1 fichier réel).

---

## 4. Conformité au modèle des piliers

### 4.1 ✅ Barrels et frontières

Les 3 règles ESLint de couches passent à 0. Les cross-pilier passent bien par les
barrels racine — c'est *justement* ce qui crée les cycles (§6).

### 4.2 🟠 `src/verticals/` déborde de sa charte

`domain-facts.yml` (`verticals-vs-modules`) : une verticale ne déclare QUE types/config,
adapters vers piliers, skins UI. Or `src/verticals/restaurant/` contient aussi :

```
src/verticals/restaurant/ops/index.ts
src/verticals/restaurant/finance/index.ts
src/verticals/restaurant/finance/nf525/index.ts
src/verticals/restaurant/handlers/FireNextCourseHandler.ts
src/verticals/restaurant/domain/types.ts
src/verticals/restaurant/presentation/MenuEngineeringDashboard.tsx
```

`ADR-020` **assume** le déplacement des handlers restaurant vers la verticale, mais
**1 seul handler sur ~12 visés** a bougé (`FireNextCourseHandler.ts`) ; les 158 autres
restent à plat dans `src/shared/eventBus/handlers/`. Migration documentée, à peine commencée.

### 4.3 🟡 Déséquilibre des 12 verticales

| Verticale | Fichiers |
|---|---:|
| `_shared` | 54 |
| hotel / garage | 28 |
| clinic | 26 |
| salon / retail / bakery | 17–19 |
| restaurant | **17** |
| gym / florist / coworking / veterinary | **9** chacune |

`restaurant` (la verticale de référence, la plus mûre métier) a **moins de fichiers de
verticale** que `hotel` ou `garage` : sa logique vit dans `src/modules/ops/service/restaurant/`
(136 f. dans `service/`). Les 4 dernières (`gym`/`florist`/`coworking`/`veterinary`) sont
des squelettes à 9 fichiers. Cohérent avec `ADR-016` (profondeur build-time L0-L3) mais
mérite d'être tracé : `verticalServicesUnwired = 41` (voir §7).

### 4.4 🟡 `src/modules/system/` — 9ᵉ dossier

```
src/modules/system/index.ts            (8 lignes)
src/modules/system/components/OnboardingChecklist.tsx
src/modules/system/domain/schemas/{license,modules,supportTicket,tenant}.ts
```

Ni pilier métier, ni `mcc`, ni `kernel`. Les schémas `license`/`modules`/`tenant`/`supportTicket`
sont des schémas **plateforme** — leur place logique est `src/kernel/contracts/` ou `src/lib/mcc/`.
`OnboardingChecklist.tsx` appartient à `commerce/acquisition/onboarding/`.

---

## 5. 🎯 Reliquats et duplications

### 5.1 `src/instances/` — configs tenant codées en dur, toujours vivantes

`grep -rn "@/instances" src` (hors `src/instances/`) → **8 imports / 5 fichiers** :

```
src/shared/providers/hooks/useNexusTenantLogic.ts   → getTenantConfig   (chemin critique)
src/shared/providers/fleet/FleetComplianceService.ts → getAllTenants
src/modules/commerce/relation/franchise/services/FranchiseService.ts → getAllTenants
src/modules/intelligence/ia/ai/DNAInjector.ts       → getTenantConfig
src/modules/intelligence/ia/fleet/FleetComplianceService.ts → getAllTenants
```

Contient `bistrolyon.ts`, `lepetitpoucet.ts`, `urbanburger.ts` (3 tenants en dur).
Annoncé « à supprimer après Sprint 1 versionbase » le 2026-08-07 ; supersédé par
Nexus + `TenantSeeder` + `SystemTenantRegistry`. **Toujours load-bearing** via le
fallback de `useNexusTenantLogic`.

### 5.2 `app/(public)/demo/` — neutralisé (⬇️ P3)

`src/app/(public)/demo/page.tsx` = redirect 10 lignes vers `/landing`. Le risque
« tenant éphémère » est **résolu**. Reste un fichier vide de sens → suppression cosmétique.

### 5.3 🎯 Fichiers dupliqués entre couches

| Fichier | Emplacement 1 | Emplacement 2 | Verdict |
|---|---|---|---|
| `FleetComplianceService.ts` (108 l.) | `src/shared/providers/fleet/` *(live — via `fleetAggregator`)* | `src/modules/intelligence/ia/fleet/` *(re-export barrel seul)* | 🎯 **byte-identique** (`diff` = 0). Copie morte à supprimer. |
| `DemoSeeder.ts` | `src/infrastructure/services/demo/` (92 l. — **live**, import dynamique dans `useNexusTenantLogic.ts:69`) | `src/lib/DemoSeeder.ts` (86 l. — cité dans un commentaire de barrel seul) | 🎯 divergent. `src/lib/` = mort. |
| `FiscalSealer.ts` | `src/lib/mcc/fiscal/` (149 l. — impl.) | `src/modules/finance/fiscalite/` (6 l. — shim) | ✅ shim ADR-015 assumé (mais impl. fiscale dans `lib/mcc/`, voir §5.4) |
| `FiscalEngine.ts` | `src/lib/mcc/fiscal/` (117 l.) | `src/modules/finance/services/` (5 l. — shim) | ✅ shim assumé |

Aussi : `pillarSyncRegistry.ts` / `syncGates.ts` existent dans `src/infrastructure/services/sync/`
**et** `src/lib/sync/` (7 f.) — à vérifier lequel est mort (🔍 PROBABLE).

### 5.4 🔍 Cœur fiscal NF525 hébergé dans `src/lib/mcc/fiscal/`

`FiscalSealer` + `FiscalEngine` (les primitives de scellement de la vente POS **tenant**)
vivent sous `src/lib/mcc/` — le namespace du **Master Control Cockpit** (super-admin flotte).
C'est un contresens de nommage : ce code sert le parcours caisse d'un restaurant, pas la
console d'admin. Déplacé là pour casser le cycle `finance ↔ lib` via barrel (commentaire
en tête de fichier). **Vérification requise** : confirmer qu'aucune logique MCC-only n'y
a été mélangée, puis renommer `src/lib/mcc/fiscal/` → `src/lib/fiscal/`.

### 5.5 🟡 6 « doublons de nom » = registre finance

`npm run measure` → `duplicates: 6`. Les 6 sont les onglets finance déclarés **deux fois** :
inline dans `FinanceTabRegistry.tsx` **et** dans `_tabs/<Tab>.tsx` (`AccountingTab`,
`AuditTab`, `BankTab`, `BillingTab`, `EInvoicingTab`, `TreasuryTab`). Ce couple
`FinanceTabRegistry ↔ _tabs/*` alimente **2 des 8 cycles** (§6, cycles 2 & 3).

### 5.6 🟢 `src/domain/` presque éteint

2 fichiers restants (`schemas/migration/schemaVersioning.ts`, `schemas/signup/signupSchemas.ts`)
sur 50 à l'origine. Migration schémas Zod vers `modules/<pilier>/domain/schemas/` quasi finie.
`src/types/` = 2 `.d.ts`, `src/constants/` = 3 fichiers (`pos`, `product-form`, `scheduling`)
qui devraient être dans `modules/ops/` et `modules/human/`.

---

## 6. 🔴 P0 — Cycles d'import : régression non vue

### 6.1 Le fait

```
$ node scripts/cycles-inspector.mjs --threshold=0 --json   → exit 1
totalCycles: 8   crossPillarCycles: 7   barrelCycles: 8   (longueurs 3 → 12)
```

`scripts/preflight.sh:190` fixe `MADGE_CYCLES_MAX=0`. **`npm run preflight` échoue
donc actuellement à la gate 5/10 sur `main`.** Les hubs :

| Hub | Cycles impliqués |
|---|---:|
| `modules/compliance/qualite/haccp/services/HACCPTelemetryBridge.ts` | 4 |
| `modules/facility/index.ts` (barrel) | 4 |
| `modules/intelligence/index.ts` (barrel) | 4 |
| `modules/compliance/index.ts` (barrel) | 3 |
| `modules/finance/index.ts` (barrel) | 3 |
| `shared/providers/fleet/*` (`NexusFleetProvider`, `fleetAggregator`, `FleetTelemetryService`) | 3 |

### 6.2 Les 8 cycles

1. `compliance/index → useQuality → QualityEngine → HACCPTelemetryBridge → facility/index → maintenance/registre → Cerfa13984Section → shared/contexts/RegistreContext` *(len 8)*
2. `intelligence/index → OraclePredictor → OracleEngine → MonkeyChaos → finance/index → FinanceDashboard → FinanceTabRegistry → _tabs/AuditTab → FECGenerator → lib/NexusTelemetryService → FleetTelemetryService` *(len 11)*
3. idem #2 + `FleetTelemetryExecutor` *(len 12)*
4. `intelligence/index → OraclePredictor → OracleEngine → MonkeyChaos → finance/index → comptabilite/analytics/hooks → useAnalyticsPage` *(len 7)*
5. `compliance/index → … → HACCPTelemetryBridge → facility/index → MaintenanceAgent → intelligence/index → IdentityGuardService` *(len 8)*
6. `compliance/index → … → HACCPTelemetryBridge → facility/index → FloorPlanEditor → useFloorPlanControls → ops/index → KitchenDashboard → tabs/index → WasteTab` *(len 11)*
7. `HACCPTelemetryBridge → facility/index → FloorPlanEditor → useFloorPlanControls → ops/index → pos/Cart.tsx → NexusFleetProvider → fleetAggregator` *(len 8)*
8. `commerce/index → lib/mcc/provisioning/steps/provisioningSteps.ts → lib/tenantBrandingFromScrape.ts` *(len 3)*

### 6.3 🎯 Cause racine

Pattern « cycle de barrel cross-pilier » : un service dans le pilier A importe le
**barrel racine** du pilier B (`@/modules/facility`, `@/modules/intelligence`…), qui
ré-exporte tout un domaine dont une feuille ré-importe le barrel de A. Concrètement :

- `HACCPTelemetryBridge` (compliance) importe `@/modules/facility` → `facility` importe
  `@/modules/intelligence` / `@/modules/ops` / `RegistreContext` → retour vers compliance.
- `MonkeyChaos` (intelligence, module de *résilience*) importe `@/modules/finance`.
- `fleetAggregator` agrège `FleetComplianceService` + `HACCPTelemetryBridge` +
  `NexusTelemetryService` dans un même fichier → point de jonction de 3 piliers.
- Cycle 8 : `provisioningSteps.ts` (dans `lib/`) importe `@/modules/commerce`.

### 6.4 🔴 Pourquoi ce n'est pas vu

```
.githooks/pre-commit:35   node scripts/cycles-inspector.mjs --threshold=430
scripts/preflight.sh:190  MADGE_CYCLES_MAX=0
```

Le hook `pre-commit` tolère **430 cycles** (seuil hérité d'avant l'assainissement
2026-08-22 qui a ramené à 72 puis 0). Tout commit passe. Seul `preflight` complet
(lancé « à la clôture de lot », souvent sauté d'après `.claude/sessions.md`) verrait le
problème. `verify-gate-integrity.mjs` protège contre le desserrement d'un *ratchet* mais
**ne réconcilie pas les deux seuils**.

> Les sessions récentes le savaient à demi : `claude-fix-cablage-verticale` note
> « madge 9→8 » — elle a **committé 8 cycles contre un ratchet de 0** sans le
> signaler comme bloquant.

### 6.5 Correctifs

| # | Action | Effort |
|---|---|---|
| 1 | **Aligner `pre-commit` sur `--threshold=0`** (ou sur `MADGE_CYCLES_MAX` lu depuis `preflight.sh`) — sinon la dette repart | 5 min |
| 2 | Cycle 8 : `provisioningSteps.ts` → remplacer `import { X } from '@/modules/commerce'` par un contrat neutre `kernel/contracts/` ou `import type` | 30 min |
| 3 | Cycles 2/3/4 : `MonkeyChaos.ts` (résilience) ne doit **pas** importer `@/modules/finance` — injecter la dépendance ou passer par `NexusEventBus` | 1 h |
| 4 | Cycles 1/5/6/7 : `HACCPTelemetryBridge` → `@/modules/facility` en `import type` uniquement, ou event bus | 1–2 h |
| 5 | `fleetAggregator.ts` : arrêter d'agréger 3 piliers dans un fichier — laisser chaque service être importé là où il est consommé | 1 h |
| 6 | Cycles 2/3 : casser `FinanceDashboard → FinanceTabRegistry → _tabs/AuditTab` (le registre ne devrait pas ré-importer les feuilles qu'il enregistre — inversion via lazy `import()`) | 1 h |

---

## 7. Dette structurelle mesurée (`npm run measure`, 2026-09-02)

| Mesure | Valeur | Sous cliquet ? | Détail |
|---|---:|---|---|
| Composants sans consommateur | 0 | ✅ | — |
| Réglages déclarés non lus | 0 | ✅ | 36 déclarés / 36 lus |
| Clés i18n manquantes / parité | 0 / 0 | ✅ | référence 552 clés |
| **Services de verticale non câblés** | **41** | ✅ (ratchet 40, +1 hors-tolérance) | `ServiceTicketService`, `WaitlistManager`, `KitchenService`, `useCashDrawer`, `EightysixtService`, `RecipeBOMCostService` + **~25 fichiers `verticals/_shared/derivation/*`, `blind-spot/*`, `sector-study/*`** (moteur Vertical Forge écrit, 0 consommateur) |
| **Chaînes FR en dur dans le JSX** | **772** | ✅ (ratchet 772, au plafond) | hors `legal/` et `verticals/` |
| **Couleurs `#hex` / `rgba()` en dur** | **955** | ✅ (ratchet 955, au plafond) | hors tokens & marketing |
| Risques responsive | 112 | informatif | 88 largeurs px figées, 259 typo ≤ 11px, 13 `<table>` sans overflow, 11 grilles figées, 4 `h-screen` strict |
| Erreurs potentiellement avalées | 198 | informatif | 0 `catch {}` vide, 39 `catch` commentés, **198 promesses flottantes** |
| Doublons de nom | 6 | informatif | registre finance (§5.5) |
| Empreinte disque | bundle 13 Mo | informatif | cache dev 0 |
| Adoption design-system | boutons bruts 1181 / primitive 284 · champs bruts 464 / 56 · cartes main 581 | informatif | ratchet `dsAdoption` à 0 mais la proportion « brut » reste majoritaire |

### 7.1 🟠 `HACCPTelemetryBridge` — god-hub

`cc=13` (sentrux) **et** hub #1 des cycles (4/8) **et** importé par `fleetAggregator`.
Fichier à refactorer en priorité : c'est le point de couplage compliance ↔ facility ↔ fleet.

### 7.2 🟠 `usePos.ts` — seul god-file restant

`sentrux check .` → `no_god_files: 1` :
`src/modules/ops/service/restaurant/pos/hooks/usePos.ts` (fan-out = 21).
Cohérent avec la mémoire NexusCoder (`ops-pos-flow`). Candidat découpage
(extraire les sous-hooks paiement / TVA / table comme fait pour `NexusOpsProvider`).

### 7.3 sentrux — complexité

`COMPLEX_FN_MAX = 76` (baseline `src/` + `scripts/`). Les fonctions `cc=13` réelles dans
`src/` : `UrssafVigilanceJob.runForTenant`, `sync-manager.processQueue`,
`LightRAGTransport.request`, `ThreeWayMatchEngine.performMatch`, `useStockDeduction`,
`ShiftEditModal`, `StaffMemberForm.handleSaveStaff`, `OracleIntentAugmenter.augmentBakery`,
`DirectoryTab`. Le gros du bruit `cc>12` (~1 400 fonctions) vient de 4 copies vendorisées
du skill `impeccable` sous `.agent/.claude/.gemini/.github/` — **hors `src/`, non bloquant**,
mais gonfle tout `sentrux check`.

---

## 8. `src/shared/` — sous-couche à clarifier

734 fichiers, dont :

| Sous-dossier | Fichiers | Remarque |
|---|---:|---|
| `eventBus/` | 224 | 159 handlers **à plat** dans `handlers/`, 42 `registerHandlers/*`, 15 `events/*`. `ADR-020` veut éclater par pilier/verticale — non fait. |
| `components/` | 203 | composants partagés + `ui/` primitives |
| `nexus/` | 138 | `contracts/` 63 (= alias `@nexus/contracts`), `guards/` 29 (`SovereignGuard`), `tokens/` 23, `vault/` 7 |
| `hooks/` | 51 | |
| `providers/` | 31 | dont `fleet/` (hub de cycles), `hooks/auth/` |
| `seeds/` | 15 | DNA templates (aussi `src/lib/seeds/` ? à vérifier) |

`shared/nexus/` = « Nexus métier » vs `lib/nexus/` = « Nexus machine » : distinction
réelle mais **non écrite** dans `CLAUDE.md` (l'audit du 2026-08-07 le demandait déjà, point 9).

---

## 9. Documentation — dette propre

`ls *.md` → **30 fichiers à la racine** ; `find docs -name '*.md'` → **184**.
Beaucoup sont des audits/plans datés et non archivés (`AUDIT-*-2026-08-*.md`,
`PLAN-*-2026-08-*.md`, `HANDOVER-2026-08-30*.md`…). `docs/archive/` existe mais est
sous-utilisé. `ARCHITECTURE.md` (racine) date du **2026-06-14** et décrit une structure
(`src/engines/`, `src/domain/schemas/`, `39 fichiers de test`) qui n'existe plus.
`docs/audit-structure.md` date du 2026-08-07. `docs/HEALTH.md` du 2026-08-25 avec des
chiffres périmés (i18n « ~25 % », `InCents 818`, etc.).

**Recommandation** : `git mv` les `*-2026-0[6-8]-*.md` vers `docs/archive/`, régénérer
`ARCHITECTURE.md` + `docs/HEALTH.md`, dater en tête chaque doc vivant.

---

## 10. Plan de remédiation priorisé

### P0 — à traiter avant tout merge (gate rouge)

1. **Aligner le seuil de cycles `pre-commit` (430) sur celui de `preflight` (0)** —
   `.githooks/pre-commit:35`. Sans ça, tout le reste régresse.
2. **Résorber les 8 cycles** (§6.5) — ~5–6 h. Commencer par le #8 (trivial) et
   `MonkeyChaos → finance` (anormal : un module de résilience ne dépend pas de la finance).

### P1 — cohérence de structure (1 sprint)

3. **Réconcilier `CLAUDE.md` §kernel-vs-lib + carte NexusCoder avec le code réel** :
   acter `src/infrastructure/` comme couche, documenter `lib/nexus` vs `shared/nexus`,
   corriger les 12 `auto_inject` morts de `domain-facts.yml`.
4. **Supprimer les copies mortes** : `src/modules/intelligence/ia/fleet/FleetComplianceService.ts`,
   `src/lib/DemoSeeder.ts`, vérifier `src/lib/sync/` vs `src/infrastructure/services/sync/`.
5. **Renommer `src/lib/mcc/fiscal/` → `src/lib/fiscal/`** (après vérif. §5.4).
6. **Dissoudre `src/modules/system/`** : schémas → `kernel/contracts/`, `OnboardingChecklist` → `commerce/acquisition/onboarding/`.
7. **Trancher `src/instances/`** : porter les 3 configs restantes dans des seeds Nexus,
   couper les 8 imports, supprimer le dossier.

### P2 — dette structurelle (sprint dédié)

8. **Trier les 59 fichiers de `src/lib/` racine** dans `services/` / `utils/` / `adapters/`.
9. **Exécuter ADR-020** : sortir les ~158 handlers à plat de `shared/eventBus/handlers/`
   vers `modules/<pilier>/` et `verticals/<v>/handlers/`.
10. **Câbler ou geler** le moteur Vertical Forge derivation (25 fichiers `verticals/_shared/`
    sans consommateur) + `ServiceTicketService` — décider : brancher, supprimer, ou `@wip` daté.
11. Découper `usePos.ts` (fan-out 21) et `HACCPTelemetryBridge` (hub de cycles).

### P3 — hygiène

12. Archiver ~120 `.md` datés, régénérer `ARCHITECTURE.md` / `HEALTH.md`.
13. Supprimer `app/(public)/demo/`, `src/constants/`, `src/types/declarations.d.ts` vide.
14. Réduire les 198 promesses flottantes (`.catch()` systématique) et 112 risques responsive.

---

## Annexe — commandes de vérification (reproductibles)

```bash
npx tsc --noEmit                                   # 0 erreur
npx eslint src/ --cache --format stylish           # 0 erreur / 0 warning
node scripts/cycles-inspector.mjs --threshold=0 --json   # exit 1 — totalCycles: 8
sentrux check .                                    # 3 violations non-bloquantes (1 god-file usePos, cc, 0 frontière)
npm run measure                                    # tableau §7
find src/modules/system -type f                    # 6 fichiers — 9e dossier
grep -rn "@/instances" src | grep -v src/instances/  # 8 imports
diff src/shared/providers/fleet/FleetComplianceService.ts \
     src/modules/intelligence/ia/fleet/FleetComplianceService.ts   # identiques
```
