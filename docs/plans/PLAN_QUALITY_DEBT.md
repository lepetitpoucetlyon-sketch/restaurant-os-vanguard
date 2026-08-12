# Plan Qualité — 6 dettes post-`/simplify`

> Issues skippées lors du pass `/simplify` du **2026-08-08** (commit `3dfc989f5`) — trop larges pour un correctif isolé.

| Métrique | Valeur |
|---|---|
| Commit source | `3dfc989f5` |
| Fichiers touchés | ~18 |
| Effort total estimé | ~2 j |

---

## Sommaire

| # | Priorité | Item | Effort |
|---|---|---|---|
| 01 | 🔴 CRITIQUE | `buildTenantPath()` — centraliser les 7 duplications du sentinel | ½ j |
| 02 | 🔴 CRITIQUE | Éliminer le stub `searchIngredientsAction` dans `runOcrScan` | ¾ j |
| 03 | 🟡 HAUTE | Injecter `ICollectiveAgreement` dans `payrollHelpers` | ½ j |
| 04 | 🟡 HAUTE | Compléter le moteur de conventions (salon, clinic, retail) | ¾ j |
| 05 | 🟡 HAUTE | Créer `useNexusStatus()` — débloquer `NexusSphereIndicator` | ½ j |
| 06 | 🟢 MOYENNE | `Map<name, Recipe>` dans `KDSTicket` — O(1) au lieu de O(n) | 2 h |

**Ordre d'exécution :** 01 en premier (débloque 6 fichiers adjacents), puis 02/03/04/05 en parallèle dans des sessions séparées, 06 en dernier.

---

## 🔴 P0 — CRITIQUE

### 01 — Extraire `buildTenantPath()` · ½ j

**Problème**

Le test `tenantId !== 'restaurant-os' && tenantId !== 'main'` existe à **7 endroits** différents du codebase. Si la liste des tenants platform s'enrichit d'un troisième (ex. `'_demo'`), il faut éditer chaque fichier manuellement — et en rater un passe silencieusement. Les deux duplications dans `nonConformityTypes.ts` et `CleaningPlan.tsx` (ajoutées dans le dernier commit) illustrent la contagion.

**Solution**

1. Créer `src/lib/nexus/utils/tenantPath.ts` avec deux exports :
   - `isSuzerainTenant(id: string): boolean` — retourne `true` pour `'restaurant-os'` et `'main'`
   - `buildTenantPath(tenantId: string, ...segments: string[]): string` — retourne le path scopé ou la collection globale pour le Suzerain
2. Ré-exporter depuis le barrel `@/lib/nexus`.
3. Remplacer les 7 occurrences par `buildTenantPath()`.
4. Ajouter un test unitaire.

**Fichiers**

| Action | Fichier |
|---|---|
| `NEW` | `src/lib/nexus/utils/tenantPath.ts` |
| `MOD` | `src/lib/nexus/index.ts` |
| `MOD` | `src/lib/nexus/NexusInstance.ts` |
| `MOD` | `src/lib/nexus/NexusAdapter.ts` |
| `MOD` | `src/lib/sync/masterBridgeInit.ts` |
| `MOD` | `src/modules/compliance/qualite/haccp/components/nonConformityTypes.ts` |
| `MOD` | `src/modules/compliance/qualite/haccp/components/CleaningPlan.tsx` |
| `MOD` | `src/modules/compliance/qualite/haccp/services/PlanMaitriseSanitaire.ts` |

**Diff type**

```typescript
// tenantPath.ts — nouvelle API
const SUZERAIN_IDS = new Set(['restaurant-os', 'main']);

export const isSuzerainTenant = (id: string) => SUZERAIN_IDS.has(id);

export function buildTenantPath(tenantId: string, ...segments: string[]): string {
  const path = segments.join('/');
  if (!tenantId || isSuzerainTenant(tenantId)) return path;
  return `tenants/${tenantId}/${path}`;
}
```

```diff
// nonConformityTypes.ts — avant (×2)
- if (tenantId && tenantId !== 'restaurant-os' && tenantId !== 'main') {
-   return `tenants/${tenantId}/nonConformities/${id}`;
- }
- return `nonConformities/${id}`;

// nonConformityTypes.ts — après
+ return buildTenantPath(tenantId, 'nonConformities', id);
```

---

### 02 — Éliminer le stub `searchIngredientsAction` dans `runOcrScan` · ¾ j

**Problème**

La règle _"jamais de stubs déguisés"_ (CLAUDE.md) est explicitement violée : `searchIngredientsAction` retourne toujours `[]`, donc `runOcrScan` produit systématiquement des données synthétiques hardcodées (Saumon / Aneth / Sel) présentées comme des résultats réels. L'utilisateur voit l'UI "Scan IA" s'animer et recevoir des articles fictifs — sans avertissement.

**Solution — deux choix mutuellement exclusifs**

**Option A (recommandée) — implémenter la vraie logique :**

1. Câbler `searchIngredientsAction` vers `Nexus.adapter.query()` avec filtre nom ≈ mot-clé (comparaison insensible à la casse).
2. Supprimer les fallbacks hardcodés Saumon/Aneth/Sel.
3. Afficher un message explicite si 0 résultat.

