# 🏛️ RESTAURANT-OS-CORE — Architecture

> Analyse complète du projet, rédigée après exploration directe du code (≈1300 fichiers).
> Compagnon du `CLAUDE.md` : ici le **pourquoi** et le **comment global** ; là-bas les **règles à respecter**.
> Dernière mise à jour : 2026-06-14. **Resynchronisé le 2026-08-12** après le rapatriement vers `kernel/` : chemins clés (§3, §4, §5, §6, §8, §10), table des piliers/domaines (§2) et routing (§7).
>
> ℹ️ Le §9 (audit de dette) reste un instantané daté : certains chemins/chiffres y reflètent l'état au moment de l'audit, pas forcément le présent.

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

Le code métier vit dans `src/modules/<pilier>/<domaine>/<module>/`. L'infrastructure (`providers/`, `connectors/`, `hooks/`, `services/`, `store/`, `domain/`, `migration/`) reste à la racine du pilier. Chaque pilier expose une **couche de domaines universels** (2-4) sous laquelle vivent les modules.

**8 piliers métier** + `mcc` (outillage plateforme). Comptes de fichiers `.ts/.tsx` (mesurés le 2026-08-12, ~1130 au total) :

| Pilier | Fichiers | Domaines universels | Rôle |
|--------|---------:|---------------------|------|
| **commerce** | 246 | `catalog` · `acquisition` · `relation` · `fidelite` | Catalogue, clients, réservations, marketing/SEO, fidélité, devis |
| **ops** | 213 | `service` · `production` · `workflow` | Caisse (POS), bar, front-desk · cuisine/KDS, recettes · moteur de commandes |
| **finance** | 175 | `comptabilite` · `tresorerie` · `fiscalite` | Compta, facturation, FEC · banque, encaissement, notes de frais · scellement NF525, TVA |
| **intelligence** | 149 | `analytique` · `ia` · `knowledge` | Analytics, rapports, anomalies · IA/agents, simulateur · RAG / Knowledge Graph |
| **compliance** | 122 | `qualite` · `securite` · `reglementaire` | HACCP, IoT, rappels · audit · RGPD |
| **human** | 104 | `effectifs` · `remuneration` (+ `conventions`) | RH, shifts · paie |
| **logistics** | 76 | `stock` · `approvisionnement` · `fleet` · `dispatch` | Inventaire · réception, achats · véhicules, chauffeurs · routing |
| **facility** | 41 | `spaces` · `maintenance` · `assets` | Plan de salle, settings · registre |
| **mcc** | 2 | — | Outillage Multi-Cloud-Control (l'essentiel vit dans `src/lib/mcc/`) |

> Note : `src/store/pillars/` porte les atomes Jotai par pilier (`commerce, compliance, core, finance, human, logistics, ops, rbac, sovereign`). C'est la couche **état**, modélisée comme telle dans `.sentrux/rules.toml` (couche `state`, pair de `nexus-core`).

Les **piliers sont étanches** (Règle du Barrel) : on importe uniquement depuis le barrel racine `@/modules/<pilier>`, jamais un domaine/module interne. Le couplage légitime (ex. POS → Finance) passe par un **bridge** (`src/modules/finance/comptabilite/FinancialNexusBridge.ts`, voir §4). Sentrux confirme l'étanchéité (aucune violation de frontière inter-piliers).

### Le modèle en couches (ce que `.sentrux/rules.toml` garde)

L'architecture réelle n'est pas seulement « des piliers » : c'est une **hiérarchie de couches à sens unique**, vérifiée à chaque `sentrux check`. Règle d'or : **une couche ne dépend que de couches d'ordre égal ou plus profond**. Un import qui remonte = violation (et souvent un cycle TDZ en SSR).

| Ordre | Couche | Chemin | Rôle |
|------:|--------|--------|------|
| 0 | `app` | `src/app/*` | Routes Next.js — la surface |
| 1 | `pillars` | `src/modules/*` | Code métier (motif `components/hooks/services/store`) |
| 1 | `ui-components` | `src/design/*` | Design System partagé (Empire) — présentation pure |
| 2 | `config` | `src/config/*` | Config/nav — lecture seule |
| 3 | `nexus-core` | `src/kernel/adapter/*`, `src/kernel/nexus/{guards,state,engines,…}/*` | Machine Nexus + barrières |
| 3 | `infrastructure` | `src/lib/adapters/*` | Adapters concrets (Firestore, POS…) câblés au boot |
| 3 | `lib-server` | `src/lib/server/*` | Guards admin server-only |
| 3 | `state` | `src/store/*` | Atomes Jotai |
| 4 | `nexus-contracts` | `src/kernel/nexus/contracts/*` | Interfaces runtime, contrat souverain |
| 5 | `domain` | `src/shared/schemas/*` | Schémas Zod partagés |
| 6 | `primitives` | `src/shared/schemas/primitives*` | Microunits, types branded — ne dépendent de **rien** |

**`src/orchestration/*` (NexusEventBus + handlers/saga) est volontairement hors hiérarchie** : le bus est *bidirectionnellement* couplé aux piliers (les modules **émettent** vers lui ; ses handlers **rappellent** les services de module). Aucun ordre strict ne le décrit sans fabriquer de fausse violation — c'est le prix de son rôle de découplage. Détail dans [NEXUS_EVENT_BUS_BIBLE](docs/architecture/NEXUS_EVENT_BUS_BIBLE.md).

> **`src/design/*` (≈23K LOC)** est plus que des « composants » : c'est le **Design System + shell applicatif partagé** — atomes UI (`atomic/`, `ui/`), layout et pile de providers (`layout/NexusProviderStack.tsx`, `providers/`), contextes transverses, gating RBAC visuel (`rbac/`), et surfaces souveraines (`sovereign/`, `blueprint/`). Couche présentation : elle consomme les hooks des piliers, jamais l'inverse.

**Les frontières qui comptent — et *pourquoi* (le mode d'échec qu'elles préviennent) :**

- **Nexus bypass** — aucun pilier/route/atome n'importe `FirestoreAdapter` ni `firebase` en direct. *Sinon* : écriture hors du chemin `tenants/{tenantId}/…`, donc **fuite cross-tenant** (SovereignGuard court-circuité).
- **Pureté SSR du store** — `src/store/pillars/*` importe les fichiers `*Atoms.ts` **directement**, jamais un barrel `modules/<pilier>/index`. *Sinon* : barrel → hook → atome → cycle → `Cannot access X before initialization` en SSR, indébogable.
- **Isolation inter-piliers** — un pilier n'importe jamais un autre pilier (matrice complète). Le couplage légitime passe par un **bridge** (infra) ou le **bus**. *Sinon* : « un bug = dix endroits ».
- **Pureté du domaine** — les schémas Zod (`src/shared/schemas/*`) ne remontent jamais vers `modules`/`lib`/`app`/`kernel`. Ils sont consommés, jamais consommateurs.
- **Ségrégation des routes** — `(client)` ↮ `(admin)` : isolation MCC stricte (le restaurateur ne peut pas tirer un composant de la console souveraine, et inversement).
- **Barrel contract** — un module ne se consomme que par son `index.ts` (doublé par ESLint `no-restricted-imports`).

> Le composition root (`src/kernel/adapter/`) et le kill-switch (`SovereignGuard` → `sovereign.breach` via le bus) traversent légitimement des couches : ce sont les seules dérogations assumées, documentées dans le gate.

---

## 3. La couche Nexus (accès données)

### Singleton et bouclier

`src/kernel/adapter/NexusAdapter.ts` expose un singleton `Nexus`. Toute écriture/lecture passe par lui. Point clé : **quand on enregistre un adapter, il est automatiquement enveloppé** par le `NexusInterceptor`, lui-même branché sur le `SovereignGuard` :

```
Nexus.adapter = new FirestoreAdapter()
   → wrap automatique → NexusInterceptor(adapter, SovereignGuard, () => activeTenant)
```

On ne peut donc pas écrire en base sans passer la barrière de souveraineté. C'est le pilier de sécurité du système.

### Adapters disponibles (`src/lib/adapters/`)

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

Groupes de routes sous `src/app/` (mesuré le 2026-08-12). **Deux familles `(public)` distinctes** — voir aussi `CLAUDE.md` :

- **`(admin)`** — console plateforme (indépendante du tenant) : `admin` (MCC), `audit-portal`, `system-map`, `blueprint`, `design-system`, `simulator`, `settings`, `account-settings`.
- **`(client)/(ops)`** — app tenant authentifiée (~30 routes) : `pos`, `pos-mobile`, `kds`, `kitchen`, `bar`, `floor-plan`, `operations`, `inventory`, `registre`, `haccp`, `nf525`, `finance`, `reservations`, `crm`, `marketing`, `menu-builder`, `menu-engineering`, `staff`, `planning`, `leaves`, `timeclock`, `recruitment`, `analytics`, `intelligence`, `integrations`, `onboarding`, `migration`, `mon-espace`, `aide`, `welcome-staff`, `vanguard-simulator`.
- **`(client)/(public)`** — pages **TENANT** (tenant résolu par l'URL) : `landing`, `showcase`, `menu`, `login`, `signup`, `welcome`, `groups`, `auth`, `docs`.
- **`(public)`** — pages **PLATEFORME** (sans tenant) : `legal`, `status`.
- **`[slug]`** — route dynamique par tenant : `reservations`.
- **`api/`** — ~35 handlers : `billing` (Stripe webhook), `finance`, `haccp`, `inventory`, `hr`, `reservations`, `delivery`, `crm`, `promotions`, `connectors`, `brand`, `ai`/`oracle`/`gemini-live`, `agent`, `print`, `push`, `email`, `webhooks`, `tenant`, `resolve-domain`, `health`, `status`, `cron`, `signup`, `auth`, `admin`, `fleet`, `google`, `widget`, `menu.json`.

`src/app/layout.tsx` monte les Providers globaux (dont `NexusPulseOrchestrator`). C'est un point chaud (god file + couplage app→providers).

---

## 8. Tests & qualité

- **39 fichiers de test** (Vitest + Playwright).
- `src/__tests__/` : `lockdown.test.ts`, `stress/` (ex. `NexusInterceptor.stress.test.ts`), `infrastructure/`.
- `src/e2e/vanguard/` : tests « vanguard » (dont `simulacra.test.ts`), benchmarks.
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
