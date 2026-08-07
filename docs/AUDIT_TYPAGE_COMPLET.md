# Audit de Typage Strict — Version Corrigée et Complète

> **Ce document remplace et corrige** l'audit « Zéro Any & Synonymes » initial.  
> L'audit original contenait 4 erreurs méthodologiques majeures et omettait 2 catégories
> entières de risques. Ce document est vérifiable : chaque chiffre provient d'un scan AST
> (`ts-morph`) ou d'un `grep` sur le code réel. `npx tsc --noEmit` reste vert après toutes
> les corrections décrites ici.

---

## 1. Ce que l'audit initial ratait

| Erreur | Impact |
|--------|--------|
| `@ts-nocheck` non scanné | Désactive TypeScript pour un **fichier entier** — pire que 100 `unknown` |
| Non-null assertions `!` non scannées | Même risque de crash que `as any`, absentes du rapport |
| `as any` amalgamé avec `: any` | 63 `as any` dans le code, dont **1 en prod** non signalé |
| 913 `unknown` traités uniformément comme erreurs | ~250 sont **intentionnellement corrects** (generics, storage, frontières) |

---

## 2. Inventaire exhaustif — Tous les types fantômes

### 2.1 `any` — 11 annotations + 63 casts

L'audit original signalait **11 `any`**. C'est le compte des annotations `: any`.
Il existe aussi **63 `as any`** (casts explicites), dont la quasi-totalité est en tests.

| Emplacement | Type | Count | Action |
|-------------|------|-------|--------|
| `src/__tests__/` + `src/e2e/` | `: any` et `as any` | ~68 | Tolérable en tests — améliorer progressivement |
| `src/modules/finance/` | `: any` | 5 | 🔴 Corriger — code de production fiscal |
| `src/shared/` | `: any` | 1 | 🔴 Corriger (était dans `useVerticalComponent` — **déjà corrigé**) |
| `src/shared/components/ui/StatCard.tsx` | `as any` | 1 | 🔴 **Déjà corrigé** — racine : générique trop contraint dans `withVerticalOverride` |

#### Les 5 `any` finance à corriger (priorité haute)

