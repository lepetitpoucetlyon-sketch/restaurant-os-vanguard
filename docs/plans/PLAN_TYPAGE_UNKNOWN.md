# Plan d'Éradication des `unknown` — Version Corrigée (Grade X réel)

> Réponse au catalogue « 913 unknown ». Ce document **corrige** les propositions
> auto-générées et définit la vraie stratégie de typage strict, vérifiée contre le
> code réel (`tsconfig.json` `strict:true` + `useUnknownInCatchVariables:true`).
>
> **Statut** : plan validé, exécution non démarrée.
> **Règle d'or** : `npx tsc --noEmit` vert avant/après chaque lot. Zéro régression.

---

## 0. Pourquoi le catalogue initial est dangereux

Le catalogue applique 4 templates mécaniques. Vérification faite sur le code :

| # | Template du catalogue | Verdict | Preuve |
|---|---|---|---|
| 1 | `catch (e: unknown)` → `catch (e: Error \| NexusDomainError)` | ❌ **Ne compile pas** | `tsconfig` a `useUnknownInCatchVariables:true` → annotation catch limitée à `any`/`unknown` (TS1196). `nexus-error-mapper.ts:7` utilise déjà `error: unknown`. |
| 2 | `Record<string,unknown>` → `Record<string, PrimitiveValue \| JsonObject>` | ❌ **Types inexistants** | `grep PrimitiveValue\|JsonObject src/` = 0. Le type maison est `SovereignField` (contient lui-même `unknown[]` / `{[k]:unknown}`). |
| 3 | `as unknown as T` → « cast direct » | ❌ **Casse la compilation** | Le double-cast existe car TS refuse le cast direct (TS2352). Beaucoup sont des frontières runtime légitimes. |
| 4 | `T = unknown` (générique) → « T explicite » | ⚠️ **No-op** | Un défaut générique `<T = unknown>` est sain ; le remplacement est cosmétique. |

**Conséquence** : appliquer le catalogue tel quel = build cassé + churn massif sans gain.

---

## 1. Fondation partagée (à créer AVANT toute correction)

### 1.1 `src/shared/types/json.ts` — le vrai type sûr des données JSON
```ts
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject { [key: string]: JsonValue }
export type JsonArray = JsonValue[];
```
Remplace `Record<string, unknown>` **uniquement** quand la donnée est réellement
sérialisable JSON (payloads, métadonnées, configs). Ni plus permissif que la
réalité, ni faux comme `PrimitiveValue`.

### 1.2 `src/lib/toError.ts` — narrowing catch réutilisable
```ts
export function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  if (typeof e === 'string') return new Error(e);
  try { return new Error(JSON.stringify(e)); } catch { return new Error(String(e)); }
}
```
S'aligne sur `translateError()` existant. Aucune annotation `catch` n'est modifiée.

---

## 2. Correction par catégorie (règle réelle)

### CAT-A — Catch clauses (~56 occ.)
- **Garder** `catch (e: unknown)`.
- Remplacer les usages bruts (`String(error)`, accès `.message` non gardé) par
  `toError(e).message` **à l'intérieur** du bloc.
- Exemple `BrandingService.ts:67` : `catch (error: unknown)` reste ; ligne 68
  `String(error)` → `toError(error).message`.
- **Ne jamais** toucher la signature. Volume réel de valeur : moyen (lisibilité + logs propres).

### CAT-B — `Record<string, unknown>` (~355 occ.) — tri en 3 sous-cas
1. **Forme réellement dynamique JSON** (télémétrie, metadata, config brute)
   → `JsonObject` / `Record<string, JsonValue>`.
   Ex : `NexusTelemetryService.emitAuditPulse`, `AuditLogger.AuditLog.metadata`.
