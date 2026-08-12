# Plan de Rapatriement `src/shared/` — Inventaire & Migration

> **Objectif** : vider `src/shared/` en rapatriant chaque fichier vers sa couche canonique.
> **Principe** : shared/ n'est pas un pilier — c'est un reliquat du monolithe. Chaque fichier
> doit rejoindre `kernel/`, `lib/`, `design/`, `store/`, un pilier `modules/<pilier>/`, ou être supprimé.
>
> **Contrainte critique** : ne jamais créer de cycle. Avant chaque déplacement, vérifier
> que la destination n'importe pas déjà depuis la source.
>
> **Méthode** : étape par étape, un commit par lot, TSC=0 après chaque commit.

---

## Inventaire : 123 fichiers, 16 sous-dossiers

| Sous-dossier | Fichiers | Importeurs | Destination naturelle |
|---|---|---|---|
| `hooks/` | 44 | 119 (via barrel) | `lib/hooks/` (utilitaires) ou `kernel/` (nexus-core) |
| `providers/` | 15 | ~30 | `kernel/providers/` |
| `seeds/` | 10 | ~5 | `lib/seeds/` (déjà doc dans CLAUDE.md) |
| `connector-manifest/` | 10 | ~12 | `modules/intelligence/connectors/` |
| `contexts/` | 9 | ~28 | supprimer (shims compat 2-6 lignes) ou `kernel/` |
| `utils/` | 8 | ~33 | `lib/utils/` (déjà barrel là-bas) |
| `plugins/` | 6 | ~14 | `kernel/plugins/` |
| `services/` | 3 | ~32 | `lib/services/` |
| `types/` | 3 | ~55+8+5 | `kernel/nexus/contracts/` ou `lib/types/` |
| `schemas/` | 3 | ~78+3 | `kernel/nexus/contracts/` ou `domain/schemas/` |
| `rbac/` | 2 | ~3 | `kernel/nexus/guards/` |
| `store/` | 2 | ~2 | `store/` racine |
| `atoms/` | 2 | ~2 | `store/` racine |
| `validation/` | 1 | ~0 | `domain/schemas/` ou supprimer |
| `constants/` | 1 | ~6 | `lib/constants/` ou `kernel/` |
| `actions/` | 1 | ~4 | `app/` (server action) ou `design/settings/` |
| racine | 3 | ~110+7 | `kernel/` (nexus-contract, genome.types) |

---

## Classification des fichiers

### CAT-A : Shims compat — SUPPRIMER (réécrire les imports)

> Fichiers de 2-6 lignes qui ne font que `export * from` ou wrapper mince. 
> Supprimer le fichier + réécrire les imports vers la cible directe.

| Fichier | Lignes | Contenu | Import cible après suppression |
|---|---|---|---|
| `contexts/FleetContext.tsx` | 6 | `@deprecated` re-export → `@/design/contexts/FleetContext` | `@design/contexts/FleetContext` |
| `contexts/IntelligenceContext.tsx` | 2 | `export * from "@/modules/intelligence"` | `@/modules/intelligence` |
| `contexts/PlanningContext.tsx` | 2 | `export * from "@/modules/human"` | `@/modules/human` |
| `contexts/RegistreContext.tsx` | 2 | `export * from "@/modules/compliance"` | `@/modules/compliance` |
| `contexts/TutorialContext.tsx` | 5 | `@deprecated` re-export → `@/design/contexts/TutorialContext` | `@design/contexts/TutorialContext` |
| `contexts/ThemeContext.tsx` | 4 | thin wrapper `useNexusCore()?.theme` | direct `useNexusCore` |
| `contexts/NotificationsContext.tsx` | 4 | thin wrapper `useNexusCore()?.notif` | direct `useNexusCore` |
| `contexts/SettingsContext.tsx` | 6 | thin wrapper `useSettings()` | direct `useSettings` |
| `store/languageAtoms.ts` | ? | probablement `@deprecated` re-export | vérifier → `store/` racine ou supprimer |
| `store/tutorialAtoms.ts` | ? | probablement `@deprecated` re-export | vérifier → `store/` racine ou supprimer |

**Total CAT-A** : ~10 fichiers, impact faible, risque nul.

