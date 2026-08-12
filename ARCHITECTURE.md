# 🏛️ RESTAURANT-OS-CORE — Architecture

> Analyse complète du projet, rédigée après exploration directe du code (≈1300 fichiers).
> Compagnon du `CLAUDE.md` : ici le **pourquoi** et le **comment global** ; là-bas les **règles à respecter**.
> Dernière mise à jour : 2026-06-14. Chemins clés (§3, §6, §10) resynchronisés le 2026-08-12 après le rapatriement vers `kernel/`.
>
> ⚠️ **Zones encore à rafraîchir** (snapshot antérieur) : la table §2 (compte de fichiers par pilier, mention `kds` comme pilier) et le routing §7 datent d'avant la restructuration en 8 piliers + domaines. Pour l'arborescence à jour et les règles exactes, se référer à `CLAUDE.md`.

---

## 1. Vue d'ensemble

RESTAURANT-OS-CORE (nom interne `restaurant-os-vanguard`) est une **plateforme SaaS multi-tenant de gestion de restaurant**, conçue comme un système d'exploitation modulaire. Elle couvre la caisse (POS), la cuisine (KDS), la conformité (HACCP, NF525), la finance/comptabilité, les RH, le commerce/marketing et la logistique/stocks — le tout sous une couche d'accès données unifiée appelée **Nexus**, avec une barrière de souveraineté multi-tenant (**SovereignGuard**) et une couche d'intelligence (RAG / Knowledge Graph).

Le système est pensé pour être piloté par des **agents IA** : conventions strictes, immuabilité fiscale, typage branded, et désormais un capteur architectural (sentrux) pour empêcher la dérive.

### Stack réelle (vérifiée dans `package.json`)

| Domaine | Technologie |
|---------|-------------|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Langage | TypeScript strict |
| Données | Firebase Firestore (+ `firebase-admin`), cache offline via Dexie (IndexedDB) |
| État | Jotai (atomes par pilier) |
| Validation/typage | Zod 4 (`z.infer` → types) |
| IA | Google Generative AI (Gemini), OpenAI, sidecar LightRAG (Python, port 9621) |
| Paiement / billing | Stripe (webhook dans `api/billing/webhook`) |
| Observabilité | Sentry, Axiom |
| UI spécialisée | Konva / react-konva (plan de salle), framer-motion, Radix, lucide-react, dnd-kit |
| Documents | jsPDF (+ autotable), export FEC |
| Tests | Vitest (unitaire), Playwright (e2e) — 39 fichiers de test |

### Terminologie maison

- **Nexus** : la couche d'accès données (abstraction au-dessus de Firestore/Mock/Simulacra).
- **Sovereign / Souverain** : tout ce qui touche l'isolation multi-tenant et la sécurité fiscale.
- **Suzerain / Vassal** : modèle multi-tenant (un « maître » pousse la config globale, les tenants sont isolés).
- **Empire / Fleet** : gestion multi-instances (plusieurs déploiements clients).
- **Grade VI / Grade X** : niveaux de maturité/qualité internes annotés dans le code.
- **Simulacra** : mode « fork » de la base pour simulation/chaos testing sans toucher au réel.

---

## 2. Architecture en piliers

Le code métier vit dans `src/modules/<pilier>/`. Chaque pilier possède typiquement : `store/` (atomes Jotai), `domain/` ou `*.types.ts` (types), `hooks/`, `components/`, `services/`, et un `<pilier>.sync.ts` (synchronisation Nexus).

| Pilier | Fichiers | Rôle | Sous-modules |
|--------|---------:|------|--------------|
| **ops** | 77 | Cœur opérationnel : caisse, cuisine, moteur de commandes | `pos`, `kitchen`, `engine` |
| **commerce** | 61 | Clients, réservations, marketing/SEO, devis | `customers`, `reservations`, `marketing` |
| **compliance** | 49 | Conformité sanitaire et fiscale | `haccp` |
| **finance** | 40 | Comptabilité, scellement NF525, banque, notes de frais | `accounting`, `billing`, `services` |
| **human** | 30 | RH, shifts, paie | `hr` |
| **logistics** | 26 | Stocks et inventaire | `inventory` |
| **intelligence** | 19 | RAG / Knowledge Graph, migration, analytics | `rag`, `migration`, `analytics` |
| **kds** | 3 | Affichage cuisine (contrats + hooks ; le gros vit dans `ops/kitchen`) | `contracts`, `hooks` |

