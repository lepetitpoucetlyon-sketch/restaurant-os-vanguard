# Plan Ultra-Détaillé — Étape 8 : vidage final de `src/shared/`

> **Cœur runtime** : `providers/` (15) + `hooks/` (28) + god file `contexts/settings/defaults.ts` (427L) + **élimination du barrel `@/shared/hooks` (126 importeurs)**.
> C'est la « session 2 » que le plan maître a explicitement isolée : la partie la plus interdépendante et la plus étalée.
> `schemas/` (3 : `primitives.ts` **GELÉ**, `ui.ts`, `index.ts`) **reste par design** (voir mémoire `project_schema_migration_strategy`).

---

## 0. Point de départ & invariants

| Élément | Valeur |
|---|---|
| **Branche** | `agent/antigravity-exec` |
| **HEAD de reprise** | `457d235f5` (étape 6 — nexus-contract) |
| **Gate baseline** | **TSC = 0**, cycles madge = **2** (tolérance 3), `kernel/lib/store/shared → modules = 0`, barrel piliers = 0 |
| **Commande gate** | `./scripts/agent-gate.sh` (rapide) — coller la sortie dans le journal |
| **shared/ restant** | `providers/` (15), `hooks/` (28), `contexts/settings/defaults.ts`, `schemas/` (3, gelé) = **47 fichiers** |

**Règle de fer** (comme étapes 1→7) : **1 sous-étape = 1 commit, TSC=0 + cycles≤2 vérifiés AVANT chaque commit.** Commits en **background** (hook `graphify` post-commit ≈ 2 min).

### ⚠️ Insight critique sur le gate (déjà validé étapes 1-7)
Le `madge` du gate tourne **sans `--ts-config`** → il ne détecte QUE les cycles à imports **relatifs** (`./`, `../`), pas les imports par alias (`@/…`, `@nexus/…`). Donc :
- Les moves par alias **ne peuvent pas** faire régresser le compteur de cycles → ne pas se rassurer à tort dessus.
- La vraie protection = **raisonnement sur les couches** + `sentrux check .` (gate architectural officiel). **Lancer `sentrux check .` à la fin de l'étape 8** pour valider les cycles réels.
- **Piège n°1 récurrent** : `git mv` casse les imports **relatifs internes** (`./x`, `../x`) qu'aucun sed d'alias ne couvre. Après CHAQUE move → `npx tsc --noEmit`, lire les `TS2307`, corriger les relatifs. (Cas rencontrés étapes 5-6 : ModuleRegistry→genome, useLexicon→plugins, nexus-contract→tenant.)

---

## 0-bis. PRÉ-CHECKS BLOQUANTS (à faire AVANT de bouger quoi que ce soit)

```bash
# 1. Où résout @/infrastructure ? (src/infrastructure N'EXISTE PAS en tant que dossier)
grep -nE '"@/?infrastructure' tsconfig.json
find src -maxdepth 2 -type d -name infrastructure
# → AuthAccess, AuthStaff, useBrandEditor, useNexusTenantLogic importent @/infrastructure/services/*
#   Déterminer la couche réelle. Si @/infrastructure mappe DANS modules/ → ces fichiers NE PEUVENT PAS aller en kernel.

# 2. @/instances : couche neutre ? (src/instances existe). kernel→instances=0 aujourd'hui.
ls src/instances/
#   useNexusTenantLogic importe @/instances → créerait kernel→instances. Vérifier que instances/ est neutre (pas un pilier).

# 3. Re-mesurer la baseline sur le HEAD de reprise
git checkout 457d235f5   # si nécessaire
./scripts/agent-gate.sh
```

**Décision conditionnée** : si `@/infrastructure` ou `@/instances` s'avère être une couche au-dessus du kernel (ou dans modules/), alors `useNexusTenantLogic` + les 3 `auth/*` vont dans **`design/providers/`** (ou une couche autorisée à importer haut) plutôt que `kernel/providers/`. Voir §3 (8b).

---

## 1. Inventaire complet avec destinations

### 1.A — Les 15 providers