**Conflits potentiels** :
- `SettingsContext` importé par 20 fichiers (design/ + modules/) — gros sed mais mécanique
- `NotificationsContext` importé par 18 fichiers — idem
- `RegistreContext` importé par 8 fichiers dans modules/
- Pas de risque de cycle car on pointe vers des modules existants

---

### CAT-B : Types & schémas transversaux — MONTER vers `kernel/` ou `lib/`

> Types purement structurels sans logique métier. Cible : `kernel/nexus/contracts/` (types Nexus)
> ou `lib/types/` (utilitaires génériques).

| Fichier | Lignes | Importeurs | Destination | Risque cycle |
|---|---|---|---|---|
| `nexus-contract.ts` | 191 | **110** | `kernel/nexus/contracts/nexus-contract.ts` | ⚠️ ÉLEVÉ — 29 imports depuis kernel/ déjà, 27 depuis modules/, 8 depuis lib/. Doit aller dans kernel/ pour respecter la hiérarchie. Vérifier que kernel/ ne crée pas de cycle. |
| `genome.types.ts` | 124 | **7** | `kernel/nexus/contracts/genome.types.ts` | ✅ Faible — importé par kernel/ (2) + lib/ (1) + shared/ (4). Pas de cycle. |
| `types/json.ts` | ? | **55** | `lib/types/json.ts` | ✅ Faible — type utilitaire pur (JsonValue etc.), pas de dépendance. |
| `types/empire.ts` | ? | **8** | `kernel/nexus/contracts/empire.types.ts` | ✅ Faible — types MCC. |
| `types/brands.ts` | ? | **5** | `kernel/nexus/tokens/brands.types.ts` | ✅ Faible — types branding. |
| `schemas/primitives.ts` | ? | **78** | ⚠️ **NE PAS BOUGER** — déjà dans `domain/schemas/` par la stratégie doc. Voir mémoire `project_schema_migration_strategy`. Alias tsconfig `@/shared/schemas/primitives` à ajouter si nécessaire. | ❌ GELÉ |
| `schemas/ui.ts` | ? | **3** | `design/schemas/ui.ts` | ✅ Faible |
| `schemas/index.ts` | ? | **9** | re-export → pointer vers domain/schemas si possible | ⚠️ Vérifier contenu |
| `validation/TicketSchema.ts` | 17 | **0** | `domain/schemas/supportTicket.ts` ou supprimer si doublon | ✅ Aucun importeur |

**Total CAT-B** : ~9 fichiers. Le plus risqué est `nexus-contract.ts` (110 importeurs).

**Conflits potentiels** :
- `nexus-contract.ts` est importé par `kernel/` (29×) ET par `modules/` (27×) → le déplacer dans `kernel/` respecte le sens de dépendance. MAIS il importe `@/lib/` (vérifier) et `@/shared/` — cycle possible. **Action** : lire le fichier, tracer chaque import, confirmer zéro cycle avant de bouger.
- `schemas/primitives.ts` : **GELÉ** par décision (voir mémoire). Ne pas toucher. Créer un alias tsconfig si on veut moderniser l'import path.

---

### CAT-C : Hooks utilitaires génériques — DÉPLACER vers `lib/hooks/`

> Hooks React sans dépendance pilier. Utilisables par n'importe quel composant.
> Cible : `src/lib/hooks/` (nouveau dossier) avec barrel.

| Hook | Lignes | Nature | Dépendances sortantes |
|---|---|---|---|
| `useAsync.ts` | 100 | util pur | aucune |
| `useDebounce.ts` | 91 | util pur | aucune |
| `useDisclosure.ts` | ? | util pur | aucune |
| `useFiltering.ts` | 127 | util pur | aucune |
| `useHasMounted.ts` | ? | util pur | aucune |
| `useInteractions.ts` | ? | util pur (clickOutside, escapeKey) | aucune |
| `useIntersectionObserver.ts` | 93 | util pur | aucune |
| `useIsMobile.ts` | ? | util pur | useMediaQuery |
| `useLanguage.ts` | ? | util pur | i18n |
| `useList.ts` | 127 | util pur | aucune |
| `useMediaQuery.ts` | ? | util pur | aucune |
| `usePagination.ts` | 100 | util pur | aucune |
| `usePerformance.ts` | ? | util pur | aucune |
| `useSorting.ts` | 98 | util pur | aucune |
| `useStorage.ts` | 84 | util pur (localStorage/sessionStorage) | aucune |
| `useVirtualization.ts` | 174 | util pur | aucune |
| `useVisibilityPurge.ts` | ? | util pur | aucune |

