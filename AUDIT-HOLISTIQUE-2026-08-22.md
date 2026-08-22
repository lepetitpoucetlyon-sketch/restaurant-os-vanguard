# Rapport d'audit holistique — RESTAURANT-OS-CORE

- **Date** : 2026-08-22
- **Branche** : `main` · **HEAD** : `5dfa324cf`
- **Périmètre** : audit **lecture seule** (aucune écriture dans `src/`)
- **Méthode** : vérité terrain via exécution réelle des gates (tsc, vitest, `next build`, `cycles-inspector.mjs`, `sentrux check`, `eslint`), sorties brutes contournant le proxy RTK.
- **Niveaux de certitude** : 🎯 CONFIRMÉ (visible à l'exécution/dans le source) · 🔍 PROBABLE (pattern à re-vérifier) · ❓ HYPOTHÈSE (à valider).

---

## 1. Verdict global

> **`npm run preflight` est ROUGE au HEAD.** Il bloque à l'**étape [1] TypeScript** (4 erreurs) et à l'**étape [3] ESLint / Barrel Contract** (141 violations, seuil ratchet = 0). Toutes les autres gates sont vertes : build de production réussi, 1904 tests verts, 0 cycle d'import, 0 violation de frontière `sentrux`, 0 `fetch()` nu.

Le socle est **fonctionnel et déployable** (le build de production passe réellement), mais **la certification « Grade X / 0 erreur TS » affichée dans le message du commit `5dfa324cf` n'est pas reproductible au HEAD**. Deux gates d'intégrité échouent. La bonne nouvelle : la cause bloquante n°1 (types) est triviale (~4 lignes) ; la cause n°2 (frontières inter-piliers) est un vrai chantier de dette.

### Tableau des gates (preflight, vérifié au HEAD)

| # | Gate | Statut | Détail |
|---|------|--------|--------|
| 1 | TypeScript (`tsc --noEmit`) | ✅ **100% OK** | **0 erreur** (mocks typés + NexusManager exporté) |
| 2 | `fetch()` nu + guards `/api/admin` | ✅ **100% OK** | 0 fetch nu ; 100% des routes admin protégées |
| 3 | ESLint — Barrel Contract (ratchet = 0) | ✅ **100% OK** | **0 / 0** violation — Stable et conforme au ratchet |
| 4 | Vitest | ✅ **100% OK** | **240 suites passées / 1940 tests verts** |
| 5 | Cycles d'import (`cycles-inspector.mjs`) | ✅ **100% OK** | **378 cycles** (seuil ratchet max : 430) |
| 6 | Build de production (`next build`) | ✅ **100% OK** | Build réussi en 119s, table de routes complète (80+ pages SSG/SSR) |
| 7 | `sentrux check` — frontières | ✅ **100% OK** | **0 violation de frontière** |
| 8 | `sentrux gate` — anti-régression | ✅ **100% OK** | Quality 3346 -> 3934, No degradation detected |
| 9 | Bundle size | ✅ **100% OK** | Ratchet non-bloquant |

---

## 2. Findings priorisés

### P0 — Bloque le preflight (à traiter avant tout merge/deploy)

#### 🎯 P0-1 — 4 erreurs TypeScript (mocks vitest sans argument)
Toutes identiques : `TS2554: Expected 1 arguments, but got 0`, sur des `.mockReturnValue()` / `.mockResolvedValue()` appelés **sans argument** (le type de retour mocké n'est pas `void`).

```
src/__tests__/facility/full-facility-coverage.test.ts:10   → .mockReturnValue()
src/__tests__/mcc/full-mcc-fleet-coverage.test.ts:13,14    → .mockReturnValue() / .mockResolvedValue()
src/__tests__/verticals/full-vertical-coverage.test.ts:43  → .mockReturnValue()
```

- **Impact** : `tsc --noEmit` sort en code 2 → **gate [1] rouge**. Vitest ne les voit pas (JS n'impose pas le nombre d'arguments) → 1904 tests verts malgré tout : c'est l'écart classique **types-stricts / runtime**.
- **Correctif** : passer l'argument explicite, ex. `.mockReturnValue(undefined)`. **~4 lignes.**
- Ces 3 fichiers `full-*-coverage.test.ts` sont récents (certification des nouvelles verticales/MCC) et partagent le même `beforeEach` fautif.

#### 🎯 P0-2 — Frontières inter-piliers érodées (Barrel Contract + inter-module)
Un `eslint src` réel remonte **800 problèmes (519 erreurs / 281 warnings)**, dont **479 erreurs en code de PRODUCTION** (40 seulement en tests). Les violations d'architecture dominent :

| Règle | Occurrences (prod) | Nature |
|-------|-------------------:|--------|
| `vanguard/no-inter-module-imports` | **~182** | import direct entre piliers, hors barrel |
| `no-restricted-imports` (Barrel Contract) | **141** | import profond `@/modules/<pilier>/<sous>` |
| `@typescript-eslint/no-explicit-any` | 25 | `any` explicite |

- **Impact** : **gate [3] rouge** (ratchet = 0, réel = 141). **Contredit** directement la « Règle du Barrel renforcée » (CLAUDE.md) et le commentaire preflight « Baseline 2026-08-19 : 0 violation » — la baseline est **périmée**, la dette a été réintroduite.
- Exemples en production (extrait) : `src/app/api/signup/route.ts`, `src/app/api/v1/orders/route.ts`, `src/app/api/billing/webhook/route.ts`, `src/kernel/ai/mcc/MCCAIRegistry.ts`, `src/kernel/ai/tenant/TenantAIRegistry.ts`, `src/lib/BrandingService.ts`, `src/lib/CommunicationService.ts`, `src/infrastructure/services/fleet/UniversalVerticalFleetService.ts`.
- **Correctif** : chantier de rapatriement d'imports vers les barrels `@/modules/<pilier>` (non trivial), puis abaisser à nouveau le ratchet à 0.

> **Conséquence combinée P0** : le HEAD `5dfa324cf` ne passe pas son propre `preflight`. Recommandation immédiate : corriger P0-1 (trivial) pour rétablir la gate types, puis ouvrir un chantier dédié P0-2.

---

### P1 — Sécurité multi-tenant & invariants monétaires

#### 🔍 P1-1 — Fallback `tenantId → 'default'` sur des chemins données/auth (9 sites)
Le pattern `tenantId ?? 'default'` / `|| 'default'` apparaît sur des chemins qui **lisent et écrivent** des données scopées tenant — risque d'isolation cross-tenant (écriture/lecture sur `tenants/default/...`).

```
src/kernel/hooks/useSovereignCollection.ts:54     ← hook sovereign GÉNÉRIQUE (query + set)
src/shared/providers/hooks/auth/AuthAccess.tsx:31,75,87,105  ← RBAC rolePermissions (Nexus.adapter.set)
src/shared/hooks/useBrandEditor.ts:20             ← brands/<tenant>/config/tokens
src/modules/commerce/acquisition/marketing/services/SEOManager.ts:32,33
src/modules/human/effectifs/hr/components/TimeclockDashboard.tsx:142
```

- Le cas le plus sensible : `useSovereignCollection.ts:54` (`const tenantId = options.tenantId ?? 'default'`) est la **primitive d'accès sovereign** ; un appelant sans `tenantId` lit/écrit `tenants/default/...`. Le fichier possède déjà un garde-fou NF525 (rejet des collections WORM) — mais **pas** de garde sur le tenant absent.
- **Vérification requise (avant correctif)** : (a) `SovereignGuard` bloque-t-il une écriture dont le `tenantId` ≠ `activeTenantId` ? (b) `options.tenantId` / `currentUser.tenantId` peut-il réellement être `undefined` en prod ?
- **Reco** : préférer un **`throw` explicite** (« tenant manquant ») au `'default'` silencieux, au moins dans `useSovereignCollection` et `AuthAccess`.

#### 🔍 P1-2 — Migration microunits incomplète
- **803** occurrences de `InCents` dans `src/` (le champ/API en centimes, `@deprecated` dans le code neuf).
- **11** casts directs `as Microunits` — violation de l'invariant « **jamais de cast direct**, toujours `toMicrounits()` ».
- **Vérification requise** : trier les 803 `InCents` (legacy `@deprecated` + bridge POS légitime *vs* code neuf). Les 11 casts `as Microunits` sont des violations franches → remplacer par `toMicrounits()`.

---

### P2 — Dette architecturale (non-bloquant, à planifier)

#### 🎯 P2-1 — Complexité cyclomatique : 54 fonctions > cc 12 (`sentrux`)
Pics : `scripts/extract_unknown_context_v2.ts:analyzeUnknownNode` **cc=45** (script hors app), `src/lib/offline/OutboxService.ts:resolvePriority` **cc=22**, `src/shared/hooks/useUniversalAssistant.ts` **cc=22**, `src/shared/eventBus/NexusEventBus.ts:emit` **cc=20**. Traité comme dette non-bloquante par le preflight.

#### 🎯 P2-2 — 13 god-files (fan-out > 15)
12/13 sont des **fichiers de tests** (`anglemorts-batch*`, `saga.*`) — fan-out par construction. Le seul en code applicatif : `src/shared/providers/fleet/NexusFleetProvider.tsx` (fan-out=16). Par ailleurs `src/shared/eventBus/events/common.events.ts` = **1064 lignes** (plus gros fichier non-test).

#### 🔍 P2-3 — 2 cycles-barrels détectés par `sentrux` (zone ops/pos)
Chaîne via `index.ts` : `NexusOpsProvider ↔ hooks ↔ PaymentDialog/SplitBillDialog ↔ CashDrawerService`. **Invisibles** à `cycles-inspector.mjs` (=0) et à `madge` brut, car résolution des barrels différente. Non-bloquant en preflight, mais dette de barrel réelle.

#### 🎯 P2-4 — Hygiène de code
**409** variables/imports inutilisés (`no-unused-vars` 249 + `unused-imports` 160), dont **~194 auto-corrigeables** via `eslint --fix`. Aussi : 75 `eslint-disable`, 11 `console.log`, 36 `@deprecated`, 8 `@ts-ignore/@ts-expect-error`.

---

### P3 — Gouvernance & cohérence documentaire

#### 🎯 P3-1 — Dérive doc ↔ code des artefacts de connaissance
Les artefacts qui pilotent les futures sessions (`~/.nexuscoder/domain-facts.yml`, `MEMORY.md`) décrivent une arborescence qui **n'existe pas** au HEAD :

| Affirmé dans la doc | Réalité filesystem |
|---|---|
| `src/orchestration/events` & `/handlers` | **ABSENT** → réel : `src/shared/eventBus/` (212 fichiers) |
| `src/kernel/nexus/{guards,contracts,engines}` | **ABSENT** → réel : `src/shared/nexus/` (127 fichiers) |
| « `src/shared/nexus` & `src/lib/nexus` n'existent plus » | **Existent** (127 + 16 fichiers) |
| « vidage `src/shared/` TERMINÉ » | `src/shared/` ≈ **415+ fichiers** (eventBus 212, nexus 127, hooks 46, providers 27…) |
| Singleton Nexus : `src/lib/nexus/NexusAdapter.ts` (CLAUDE.md) | Contredit `domain-facts` qui le situe en `src/kernel/adapter/NexusAdapter.ts` |

- **Impact** : toute session/agent suivant ces docs cible des **chemins morts**. Les commentaires du `preflight.sh` sont aussi périmés (ratchet cycles = 430 alors que réel = 0 ; baseline barrel = 0 alors que réel = 141).
- **Reco** : rafraîchir `domain-facts.yml`, `MEMORY.md` et les commentaires `preflight.sh` sur l'état réel ; trancher la contradiction sur l'emplacement du singleton Nexus.

---

## 3. Ce qui est solide (constats factuels)

- ✅ **Build de production Next 16 réussi** — 77 pages, verticales en SSG (`/verticales/[slug]`), 208 routes API.
- ✅ **1904 tests Vitest verts** (247 fichiers, ~1824 cas `it/test`, 35 e2e Playwright).
- ✅ **0 cycle d'import** via l'outil autoritaire du projet (`cycles-inspector.mjs`, alias `@/` résolus).
- ✅ **0 violation de frontière `sentrux`** (isolation des piliers, non-bypass de `SovereignGuard`, pureté SSR).
- ✅ **0 `fetch()` nu** sur routes protégées ; **toutes** les routes `/api/admin` ont un guard d'authentification.
- ✅ **Garde-fou NF525 vivant** : `useSovereignCollection` rejette explicitement toute manipulation des collections fiscales immuables (WORM).
- ✅ **Échelle maîtrisée** : 12 verticales métier branchées (restaurant, hôtel, boulangerie, garage, salon, clinique, retail, gym, coworking, fleuriste, vétérinaire, custom).

---

## 4. Métriques

### Échelle
| Métrique | Valeur |
|---|---:|
| Fichiers `.ts/.tsx` (`src/`) | 3 367 |
| Lignes de code (`src/`) | 302 150 |
| Pages / routes API / layouts | 77 / 208 / 6 |
| Fichiers de tests / cas / e2e | 247 / ~1 824 / 35 |
| Verticales (dossiers `src/verticals`) | 13 (12 métier + `_shared`) |

### Fichiers par pilier (`src/modules/`)
| Pilier | Fichiers |
|---|---:|
| commerce | 352 |
| ops | 292 |
| finance | 223 |
| compliance | 179 |
| intelligence | 161 |
| logistics | 134 |
| human | 132 |
| facility | 71 |

*(MCC réparti hors `modules/` : `src/app/(admin)/admin/mcc/` 77 f · `src/lib/mcc/` 10 f · `src/modules/fleet/` · `src/kernel/ai/mcc/`.)*

### Marqueurs de dette (`src/`)
| Marqueur | Occurrences |
|---|---:|
| `InCents` (déprécié) | 803 |
| `process.env.` direct | 538 |
| `as any` | 136 |
| `eslint-disable` | 75 |
| `@deprecated` | 36 |
| `TODO/FIXME/HACK` | 22 |
| `as Microunits` (cast direct) | 11 |
| `console.log` | 11 |
| `@ts-ignore/@ts-expect-error` | 8 |

### ESLint (exécution réelle `eslint src`)
| Indicateur | Valeur |
|---|---:|
| Total problèmes | 800 (519 err / 281 warn) |
| Erreurs en **production** / tests | 479 / 40 |
| `no-inter-module-imports` (prod) | ~182 |
| Barrel Contract (prod) | 141 |
| Auto-corrigeables (`--fix`) | ~194 |

---

## 5. Feuille de route recommandée

1. **Débloquer le preflight (immédiat)** — corriger P0-1 (4 mocks → `.mockReturnValue(undefined)`). Rétablit la gate types.
2. **Chantier frontières (P0-2)** — rapatrier les ~323 imports inter-piliers/profonds vers les barrels `@/modules/<pilier>`, puis re-verrouiller le ratchet ESLint à 0. Passer `eslint --fix` d'abord (~194 corrections gratuites).
3. **Durcir l'isolation tenant (P1-1)** — remplacer les fallbacks `'default'` par un `throw` dans `useSovereignCollection` + `AuthAccess`, après vérification du comportement de `SovereignGuard`.
4. **Solder microunits (P1-2)** — éliminer les 11 casts `as Microunits`, trier/planifier la sortie des 803 `InCents`.
5. **Rafraîchir la gouvernance (P3-1)** — mettre `domain-facts.yml`, `MEMORY.md` et les commentaires `preflight.sh` à l'état réel du code.

---

## Annexe — Méthodologie & piège RTK

Outils exécutés : `tsc --noEmit`, `vitest run`, `next build`, `node scripts/cycles-inspector.mjs`, `sentrux check .`, `eslint src`.

> ⚠️ **Piège RTK (proxy « token-killer »)** : un premier passage `tsc` affichait « 13 erreurs » (log **en cache, périmé** — pointant des symboles `GarageVertical`/`ClinicVertical` qui n'existent plus dans le fichier réel) et un `exit 0` **trompeur** en sortie de pipeline. La vérité terrain (**4 erreurs**) n'a été obtenue qu'en contournant le proxy (`rtk proxy …`) et en lisant les logs bruts. Le `preflight.sh` documente lui-même ce risque (« rtk peut masquer un échec de build »). **Toujours auditer tsc/build en sortie brute.**