```diff
- // eslint-disable-next-line @typescript-eslint/no-unused-vars
- const searchIngredientsAction = async (_tenantId: string, _query: string): Promise<Ingredient[]> => ([]);

+ async function searchIngredientsAction(tenantId: string, query: string): Promise<Ingredient[]> {
+   const all = await Nexus.adapter.query<Ingredient>(`tenants/${tenantId}/ingredients`);
+   const q = query.toLowerCase();
+   return (all ?? []).filter(i => String(i.name).toLowerCase().includes(q));
+ }
```

**Option B — gater la feature :**

1. Ajouter `ocrScan: boolean` aux `TenantCapabilities`.
2. Le bouton "Scan IA" ne s'affiche que si `capabilities.ocrScan`.
3. `runOcrScan` retourne `[]` explicitement avec un commentaire `// TODO: connecter API OCR` (comportement déclaré, pas caché).

**Fichiers**

| Action | Fichier |
|---|---|
| `MOD` | `src/modules/logistics/approvisionnement/reception/components/receptionService.ts` |
| `MOD` | `src/modules/logistics/approvisionnement/reception/components/InventoryReceptionDashboard.tsx` |
| `MOD` _(option B)_ | `src/domain/schemas/tenant.ts` — `TenantCapabilities` |

---

## 🟡 P1 — HAUTE

### 03 — Injecter `ICollectiveAgreement` dans `payrollHelpers` · ½ j

**Problème**

Les constantes `NORMAL_WEEKLY_HOURS = 35`, `OT_25_BAND_HOURS = 8`, `NIGHT_START_HOUR = 21`, `MEAL_BENEFIT_EUR = 4.15` dupliquent exactement les champs de `ICollectiveAgreement`. Pire : `NIGHT_START_HOUR = 21` est la valeur HCR — pour les tenants `garage`, la convention AUTO prévoit 22h. Tous les garages calculent les majorations de nuit avec **une heure de début incorrecte**.

**Solution**

1. Supprimer les 4 constantes de `payrollHelpers.ts`. Garder uniquement `MU_TO_EUR` et `FR_PUBLIC_HOLIDAYS` (non-variant-dépendants).
2. Ajouter `convention: ICollectiveAgreement` en dernier paramètre de `analyseSession()`, `weeklyOvertimeBreakdown()` et `computeGross()`. Chaque fonction lit `convention.nightStartHour` etc. au lieu de la constante.
3. Dans `PrepaieBuilder`, obtenir la convention via `resolveCollectiveAgreement(tenant.variant)` et la passer à chaque appel.

```diff
- export const NIGHT_START_HOUR = 21;

- export function analyseSession(clockIn: number, clockOut: number, breaks: ...) {
-   // utilise NIGHT_START_HOUR (hardcodé HCR)

+ export function analyseSession(
+   clockIn: number, clockOut: number, breaks: ...,
+   convention: ICollectiveAgreement,
+ ) {
+   // utilise convention.nightStartHour (HCR=21, AUTO=22)
```

**Fichiers**

| Action | Fichier |
|---|---|
| `MOD` | `src/modules/human/remuneration/payroll/payrollHelpers.ts` |
| `MOD` | `src/modules/human/remuneration/payroll/PrepaieBuilder.ts` |

> ℹ️ Peut être exécuté avant l'item 04 — le fallback HCR par défaut reste valide pour restaurant/hotel/bakery.

---

### 04 — Compléter le moteur de conventions (salon, clinic, retail) · ¾ j

**Problème**

Le switch de `resolveCollectiveAgreement()` renvoie silencieusement `HCR_CONVENTION` pour `salon`, `clinic` et `retail`. Un salon (IDCC 2596 – coiffure) applique un seuil de nuit différent et n'a pas d'avantage en nature repas. Une clinique (accord de branche santé privée) a des majorations de dimanche à 50% mais pas d'HCR. **Le calcul pré-paie est silencieusement faux pour ces verticales.**

**Conventions à créer**

| Fichier | IDCC / base légale | nightStart | dimanche+ | repas € |
|---|---|---|---|---|
| `hcr.convention.ts` _(existant)_ | 1979 | 21h | +50% | 4.15 |
| `auto.convention.ts` _(existant)_ | 1090 | 22h | +100% | 0 |
| `salon.convention.ts` **NEW** | 2596 (coiffure) | 21h | +100% | 0 |
| `clinic.convention.ts` **NEW** | 2264 (hospitalisation privée) | 21h | +50% | 0 |
| `retail.convention.ts` **NEW** | 1517 (commerce de détail non alimentaire) | 21h | +100% | 0 |
| `bakery` → HCR ✓ | 1979 (boulangerie ≈ HCR) | 21h | +50% | 4.15 |

> ⚠️ Les valeurs sont des approximations légales — ajouter un commentaire `// À valider avec expert-comptable avant mise en prod` dans chaque fichier.

**Solution**