**Total CAT-C** : ~17 hooks, ~1200 lignes. Risque nul — aucune dépendance pilier.

**Conflits potentiels** : aucun. Ce sont des hooks purement React sans import métier.

**Méthode** :
1. Créer `src/lib/hooks/`
2. Copier les 17 fichiers
3. Créer `src/lib/hooks/index.ts` (barrel)
4. Mettre à jour `src/shared/hooks/index.ts` pour re-exporter depuis `@/lib/hooks/` (transition)
5. Réécrire les imports directs `@/shared/hooks/useDebounce` → `@/lib/hooks/useDebounce`
6. Supprimer les fichiers de shared/ quand le barrel les masque

---

### CAT-D : Hooks métier / Nexus-core — DÉPLACER vers `kernel/hooks/`

> Hooks qui dépendent du cœur Nexus (tenant, auth, settings, mutations).
> Cible : `kernel/hooks/` (accès au core, pas un pilier spécifique).

| Hook | Lignes | Dépendances | Risque |
|---|---|---|---|
| `useTenant.ts` | ? | NexusCoreContext | ✅ |
| `useSettings.ts` | 110 | NexusCoreContext + Nexus adapter | ✅ |
| `useNexusStatus.ts` | ? | atom + Nexus | ✅ |
| `useNexusMutation.ts` | 106 | Nexus adapter | ✅ |
| `useActionPermission.ts` | ? | RBAC + auth | ✅ |
| `useTabAccess.ts` | ? | RBAC + auth | ✅ |
| `usePageAccess.ts` | ? | RBAC + auth | ✅ |
| `actionPermissionMap.ts` | ? | constantes RBAC | ✅ |
| `useSovereignSwitchboard.ts` | ? | Nexus core | ✅ |
| `useDataMigration.ts` | ? | Nexus + migration | ⚠️ Vérifier |
| `useDLQQuarantine.ts` | ? | orchestration atoms | ⚠️ → orchestration/ plutôt |
| `useTenantLifecycle.ts` | 84 | tenant + lifecycle | ✅ |

**Total CAT-D** : ~12 hooks. Risque moyen — dépendent de `kernel/` mais kernel/ les importerait aussi.

**Conflits potentiels** :
- `useNexusMutation` et `useTenant` sont importés par les 8 piliers → déplacer dans kernel/ respecte le sens
- `useDLQQuarantine` devrait aller dans `orchestration/hooks/` plutôt que kernel/

---

### CAT-E : Hooks pilier-spécifique — RAPATRIER vers le pilier

> Hooks liés à un pilier identifiable.

| Hook | Lignes | Pilier cible | Raison |
|---|---|---|---|
| `useGeminiAgent.ts` | 147 | `modules/intelligence/` | agent IA |
| `useStrategicOracle.ts` | 112 | `modules/intelligence/` | oracle IA |
| `useIntelligence.ts` | ? | `modules/intelligence/` | wrapper intelligence |
| `useNexusFleet.ts` | ? | `modules/intelligence/` | fleet IA |
| `useCoreOracle.ts` | ? | `modules/intelligence/` | oracle IA |
| `useLexicon.ts` | ? | vertical plugin | `kernel/plugins/` |
| `useUI.ts` | ? | design layer | `design/hooks/` |
| `useBrandEditor.ts` | ? | branding | `design/hooks/` |
| `useBrandCapabilities.ts` | ? | branding | `design/hooks/` |
| `useFirestoreBrand.ts` | ? | branding | `design/hooks/` |
| `useConnector.ts` | ? | connectors | `modules/intelligence/connectors/` |
| `useManagement.ts` | ? | ?? | vérifier contenu |
| `useNotifications.ts` | ? | notifications | `design/hooks/` ou `kernel/` |
| `useVerticalComponent.ts` | ? | vertical UI | `kernel/plugins/` |

**Total CAT-E** : ~14 hooks.