2. **Forme connue** (l'objet a des clés fixes documentées ailleurs)
   → **interface dédiée** (le vrai Grade X). Ex : `GeminiProvider.buildRequestBody`
   a une structure Gemini connue → `interface GeminiRequestBody`.
3. **Vraiment opaque / passthrough** (index signature d'extension, valeur non lue)
   → **laisser `unknown`**, c'est correct. Ex : `SovereignField`'s `[key]: unknown`.
- ⚠️ Ne pas convertir aveuglément : chaque site est classé 1/2/3 avant édition.

### CAT-C — `as unknown as T` (~239 occ.) — tri en 3 sous-cas
1. **Un schéma Zod existe** (JournalEntry, Order, Reservation, CartItem…)
   → `Schema.parse(x)` ou `Schema.safeParse`. Élimine le cast ET valide au runtime.
   Ex : `FinancialNexusBridge:275` `… as unknown as JournalEntry` → `JournalEntrySchema.parse(...)`.
2. **Incompatibilité de type source réparable** (le type d'origine est trop large/étroit)
   → corriger le type source, supprimer le cast. C'est le vrai travail de fond.
   Ex : `useAccounting:80` `(node.data||[]) as unknown as JournalEntry[]` → typer le node.
3. **Frontière runtime irréductible** (`window`, Firestore raw doc, lib sans types,
   `serverTimestamp` sentinel) → **garder**, mais isoler dans un helper typé + commenter.
   Ex : `AmbientAudio:26` `window as unknown as {AudioContext?…}` → helper `getAudioContext()`.

### CAT-D — Adapters BD `T = unknown` (~26 occ.)
- Les défauts génériques `get<T=unknown>` : **laisser** (défaut sain).
- Les **lectures** (`snap.data() as unknown as T`) : valider via `z.infer` au point
  d'appel métier, pas dans l'adapter générique. Cible : `FirestoreAdapter`, `MockAdapter`, `SimulacraAdapter`.
- `serverTimestamp(): unknown` : c'est un sentinel Firestore opaque → garder `unknown`
  ou introduire un type `ServerTimestamp` branded partagé (option, faible priorité).

### CAT-E — Event payloads (~18 occ.)
- `BusOutboxEntry.payload`, `DeadLetterEntry.payload`, `IPaymentProvider.onWebhook(payload)`…
- Cible : lier au `EventPayloadMap` de `NexusEventBus` (typage par event-id).
- **Prudence** : les payloads outbox/DLQ sont *persistés* et migrés (`PayloadMigrator`) →
  garder `unknown` en storage, typer au moment du dispatch. Ne pas sur-typer la persistance.

### CAT-F — Génériques `T = unknown` (interfaces, props React) 
- `React.ComponentType<unknown>`, `INexusTransaction<T=unknown>`, etc.
- **Laisser** dans 90% des cas. `ComponentType<unknown>` pour un registre de routes
  dynamiques est correct. Ne convertir que si un type de props concret est disponible.

---

## 3. Séquence d'exécution recommandée

| Lot | Contenu | Risque | tsc |
|-----|---------|--------|-----|
| **L0** | Fondation : `json.ts` + `toError.ts` | nul | vert |
| **L1** | CAT-A catch (~56) — mécanique, sûr | faible | vert |
| **L2** | CAT-C sous-cas 1 (Zod parse) là où schéma existe | moyen | vert |
| **L3** | CAT-B sous-cas 1 (JsonObject) + sous-cas 2 (interfaces) | moyen | vert |
| **L4** | CAT-D adapters + CAT-E events (frontières) | élevé | vert |
| **L5** | CAT-C sous-cas 2 (fix type source) — le fond | élevé | vert |
| **L6** | Passe finale : re-scan `unknown` restants, documenter les `unknown` **légitimes** | — | vert |

Chaque lot = 1 commit local (jamais de push — cf. règle GitLab).

---

## 4. Estimation réaliste sur les 913

- ~**500** corrections à valeur réelle (catch narrow, Zod parse, interfaces, JsonObject).
- ~**250** à **laisser** (`unknown` déjà correct : génériques, index dynamiques, sentinels, storage).
- ~**160** nécessitant un **fix du type source** (travail de fond, le vrai Grade X).

Objectif : non pas « 0 unknown » (impossible et non souhaitable), mais **0 unknown
non justifié** + chaque `unknown` restant commenté sur sa raison d'être.

---

## 5. Anti-objectifs (ne PAS faire)
- ❌ Modifier une annotation `catch`.
- ❌ Introduire `PrimitiveValue`/`JsonObject`-du-catalogue (types fantômes).
- ❌ Supprimer un `as unknown` de frontière runtime sans helper de remplacement.
- ❌ Sur-typer les payloads persistés (outbox/DLQ) qui doivent rester agnostiques.
- ❌ Toucher `journalEntries`/`fiscalSeals`/`fiscalLedger` sans validation NF525 (immuabilité).
