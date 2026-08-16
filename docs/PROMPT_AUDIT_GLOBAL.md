# PROMPT — Audit Global Restaurant OS Core

> Copier-coller ce prompt en début de session dédiée à l'audit.
> Objectif : audit exhaustif multi-angles, lecture seule, rapport structuré.

---

## Contexte projet (à lire avant tout)

Tu audites **Restaurant OS Core** — plateforme SaaS multi-tenant, multi-verticale (restaurant / garage / clinique / salon / …).

Lire impérativement avant de commencer :
- `CLAUDE.md` — conventions, architecture 8 piliers, règles critiques
- `ARCHITECTURE.md` — flux NF525, RAG, modèle de données
- `.claude/sessions.md` — sessions actives (ne pas interférer)
- `src/shared/nexus/contracts/settings/identity.ts` — `BusinessIdentity` (pas `RestaurantIdentity`)
- `src/shared/nexus/contracts/settings/pos.ts` — `ReceiptTemplate.businessName` (pas `restaurantName`)

**Invariants absolus** (signaler toute violation immédiatement) :
1. Prix en `*InMicrounits` (1 µ = 0.000001 €) — jamais `*InCents` dans le nouveau code
2. NF525 : `journalEntries`, `fiscalSeals`, `fiscalLedger` → jamais delete/update
3. `tenantId` = `activeTenantId` depuis `useTenant()` — jamais hardcodé
4. `SovereignGuard` ne se contourne jamais
5. Imports uniquement via barrels `@/modules/<pilier>` — jamais chemin interne direct

---

## Mission

Effectuer un audit **lecture seule** exhaustif. Produire un rapport structuré par angle.
Pour chaque finding : fichier, ligne, gravité (P0/P1/P2/P3), description, correction suggérée.

---

## Angles d'audit (couvrir tous)

### 1. Architecture & Barrels
- Imports qui court-circuitent les barrels (`@/modules/<pilier>/<domaine>/...` direct)
- Fichiers dans `components/<pilier>/` ou `domain/<pilier>/` au lieu de `modules/<pilier>/`
- Exports depuis un module sans passer par son `index.ts`
- Dépendances circulaires (madge + sentrux)
- God files (>400 lignes) — identifier, proposer découpe
- Complexité cyclomatique >12 (sentrux) — lister les fonctions

### 2. Vision & Généralisation Multi-verticale
- Champs restaurant-specific dans couches génériques (`shared/`, `lib/`, `config/`, `domain/`)
  - Chercher : `restaurant`, `cuisine`, `chef`, `carte`, `menu` dans les interfaces/types/defaults
  - Vérifier : `BusinessIdentity.activityCategory` (pas `cuisineType`), `ReceiptTemplate.businessName` (pas `restaurantName`)
- `PlatformVariant` — vérifier que chaque switch exhaustif utilise `VERTICAL_NAV_OVERRIDES` ou équivalent (pas de `else if` en cascade)
- DNA templates dans `src/shared/seeds/` — chaque verticale a son DNA ? Pas de fallback `restaurant` non intentionnel ?
- `filterByCapabilities` dans `navConfig.ts` — capabilities filtrées par variant correctement ?
- `resolveDNA(variant)` dans `TenantSeeder` — toutes les verticales couvertes ?