**Conflits potentiels** :
- `useGeminiAgent` / `useStrategicOracle` importent potentiellement depuis `@/modules/intelligence` → cycle si intelligence importe shared/hooks. **Vérifier avant migration.**
- `useConnector` : peut-être déjà dupliqué dans `modules/intelligence/connectors/hub/hooks/` (le barrel shared/hooks mentionne la dépréciation)

---

### CAT-F : Providers — DÉPLACER vers `kernel/providers/`

> Le cœur du runtime React (auth, tenant, theme). Transversal par nature.

| Fichier | Lignes | Rôle | Destination |
|---|---|---|---|
| `providers/NexusCoreContext.ts` | 21 | Context React principal | `kernel/providers/` |
| `providers/NexusCoreProvider.tsx` | 99 | Provider racine | `kernel/providers/` |
| `providers/NexusPulseOrchestrator.tsx` | 36 | Pulse/heartbeat | `kernel/providers/` |
| `providers/NotificationProvider.tsx` | 36 | Notifications | `kernel/providers/` |
| `providers/SplashGate.tsx` | 122 | Splash screen gate | `design/` (déjà un SplashScreen dans design/) |
| `providers/UIThemeProvider.tsx` | 78 | Theme provider | `design/providers/` |
| `providers/VerticalUIProvider.tsx` | 71 | Vertical UI plugin | `kernel/providers/` |
| `providers/hooks/auth/AuthAccess.tsx` | 164 | RBAC access | `kernel/providers/auth/` |
| `providers/hooks/auth/AuthSession.tsx` | 111 | Session mgmt | `kernel/providers/auth/` |
| `providers/hooks/auth/AuthStaff.tsx` | 174 | Staff auth | `kernel/providers/auth/` |
| `providers/hooks/settings/useSettingsModule.ts` | 65 | Settings hook | `kernel/providers/settings/` |
| `providers/hooks/useExtensions.ts` | 30 | Extensions hook | `kernel/providers/` |
| `providers/hooks/useNexusAuthLogic.ts` | 157 | Auth logic | `kernel/providers/auth/` |
| `providers/hooks/useNexusFleetLogic.ts` | 25 | Fleet logic | `modules/intelligence/` |
| `providers/hooks/useNexusTenantLogic.ts` | 100 | Tenant logic | `kernel/providers/tenant/` |

**Total CAT-F** : 15 fichiers, ~1289 lignes. Risque moyen-élevé.