> Note : `src/store/pillars/` contient les atomes Jotai par pilier (`commerce, compliance, core, finance, human, logistics, marketing, ops, sovereign`). C'est la couche **état** ; je l'ai modélisée comme telle dans `.sentrux/rules.toml` (couche `state`, pair de `nexus-core`).

Les **piliers sont étanches** : ils ne s'importent pas directement entre eux. Le couplage légitime (ex. POS → Finance) passe par un **bridge** dans `infrastructure/` (voir §4). Sentrux confirme cette étanchéité (aucune violation de frontière inter-piliers).

---

## 3. La couche Nexus (accès données)

### Singleton et bouclier

`src/kernel/adapter/NexusAdapter.ts` expose un singleton `Nexus`. Toute écriture/lecture passe par lui. Point clé : **quand on enregistre un adapter, il est automatiquement enveloppé** par le `NexusInterceptor`, lui-même branché sur le `SovereignGuard` :

```
Nexus.adapter = new FirestoreAdapter()
   → wrap automatique → NexusInterceptor(adapter, SovereignGuard, () => activeTenant)
```

On ne peut donc pas écrire en base sans passer la barrière de souveraineté. C'est le pilier de sécurité du système.

### Adapters disponibles (`src/infrastructure/adapters/`)

- **FirestoreAdapter** (+ `FirestoreBatch`, `FirestoreDocumentStore`) — production.
- **MockAdapter** — tests / dev.
- **SimulacraAdapter** (chargé en lazy `import()`) — mode simulation (fork de la réalité).
- Adapters spécialisés : `FleetAdapter` (multi-instances), `GeminiAdapter` (IA), `LedgerAdapter` / `SovereignLedgerAdapter` (registre fiscal), `POSAdapter`, `ZeusAdapter`, `IDAdapter`.
- **FinancialNexusBridge** et **FiscalAdapter** — le pont fiscal (voir §4).

### SovereignGuard — la barrière

`src/kernel/nexus/guards/SovereignGuard.ts` applique :

- **Isolation tenant** : tout chemin doit être `tenants/{tenantId}/...`. Une fuite déclenche `SHADOW_ISOLATION_BREACH: Execution Terminated.`
- **Mode maître** : `MasterBridge.isMasterMode()` autorise des écritures globales hors `tenants/` (push de config souveraine).
- **Collections à écriture signée** (`SIGNED_WRITE_COLLECTIONS`) : `journalEntries`, `fiscalSeals`, … → exigent une signature valide (`NF525_WRITE_SIGNATURE_INVALID` sinon).
- **Collections immuables** (`IMMUTABLE_COLLECTIONS`) : `fiscalLedger`, `fiscalSeals`, `journalEntries` + tout `fiscal/` → **jamais d'update ni de delete**.

### ICM-lite — chargement sélectif par route

`src/lib/icm/TaskContext.ts` déclare, pour chaque route, une **carte d'importance** (`ICMImportanceMap`) sur 10 domaines (`orders, tables, products, categories, stocks, recipes, finance, compliance, marketing, staff`) avec 4 niveaux : `HIGH | MEDIUM | LAZY | OFF`.

`NexusSyncService` n'initialise que les modules `HIGH`/`MEDIUM` de la route active. Exemple : la route `/pos` charge `orders, tables, products, categories` en HIGH, `stocks/recipes` en LAZY, le reste OFF. C'est une optimisation mémoire/perf importante (le `dev` tourne avec `--max-old-space-size=1024`).

> Pour ajouter une route : entrée dans `TASK_MAPS` + cas dans `resolveTaskContext()`.