### 3. Event Bus & Saga Pattern
- Lister tous les `NexusEventBus.emit(...)` — ont-ils un handler enregistré ?
- Lister tous les handlers dans `registerHandlers.ts` — couvrent-ils tous les events émis ?
- Events émis sans handler = silent drop → P1
- Handlers qui font des I/O sans try/catch + DLQ → P1
- Vérifier le chaînage DLQ : échec → `tenants/{tenantId}/dlq/...` (pas de perte silencieuse)
- Events cross-pilier : passent-ils uniquement via le bus (pas d'import direct) ?
- Handlers MCC qui consomment des events métier tenant → violation (MCC ne lit pas les events tenant)
- Outbox pattern : `NexusEventBus.emit` en plein milieu d'une transaction Nexus sans outbox → risque de perte

### 4. Multi-tenancy & SovereignGuard
- Toutes les écritures Nexus ont-elles le path `tenants/{tenantId}/...` ?
- `tenantId` récupéré depuis `useTenant()` ou paramètre serveur — jamais hardcodé ni depuis `process.env`
- Collections protégées dans `SovereignGuard` — vérifier qu'aucune nouvelle collection sensible n'a été ajoutée sans guard
- Cross-tenant read : un tenant peut-il lire les données d'un autre ? (vérifier les queries sans filtre `tenantId`)
- Admin routes `/(admin)/` — `verifyCaller` ou `requireSuperAdmin` présent partout ?
- API routes publiques — pas d'accès non authentifié à des données tenant

### 5. NF525 & Fiscal
- `FinancialNexusBridge.processOrder()` appelé pour chaque vente POS ? (pas de bypass)
- `FiscalEngine.sealEntry()` — hash chaîné SHA-256 (previousHash correct) ?
- Aucun `delete`/`update` sur `journalEntries`, `fiscalSeals`, `fiscalLedger`
- Numérotation continue des tickets (pas de trou, pas de doublon)
- Clôture Z : `TicketZHandler` — race condition possible si deux clôtures simultanées ?
- Scellés : tous les `FiscalSeal` ont-ils un `previousHash` non null (sauf le premier) ?

### 6. Microunits & Monnaie
- Chercher `*InCents`, `/ 100`, `* 100` dans le code métier récent → P1 si trouvé
- Conversions d'affichage : `/ 1_000_000` (pas `/ 100`)
- Conversions de saisie : `* 1_000_000` (pas `* 100`)
- `toMicrounits()` depuis `@/domain/schemas/primitives` utilisé partout ?
- Branded type `Microunits` — casts directs `as Microunits` sans `toMicrounits()` → P1

### 7. RBAC & Sécurité
- API routes sans `requireTenantRole()` ou `requireSuperAdmin()` → P0
- Endpoints qui utilisent `tenantId` depuis le body/query (IDOR possible) → P0
- Secrets hardcodés dans le code (API keys, tokens, passwords) → P0
- `eval()`, `new Function()`, injection de templates → P0
- XSS : `dangerouslySetInnerHTML` sans sanitisation → P1
- PBKDF2 pour PIN/passwords (pas MD5/SHA1 direct) → vérifier
- Rate limiting sur les routes sensibles (login, PIN, signup)
- CORS : origines autorisées bien configurées ?

### 8. State Management (Jotai)
- Atoms qui encapsulent des états cross-pilier → violation (chaque pilier gère son state)
- `useAtom` sur des atoms non liés à la couche UI courante → sur-abonnement → re-renders
- Atoms dérivés complexes recalculés à chaque render sans `useMemo` → perf
- `store/base.ts` (`NexusNode`, `updateNexusNode`) — anti-cycles respecté ?
- Atoms partagés entre `mcc` et `tenant` → isolation brisée

### 9. ICM / TaskContext & Performance
- Routes sans entrée dans `TASK_MAPS` → tous les modules se chargent → P2
- `NexusSyncService.init()` appelé avec le bon `taskContext` par route ?
- Dynamic imports pour les modales et panels lourds (>50Ko) ?
- Images Next.js `<Image>` au lieu de `<img>` partout ?
- `use client` sur des composants qui pourraient être Server Components → bundle gonflé
- N+1 queries : boucles avec `Nexus.adapter.get()` à l'intérieur → P2

### 10. Nexus / Adapters
- Imports directs de `firebase/firestore` hors de `lib/nexus/` → violation
- Logique métier dans `lib/nexus/` (réservé machine core) → violation
- `NexusInterceptor` + `SovereignGuard` wrappés automatiquement → vérifier que le singleton est bien utilisé
- Adapters Firestore / Simulacra / Mock : le code ne doit pas supposer Firestore → vérifier `instanceof` ou `typeof` illicites
- `Nexus.adapter.set()` sans path `tenants/{tenantId}/...` → P0

### 11. MCC — Multi-Cloud Control
- MCC consomme-t-il des events métier tenant ? (`NexusEventBus.on('order.*')` dans MCC → violation)
- Écriture MCC : path `platform/mcc/...` ou `tenants/{tenantId}/...` selon contexte — jamais `platform/tenants/{id}/business_data`
- Fleet operations : `cloneFromReference`, `decommission`, `upgrade` — atomic + rollback en cas d'erreur ?
- `APP_MODE=mcc` bien isolé — aucun composant tenant ne se charge en mode MCC ?

### 12. Vertical Forge & Capitalisation
- `src/verticals/_shared/adapters/factories.ts` — les 8+ verticales utilisent les factories (pas de copier-coller) ?
- `VerticalBlueprint` valide pour chaque verticale (`validateBlueprint()`)
- `src/verticals/<slug>/` — chaque dossier a son `index.ts` barrel et son DNA ?
- Records exhaustifs (`PLATFORM_VARIANTS`, `VERTICAL_META`) — à jour avec toutes les verticales ?
- `SystemTenantRegistry` — tous les tenants démo/reference enregistrés ?

### 13. Tests & Couverture
- Services métier critiques sans tests unitaires (NF525, SovereignGuard, microunits) → P1
- Tests qui mockent Nexus au lieu d'utiliser le mock adapter (`SimulacraAdapter`) → faux positifs
- Tests qui hardcodent des `tenantId` → violation isolation
- Coverage handlers EventBus : chaque handler a-t-il au moins 1 test ?
- Tests E2E : les flux critiques (POS → NF525 → clôture Z) sont couverts ?

### 14. Dead Code & Dettes
- Fichiers orphelins dans `components/<pilier>/` ou `domain/<pilier>/` non rapatriés
- Exports non utilisés (barrel exports vers nulle part)
- `TODO`, `FIXME`, `HACK`, `@ts-ignore`, `any` explicit → lister avec contexte
- Routes/pages sans layout ou sans auth guard
- Features flags / `APP_MODE` checks obsolètes
- `console.log` en production (hors `logger.`)
- Dépendances npm non utilisées ou obsolètes (`npm ls --depth=0`)

### 15. i18n & Textes
- Textes en dur en anglais dans l'UI (l'app est monolingue FR) → incohérence
- Termes restaurant-specific dans l'UI pour des verticales non-restaurant (ex : "Carte" pour un garage) → vérifier que `filterByVertical` gère bien les labels
- `useLexicon()` hook — utilisé pour les termes contextuels ? ou textes hardcodés ?