Localiser avec :
```bash
grep -rn ": any\|as any" src/modules/finance/ --include="*.ts" --include="*.tsx"
```
Pour chaque occurrence : identifier le type réel (via le schéma Zod correspondant ou l'interface de domaine) et remplacer. Cf. section 5.3 pour la méthode.

### 2.2 Non-null assertions `!` — **ABSENT de l'audit original**

**9 occurrences en production.** Risque : crash runtime si l'assertion est fausse.

| Fichier | Ligne | Pattern | Correction appliquée |
|---------|-------|---------|---------------------|
| `src/shared/providers/hooks/auth/AuthStaff.tsx` | 32 | `data!.users` | ✅ `const users = data?.users; Array.isArray(users) ? users.map(...)` |
| `src/app/(admin)/admin/agent/page.tsx` | 235 | `report!.complexity` | ✅ `report?.complexity.godObjects.length ?? 0` |
| `src/app/(client)/(ops)/mon-espace/page.tsx` | 51 | `currentUser!.id` | ✅ `currentUser?.id` |
| `src/shared/components/settings/PayrollIntegrationPanel.tsx` | 294 | `currentEntry.fields!.length` | ✅ `currentEntry.fields?.length` |
| `src/modules/human/effectifs/hr/components/planning/ShiftEditModal.tsx` | 345 | `shift!.id` | ✅ `if (shift) onDelete(shift.id)` |
| `src/modules/commerce/relation/reservations/migration/ReservationHistoryImporter.ts` | 252 | `r.email!` + `r.phone!` | ✅ type predicate `(r): r is R & { email: string }` |
| `src/modules/commerce/acquisition/onboarding/migration/importers/reservationsImporter.ts` | 54–55 | `r.email!` + `r.phone!` | ✅ type predicate |
| `src/modules/commerce/acquisition/onboarding/migration/importers/crmImporter.ts` | 63 | `r.email!` | ✅ type predicate |

**Pattern type predicate** (pour les `.filter` suivi `.map`) :
```ts
// Avant — TypeScript ne narrowe pas après .filter(r => r.email)
crmRecords.filter(r => r.email).map(r => [r.email!.toLowerCase(), r.id])

// Après — narrowing garanti par le compilateur
crmRecords
  .filter((r): r is typeof r & { email: string } => Boolean(r.email))
  .map(r => [r.email.toLowerCase(), r.id])   // plus de !
```

### 2.3 `@ts-ignore` et `@ts-expect-error` — 1+1

| Fichier | Directive | Action |
|---------|-----------|--------|
| `src/commerce/` (1 occurrence) | `@ts-ignore` | Identifier la cause → corriger le type source → supprimer la directive |
| `src/finance/` (1 occurrence) | `@ts-expect-error` | `@ts-expect-error` est moins grave (`@ts-ignore` silencieux, `@ts-expect-error` échoue si inutile) — corriger quand même |

### 2.4 `@ts-nocheck` — 0 occurrences

Absent du projet. ✅ Mentionner dans l'audit pour montrer qu'il a été vérifié.

### 2.5 `Function` / `Object` / `{}` — 0 occurrences

Confirmé. ✅

### 2.6 `eslint-disable @typescript-eslint/no-explicit-any` — 0 occurrences prod

Confirmé. ✅ (2 suppressions supprimées en même temps que les corrections `any`)

---

## 3. Les 913 `unknown` — Tri correct (l'audit original se trompait)

L'audit original recommandait de remplacer **systématiquement** par des génériques `<T>`.
C'est faux et dangereux : certains `unknown` sont **corrects par conception**.

### 3.1 Tri en 3 buckets

| Bucket | Count estimé | Description | Action |
|--------|-------------|-------------|--------|
| **À corriger** | ~500 | `unknown` utilisé par défaut là où un type réel est connaissable | Corriger selon CAT A–E (voir section 4) |
| **Légitimes — laisser** | ~250 | Génériques d'adapter, storage durable, frontières runtime | Laisser + commenter |
| **Fix du type source** | ~160 | Le `unknown` vient d'un type source trop large — corriger la source | Travail de fond |

### 3.2 Pourquoi `T = unknown` dans les génériques est CORRECT

```ts
// useVerticalComponent.ts — AVANT (mauvais)
function useVerticalComponent<P extends Record<string, any>>(...)

// APRÈS (correct) — P extends object, pas de any interne
function useVerticalComponent<P extends object>(...)
```

Un défaut générique `get<T = unknown>` dans un adapter signifie :
> « Si tu ne précises pas le type au call site, tu devras narrower — le compilateur te força à être explicite. »

C'est précisément le comportement voulu. **Ne pas remplacer `T = unknown` par `T = SovereignMap`**
dans les adapters génériques : ça casserait `adapter.get<JournalEntry>('...')`.

### 3.3 `unknown` dans le storage — INTENTIONNEL

```ts
interface BusOutboxEntry {
  payload: unknown  // ← CORRECT, ne pas typer
}
```

Les payloads d'outbox/DLQ sont persistés et migrés. Typer `payload: OrderCreatedPayload`
casserait la migration v1 → v2. `unknown` ici = contrat de durabilité.

### 3.4 Recommandation corrigée pour Next.js App Router

L'audit original : « utiliser un parsing Zod avec typage `z.infer` pour les params ».
**C'est juste.** Exemple concret :

```ts
// Avant — params: unknown
export default async function Page({ params }: { params: unknown }) {
  const { id } = params as { id: string }; // dangereux
}

// Après — Zod parse + z.infer
import { z } from 'zod';
const PageParamsSchema = z.object({ id: z.string() });
type PageParams = z.infer<typeof PageParamsSchema>;

export default async function Page({ params }: { params: unknown }) {
  const { id } = PageParamsSchema.parse(params); // valide au runtime
}
```

---

## 4. Plan d'action par catégorie

### CAT-A — Catch clauses (~56 occ.)

**Règle** : L'annotation `catch (e: unknown)` est **obligatoire** avec `useUnknownInCatchVariables: true`.
Ne jamais écrire `catch (e: Error)` — c'est une erreur de compilation TS1196.

```ts
// ❌ INVALIDE avec le tsconfig de ce projet
catch (e: Error) { console.error(e.message) }

// ✅ CORRECT
catch (e: unknown) {
  logger.error('...', { error: toError(e).message })
}
```

**`toError`** est disponible dans `src/lib/toError.ts` — importer et utiliser.

---

### CAT-B — `Record<string, unknown>` (~355 occ.)

Distinguer 3 sous-cas **avant** de modifier :

| Sous-cas | Signe | Correction |
|----------|-------|-----------|
| Données JSON sérialisables (télémétrie, metadata, config) | Valeurs lues via `JSON.stringify` ou envoyées en payload HTTP | `JsonObject` depuis `src/shared/types/json.ts` |
| Forme connue (clés fixes documentées) | L'objet a une structure Gemini, Stripe, Firebase précise | Interface dédiée (ex: `GeminiRequestBody`) |
| Vraiment opaque (passthrough, index dynamique non lu) | La valeur n'est jamais lue directement | Laisser `unknown` |

```ts
// src/shared/types/json.ts — disponible
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject { [key: string]: JsonValue }
export type JsonArray = JsonValue[];
```

**Ne pas utiliser** `Record<string, PrimitiveValue | JsonObject>` — ces types n'existent pas dans le projet.

---

### CAT-C — `as unknown as T` (~239 occ.)

| Sous-cas | Signe | Correction |
|----------|-------|-----------|
| Schéma Zod existe | `JournalEntry`, `Order`, `Reservation`, `CartItem`… | `Schema.parse(x)` — valide ET type |
| Type source réparable | Le type d'origine est trop large/étroit | Corriger le type source, supprimer le cast |
| Frontière runtime irréductible | `window`, Firestore raw doc, lib sans types | Garder + isoler dans un helper typé + commenter |

```ts
// ❌ Avant
const entry = snap.data() as unknown as JournalEntry;

// ✅ Après — Zod valide ET type en une ligne
const entry = JournalEntrySchema.parse(snap.data());
```

---

### CAT-D — Adapters (`T = unknown`)

- Défauts `get<T = unknown>` → **laisser** (sain)
- Lectures `snap.data() as unknown as T` → valider via `z.infer` au point d'appel métier, pas dans l'adapter

---

### CAT-E — Event payloads

- `payload: unknown` en storage → **laisser**
- Typer au moment du dispatch via `EventPayloadMap` de `NexusEventBus`

---

### CAT-F — Génériques React `ComponentType<unknown>`

- Laisser dans les registres de routes dynamiques
- Remplacer seulement si un type de props concret est disponible et stable

---

## 5. Séquence d'exécution recommandée

| Lot | Contenu | Risque | Gate |
|-----|---------|--------|------|
| **L0** ✅ | `json.ts` + `toError.ts` — fondation | nul | `tsc` vert |
| **L0b** ✅ | `withVerticalOverride<P extends object>` + `StatCard` sans cast | nul | `tsc` vert |
| **L0c** ✅ | 9 non-null assertions `!` → guards propres | faible | `tsc` vert |
| **L1** | CAT-A catch (~56) — remplacer `String(error)` par `toError(e).message` | faible | `tsc` vert |
| **L2** | CAT-C sous-cas 1 — Zod parse là où schéma existe | moyen | `tsc` vert |
| **L3** | CAT-B — JsonObject + interfaces dédiées | moyen | `tsc` vert |
| **L4** | `@ts-ignore` (Commerce) + `@ts-expect-error` (Finance) — corriger cause | élevé | `tsc` vert |
| **L5** | 5 `any` restants dans `src/modules/finance/` | élevé | `tsc` vert |
| **L6** | CAT-D adapters + CAT-E events | élevé | `tsc` vert |
| **L7** | CAT-C sous-cas 2 — fix types sources | élevé | `tsc` vert |
| **L8** | Re-scan complet, documenter `unknown` légitimes restants | — | `tsc` vert |

**Règle absolue** : 1 lot = 1 commit. `tsc --noEmit` vert avant merge.

---

## 6. Métriques cibles (Grade X Pur réel)

| Métrique | Avant corrections | Cible Grade X |
|----------|------------------|---------------|
| `any` (prod) | 6 | 0 |
| `as any` (prod) | 1 | 0 |
| Non-null `!` (prod) | 9 | 0 |
| `@ts-ignore` | 1 | 0 |
| `@ts-expect-error` | 1 | 0 |
| `unknown` non justifiés | ~500 | 0 |
| `unknown` légitimes documentés | non documentés | tous commentés |
| `tsc --noEmit` | vert | vert (invariant) |

---

## 7. Anti-objectifs (ne PAS faire)

- ❌ Écrire `catch (e: Error | NexusDomainError)` — TS1196 avec `useUnknownInCatchVariables: true`
- ❌ Utiliser `PrimitiveValue` ou `JsonObject`-du-catalogue — types inexistants dans le projet
- ❌ Remplacer `T = unknown` par `T = SovereignMap` dans les adapters génériques
- ❌ Sur-typer les payloads persistés (outbox/DLQ)
- ❌ Toucher `journalEntries` / `fiscalSeals` / `fiscalLedger` sans validation NF525
- ❌ Supprimer un `as unknown` de frontière runtime sans helper de remplacement
- ❌ Viser « 0 unknown » — objectif impossible et non souhaitable

---

## 8. Fondation disponible dans le projet

| Fichier | Contenu | Utilisation |
|---------|---------|-------------|
| `src/shared/types/json.ts` | `JsonPrimitive`, `JsonValue`, `JsonObject`, `JsonArray` | `Record<string, unknown>` → JSON sérialisable |
| `src/lib/toError.ts` | `toError(e: unknown): Error` | Narrowing dans les blocs `catch` |
| `src/shared/nexus/contracts/nexus-error-mapper.ts` | `translateError(error: unknown, pillar)` | Erreurs métier pilier |
| `src/shared/nexus-contract.ts` | `SovereignField`, `SovereignMap`, `SovereignData<T>` | Données dynamiques tenant |