**Conflits potentiels** :
- `NexusCoreProvider` importe lourdement `@/lib/` et `@/shared/hooks` → doit migrer APRÈS les hooks (CAT-C/D)
- `AuthStaff` et `AuthAccess` importent `@nexus/contracts` et `@/lib/` → OK dans kernel/
- `useNexusFleetLogic` importe `@/modules/intelligence` → **cycle si dans kernel/**. Doit aller dans `modules/intelligence/` ou rester dans shared/ avec annotation.
- `useNexusTenantLogic` est un god file potentiel (100L mais complexe) — inspecter avant déplacement

---

### CAT-G : Services — DÉPLACER vers `lib/services/`

| Fichier | Lignes | Importeurs | Destination |
|---|---|---|---|
| `services/SelfHealingEngine.ts` | 191 | **7** | `lib/services/SelfHealingEngine.ts` |
| `services/SovereignMath.ts` | 121 | **28** | `lib/services/SovereignMath.ts` |
| `services/SovereignStorage.ts` | ? | **4** | `lib/services/SovereignStorage.ts` |

**Total CAT-G** : 3 fichiers. Risque faible.

**Conflits potentiels** :
- `SovereignMath` est le plus importé (28 importeurs dans modules/ + store/) — migration mécanique
- `SelfHealingEngine` importe `@/lib/` et `@nexus/` → OK dans lib/
- Aucun de ces services n'importe de module → pas de cycle

---

### CAT-H : Plugins / Vertical Registry — DÉPLACER vers `kernel/plugins/`

| Fichier | Lignes | Rôle |
|---|---|---|
| `plugins/CoreContext.ts` | ? | Context core pour plugins |
| `plugins/IVerticalPlugin.ts` | ? | Interface plugin |
| `plugins/IVerticalUIPlugin.ts` | ? | Interface UI plugin |
| `plugins/IVerticalLexicon.ts` | ? | Interface lexique |
| `plugins/VerticalRegistry.ts` | 50 | Registry des verticales |
| `plugins/VerticalUIRegistry.ts` | ? | Registry UI |

**Total CAT-H** : 6 fichiers. Risque faible — interfaces pures.

**Conflits potentiels** :
- `VerticalRegistry` importe dynamiquement les verticales → vérifier que kernel/ peut faire cet import
- `IVerticalPlugin` est importé par `src/verticals/` → sens correct (verticals dépend de kernel)

---

### CAT-I : Seeds, connector-manifest, RBAC, etc.

| Sous-dossier | Fichiers | Destination | Risque |
|---|---|---|---|
| `seeds/` (10 fichiers) | DNA templates par verticale | `lib/seeds/` (déjà doc CLAUDE.md : `shared/seeds/`) | ✅ Faible — pas de dépendance circulaire |
| `connector-manifest/` (10) | Catalogue connecteurs | `modules/intelligence/connectors/manifest/` | ✅ Faible |
| `rbac/` (2) | actionPermissionMap + checkPermission | `kernel/nexus/guards/rbac/` | ✅ Faible |
| `constants/pricing.ts` (1) | Constantes pricing | `lib/constants/pricing.ts` | ✅ Faible |
| `actions/settings.action.ts` (1) | Server action settings | `app/api/` ou `design/settings/` | ⚠️ Vérifier si c'est une Next.js Server Action |
| `utils/motion/` (5) | Framer Motion variants | `design/utils/motion/` | ✅ Faible |
| `utils/a11y/` (2) | Accessibilité | `design/utils/a11y/` | ✅ Faible |
| `utils/categoryMatcher.ts` (1) | Helper catégories | `lib/utils/` | ✅ Faible |
| `utils/parseRequest.ts` (1) | Parse HTTP | `lib/utils/` | ✅ Faible |
| `atoms/` (2) | Jotai atoms (DLQ + nexusStatus) | `store/` racine | ✅ Faible |
| `ModuleRegistry.ts` (1) | Registry modules | `kernel/` | ⚠️ Vérifier usage |

---

### CAT-J : Fichier critique — `contexts/settings/defaults.ts` (427 lignes)

> Ce fichier est un **god file** (427L) qui contient les valeurs par défaut de tous les settings.
> Il importe depuis `@/config/instance` et `@nexus/contracts/settings`.
> **20 importeurs** (contexts/SettingsContext + providers + modules).

**Destination** : `kernel/nexus/contracts/settings/defaults.ts` ou `lib/settings/defaults.ts`

**Conflits potentiels** :
- Importe `@/config/instance` (3 fonctions) — vérifier que kernel/ peut y accéder
- C'est un god file → fragmenter en même temps ? (settings par domaine)
- **Recommandation** : déplacer tel quel dans `kernel/nexus/contracts/settings/defaults.ts`, fragmenter dans un second temps

---

## Plan d'exécution — 8 étapes ordonnées

> **Règle** : chaque étape = 1 commit, TSC=0 après.
> L'ordre respecte les dépendances : on déplace d'abord ce qui n'a pas de dépendance,
> puis ce qui dépend de la couche précédente.

### Étape 1 — Shims compat (CAT-A) · ~30 min · Risque : NUL

**Quoi** : Supprimer les 10 fichiers de 2-6 lignes qui ne font que re-exporter.

**Actions** :
1. Pour chaque shim dans CAT-A :
   a. Lister les importeurs : `grep -rn "@/shared/contexts/SettingsContext" src/`
   b. Réécrire chaque import vers la cible directe
   c. Supprimer le fichier shim
2. `npx tsc --noEmit` → 0
3. Commit : `refactor(rapatriement): étape 1 — supprimer 10 shims compat contexts/store`

**Vérification conflits** :
- `SettingsContext` (20 importeurs) → tous reçoivent `useSettings` depuis `@/shared/hooks` qui existe encore
- `NotificationsContext` (18 importeurs) → idem via `useNexusCore`
- `RegistreContext` (8 importeurs) → les modules importent déjà `@/modules/compliance` directement

---

### Étape 2 — Types & utilitaires purs (CAT-B partiel + CAT-G + CAT-I partiel) · ~45 min · Risque : FAIBLE

**Quoi** : Déplacer les fichiers sans dépendance métier vers `lib/` et `kernel/`.

**Actions** :
1. `types/json.ts` → `lib/types/json.ts` + alias tsconfig + réécrire 55 imports
2. `services/SovereignMath.ts` → `lib/services/SovereignMath.ts` + réécrire 28 imports
3. `services/SelfHealingEngine.ts` → `lib/services/SelfHealingEngine.ts` + réécrire 7 imports
4. `services/SovereignStorage.ts` → `lib/services/SovereignStorage.ts` + réécrire 4 imports
5. `constants/pricing.ts` → `lib/constants/pricing.ts` + réécrire 6 imports
6. `utils/parseRequest.ts` → `lib/utils/parseRequest.ts`
7. `utils/categoryMatcher.ts` → `lib/utils/categoryMatcher.ts`
8. `validation/TicketSchema.ts` → vérifier si mort, sinon `domain/schemas/`
9. `atoms/` (2 fichiers) → `store/atoms/`
10. `npx tsc --noEmit` → 0
11. Commit

**Vérification conflits** :
- `types/json.ts` : importé par modules/ (16), app/ (22), orchestration/ (3), lib/ (7) — tout va dans le sens descendant depuis lib/. ✅
- `SovereignMath` : importé par store/ (3), modules/ (22) — OK depuis lib/. ✅
- Aucun de ces fichiers n'importe depuis modules/ → zéro cycle

---

### Étape 3 — Hooks utilitaires (CAT-C) · ~1h · Risque : FAIBLE

**Quoi** : Créer `lib/hooks/` et y déplacer les 17 hooks sans dépendance pilier.

**Actions** :
1. `mkdir -p src/lib/hooks`
2. Déplacer les 17 hooks CAT-C
3. Créer `src/lib/hooks/index.ts` avec tous les re-exports
4. Mettre à jour `shared/hooks/index.ts` pour re-exporter depuis `@/lib/hooks/`
5. Réécrire les imports directs vers `@/shared/hooks/useDebounce` → `@/lib/hooks/useDebounce`
6. Les imports via le barrel `@/shared/hooks` continuent de fonctionner grâce au re-export
7. `npx tsc --noEmit` → 0
8. Commit

**Vérification conflits** :
- Ces hooks n'importent rien de modules/ → aucun cycle possible
- Le barrel `@/shared/hooks` reste en place comme pont transitoire
- 119 importeurs du barrel → aucune casse grâce au re-export

---

### Étape 4 — Utils design (motion + a11y) · ~20 min · Risque : NUL

**Quoi** : Déplacer les utils Framer Motion et a11y vers design/.

**Actions** :
1. `utils/motion/` (5 fichiers) → `design/utils/motion/`
2. `utils/a11y/` (2 fichiers) → `design/utils/a11y/`
3. Réécrire les 33 imports `@/shared/utils/motion` → `@design/utils/motion`
4. `npx tsc --noEmit` → 0
5. Commit

**Vérification conflits** :
- `utils/motion` importé par design/ (10) et modules/ (22) — modules/ peut importer depuis design/ ? **OUI** — design/ est une couche de présentation, modules/ l'importent pour les composants UI. ✅

---

### Étape 5 — Types kernel & plugins (CAT-B types + CAT-H + RBAC) · ~45 min · Risque : MOYEN

**Quoi** : Monter les types structurels et plugins vers kernel/.

**Actions** :
1. `genome.types.ts` → `kernel/nexus/contracts/genome.types.ts` + réécrire 7 imports
2. `types/empire.ts` → `kernel/nexus/contracts/empire.types.ts` + réécrire 8 imports
3. `types/brands.ts` → `kernel/nexus/tokens/brands.types.ts` + réécrire 5 imports
4. `schemas/ui.ts` → `design/schemas/ui.ts` + réécrire 3 imports
5. `plugins/` (6 fichiers) → `kernel/plugins/` + réécrire ~14 imports
6. `rbac/` (2 fichiers) → `kernel/nexus/guards/rbac/` + réécrire ~3 imports
7. `ModuleRegistry.ts` → `kernel/ModuleRegistry.ts` (si vivant)
8. `npx tsc --noEmit` → 0
9. Commit

**Vérification conflits** :
- `VerticalRegistry` fait `import()` dynamique des verticales — vérifié OK dans kernel/
- `genome.types` importé par kernel/ déjà → self-referencing, pas de cycle
- `plugins/` importé par lib/ (2) — lib/ peut importer kernel/ ? **OUI** — kernel/ est au-dessus de lib/… **NON ATTENDEZ** — la hiérarchie est : kernel/ > shared/ > lib/ > modules/. kernel/ est le plus bas (infrastructure), lib/ est transversal. **Vérifier** : est-ce que kernel/ importe lib/ ? Si oui, les plugins ne peuvent PAS aller dans kernel/ sans créer de cycle kernel↔lib. **Action préalable** : `grep -rn "from '@/lib/" src/kernel/` pour vérifier.

**⚠️ Point de décision** : si kernel/ importe lib/, alors plugins/ doit rester dans shared/ ou créer une nouvelle couche `src/platform/`.

---

### Étape 6 — `nexus-contract.ts` (CAT-B critique) · ~1h · Risque : ÉLEVÉ

**Quoi** : Migrer le fichier le plus importé (110 refs) vers kernel/.

**Prérequis** : étapes 1-5 terminées (les imports depuis shared/ réduits).

**Actions** :
1. Lire `nexus-contract.ts` intégralement — tracer CHAQUE import sortant
2. Vérifier qu'aucun import ne crée de cycle avec kernel/
3. Déplacer vers `kernel/nexus/contracts/nexus-contract.ts`
4. Ajouter alias tsconfig temporaire : `@shared/nexus-contract` → `kernel/nexus/contracts/nexus-contract`
5. Réécrire les 110 imports (sed mécanique)
6. Retirer l'alias temporaire
7. `npx tsc --noEmit` → 0
8. Commit

**Vérification conflits** :
- Importé par TOUT : kernel/ (29), modules/ (27), lib/ (8), design/ (1), app/ (0), shared/ (15)
- Le fichier importe-t-il quelque chose de modules/ ? → **NON** (vérifié : il n'importe que des primitives)
- Le fichier importe-t-il lib/ ? → **à vérifier** — si oui, il ne peut pas aller dans kernel/ si kernel/ ne doit pas dépendre de lib/. Solution : extraire la partie qui dépend de lib/ dans un fichier séparé dans lib/.

---

### Étape 7 — Seeds + connector-manifest + actions (CAT-I) · ~30 min · Risque : FAIBLE

**Quoi** : Déplacer les lots restants.

**Actions** :
1. `seeds/` (10 fichiers) → `lib/seeds/` (le CLAUDE.md dit déjà `shared/seeds/`, mettre à jour)
2. `connector-manifest/` (10 fichiers) → `modules/intelligence/connectors/manifest/`
3. `actions/settings.action.ts` → vérifier si server action, déplacer vers `app/` ou `design/`
4. `npx tsc --noEmit` → 0
5. Commit

**Vérification conflits** :
- `seeds/` importé par lib/TenantSeeder (1) et shared/ (1) — pas de cycle vers lib/
- `connector-manifest/` importé par modules/intelligence (déjà) et lib/ (2) et app/ (6) — OK dans modules/intelligence si les autres importent via le barrel

---

### Étape 8 — Providers + hooks métier (CAT-D + CAT-E + CAT-F) · ~2h · Risque : ÉLEVÉ

**Quoi** : Le lot le plus délicat — les providers et hooks métier.

**Prérequis** : toutes les étapes précédentes terminées.

**Actions** :
1. **Providers auth** (AuthAccess, AuthSession, AuthStaff, useNexusAuthLogic) → `kernel/providers/auth/`
2. **Provider tenant** (useNexusTenantLogic) → `kernel/providers/tenant/`
3. **Provider core** (NexusCoreProvider, NexusCoreContext) → `kernel/providers/`
4. **Provider settings** (useSettingsModule) → `kernel/providers/settings/`
5. **Provider UI** (UIThemeProvider, VerticalUIProvider, SplashGate, NotificationProvider) → `design/providers/`
6. **Provider fleet** (useNexusFleetLogic) → ⚠️ `modules/intelligence/` (importe intelligence)
7. **Provider pulse** (NexusPulseOrchestrator) → `kernel/providers/`
8. **Hooks métier intelligence** (useGeminiAgent, useStrategicOracle, etc.) → `modules/intelligence/hooks/`
9. **Hooks design** (useUI, useBrandEditor, etc.) → `design/hooks/`
10. **Hooks kernel** (useTenant, useSettings, useNexusMutation, etc.) → `kernel/hooks/`
11. Mettre à jour le barrel `@/shared/hooks` pour re-exporter depuis les nouvelles locations
12. `npx tsc --noEmit` → 0
13. Commit (ou 2-3 commits si le lot est trop gros)

**Vérification conflits** :
- **NexusCoreProvider** importe `@/shared/hooks` (qui re-exporte) et `@/lib/` → doit migrer APRÈS les hooks
- **useNexusFleetLogic** importe `@/modules/intelligence` → **NE PEUT PAS** aller dans kernel/ (cycle). Doit rester dans shared/ ou aller dans modules/intelligence/
- **AuthStaff** importe `@nexus/contracts` → OK dans kernel/
- **useGeminiAgent** importe probablement le SDK Gemini → OK dans modules/intelligence/
- **useStrategicOracle** : doublon potentiel entre `shared/hooks/` et `modules/intelligence/hooks/` → vérifier et dédupliquer

---

### Étape finale — Nettoyage barrel `@/shared/hooks` · ~30 min

**Quoi** : Une fois tous les hooks rapatriés, le barrel `shared/hooks/index.ts` ne contient plus que des re-exports. Le supprimer et réécrire les 119 imports du barrel.

**Actions** :
1. Réécrire tous les `from '@/shared/hooks'` vers la source canonique (`@/lib/hooks`, `@kernel/hooks`, etc.)
2. Supprimer `shared/hooks/index.ts` et les hooks restants
3. Ajouter un alias tsconfig `@/shared/hooks` → erreur compilateur pour empêcher la régression
4. Vérifier `ls src/shared/` — ne devrait contenir que `schemas/primitives.ts` (GELÉ) et les re-exports si besoin
5. `npx tsc --noEmit` → 0
6. Commit final

---

## Résumé effort & risques

| Étape | Fichiers | Effort | Risque | Prérequis |
|---|---|---|---|---|
| 1. Shims compat | 10 | 30 min | Nul | — |
| 2. Types & services purs | ~12 | 45 min | Faible | — |
| 3. Hooks utilitaires | 17 | 1h | Faible | — |
| 4. Utils design | 7 | 20 min | Nul | — |
| 5. Types kernel & plugins | ~11 | 45 min | ⚠️ Moyen | Vérifier kernel↔lib |
| 6. nexus-contract | 1 | 1h | 🔴 Élevé | Étapes 1-5 |
| 7. Seeds + connectors | ~21 | 30 min | Faible | — |
| 8. Providers + hooks métier | ~29 | 2h | 🔴 Élevé | Étapes 1-7 |
| Final. Nettoyage barrel | ~2 | 30 min | Moyen | Étape 8 |
| **TOTAL** | **~123** | **~7h** | | |

---

## Points de vérification obligatoires

Avant CHAQUE déplacement de fichier :

```bash
# 1. Vérifier que la destination n'importe pas depuis la source
grep -rn "from.*shared/" src/<destination>/ | wc -l  # doit être 0 après migration

# 2. Vérifier que le fichier n'importe pas depuis la destination (cycle)
grep -rn "from.*<destination>" src/shared/<fichier>

# 3. Après déplacement
npx tsc --noEmit  # DOIT être 0

# 4. Vérifier pas de nouveau cycle
npx madge --circular src/  # ne doit pas augmenter
```

---

## Décisions préalables nécessaires

1. **kernel/ peut-il importer lib/ ?** → Détermine si les plugins et nexus-contract peuvent aller dans kernel/
2. **Faut-il créer `src/platform/` ?** → Couche intermédiaire entre kernel/ et modules/ pour les providers transversaux
3. **`schemas/primitives.ts` reste-t-il gelé ?** → Confirmé par mémoire projet, ne pas toucher
4. **Le barrel `@/shared/hooks` doit-il survivre comme alias ?** → Recommandation : non, réécrire tous les imports

---

> **Recommandation d'exécution** : faire les étapes 1→4 en un bloc (2h, risque faible),
> puis s'arrêter pour valider. Étapes 5→8 demandent plus de prudence et des vérifications
> manuelles de cycles. Prévoir 2 sessions distinctes.