---

## Format du rapport

Produire un document `docs/AUDIT_GLOBAL_<date>.md` avec :

```
# Audit Global — <date>

## Résumé exécutif
- P0 (bloquants prod) : N findings
- P1 (critiques) : N findings
- P2 (importants) : N findings  
- P3 (mineurs/dette) : N findings

## P0 — Bloquants production
| # | Fichier:ligne | Description | Correction suggérée |
|---|---|---|---|

## P1 — Critiques
...

## P2 — Importants
...

## P3 — Dette technique
...

## Angles conformes (aucun finding)
Liste des angles vérifiés et propres.

## Non couvert (périmètre trop large pour cette session)
Ce qui n'a pas pu être audité.
```

---

## Méthode d'exécution suggérée

1. `npx tsc --noEmit` → noter les erreurs
2. `npx vitest run` → noter les échecs
3. `sentrux check .` → noter CC violations + cycles
4. `npx madge src --circular` → cycles d'import réels
5. Grepper les invariants critiques (InCents, hardcodé tenantId, etc.)
6. Lire les fichiers clés listés dans `CLAUDE.md`
7. Parcourir `src/shared/eventBus/handlers/` + `registerHandlers.ts`
8. Parcourir `src/modules/` pilier par pilier
9. Parcourir `src/verticals/` pour la généralisation
10. Produire le rapport

**Ne pas modifier de code pendant l'audit.** Rapport uniquement.
