# Plan V3 — Audit Global & Reste à faire

> **Repo** : RESTAURANT-OS-CORE · branche `fix/coherence-ui-backend-securite`
> **Rédigé le** : 2026-08-09 · **mis à jour** le 2026-08-09 · session `audit-global-v3`
>
> Ce document est **autonome** : chaque chantier contient le diagnostic, la preuve empirique,
> le fichier/module exact, la correction proposée et le critère de validation.

---

## Sommaire des Nouveaux Chantiers (V3)

| # | Chantier | Sévérité | Effort | Bloquant |
|---|----------|----------|--------|----------|
| [23](#chantier-23--29-composants-ui-effectuant-des-écritures-base-de-données-directes) | 29 composants UI effectuant des écritures base de données directes | 🔴 CRITIQUE | ~6 h | Oui — faille CQRS / NF525 / Sovereign |
| [24](#chantier-24--120-tests-en-échec-sur-linfrastructure-mock-vitest-4) | 120 tests en échec sur l'infrastructure Mock (Vitest 4) | 🔴 HIGH | ~4 h | Oui — CI rouge |
| [25](#chantier-25--anti-pattern-god-hooks-et-logique-métier-dans-la-vue) | Anti-pattern God Hooks et logique métier dans la Vue | 🟠 MEDIUM | ~3 h | Non |

---

## Bilan des Chantiers V2 (Validés)

Ces chantiers de la session précédente sont désormais **livrés** :
- ✅ **Chantier 17** : Les 63 handlers fantômes (non-émis) ont été recensés et commentés avec le tag `TODO(Chantier 17)` pour analyse métier.
- ✅ **Chantier 18** : Création et branchement du `CatchAllAuditHandler` pour capturer les 85 événements orphelins silencieux.
- ✅ **Chantier 19** : Les 128 handlers modificateurs sont désormais "tier-aware" via le `SovereignGuard` (`isWritable`).
- ✅ **Chantier 20** : 32 routes API non sécurisées ont été corrigées avec les guards `requireFleetAdmin` et `requireTenantUser`.
- ✅ **Chantier 21** : Les 77 routes API orphelines sans consommateur UI ont été documentées.

---

## Chantier 23 — 29 composants UI effectuant des écritures base de données directes

> 🔴 **CRITIQUE — Faille architecturelle CQRS, NF525 et SovereignGuard.**

### Symptôme
29 composants frontend (marqués `"use client"`) effectuent des écritures directes dans la base de données via l'instance `Nexus.adapter.set` ou `update`.

### Preuve Empirique
L'analyse par AST (Sonde V3) a identifié ces fichiers, notamment :
- `src/modules/commerce/relation/reservations/components/EventQuoteModal.tsx`
- `src/modules/compliance/qualite/haccp/components/NonConformityForm.tsx`
- `src/modules/finance/providers/NexusFiscalProvider.tsx`
- `src/modules/logistics/stock/inventory/components/inventory/StockReceptionModal.tsx`

### Cause Racine
Les développeurs ont pris un raccourci en utilisant le `NexusAdapter` isomorphe directement depuis le navigateur. 
Ceci **contourne totalement** :
1. Le `ServerEventBus` (Outbox pattern).
2. L'Auditabilité NF525 (puisqu'aucun événement métier n'est tracé dans le ledger).
3. Le `SovereignGuard` (qui protège les instances `_ref_*` contre les mutations).

### Correction Proposée
1. Remplacer `Nexus.adapter.set` dans ces composants par des appels à des **Server Actions Next.js** ou des routes API.
2. Côté serveur, les Server Actions doivent valider l'accès via `requireTenantUser()`, puis émettre l'intention via `NexusEventBus.emitDurable(event, payload)`.
3. C'est le Handler (ou la Saga) asynchrone qui effectuera l'écriture finale via `Nexus.adapter`.

---

## Chantier 24 — 120 tests en échec sur l'infrastructure Mock (Vitest 4)

> 🔴 **HIGH — La CI est rouge et les régressions sont masquées.**

### Symptôme
La suite de tests globale `npx vitest run` crashe avec 120 tests en échec. Les erreurs sont concentrées sur les modules d'infrastructure (`LLMManager`, `PiiVault`, `PolicyEngine`) et les suites de Sagas (`saga.*.test.ts`).

### Preuve Empirique
Exemples d'erreurs récurrentes :
- `Error: [LLMManager] No LLM provider registered.` (dans `ocrParsers.test.ts`).
- `TypeError: Cannot read properties of undefined (reading 'keyFingerprint')` (dans `PiiVault.test.ts`).
- `AssertionError: expected "vi.fn()" to be called at least once` (dans `HACCPLogService.test.ts`).

### Cause Racine
Les tests de l'application Restaurant OS ne sont pas isolés les uns des autres. Les mutations de l'état global (ex: `vi.spyOn(Nexus.adapter)`) ne sont pas correctement nettoyées entre les suites (`afterEach`). De plus, certaines dépendances système (comme `LLMProvider`) manquent d'un mock par défaut dans un `setupFiles` global pour Vitest.

### Correction Proposée
1. Créer un fichier `vitest.setup.ts` qui mocke les singletons transverses (ex: `LLMManager`, `Nexus.adapter`).
2. Ajouter `vi.clearAllMocks()` et `vi.resetModules()` dans les hooks globaux pour garantir l'isolation.
3. Réparer les assertions des tests impactés en s'assurant que les événements fantômes du Chantier 17 ne causent pas d'effets secondaires inattendus.

---

## Chantier 25 — Anti-pattern God Hooks et logique métier dans la Vue

> 🟠 **MEDIUM — Problème de maintenabilité et de testabilité.**

### Symptôme
Des composants UI complexes orchestrent de la logique métier lourde directement dans des `useEffect` ou des callbacks au lieu de la déléguer à des services de domaine purs.

### Preuve Empirique
- `TimeclockDashboard.tsx` : Calcule les heures supplémentaires, les temps de pause, et la conformité RH au sein même de la vue.
- `CardImprintStep.tsx` : Gère le flow complexe Stripe/Monetico avec des variables d'état locales pour la machine à états de la transaction.

### Cause Racine
La vélocité de livraison a poussé à concentrer la logique dans des "God Components" plutôt que de la concevoir de manière découplée (Headless Hooks + Pure Domain Functions).

### Correction Proposée
1. Extraire la logique métier vers des fichiers `.service.ts` ou `.domain.ts` pur-TypeScript (totalement agnostiques de React).
2. Tester ces services de domaine nativement avec Vitest.
3. Ne conserver dans le composant React que la gestion de l'état d'affichage (UI).