---

## 4. Flux critique : vente POS → scellement NF525

C'est le flux le plus sensible du système (conformité fiscale française).

```
Panier POS (CartItem[])
   │
   ▼
FinancialNexusBridge.processOrder(payload)        modules/finance/comptabilite/FinancialNexusBridge.ts
   │  1. computeTvaBreakdown(items)  → ventilation TVA par taux
   │  2. getLastSeal(tenantId)       → dernier sceau (continuité de chaîne)
   │  3. construit un JournalEntry (immuable, NF525)
   │  4. construit un FiscalSeal
   ▼
FiscalEngine.sealEntry(data, options)             modules/finance/fiscalite/FiscalAdapter.ts
   │  dataSnapshot = CryptoService.canonicalStringify(data)
   │  previousHash = lastSeal?.hash ?? GENESIS_ROOT
   │  hash = SHA-256(dataSnapshot + previousHash)
   │  signature = CryptoService.signFiscalData(hash, instanceId)
   ▼
{ JournalEntry, FiscalSeal }  →  écrits via Nexus (collections immuables, signées)
```

Points de conformité :

- **Chaîne de hash** : chaque sceau référence le `previousHash` du précédent ; le premier part de `GENESIS_ROOT`. La vérification recalcule toute la chaîne et compare (`if (current.previousHash !== seals[i-1].hash) return false`).
- **Mode formation** : `isTrainingMode` produit un `TRAINING_MODE_HASH` dédié (ne pollue pas la chaîne réelle).
- **Immuabilité** : garantie par SovereignGuard (collections immuables) + le manifeste finance (« No modification allowed after validation »).
- **Monnaie** : tout est en **microunits** (voir §6). La ventilation TVA travaille en entiers.
- **Export FEC** : route `api/admin/finance/fec/export` (Fichier des Écritures Comptables, obligation légale).

---

## 5. Intelligence / RAG

`src/modules/intelligence/knowledge/rag/` orchestre un **Knowledge Graph** via un sidecar Python **LightRAG** (port 9621, lancé par `docker-compose`).

```
HermesKnowledgeManager  →  LightRAGClient  →  HTTP REST  →  LightRAG Server (Python)
```