1. Créer `salon.convention.ts`, `clinic.convention.ts`, `retail.convention.ts` dans `src/modules/human/conventions/`.
2. Ajouter un case explicite pour chaque variant dans `index.ts`.
3. Remplacer `default: return HCR_CONVENTION` par un throw :

```diff
+ case 'salon':   return SALON_CONVENTION;
+ case 'clinic':  return CLINIC_CONVENTION;
+ case 'retail':  return RETAIL_CONVENTION;
  case 'restaurant':
  case 'hotel':
  case 'bakery':
- default:
-   return HCR_CONVENTION;
+   return HCR_CONVENTION;
+ default:
+   throw new Error(`No collective agreement defined for variant: ${variant ?? 'undefined'}`);
```

**Fichiers**

| Action | Fichier |
|---|---|
| `NEW` | `src/modules/human/conventions/salon.convention.ts` |
| `NEW` | `src/modules/human/conventions/clinic.convention.ts` |
| `NEW` | `src/modules/human/conventions/retail.convention.ts` |
| `MOD` | `src/modules/human/conventions/index.ts` |

---

### 05 — Créer `useNexusStatus()` — débloquer `NexusSphereIndicator` · ½ j

**Problème**

`NexusHeroHeader` affiche toujours `NexusSphereIndicator` avec `isActive=false, isProcessing=false` — la sphère est perpétuellement éteinte. Avant le split, le composant parent avait accès au contexte de settings. L'extraction a rompu ce câblage sans le remplacer. Conséquence : l'utilisateur voit une sphère morte même quand le Nexus est actif et traite des commandes vocales.

**Solution**

1. Créer l'atom Jotai dans `src/shared/atoms/nexusStatus.atom.ts` :

```typescript
import { atom } from 'jotai';
export const nexusStatusAtom = atom({ isActive: false, isProcessing: false });
```

2. Dans `NexusSyncService`, mettre à jour l'atom lors des transitions :
   - connect → `{ isActive: true, isProcessing: false }`
   - traitement en cours → `{ isActive: true, isProcessing: true }`
   - disconnect → `{ isActive: false, isProcessing: false }`

3. Créer le hook `src/shared/hooks/useNexusStatus.ts` :

```typescript
import { useAtomValue } from 'jotai';
import { nexusStatusAtom } from '@/shared/atoms/nexusStatus.atom';

export function useNexusStatus() {
  return useAtomValue(nexusStatusAtom);
}
```

4. Dans `NexusHeroHeader`, câbler :

```diff
+ const { isActive, isProcessing } = useNexusStatus();
- <NexusSphereIndicator isActive={false} isProcessing={false} />
+ <NexusSphereIndicator isActive={isActive} isProcessing={isProcessing} />
```

**Fichiers**

| Action | Fichier |
|---|---|
| `NEW` | `src/shared/atoms/nexusStatus.atom.ts` |
| `NEW` | `src/shared/hooks/useNexusStatus.ts` |
| `MOD` | `src/lib/nexus/NexusSyncService.ts` _(ou équivalent)_ |
| `MOD` | `src/shared/components/settings/nexus-settings/NexusHeroHeader.tsx` |

---

## 🟢 P2 — MOYENNE

### 06 — `Map<name, Recipe>` dans `KDSTicket` — O(1) au lieu de O(n) · 2 h

**Problème**

`KDSItemCard` appelle `recipes.find(p => p.name.includes(item.name) || ...)` à chaque render. Dans un service actif (20 tickets × 5 articles = 100 instances), chaque re-render de `KDSBoard` déclenche 100 scans linéaires sur une liste de ~200 recettes — soit **20 000 comparaisons de chaînes par cycle**. Le KDS se re-rend à chaque update d'une commande.

**Solution**

1. Dans `KDSTicket.tsx`, construire la Map une seule fois via `useMemo` :

```typescript
const recipeByName = useMemo(
  () => new Map(recipes.map(r => [r.name.toLowerCase(), r])),
  [recipes]
);
```

2. Passer `recipeByName` à la place de `recipes` dans chaque `<KDSItemCard />`.

3. Dans `KDSItemCard`, remplacer le `find()` :

```diff
- recipes: Recipe[]
- const product = recipes.find(p => p.name.includes(item.name) || item.name.includes(p.name));

+ recipeByName: Map<string, Recipe>
+ const product = recipeByName.get(item.name.toLowerCase());
```

> La recherche bidirectionnelle (`p.name.includes(item.name) || ...`) était de toute façon fragile — une correspondance exacte sur le nom normalisé est plus robuste.

**Fichiers**

| Action | Fichier |
|---|---|
| `MOD` | `src/modules/ops/production/kds/components/KDSTicket.tsx` |
| `MOD` | `src/modules/ops/production/kds/components/kds-ticket/KDSItemCard.tsx` |

---

## Ordre d'exécution

```
01 buildTenantPath          ← en premier, débloque 6 fichiers adjacents
├── 02 runOcrScan stub      ┐
├── 03 payrollHelpers       ├── en parallèle (sessions séparées)
├── 04 conventions          │
└── 05 useNexusStatus       ┘
    06 KDSTicket Map        ← en dernier, aucune dépendance
```