| Fichier | Imp. ext. | Deps sortantes clés | **Destination** | Contrainte |
|---|---|---|---|---|
| `NexusCoreContext.ts` | 11 (design1, lib1, shared8, test1) | `@nexus/contracts/nexus.types` | **kernel/providers/** | pur nexus ✅ |
| `NexusCoreProvider.tsx` | 17 (app8, design3, modules5, shared1) | `@/config/languages`, `@/i18n/translations`, `@nexus/…` | **kernel/providers/** | kernel→config(2)/i18n(1) existent ✅ |
| `NexusPulseOrchestrator.tsx` | 1 (design) | **`@modules/finance`**, `@/lib`, `@/store/pillars/sovereign` | **design/providers/** | 🔴 `@modules/finance` → INTERDIT en kernel |
| `NotificationProvider.tsx` | 0 | `@/lib/logger`, `@nexus/…` | **kernel/providers/** | ✅ |
| `SplashGate.tsx` | 1 (design) | **`@design/SplashScreen`**, `@/lib/mcc`, `@/store` | **design/providers/** | importe design → design/ |
| `UIThemeProvider.tsx` | 0 | `@/shared/hooks/useSettings`, `@/store/themeAtoms` | **design/providers/** | UI/thème |
| `VerticalUIProvider.tsx` | 2 (design1, shared1) | `@/kernel/plugins/*`, `@/store/pillars/sovereign` | **kernel/providers/** ou design/ | plugins désormais en kernel ✅ |
| `hooks/auth/AuthAccess.tsx` | 0 (interne) | `@/lib/*`, `@nexus`, `@/lib/client/authedFetch` | **kernel/providers/auth/** | ⚠️ dépend pré-check infra |
| `hooks/auth/AuthSession.tsx` | 0 (interne) | `@/lib/*`, `@nexus`, `firebase/*` | **kernel/providers/auth/** | ✅ |
| `hooks/auth/AuthStaff.tsx` | 0 (interne) | `@/config/instance`, `@/lib/*`, `@nexus`, `firebase` | **kernel/providers/auth/** | ⚠️ infra |
| `hooks/settings/useSettingsModule.ts` | 0 (interne) | `@/lib`, **`@/shared/contexts/settings/defaults`**, `@nexus` | **kernel/providers/settings/** | importe le god file (→ déplacé 8f) |
| `hooks/useExtensions.ts` | 1 (design) | **`@/shared/hooks`** (barrel) | **kernel/providers/** | dépend du barrel (8g) |
| `hooks/useNexusAuthLogic.ts` | 0 (interne) | `@/lib/*`, `auth/*` (relatifs), `@nexus` | **kernel/providers/auth/** | 🔶 imports relatifs `./auth/*` à ajuster |
| `hooks/useNexusFleetLogic.ts` | 0 (interne) | `@nexus` seulement | **kernel/providers/** | pur nexus ✅ (malgré le nom « fleet ») |
| `hooks/useNexusTenantLogic.ts` | 0 (interne) | `@/config`, **`@/infrastructure`**, `@/instances`, `@/lib`, `@/store`, `@nexus` | **kernel/providers/tenant/** | ⚠️ infra + instances (pré-check) |

**Interdépendances internes** (imports relatifs à préserver/ajuster lors du move) :
- `NexusCoreProvider` monte l'arbre : consomme `useNexusAuthLogic`, `useNexusTenantLogic`, `useNexusFleetLogic`, `useSettingsModule`, `NexusCoreContext`.
- `useNexusAuthLogic` → `./auth/AuthAccess|AuthSession|AuthStaff` (relatifs).
- Si tout part ensemble vers `kernel/providers/` (même arbo `auth/`, `settings/`, `tenant/`), **les relatifs survivent**. → **déplacer le sous-arbre `providers/hooks/` en bloc** vers `kernel/providers/` en conservant la structure `auth/ settings/ tenant/`.

### 1.B — Les 28 hooks

**CAT-D → `kernel/hooks/`** (nexus-core ; kernel→lib/store/nexus déjà présents) :

| Hook | Imp. | Deps clés |
|---|---|---|
| `useTenant` | 7 | NexusCoreContext |
| `useActionPermission` | 6 | `@/lib/logger`, NexusCoreContext, `@nexus/contracts/permissions.types` |
| `useTabAccess` | 4 | NexusCoreContext, `@/store/pillars/rbac`, `@nexus` |
| `useNexusMutation` | 4 | `@/lib/logger`, `@/store`, `@nexus/engines`, `@nexus/state` |
| `useSovereignSwitchboard` | 2 | `@/lib/nexus`, `@/lib/sovereign` |
| `usePageAccess` | 1 | NexusCoreContext, `@/store/pillars/rbac`, `@nexus` |
| `useSettings` | 1 | `@/lib/SettingsManager`, `@/store/settingsAtoms`, `@nexus` |
| `useNexusStatus` | 1 | `@/store/atoms/nexusStatus.atom` |
| `useLanguage` | 1 | NexusCoreContext |
| `useDataMigration` | 1 | `@/lib/MigrationService` |
| `useNotifications` | 0 | NexusCoreContext |
| `useUI` | 0 | NexusCoreContext |
| `useTenantLifecycle` | 0 | `@/lib/GlobalRegistryService`, `@nexus/state` |
| `actionPermissionMap.ts` | 0 | **shim** `export * from '@nexus/guards/rbac/actionPermissionMap'` → **supprimer** et pointer `useActionPermission` directement sur `@nexus/guards/rbac/actionPermissionMap` |

**CAT-E intelligence → `modules/intelligence/…/hooks/`** (importent l'IA/pilier) :

| Hook | Imp. | Deps |
|---|---|---|
| `useGeminiAgent` | 3 | `@/lib/logger`, `tenantScopedKey`, nexus-contract |
| `useNexusFleet` | 2 | **`@/modules/intelligence`** |
| `useStrategicOracle` | 1 | **`@modules/intelligence/services/MacroBrain`**, `@/lib/axiom`, `useNexusFleet` |
| `useIntelligence` | 0 | (pur / wrapper) |
| `useCoreOracle` | 0 | `@/lib/adapters/MasterBridge`, `@nexus/state` |

> ⚠️ Ces hooks ne sont **PAS** dans le barrel `@/shared/hooks` → import direct uniquement → **pas de risque shared→modules via barrel**. Réécrire leurs importeurs directs vers `@/modules/intelligence` (barrel du pilier) et **les ajouter au barrel `modules/intelligence/index.ts`**.

**CAT-E design → `design/hooks/`** (branding/UI/vertical) :

| Hook | Imp. | Deps |
|---|---|---|
| `useBrandEditor` | 5 | `@/infrastructure/services/storage`, `@/store/pillars/sovereign`, `@nexus/tokens/brand` |
| `useVerticalComponent` | 2 | `@/kernel/plugins/*`, `VerticalUIProvider` |
| `useFirestoreBrand` | 1 | `@/lib/nexus`, `@nexus/state`, `@nexus/tokens` |
| `useBrandCapabilities` | 0 | `@nexus/state/SovereignGenome` |
| `useLexicon` | 0 | `NexusCoreProvider`, `@/kernel/plugins/IVerticalLexicon` |

**Autres** :

| Hook | Imp. | Destination |
|---|---|---|
| `useDLQQuarantine` | 0 | **orchestration/hooks/** (`@orchestration/NexusEventBus`, `@/store/atoms/dlqQuarantine`) |
| `useManagement` | 0 | **kernel/hooks/** ou vérifier mort (`@/store/pillars/commerce+compliance`) — 0 imp, candidat suppression |
| `useConnector.ts` | 0 | **type `UseConnectorResult`** → garder NEUTRE : déplacer le type dans `kernel/hooks/` (ou lib/) puis re-export barrel. **NE PAS** mettre en modules (violerait le barrel). Supprimer le fichier `useConnector.ts` de shared. |
| `index.ts` (barrel) | — | **8g** (dernier) |

### 1.C — God file `contexts/settings/defaults.ts` (427L, 2 importeurs)

- Importeurs : `design/settings/SettingsDashboard.tsx` + `shared/providers/hooks/settings/useSettingsModule.ts`.
- **Destination** : `kernel/nexus/contracts/settings/defaults.ts`.
- Fragmentation optionnelle (par domaine de settings) → **différer** à un chantier « god files » ultérieur ; ici **déplacer tel quel** (2 refs, mécanique).

### 1.D — Barrel `@/shared/hooks` (126 importeurs : modules 56, design 50, app 11, kernel 8, shared 1)

Surface exportée actuelle (`shared/hooks/index.ts`) = **mix** :
- hooks utilitaires **déjà** en `@/lib/hooks` (re-exportés) ;
- hooks nexus-core **locaux** : `useActionPermission`, `useTabAccess`, `useNexusStatus`, `useTenant` (→ partent en kernel/hooks 8b) ;
- hooks de `NexusCoreContext` : `useNexusCore`, `useAuth`, `useUI`, `useSettings`, `useLanguage`, `useNotifications` (→ NexusCoreContext part en kernel/providers 8a) ;
- type `UseConnectorResult`.

**Stratégie d'élimination (la plus propre)** : **déplacer le barrel** `shared/hooks/index.ts` → **`kernel/hooks/index.ts`** en tant que barrel unifié (re-exporte `@/lib/hooks/*` + les hooks nexus-core désormais en kernel + les hooks de NexusCoreContext en kernel/providers), puis :

```bash
# 126 importeurs : @/shared/hooks → @/kernel/hooks (barrel unifié)
grep -rl "shared/hooks'" src --include='*.ts' --include='*.tsx' | xargs sed -i '' "s|@/shared/hooks'|@/kernel/hooks'|g; s|@shared/hooks'|@kernel/hooks'|g"
# (attention à ne matcher que le barrel — quote fermante ' juste après hooks — pas @/shared/hooks/useX)
```
- `kernel/hooks/index.ts` re-exportant `@/lib/hooks` (kernel→lib ✅) + `@/kernel/providers/NexusCoreContext` (kernel→kernel ✅) → aucune inversion.
- Résultat : `shared/hooks/` **entièrement vidé**.

---

## 2. Ordre d'exécution (7 sous-commits)

> Dépendances : NexusCoreContext (8a) avant les hooks qui l'importent (8b) avant le barrel (8g). God file (8f) avant/pendant que useSettingsModule bouge (8a-providers).

### 8a — Providers → kernel/providers + design/providers
1. `mkdir -p src/kernel/providers/{auth,settings,tenant}` et `src/design/providers`.
2. `git mv` en **préservant la structure** :
   - kernel : `NexusCoreContext.ts`, `NexusCoreProvider.tsx`, `NotificationProvider.tsx`, `VerticalUIProvider.tsx`, `hooks/useExtensions.ts`, `hooks/useNexusFleetLogic.ts`, `hooks/auth/*`, `hooks/settings/useSettingsModule.ts`, `hooks/useNexusAuthLogic.ts`, `hooks/useNexusTenantLogic.ts` → `kernel/providers/…` (même arbo `auth/ settings/ tenant/`).
   - design : `NexusPulseOrchestrator.tsx`, `SplashGate.tsx`, `UIThemeProvider.tsx` → `design/providers/`.
3. Réécrire imports : `@/shared/providers/` et `@shared/providers/` → `@/kernel/providers/` **sauf** les 3 fichiers design → `@design/providers/`. ⚠️ faire les 3 design **d'abord** (ciblés), puis le reste vers kernel.
4. Corriger les **relatifs internes** cassés (ex. `useNexusAuthLogic` → `./auth/*` : survivent si structure préservée ; sinon re-TSC).
5. Le barrel `shared/hooks/index.ts` ligne 29-36 : `@/shared/providers/NexusCoreContext` → `@/kernel/providers/NexusCoreContext`.
6. **TSC=0 + cycles≤2** → commit.

### 8f — God file defaults.ts → kernel/nexus/contracts/settings/
> À faire tôt car `useSettingsModule` (déplacé en 8a) l'importe.
1. `mkdir -p src/kernel/nexus/contracts/settings`
2. `git mv src/shared/contexts/settings/defaults.ts src/kernel/nexus/contracts/settings/defaults.ts`
3. Réécrire les 2 importeurs : `@/shared/contexts/settings/defaults` → `@nexus/contracts/settings/defaults`.
4. `rm -rf src/shared/contexts` (vide). **TSC=0** → peut être **fusionné dans le commit 8a**.

### 8b — Hooks nexus-core → kernel/hooks
1. `mkdir -p src/kernel/hooks`
2. `git mv` les 13 hooks CAT-D + gérer `actionPermissionMap.ts` (supprimer le shim, pointer `useActionPermission` sur `@nexus/guards/rbac/actionPermissionMap`).
3. Réécrire imports directs `@/shared/hooks/useX` → `@/kernel/hooks/useX` (formes `@/shared` et `@shared`, + inline `import('…')`).
4. **TSC=0 + cycles≤2** → commit.

### 8c — Hooks intelligence → modules/intelligence
1. Déterminer le sous-dossier cible (ex. `modules/intelligence/ia/hooks/` ou `modules/intelligence/domain/agency/`).
2. `git mv` les 5 hooks. Ajouter au barrel `modules/intelligence/index.ts`.
3. Réécrire importeurs directs → `@/modules/intelligence` (barrel). Vérifier **aucun** `kernel/lib/store → modules` créé (ces hooks ne sont importés que par app/design/modules).
4. **TSC=0** + `sentrux` → commit.

### 8d — Hooks design → design/hooks
1. `mkdir -p src/design/hooks`
2. `git mv` les 5 hooks branding/vertical. Réécrire importeurs → `@design/hooks/useX`.
3. **TSC=0** → commit.

### 8e — Hooks divers (orchestration + nettoyage)
1. `useDLQQuarantine` → `orchestration/hooks/`. `useConnector` type → `kernel/hooks/` (neutre) + suppression fichier shared. `useManagement` → vérifier mort (0 imp) : supprimer ou `kernel/hooks/`.
2. **TSC=0** → commit.

### 8g — Élimination du barrel (dernier)
1. Créer `kernel/hooks/index.ts` = barrel unifié (voir §1.D).
2. `sed` 126 importeurs `@/shared/hooks'`/`@shared/hooks'` → `@/kernel/hooks'`/`@kernel/hooks'` (**quote fermante** pour ne pas toucher `@/shared/hooks/useX`).
3. `rm src/shared/hooks/index.ts` (+ tout reliquat). Vérifier `ls src/shared/` = **`schemas` seulement**.
4. **TSC=0 + cycles≤2 + `sentrux check .`** → commit final.

---

## 3. Points de vigilance (résumé actionnable)

1. 🔴 **NexusPulseOrchestrator → design/** (pas kernel : `@modules/finance`).
2. ⚠️ **Pré-check `@/infrastructure` / `@/instances`** : conditionne kernel vs design pour `useNexusTenantLogic` + `auth/*`.
3. 🔶 **Imports relatifs** cassés par `git mv` : toujours re-TSC, lire `TS2307`, corriger (`./`, `../`).
4. 🟢 **`UseConnectorResult`** doit rester **neutre** (kernel/hooks ou lib) — jamais modules (sinon barrel→modules).
5. 🟢 **`"use client"`** : préserver la directive en tête des providers/hooks lors des moves (git mv la conserve ; ne pas la perdre en refactor).
6. 🟢 **Barrel unifié en kernel/hooks** : ne re-exporter QUE des symboles kernel/lib/kernel-providers (jamais modules) pour éviter `kernel→modules`.
7. 🕒 **Hook `graphify`** ≈ 2 min post-commit → commits en **background**, vérifier `git log` ensuite.
8. ✅ **Gate final** : lancer `./scripts/agent-gate.sh` **et** `sentrux check .` (ce dernier voit les cycles par alias que le madge du gate rate).

---

## 4. Vérification par sous-étape (obligatoire avant chaque commit)

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"                                   # == 0
npx madge --circular --extensions ts,tsx src 2>/dev/null | grep -cE '^[0-9]+\)'  # <= 2
grep -rn "from '@/modules/" src/kernel src/lib src/store --include='*.ts*' | grep -v '\.test\.' | wc -l  # == 0
# refs shared résiduelles du lot en cours :
grep -rn "@/\?shared/\(providers\|hooks\|contexts\)" src --include='*.ts*' | wc -l
```

Template commit : `refactor(rapatriement): étape 8x — <lot> → <couche>` + `TSC=0, cycles=2`.

---

## 5. État cible final

```
src/shared/
└── schemas/          ← primitives.ts (GELÉ), ui.ts, index.ts   [reste par design]
```
- `shared/` réduit de 47 → **3 fichiers** (schemas gelé).
- Tous les autres symboles relocalisés : `kernel/{providers,hooks,nexus/contracts/settings}`, `design/{providers,hooks}`, `modules/intelligence/…/hooks`, `orchestration/hooks`.
- Barrel `@/shared/hooks` supprimé → remplacé par `@/kernel/hooks`.
- **Gate vert** : TSC=0, cycles=2 (madge) / 0 nouveau (sentrux), toutes inversions de couche = 0.

---

## 6. Rollback

Chaque sous-étape = 1 commit isolé → `git revert <hash>` ou `git reset --hard 457d235f5` (HEAD de reprise) annule proprement. Aucune donnée détruite (moves uniquement ; seul `useManagement`/`actionPermissionMap` peuvent être supprimés → vérifiés morts avant).