- `HermesKnowledgeManager` : orchestrateur haut niveau, scope par tenant (le `workspace` LightRAG = `tenantId`, cohérent avec l'isolation Nexus).
- `LightRAGClient` : client REST avec retry intégré (`query`, `insert`, `insertBatch`, `insertMedia`, `getKnowledgeGraph`, `dropWorkspace`, etc.).
- IA générative par ailleurs via `GeminiAdapter` et OpenAI (vision, extraction de marque, analyse NAM, etc. — voir routes `api/admin/intelligence/*`).

---

## 6. Modèle de données

Schémas **Zod** par pilier dans `src/modules/<pilier>/domain/schemas/`, types dérivés par `z.infer<>`. Primitives partagées : `src/shared/schemas/primitives.ts`.

### Primitives (`primitives.ts`)

- **`Microunits`** : `z.number().int().min(0).brand<'Microunits'>()`. **1 unité = 1 000 000 µ**. Cast via `toMicrounits(val)`, jamais `as Microunits`. Empêche tout mélange accidentel avec des cents ou des floats.
- **`sanitized(min, max)`** : chaîne nettoyée (anti-XSS : retire `<script>`, balises, caractères dangereux) PUIS validée.
- **`TimestampSchema`** : union ISO string / ms number / objet Firestore Timestamp → normalisé en ms.

### Entités principales

| Schéma | Entités |
|--------|---------|
| `finance.ts` | `JournalEntry`, `Account`, `LedgerAccount`, `BankTransaction`, `ExpenseClaim`, `FiscalSeal`, `TaxRate`, métriques |
| `orders.ts` | `Order`, `OrderLine`, `OrderPatch` |
| `pos.ts` | `PosTicket`, `CartLine`, `PaymentSplit` |
| `commerce.ts` | `Product` |
| `inventory.ts` | `StockItem`, `InventoryTransaction` |
| `hr.ts` | `ShiftEntry`, `PayrollCalculation`, `ShiftStats` |
| `tenant.ts` | `TenantConfig`, `OrchestratorSignal`, `TenantTheme` |

> Contrats runtime (interfaces) dans `src/kernel/nexus/contracts/`, dont le « contrat souverain » de base (`SovereignNode`, `TenantConfig`, `SovereignData`) dans `src/kernel/nexus/contracts/nexus-contract.ts`.

---

## 7. Routing (App Router)

Trois groupes de routes sous `src/app/` :

- **`(admin)`** : `master-console`, `mcc`, `audit-portal`, `system-map`, `blueprint`, `simulator`, `settings`, `agent`, `prospecting`, `inventory/reception`, `simulation`.
- **`(client)/(ops)`** : `pos`, `kds`, `kitchen`, `bar`, `floor-plan`, `operations`, `registre`, `reservations`, `migration`.
- **`(client)/(public)`** : `landing`, `welcome`, `signup`, `showcase`, `groups`, `docs/[category]`, `vanguard-simulator`, `auth/logout`.
- **`api/`** : `billing/webhook` (Stripe), `finance/fec/export`, `intelligence/vision`, `brand/extract`, `system/health`, `procurement/delivery/[id]/sign`, `nam/analyze`, `git/*`, `signup`.

`src/app/layout.tsx` monte les Providers globaux (dont `NexusPulseOrchestrator`). C'est un point chaud (god file + couplage app→engines).

---

## 8. Tests & qualité

- **39 fichiers de test** (Vitest + Playwright).
- `src/__tests__/` : `lockdown.test.ts`, `stress/` (ex. `NexusInterceptor.stress.test.ts`), `infrastructure/`.
- `src/tests/vanguard/` : tests « vanguard » (dont `simulacra.test.ts`), benchmarks.
- `tests/` (racine) : `e2e/` (Playwright), `falange/`, `verification/`, `benchmarks/`.
- **Simulacra** (`src/kernel/adapters/Simulacra/`) : `MonkeyChaos` (chaos/dérive réseau), `RealityGenerator` (génère des rafales de ventes — « rush hour »), `SinfoniaGradeXProof`.
- Vérifications : `npx tsc --noEmit` (✅ **0 erreur** à ce jour), `npx vitest run`, `./scripts/preflight.sh` (TS + ESLint + tests + **sentrux** depuis cette session).

---

## 9. Audit de dette technique (priorisé)

> ✅ **Mesure réelle sentrux** (0.5.7, lancé sur Mac le 2026-06-15) :
> **Quality 7011/10000 — 14 règles vérifiées, toutes passent** (`sentrux check .`).
> 1259 fichiers scannés. Les règles de `.sentrux/rules.toml` (dont `max_cycles=0`) passent →
> sentrux **confirme 0 cycle**, cohérent avec l'analyse manuelle (le « cycle de barrel » était
> un faux positif de commentaire).
>
> ⚠️ **Correction d'honnêteté** : le « 4884/10000 » d'une version antérieure était un chiffre
> **inventé** (sentrux n'avait alors jamais tourné), pas une mesure. La vraie valeur est 7011.
>
> ⚠️ **Calibrage à finir** : au scan, sentrux résout 2761 specs d'import mais en laisse
> **5528 non résolues** (probable non-suivi des alias tsconfig `@/`, `@nexus/`…). Le graphe
> analysé est donc **partiel** ; « toutes les règles passent » est encourageant mais en partie
> parce que des arêtes restent invisibles à l'outil. Ajuster les `paths` dans `rules.toml`
> pour que sentrux suive les alias, puis relancer.
>
> Les fan-out/cc ci-dessous restent des **estimations heuristiques maison** tant que le
> résolveur sentrux n'est pas calibré.

Voici la dette restante, par priorité.

### ✅ P1 — Cycle runtime SovereignGuard ↔ MasterBridge — **CASSÉ**

Le cycle `SovereignGuard → MasterBridge → TimeSync → NexusAdapter → SovereignGuard` est résolu via le `NexusEventBus`. `SovereignGuard` n'importe plus `MasterBridge` : il **émet** l'événement `sovereign.breach` ; un nouveau handler `SovereignBreachHandler` (priorité CRITICAL, enregistré dans `registerHandlers`) le consomme et pousse le kill-switch via `MasterBridge`. L'appel mort `isMasterMode()` (bloc vide) a été retiré. Vérifié : `SovereignGuard` n'atteint plus statiquement `MasterBridge`/`NexusAdapter`/`TimeSync` (analyse de reachability) et `tsc --noEmit` à 0 erreur. **À relancer côté machine : `npx vitest run` (le sandbox n'a pas le binding natif rolldown).**

### 🟠 P2 — God files (fan-out > 15)

- ✅ `src/lib/NexusSyncService.ts` (26 → **~15**) — **découpé** : les 6 sous-services de pilier + TimeSync extraits dans `src/lib/sync/pillarSyncRegistry.ts` ; les gates de sécurité (privacy shield + génome) dans `src/lib/sync/syncGates.ts`. L'orchestrateur ne fait plus que séquencer.

Restent à découper, par impact :

- `src/engines/ops/NexusOpsProvider.tsx` (27)
- `src/engines/core/NexusCoreProvider.tsx` (20)
- `src/shared/nexus/contracts/settings.ts` (18)
- `src/app/layout.tsx` (18)

Les Providers Nexus concentrent trop de responsabilités. Piste : extraire des sous-providers ou déplacer la logique de sync hors du composant.

### 🟠 P3 — Fonctions trop complexes (cc > 25)

- ✅ `NexusFleetProvider` (cc≈60 → ≈21) — **traité** : le mapper `mappedInstances` et le patch broadcast extraits dans `src/engines/fleet/fleetMappers.ts` (sous-constructeurs metrics/branding/security, chacun < 25).
- Restent : `useDataMigration` (46), `NexusCoreProvider` (33), `NexusBridge.listen` (32), `useFloorPlanControls` (31).
- (`scratch/*` : cc 60 et 26 — code jetable, à exclure ou supprimer.)

### 🟡 P4 — Dette héritée diffuse

- ✅ **`CartItem` unifié** : il n'existe **qu'une** définition (`modules/ops/engine/types.ts`, microunits) ; `pos/hooks/usePos.ts` l'importe et convertit (`priceInCents * 10000`). L'item « deux CartItem » était obsolète.
- ✅ **Débris racine supprimés** : 31 fichiers (`fix_*.py`, `tsc_*`, `*.log`, `eslint_*`, dumps) retirés de la racine.
- ⏸️ **Migration cents → microunits** : **478 occurrences** `InCents` sur ~120 fichiers, dont du fiscal critique (FEC, paie, NF525) et ~17 frontières PSP (Stripe/Swan) où les cents sont **intentionnels**. Un renommage en bloc corromprait les montants (1 cent = 10 000 µ). Plan additif, par couche et test-gated dans **`MIGRATION-microunits.md`** — non exécuté ici car `vitest` ne tourne pas dans cet environnement.
- **`.sentruxignore` non lu** par sentrux 0.5.7 (pas de mécanisme d'exclusion documenté) → `scratch/` reste compté.

### ✅ Déjà traité cette session

5 cycles cassés (vérifiés `tsc --noEmit` à 0 erreur) :
1. `common.types ↔ nexus-internal-mapper` (redirection vers sources canoniques).
2. `seo.types ↔ marketingAtoms` (types déplacés vers `seo.types`).
3. `ops/engine/types ↔ contracts/index` (import depuis fichier source au lieu du barrel).
4. `GlobalRegistryService ↔ nexusNodeFactory` **et** `nexusNodeFactory ↔ useNexusNode` (passage par le module neutre `store/base`).
5. `SovereignGuard ↔ MasterBridge` (barrière fiscale) — découplé via `NexusEventBus` (événement `sovereign.breach` + `SovereignBreachHandler`).

God files découpés :
- `NexusSyncService` (26 → ~15) via `sync/pillarSyncRegistry` + `sync/syncGates`.
- `NexusOpsProvider` (27 → 14) via `opsCore` + `hooks/{floor,kitchen,commerce,catalog}Hooks` (réexports pour compat des 35 consommateurs).

Complexité réduite : `NexusFleetProvider` (cc≈60 → ≈21) via `fleetMappers`.

État cycles : **0 cycle réel** (scan dépouillant commentaires + imports dynamiques, 1011 fichiers). ⚠️ Un « cycle de barrel des contrats » signalé un temps était un **faux positif** : 2 exemples `import` dans des commentaires JSDoc (`finance.ts`, `finance.types.ts`) comptés à tort comme arêtes. Leçon : un détecteur de cycle doit dépouiller commentaires et chaînes ; se fier à `sentrux` (parse TS). Détail : `workflows/refactor-cycle/01_audit/output/findings.md`.
Débris racine : 31 fichiers supprimés. Plan fiscal : `MIGRATION-microunits.md`.

---

## 10. Fichiers clés (carte mémoire)

| Fichier | Rôle |
|---------|------|
| `src/kernel/adapter/NexusAdapter.ts` | Singleton Nexus + wrap automatique SovereignGuard |
| `src/kernel/adapter/NexusInterceptor.ts` | Interception des opérations (applique le Guard) |
| `src/kernel/nexus/guards/SovereignGuard.ts` | Barrière multi-tenant + immuabilité fiscale |
| `src/kernel/nexus/contracts/nexus-contract.ts` | Primitives souveraines (`SovereignNode`, `TenantConfig`) |
| `src/modules/finance/comptabilite/FinancialNexusBridge.ts` | Pont POS → JournalEntry NF525 |
| `src/modules/finance/fiscalite/FiscalAdapter.ts` | `FiscalEngine.sealEntry()` — chaîne de scellement |
| `src/shared/schemas/primitives.ts` | `Microunits`, `sanitized`, `Timestamp` |
| `src/modules/finance/domain/schemas/finance.ts` | `JournalEntry`, `FiscalSeal`, `Account` (Zod) |
| `src/lib/icm/TaskContext.ts` | Cartes d'importance ICM-lite par route |
| `src/lib/NexusSyncService.ts` | Orchestrateur : séquence cleanup → suture → gates → sync (découpé) |
| `src/orchestration/sync/pillarSyncRegistry.ts` | Init/stop des sous-services de pilier + TimeSync (extrait) |
| `src/orchestration/sync/syncGates.ts` | Gates de sync : privacy shield (Grade X) + génome (Grade IX) (extrait) |
| `src/orchestration/NexusEventBus.ts` | Bus d'événements (CRITICAL/HIGH/BACKGROUND) — découple les piliers |
| `src/orchestration/handlers/SovereignBreachHandler.ts` | Kill-switch global sur brèche d'isolation (consomme `sovereign.breach`) |
| `src/lib/adapters/MasterBridge.ts` | Mode maître / push config globale |
| `src/store/base.ts` | Module neutre : `NexusNode`, `updateNexusNode` |
| `src/store/nexusNodeFactory.ts` | Fabrique d'atomes + RBAC (`createProxyDomain`) |
| `src/modules/intelligence/knowledge/rag/HermesKnowledgeManager.ts` | Orchestrateur LightRAG |
| `src/kernel/adapters/Simulacra/` | Simulation / chaos testing |

---

## 11. Commandes

```bash
npx tsc --noEmit          # Vérification types (actuellement 0 erreur)
npx vitest run            # Tests unitaires
npx playwright test       # Tests e2e
./scripts/preflight.sh    # TS + ESLint + tests + sentrux
sentrux check .           # Gate architectural (cycles, god files, layers)
docker-compose up         # App + sidecar LightRAG (port 9621)
npm run dev               # Next dev (Turbopack, mémoire bridée à 1 Go)
```
