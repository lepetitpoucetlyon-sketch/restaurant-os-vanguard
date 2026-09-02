# Plan correctif — Structure du code

> Dérivé de [`docs/audits/AUDIT-STRUCTURE-CODE-2026-09-02.md`](../audits/AUDIT-STRUCTURE-CODE-2026-09-02.md)
> Ré-analysé à `HEAD = 8e1c1901f` le 2026-09-02.
> **Toutes les mesures ci-dessous sont reproductibles** (Loi 7) — commande donnée à chaque étape.
> Règle : on corrige le **code**, jamais on ne desserre une gate (Loi 2). Ne jamais relever un cliquet.

---

## MàJ 2026-09-02 — Lot 1 déjà en cours + 4 décisions actées

### Le Lot 1 est **déjà exécuté dans l'arbre de travail** (non commité)

`git status` : `RegistreContext.tsx` **supprimé**, `HACCPTelemetryBridge` / `QualityEngine` /
`MonkeyChaos` / `provisioningSteps` modifiés, `src/shared/hooks/index.ts` + `registre.contracts.ts`
ajustés. **`node scripts/cycles-inspector.mjs --threshold=0` → 0 cycles** (3 runs stables).

→ Il reste à : (a) résorber `frHardcoded` 773→≤772, (b) committer, (c) appliquer le
seuil `pre-commit` 430→0 (§1.1), (d) **remplacer les pansements par les vraies coupes**
(cf. décision #4 : MonkeyChaos supprimé, pas juste « import profondi »).

### Décisions actées (Mohammed-ali, 2026-09-02)

| # | Décision | Statut |
|---|---|---|
| **1** | **`/registre` devient un écran compliance** : les 7 `*Section` (DUERP, Cerfa 13984, incendie, PMR, prestataires, sanitaire, interventions) + `useRegistre` déménagent `facility/maintenance/registre/` → `compliance/reglementaire/`. `facility/index.ts` ne les ré-exporte plus. La page `src/app/(client)/(ops)/registre/page.tsx` importe depuis `@/modules/compliance`. | ✅ validé — arête `facility → compliance` supprimée structurellement (mieux que le contrat neutre) |
| **2** | **Vertical Forge — dérivation** : les 13 `_shared/derivation/*Deriver.ts` sont **gelés** (`@wip owner:Mohammed-ali échéance:onboarding verticale n°3`), **exemptés de la mesure `verticalServicesUnwired`** avec commentaire. `blind-spot` reste branché. On les câble dans `provisioningSteps.ts` le jour d'un vrai métier n°3, sinon on supprime. | 🟡 reco par défaut — **à confirmer** : geler ou supprimer maintenant ? |
| **3** | **`src/instances/` — on dégage les 3, `lepetitpoucet` inclus.** `git rm -r src/instances/` (aucune config resto ne vit en `.ts`). `bistrolyon`/`urbanburger` (`(Fictif)`) → purge totale, y compris dans `InstanceGuard.ts` (domaines + `authorizedProjects`). `lepetitpoucet` → la **chaîne id** reste comme défaut ; sa config vient de Nexus (`tenants/lepetitpoucet/…`) comme tout client. Repointer les 4 consommateurs de `getTenantConfig`/`getAllTenants` vers Nexus. **Tâche 2.5bis séparée** : retirer les sentinelles `\|\| 'lepetitpoucet'` (`config/instance.ts`, `SovereignGenome.ts`…). | ✅ confirmé 2026-09-02 |
| **4** | **MonkeyChaos — on dégage** (concept Netflix Chaos Monkey OK, mais cette implémentation = décor). Supprimer `src/modules/intelligence/ia/resilience/MonkeyChaos.ts`, `OracleEngine.superviseChaos()` (**0 appelant**), et le backdoor `_monkeyPatch?: { forceAsymmetry }` dans `SovereignLedger.recordTransfer` (**0 usage** — point rouge audit NF525). Garder `SimulacraStressEngine` + `src/__tests__/stress/ChaosMonkey.stress.test.ts` + `src/e2e/vanguard/chaos.test.ts` (la vraie résilience, déjà en place, avec assertions). Supprimer le fichier **résout le cycle `MonkeyChaos → finance` à la racine** — annuler le pansement « import profond » de l'arbre de travail. | ✅ validé |

---

## Tableau de bord — état de départ

| Gate / mesure | Commande | Valeur (`HEAD 8e1c1901f`) | Arbre de travail | Cible |
|---|---|---:|---:|---:|
| TypeScript | `npx tsc --noEmit` | 0 | 0 | 0 |
| ESLint (barrel / inter-module / lib→modules) | `npx eslint src/` | 0 / 0 / 0 | 0 / 0 / 0 | 0 |
| **Cycles madge** | `node scripts/cycles-inspector.mjs --threshold=0` | **8** (exit 1) | **0** ✅ *(Lot 1 en cours, non commité)* | 0 |
| Seuil cycles `pre-commit` | `.githooks/pre-commit:35` | **430** | 430 | 0 |
| `frHardcoded` | `npm run measure` | 772 (au ratchet) | **773** 🔴 (anti-slop non commité) | ≤ 772 |
| `verticalServicesUnwired` | `npm run measure` | 36 / ratchet 40 | 36 | ↓ + exempter forge |
| `duplicates` | `npm run measure` | 6 | 6 | mesure à affiner (faux positif finance tabs) |
| Doublons de fichiers | §4 | `FleetComplianceService` (byte-identique), `DemoSeeder` | idem | 0 |

> **Attention** : l'arbre de travail contient déjà les coupes du Lot 1 (RegistreContext supprimé,
> `HACCPTelemetryBridge`/`QualityEngine`/`MonkeyChaos`/`provisioningSteps` modifiés) **+ le
> nettoyage AI-slop non commité (~88 fichiers)**. Certaines coupes sont des **pansements**
> (import profond) à remplacer par les vraies actions de ce plan (ex. MonkeyChaos : supprimer
> le fichier, cf. §1.2 décision #4).

**Ordre d'exécution** : Lot 0 → Lot 1 (débloque `preflight`) → Lot 2 → Lot 3 → Lots 4-8 (dette, sprint dédié).

---

## LOT 0 — Pré-requis : rendre l'arbre de travail committable (30 min)

> L'arbre de travail actuel **franchit un cliquet** (`frHardcoded` 773 > 772) et contient
> un chantier cycle 8 inachevé. Rien d'autre ne peut être vérifié proprement tant que ce
> n'est pas assaini.

### 0.1 — Résorber `frHardcoded` 773 → ≤ 772

```bash
node scripts/measure.mjs
node -e 'const d=JSON.parse(require("fs").readFileSync(".measures/latest.json"));let v=d.detail.frHardcoded;if(typeof v==="string")v=JSON.parse(v);console.log(v.detail.slice(0,20).join("\n"))'
```

- Identifier la (ou les) chaîne(s) FR en dur nouvellement introduite(s) par le nettoyage
  AI-slop non commité (`src/i18n/locales/*`, pages MCC).
- Soit la passer par `t('...')`, soit — si c'est un libellé réglementaire (NF525/FEC/PCG) —
  vérifier qu'elle est bien dans `verticals/` ou `legal/` (exclus de la mesure), sinon
  l'exempter explicitement dans `scripts/measure/measures.mjs` (motif `m15`) **avec commentaire**.
- **Ne pas** relever `FR_HARDCODED_MAX`.

### 0.2 — Statuer sur le chantier `provisioningSteps.ts` (arbre de travail, +35 l.)

Le diff en cours introduit `registerCompanyScraper()` (DI, ✅) **mais garde** :

```ts
const modTarget = '@' + '/modules/commerce';
const mod = await import(/* @vite-ignore */ modTarget);   // ❌ évitement de madge
```

→ Voir **Lot 2 §2.8**. Décision : soit finir maintenant (recommandé, c'est le cycle 8),
soit `git stash` ce fichier pour committer le reste proprement.

### 0.3 — Committer le nettoyage AI-slop

```bash
./scripts/preflight.sh    # doit passer les gates 1-4 ; gate 5 (cycles) restera rouge — attendu, corrigé au Lot 1
```

Commit `chore(i18n): nettoyage AI-slop — dictionnaires + écrans MCC` (périmètre : `src/i18n/`, `src/app/(admin)/admin/mcc/`, `CLAUDE.md`, `AGENTS.md`, `src/config/prompts.ts`, `src/kernel/ai/mcc/MCC_SYSTEM_PROMPTS.ts`).

---

## LOT 1 — 🔴 P0 : réconcilier la gate de cycles + résorber les 8 cycles (1 j)

### 1.1 — Aligner le seuil `pre-commit` sur `preflight` (5 min)

**Fichier** : `.githooks/pre-commit:35`

```diff
- node scripts/cycles-inspector.mjs --threshold=430 || fail "Cycles d'import au-dessus du seuil."
+ node scripts/cycles-inspector.mjs --threshold=0 || fail "Cycles d'import — seuil ratchet 0 dépassé."
```

> Le `430` est un vestige d'avant l'assainissement 2026-08-22. `preflight.sh:195` est déjà
> à `MADGE_CYCLES_MAX=0`. Après cette ligne, **impossible de committer un nouveau cycle**.
> ⚠️ Faire cette étape **en dernier** dans le Lot 1 (sinon le hook bloque les commits
> intermédiaires) — ou committer les corrections 1.2→1.6 avec `--no-verify` justifié puis
> réactiver. Recommandé : 1.2→1.6 d'abord, `cycles-inspector --threshold=0` doit passer,
> **puis** 1.1.

### 1.2 — Cycles 2, 3, 4 : **supprimer MonkeyChaos** (décision #4) (30 min)

**Cause du cycle** : `src/modules/intelligence/ia/resilience/MonkeyChaos.ts` fait
`await import('@/modules/finance…')` pour « attaquer » `SovereignLedger`. Chaîne :
`intelligence/index → OraclePredictor → OracleEngine → MonkeyChaos → finance → … → intelligence`.

**Décision : ce code est mort et faux, on le supprime (pas de contrat neutre, pas d'import profond).**

Preuves (vérifiées 2026-09-02) :
- `OracleEngine.superviseChaos()` (seul appelant de `MonkeyChaos`) → **0 appelant lui-même**
- `SovereignLedger.recordTransfer` param `_monkeyPatch?: { forceAsymmetry }` → **0 usage** (2 réf., toutes dans le fichier)
- l'« attaque » envoie une transaction **valide** puis crie « faille » si elle passe → fausse alerte par construction
- la vraie résilience est déjà testée : `src/__tests__/stress/ChaosMonkey.stress.test.ts`,
  `src/e2e/vanguard/chaos.test.ts`, `offline-resilience.test.ts`, `SovereignLedger.validateIntegrity()` (vrai `throw` sur déséquilibre)

**Actions** :
```bash
git rm src/modules/intelligence/ia/resilience/MonkeyChaos.ts
```
- `src/modules/intelligence/services/OracleEngine.ts` : supprimer la fonction `superviseChaos()` entière.
- `src/modules/finance/services/SovereignLedger.ts` : supprimer le param `_monkeyPatch?: { forceAsymmetry: boolean }` (ligne ~73) **et** le bloc `if (params._monkeyPatch?.forceAsymmetry) { … throw 'LEDGER_INVIOLABLE' }` (lignes ~77-81). Un backdoor dans un chemin d'écriture fiscale = point rouge audit NF525.
- Garder `src/infrastructure/adapters/Simulacra/SimulacraStressEngine.ts` (rush mode / stress HACCP — vrai outil de charge).
- ⚠️ Annuler le pansement de l'arbre de travail (`MonkeyChaos.ts:14` `await import('@/modules/finance/services/SovereignLedger')`) — inutile puisque le fichier disparaît.

**Vérif** :
```bash
grep -rn "MonkeyChaos\|superviseChaos\|_monkeyPatch\|forceAsymmetry" src   # 0 (hors stress tests / SimulacraStressEngine)
npx vitest run src/__tests__/stress/ src/e2e/vanguard/chaos.test.ts        # vert
node scripts/cycles-inspector.mjs --threshold=0 --json | node -e 'console.log(JSON.parse(require("fs").readFileSync(0)).totalCycles)'   # 8 → 5
```

### 1.3 — Cycles 1, 5, 6, 7 : casser le triangle compliance ↔ facility (2-3 h)

Deux arêtes à couper.

**Arête A — `compliance → facility`** (2 sites, même pattern) :

| Fichier:ligne | Code actuel | Correction |
|---|---|---|
| `src/modules/compliance/services/QualityEngine.ts:122` | `const { MaintenanceAgent } = await import('@/modules/facility');` | émettre `NexusEventBus.emit('facility.maintenance_check_requested', { tenantId, source: 'quality' })` (ADR-015 canal #3) **ou** `await import('@/modules/facility/services/MaintenanceAgent')` |
| `src/modules/compliance/qualite/haccp/services/HACCPTelemetryBridge.ts:51` | `const { MaintenanceAgent } = await import('@/modules/facility');` | idem |

> `MaintenanceAgent` n'est appelé que pour un **effet de bord** (déclencher une vérif
> maintenance sur dérive HACCP) → **l'événement est le bon canal**. Créer le handler
> `MaintenanceCheckRequestedHandler` dans `src/modules/facility/` (ADR-020) qui appelle
> `MaintenanceAgent`. Vérifier que l'event est déclaré dans `src/shared/eventBus/events/`.

**Arête B — `facility → compliance`** via un shim `shared/` :

`src/shared/contexts/RegistreContext.tsx` = **1 ligne** :
```ts
export * from '@/modules/compliance';
```
C'est un ré-export sauvage du barrel compliance depuis `shared/`, qui **évite** la règle
`no-inter-module-imports` (chemin `@/shared/…` non matché). 11 importeurs de `useRegistre`,
dont **8 dans `src/modules/facility/maintenance/registre/*`**.

Il existe **deux** `RegistreContext.tsx` :
- `src/shared/contexts/RegistreContext.tsx` — le shim (à supprimer)
- `src/modules/compliance/qualite/haccp/contexts/RegistreContext.tsx` — l'implémentation réelle

**Correction — DÉCISION #1 actée : `/registre` devient un écran compliance.**

1. `git mv src/modules/facility/maintenance/registre/ src/modules/compliance/reglementaire/registre/`
   (les 7 `*Section.tsx` + leur `index.ts`).
2. Déplacer `src/modules/compliance/qualite/haccp/contexts/RegistreContext.tsx` (l'impl. réelle)
   vers `src/modules/compliance/reglementaire/registre/` s'il ne sert qu'à ça, sinon le laisser
   et importer en relatif.
3. **Supprimer** `src/shared/contexts/RegistreContext.tsx` (le shim `export *`). *(Déjà fait
   dans l'arbre de travail — `D src/shared/contexts/RegistreContext.tsx`.)*
4. `src/modules/facility/index.ts` : retirer le bloc `export { DUERPSection, IncendieSection,
   Cerfa13984Section, PrestatairesSection, PMRSection, SanitaryComplianceSection,
   InterventionLogSection } from './maintenance/registre';`.
5. `src/modules/compliance/index.ts` : ajouter ce bloc d'export (depuis `./reglementaire/registre`).
6. `src/app/(client)/(ops)/registre/page.tsx` : `import { DUERPSection, … } from '@/modules/compliance';`
   (au lieu de `@/modules/facility`).
7. Les 8 `*Section.tsx` : `useRegistre` en **import relatif** (même dossier / pilier).
8. Vérifier qu'aucun autre consommateur de `@/modules/facility` ne tirait un `*Section`
   (`grep -rn "DUERPSection\|Cerfa13984Section\|IncendieSection" src --include="*.tsx" | grep -v reglementaire`).

> Résultat : l'arête `facility → compliance` **disparaît structurellement** (facility ne
> connaît plus le registre), et `facility/index.ts` s'allège de 7 exports + la dépendance konva-adjacente.

**Vérif** :
```bash
grep -rn "maintenance/registre" src --include="*.ts" --include="*.tsx"   # 0 hors compliance/
node scripts/cycles-inspector.mjs --threshold=0 --json | node -e 'console.log(JSON.parse(require("fs").readFileSync(0)).totalCycles)'
npx vitest run   # + vérifier /registre à l'écran (route toujours atteignable)
```

**Arête C — `facility → ops`** (cycle 6, 7) :

`src/modules/facility/spaces/floor-plan/useFloorPlanControls.ts:4` :
```ts
import { useTables, useReservations } from "@/modules/ops";
```
Le plan de salle (facility) lit les tables et réservations (ops). Chaîne 6 :
`facility/index → FloorPlanEditor → useFloorPlanControls → @/modules/ops → KitchenDashboard → tabs/index → WasteTab → …`.

**Correction** : `useTables` / `useReservations` sont des hooks de lecture de données.
- Option 1 : les exposer via un contrat `kernel/contracts/` (registre de hooks souverains).
- Option 2 : `FloorPlanEditor` reçoit `tables` / `reservations` **en props** depuis la page
  qui le monte (`app/(client)/(ops)/floor-plan/page.tsx`), qui elle a le droit d'importer
  les deux piliers. C'est le pattern « composition root » (ADR-015 canal #3 bis).
- **Recommandé : Option 2** — `useFloorPlanControls` devient pur (reçoit les données), la
  page injecte. Casse l'arête sans contrat nouveau.

### 1.4 — Cycle 7 : `fleetAggregator` bridge 3 piliers (1 h)

`src/shared/providers/fleet/fleetAggregator.ts` importe en un seul fichier :
```ts
import { HACCPTelemetryBridge } from '@/modules/compliance/qualite/haccp/services/HACCPTelemetryBridge';
import { fleetEngine } from '@/modules/intelligence/ia/fleet/FleetAdapter';
```
puis `NexusFleetProvider` est importé par `src/modules/ops/service/restaurant/pos/components/Cart.tsx:11`
(`useNexusFleet`). Triangle `ops → shared/fleet → compliance` + `→ intelligence`.

**Correction** : `fleetAggregator` ne devrait pas **importer** les services de télémétrie de
chaque pilier — il devrait les recevoir par **enregistrement** (chaque pilier fait
`FleetRegistry.register('haccp', HACCPTelemetryBridge)` dans son `registerHandlers`).
Le provider lit le registre. Pattern identique au `registerCompanyScraper` du Lot 2.8.

Alternative légère : `Cart.tsx` n'a probablement pas besoin de **tout** `useNexusFleet` —
vérifier ce qu'il consomme (`grep -n useNexusFleet src/modules/ops/service/restaurant/pos/components/Cart.tsx`)
et extraire un hook plus fin si c'est juste un flag.

### 1.5 — Cycle 8 : `provisioningSteps.ts → @/modules/commerce` (voir Lot 2.8) (30 min)

Finaliser le chantier en cours **sans** la concaténation de chaîne. Détail au Lot 2.8.

### 1.6 — Vérification finale du Lot 1

```bash
npx tsc --noEmit                                      # 0
node scripts/cycles-inspector.mjs --threshold=0       # exit 0, Total Cycles : 0
npx vitest run                                        # vert
npx eslint src/                                        # 0/0
./scripts/preflight.sh                                # 10/10 (gate 5 verte)
```

Puis appliquer **1.1** (seuil `pre-commit` → 0) et committer :
`fix(arch): résorption des 8 cycles d'import + alignement seuil pre-commit (430→0)`.

---

## LOT 2 — 🟠 P1 : cohérence des couches transversales (1 sprint)

### 2.1 — Réconcilier `CLAUDE.md` + carte NexusCoder avec le code réel (2 h)

`CLAUDE.md` décrit `src/kernel/` comme la « machine core Nexus » — **faux**. Le cœur est à :

| Pièce | Emplacement réel |
|---|---|
| `NexusAdapter`, `NexusInterceptor` | `src/lib/nexus/` |
| `SovereignGuard` | `src/shared/nexus/guards/` |
| `NexusEventBus` | `src/shared/eventBus/` |
| Adapters Firestore/Simulacra/Mock | `src/infrastructure/adapters/` |
| `FiscalLedger` | `src/infrastructure/services/sovereign/fiscal/` |
| `pillarSyncRegistry`, `syncGates` | `src/infrastructure/services/sync/` |
| `FiscalSealer`, `FiscalEngine` (impl.) | `src/lib/mcc/fiscal/` |

**Actions** :
1. Réécrire la section « Structure `lib/` » + « Règle lib/nexus vs shared/nexus » de `CLAUDE.md`
   pour refléter les **4 emplacements** et **acter `src/infrastructure/` comme couche officielle**
   (rôle : adapters + bootstrap + services d'infra runtime).
2. Ajouter un tableau « Où vit quoi » (le tableau ci-dessus).
3. Corriger `~/.nexuscoder/domain-facts.yml` : les 12 entrées `auto_inject` pointant vers
   `src/kernel/nexus/**` sont **mortes** — les remapper. Mettre à jour `kernel-vs-lib`,
   `kernel-adapter-singleton`, `multi-tenant-sovereign` (chemins `src/kernel/nexus/guards/` → `src/shared/nexus/guards/`).
4. Régénérer `ARCHITECTURE.md` (racine, daté 2026-06-14, décrit `src/engines/` qui n'existe plus).

### 2.2 — Supprimer les 2 doublons de fichiers réels (1 h)

| Doublon | Vivant | Mort (à supprimer) | Vérif |
|---|---|---|---|
| `FleetComplianceService.ts` (byte-identique) | `src/shared/providers/fleet/FleetComplianceService.ts` (via `fleetAggregator`) | `src/modules/intelligence/ia/fleet/FleetComplianceService.ts` | `grep -rn "ia/fleet/FleetComplianceService\|intelligence.*FleetComplianceService" src` — retirer le re-export de `src/modules/intelligence/ia/fleet/index.ts:2` et de `modules/intelligence/index.ts` s'il y est |
| `DemoSeeder.ts` | `src/infrastructure/services/demo/DemoSeeder.ts` (import dynamique `useNexusTenantLogic.ts:69`) | `src/lib/DemoSeeder.ts` | cité seulement dans le commentaire `src/lib/services/index.ts:14` — nettoyer le commentaire |

```bash
git rm src/modules/intelligence/ia/fleet/FleetComplianceService.ts src/lib/DemoSeeder.ts
npx tsc --noEmit && npx vitest run
```

> ⚠️ Vérifier avant : `src/lib/sync/` (7 f.) vs `src/infrastructure/services/sync/` — lequel
> est mort ? `grep -rn "@/lib/sync\|infrastructure/services/sync" src --include="*.ts" | grep -v "sync/"`.

### 2.3 — Déplacer `src/lib/mcc/fiscal/` → `src/lib/fiscal/` (2 h)

`FiscalSealer`/`FiscalEngine` scellent la **vente POS tenant** — rien à voir avec le MCC.
Le barrel `src/lib/fiscal.ts` (2 lignes) est un demi-pas.

```bash
git mv src/lib/mcc/fiscal src/lib/fiscal
# supprimer src/lib/fiscal.ts (devient src/lib/fiscal/index.ts) ou le pointer sur ./fiscal/
# mettre à jour les 12 importeurs : @/lib/mcc/fiscal/* et @/lib/fiscal
grep -rln "@/lib/mcc/fiscal\|@/lib/fiscal" src --include="*.ts" --include="*.tsx"
```
Ajouter `src/lib/fiscal/index.ts` : `export * from './FiscalSealer'; export * from './FiscalEngine'; export * from './FiscalKeyService';`.
Repointer les shims `src/modules/finance/fiscalite/FiscalSealer.ts` et `.../services/FiscalEngine.ts`.
Vérifier qu'aucun cycle ne réapparaît (`FiscalEngine` importe `@/lib/nexus`, `@/lib/CryptoService` — OK, pas de `@/modules/`).

### 2.4 — Dissoudre `src/modules/system/` (1 h)

6 fichiers, 9ᵉ dossier hors des 8 piliers.

| Fichier | Destination |
|---|---|
| `domain/schemas/{license,modules,tenant,supportTicket}.ts` | `src/kernel/contracts/` (schémas plateforme) |
| `components/OnboardingChecklist.tsx` | `src/modules/commerce/acquisition/onboarding/` |
| `index.ts` | supprimé |

```bash
grep -rln "@/modules/system" src --include="*.ts" --include="*.tsx"   # repointer
```

### 2.5 — `src/instances/` — DÉCISION #3 : on dégage (2 h + tâche 2.5bis séparée)

3 configs tenant en dur (`bistrolyon.ts`, `lepetitpoucet.ts`, `urbanburger.ts`).
**4 consommateurs réels** de `getTenantConfig`/`getAllTenants` :
`useNexusTenantLogic.ts:6`, `FleetComplianceService.ts:3` (×2 emplacements — voir 2.2),
`FranchiseService.ts:9`, `DNAInjector.ts:1`.

**DÉCISION #3 (confirmée 2026-09-02) : on dégage les 3 — `lepetitpoucet` inclus.**
`bistrolyon` / `urbanburger` sont marqués `(Fictif)` dans le code. `lepetitpoucet` :
config-as-code périmée (le vrai tenant vit dans Nexus `tenants/lepetitpoucet/…` comme
tout client). Aucune clé `.env` `LEPETITPOUCET` n'existe → pas un déploiement prod actif.

1. `git rm -r src/instances/` (les 3 configs + `index.ts` + `types.ts`).
2. Retirer l'alias `@/instances` — **fait** (`grep instances tsconfig.json` → 0). Le résolveur
   `@/*` → `src/*` faisait le reste, donc rien d'autre à toucher côté tsconfig.
3. Repointer les 4 consommateurs :
   - `useNexusTenantLogic.ts:50` `getTenantConfig(tenantId)` → lecture Nexus
     `Nexus.adapter.get('tenants/{id}/tenantConfig')` (logique de `getTenantConfigAsync`
     à déplacer vers `src/lib/services/tenantConfig.ts`, sans les 3 configs en dur).
   - `FleetComplianceService.ts` `getAllTenants()` → `SystemTenantRegistry.list()` ou requête Nexus.
   - `FranchiseService.ts:36` `getAllTenants()` → idem.
   - `DNAInjector.ts:35` `getTenantConfig()` → lecture Nexus.
4. **`bistrolyon` / `urbanburger` : purge totale** — aussi dans `InstanceGuard.ts`
   (`'bistrolyon.fr'`, `'urbanburger.io'`, `'kitchen-os-bistrolyon.web.app'`,
   `'kitchen-os-urbanburger.web.app'` + `authorizedProjects.{bistrolyon,urbanburger}`).
5. `lepetitpoucet` : garder la **chaîne** `'lepetitpoucet'` comme id par défaut pour l'instant
   (`DEFAULT_TENANT_ID`, `FALLBACK_TENANT`, `InstanceGuard`) — c'est un identifiant, pas une
   config. Le nettoyage de ces sentinelles = §2.5bis.
6. Tests (`multi-tenant-isolation.test.ts`, `franchise.test.ts`, `KeycloakAuthProvider.test.ts`)
   utilisent `'lepetitpoucet'` comme id — OK, ils ne dépendent pas de `lepetitpoucetConfig`.
   Vérifier `franchise.test.ts` qui teste `getAllTenants` (peut nécessiter un mock du registre Nexus).

**Vérif** :
```bash
grep -rn "@/instances\|bistrolyon\|urbanburger\|lepetitpoucetConfig\|getAllTenants\|getTenantConfig\b" src --include="*.ts" --include="*.tsx"   # 0 (hors la chaîne id 'lepetitpoucet')
test ! -d src/instances && echo "src/instances supprimé"
npx tsc --noEmit && npx vitest run
```

#### 2.5bis — (séparé, plus tard) « zéro tenant par défaut codé en dur »

`'lepetitpoucet'` est aussi câblé comme **sentinelle par défaut** dans 6 endroits hors
`src/instances/` :

| Fichier:ligne | Usage |
|---|---|
| `src/config/instance.ts:40` | `DEFAULT_TENANT_ID = … \|\| 'lepetitpoucet'` |
| `src/shared/nexus/state/SovereignGenome.ts:77` | `FALLBACK_TENANT = … \|\| 'lepetitpoucet'` |
| `src/shared/nexus/guards/InstanceGuard.ts:17-34` | mapping domaines `lepetitpoucet.com`/`bistrolyon.fr`/`urbanburger.io` → tenant |
| `src/app/api/admin/fleet/seed-demo/route.ts:31` | fallback |
| `src/shared/providers/fleet/FleetTelemetryExecutor.ts:62-65` | entrée télémétrie en dur |

→ Ces `|| 'lepetitpoucet'` doivent devenir une erreur explicite ou une résolution réelle.
`InstanceGuard.ts` (mapping domaine→tenant white-label) est légitime **si** ces domaines
sont de vrais déploiements — sinon le vider. **Chantier à part, non bloquant.**

### 2.6 — Documenter `src/shared/` (30 min)

Ajouter à `CLAUDE.md` : `shared/eventBus/` (bus + 159 handlers + registres), `shared/nexus/`
(contracts 63 = `@nexus/contracts`, guards 29, tokens 23, vault 7), `shared/components/` (primitives + partagés).

### 2.7 — Nettoyer les reliquats `src/domain/`, `src/constants/`, `src/types/` (30 min)

- `src/domain/schemas/{migration,signup}/` → `src/modules/<pilier>/domain/schemas/` (2 fichiers)
- `src/constants/{pos,product-form}.ts` → `src/modules/ops/constants/` ; `scheduling.ts` → `src/modules/human/`
- `src/types/declarations.d.ts` (23 octets, vide) → supprimer

### 2.8 — Finaliser le cycle 8 proprement (`provisioningSteps.ts`) (30 min)

L'arbre de travail introduit `registerCompanyScraper()` (bon) mais garde un
`await import('@' + '/modules/commerce')` (concaténation = **berne madge, pas de vraie
résolution**).

**Correction** :
- Garder `registerCompanyScraper(fn)` / `getRegisteredCompanyScraper()`.
- **Supprimer** tout le bloc fallback `await import(...)`.
- L'enregistrement se fait au bootstrap : dans `src/infrastructure/bootstrapProviders.ts`
  (ou un `registerHandlers/commerce.ts`), appeler
  `registerCompanyScraper(scrapeCompany)` — c'est **le composition root** qui a le droit
  d'importer `@/modules/commerce`.
- Si aucun scraper enregistré → `return null` (déjà géré, log info).

```bash
node scripts/cycles-inspector.mjs --threshold=0 --json | grep totalCycles   # doit être 0 pour de vrai
grep -rn "'@' + '/modules\|\"@\" + \"/modules" src   # 0 — aucune concaténation d'import
```

---

## LOT 3 — 🟡 P2 : dette structurelle (sprint dédié)

### 3.1 — Trier les 59 fichiers de `src/lib/` racine (1 j)

Cibles (barrels existants) :
- `src/lib/services/` ← `CryptoService`, `TenantSeeder`, `IdentityManager`, `ProvisioningEngine`,
  `BrandingProvider.tsx`, `GroupService`, `CommunicationService`, `SettingsManager`, `MigrationService`,
  `AccessPolicyManager`, `SecurityGuard`, `GenomeValidator`, `RuntimeValidator`, `ZodInterceptor`,
  `GlobalRegistryService`, `NexusSyncService`, `NexusTelemetryService`, `EdgeSyncService`,
  `OfflineMasteryEngine`, `GreenEngine`, `ZKBenchmarkEngine`, `QuantumCrypto`, `MosyleClient`, `MigrationService`
- `src/lib/utils/` ← `dates`, `formatters`, `helpers`, `utils`, `toError`, `bloom-filter`, `constants`,
  `authConstants`, `toSovereignData`
- `src/lib/adapters/` ← `firebase`, `firebase-admin-init`, `axiom`, `sentry`, `email-service`, `logger`, `telemetry`
- `src/store/` ← `instanceGuardAtoms.ts`
- `src/shared/components/ui/` ← `ui.components.ts`, `ui.foundations.ts`, `BrandingUI.ts`
- **supprimer** : `DemoSeeder.ts` (fait au 2.2), `mock-data.ts` (si non testé), `fix_window.ts`

> ⚠️ Mesuré lors du merge-plan : router `lib/` → barrels **fait exploser les cycles madge
> de 2 à 100** (cf. `CLAUDE.md`). Faire ce lot **fichier par fichier**, `cycles-inspector`
> après chaque déplacement, jamais en masse. Beaucoup d'imports profonds `lib/` sont
> porteurs (memory `project_lib_deep_imports_load_bearing`).

### 3.2 — Exécuter ADR-020 : sortir les 159 handlers à plat (2-3 j)

`src/shared/eventBus/handlers/` = 159 fichiers à plat, tous piliers/verticales confondus.
ADR-020 : chaque handler vit à côté du module qui possède la réaction.

- Handlers `pos.*`/`kds.*`/`bar.*`/`kiosk.*` → `src/verticals/restaurant/handlers/` (1/12 fait)
- Handlers `<pilier>.*` génériques → `src/modules/<pilier>/handlers/`
- Garder `src/shared/eventBus/` = bus + types + `registerHandlers/` (registres)
- Faire pilier par pilier, `registerHandlers/*.ts` mis à jour à chaque lot.

### 3.3 — Vertical Forge — DÉCISION #2 : geler les derivers (1/2 j)

État vérifié (2026-09-02) :
- `blind-spot` → **branché** (`src/app/(admin)/admin/mcc/_tabs/BlindSpotTab.tsx` appelle
  `runBlindSpotRules(DEFAULT_RULES, …)`) → **rien à faire, garder**.
- **13 `_shared/derivation/*Deriver.ts`** (RbacDeriver 16 Ko, BusinessLawsDeriver 13 Ko, KpiDeriver 11 Ko…)
  → **PAS branchés**. `DeriversTab.tsx` du MCC est une **maquette** (`sampleOutput` en dur).
  `provisioningSteps.ts` ne les référence pas.
- `sector-study/*` → partiel.

**Décision par défaut : geler, ne pas supprimer.**
1. En tête de `src/verticals/_shared/derivation/index.ts` :
   `// @wip owner:Mohammed-ali échéance:2026-12-31 — dérivation auto de la config verticale,`
   `// à câbler dans provisioningSteps.ts le jour de l'onboarding d'une verticale n°3. cf. PLAN-CORRECTIF-STRUCTURE.`
2. **Exempter `src/verticals/_shared/derivation/**` de la mesure `verticalServicesUnwired` (`m17`)**
   dans `scripts/measure/measures.mjs` avec commentaire renvoyant à cette décision.
3. `DeriversTab.tsx` : ajouter un bandeau « maquette — non branché » (honnêteté écran, AGENTS.md Loi 8).

> ⚠️ **À reconfirmer avec Mohammed-ali** : geler (défaut) OU supprimer les 13 derivers
> maintenant (~110 Ko) si restaurant = 100 % du business pour 12+ mois.

**Reste de `verticalServicesUnwired` (36)** :
- `ServiceTicketService`, `WaitlistManager`, `KitchenService`, `SmsSanitizerService`,
  `production/core/domain/types.ts`, `IPrinterConnection` (interface) → décider un par un :
  brancher (si prévu au golden path), `@wip` daté, ou supprimer.
- `verticals/<v>/adapters/*ComplianceAdapter.ts` + `<v>/domain/types.ts` + `<v>/ui.ts` des
  verticales non-restaurant (gym, florist, coworking, veterinary, hotel, salon, retail, garage, clinic, bakery)
  → conformes à ADR-016 (profondeur build-time) → **exempter dans `m17`** plutôt que les compter comme dette.

### 3.4 — Découper les 2 god-hubs (1 j)

| Fichier | Métrique | Action |
|---|---|---|
| `src/modules/ops/service/restaurant/pos/hooks/usePos.ts` | fan-out 21 (sentrux `no_god_files`) | extraire `usePosPayment`, `usePosTva`, `usePosTable` (patron `NexusOpsProvider`) |
| `src/modules/compliance/qualite/haccp/services/HACCPTelemetryBridge.ts` | cc 13 + hub #1 des cycles | après Lot 1.3, séparer « lecture risque » / « report MCC » / « déclenchement maintenance » |

---

## LOT 4 — 🟢 P3 : hygiène (au fil de l'eau)

### 4.1 — Archiver la dette documentaire

30 `.md` racine + 184 `docs/` = 214. `git mv` vers `docs/archive/` tous les
`AUDIT-*-2026-0[6-8]-*.md`, `PLAN-*-2026-0[6-8]-*.md`, `HANDOVER-2026-08-*.md`,
`LOT-7-INVESTIGATION-*.md`. Garder vivants : `ARCHITECTURE.md`, `CLAUDE.md`, `AGENTS.md`,
`BACKLOG.md`, `CHANGELOG.md`, `docs/HEALTH.md`, ADRs, ce plan.

### 4.2 — `duplicates: 6` (faux positif) — affiner la mesure

Les 6 « doublons » sont les `dynamic(() => import('./_tabs/X'))` de `FinanceTabRegistry.tsx` :
c'est du **code-splitting légitime**, pas une duplication. Corriger le motif de la mesure
`m6` pour **exclure les ré-exports `dynamic()`**. Ne pas toucher au code.

### 4.3 — Supprimer les coquilles vides

- `src/app/(public)/demo/page.tsx` (redirect 10 l. → `/landing`) — supprimer + retirer la route.
- `src/app/(public)/legal/` vs `src/app/(marketing)/legal/` : documenter la répartition
  (plateforme vs marketing) dans `CLAUDE.md` §Routes, ou fusionner.

### 4.4 — Réduire les 199 promesses flottantes + 109 risques responsive

- `catch`/`.catch()` systématique sur les `emit`/`import()` flottants (mesure `swallowedErrors.flottantes`).
- 88 largeurs px figées → variantes responsive ; 13 `<table>` sans `overflow-x-auto` ;
  4 `h-screen` strict → `min-h-[100dvh]`.

---

## Récapitulatif — effort et impact

| Lot | Effort | Débloque |
|---|---|---|
| **Lot 0** | 0,5 j | arbre committable |
| **Lot 1** | 1 j | `npm run preflight` vert (gate 5) + gate anti-régression réelle |
| **Lot 2** | 1 sprint (~4-5 j) | cohérence `CLAUDE.md` ↔ code, fin des doublons, `src/` sans dossiers parasites |
| **Lot 3** | 1 sprint (~5-6 j) | `lib/` rangé, ADR-020 exécuté, verticales sans code mort |
| **Lot 4** | au fil de l'eau | hygiène doc + mesures affinées |

**Chemin critique client** : Lot 0 + Lot 1 = **1,5 j** pour retrouver un `preflight` vert
et une gate de cycles qui mord. Le reste est de la dette non bloquante.

---

## Annexe — commandes de vérification par lot

```bash
# Lot 0
npm run measure | grep -E "Chaînes françaises|dépasse"
# Lot 1
node scripts/cycles-inspector.mjs --threshold=0        # exit 0 attendu après 1.2-1.5
grep -n "threshold=" .githooks/pre-commit               # =0 après 1.1
# Lot 2
diff src/shared/providers/fleet/FleetComplianceService.ts src/modules/intelligence/ia/fleet/FleetComplianceService.ts 2>&1   # "No such file"
find src/modules/system -type f 2>&1                    # vide
grep -rn "@/instances" src | grep -v src/instances/     # 0
ls src/lib/fiscal/ 2>&1                                 # existe
# Lot 3
find src/lib -maxdepth 1 -type f | wc -l                # << 59
find src/shared/eventBus/handlers -maxdepth 1 -name '*.ts' | wc -l   # << 159
npm run measure | grep "Services de verticale non câblés"
# Global
./scripts/preflight.sh                                  # 12/12
```
