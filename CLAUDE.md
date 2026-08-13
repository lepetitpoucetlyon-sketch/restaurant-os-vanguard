# RESTAURANT-OS-CORE — Conventions Claude Code

> 📐 Analyse complète (flux NF525, RAG, modèle de données, dette) : **`ARCHITECTURE.md`**.
> ⚠️ `ARCHITECTURE.md` contient encore des chemins d'avant la migration `kernel/` — se fier à ce fichier-ci pour les chemins.

## Coordination multi-sessions (OBLIGATOIRE — PREMIÈRE ACTION)

Plusieurs sessions Claude Code tournent en parallèle. **AVANT toute autre action** (même lire du code) :

1. **Lire** `.claude/sessions.md`
2. **S'inscrire** : une ligne au tableau (nom court, périmètre, date, `active`)
3. **Vérifier** : si une session `active` couvre le même périmètre → **STOP, demander à l'utilisateur**
4. **À la fin** : passer le status à `terminée`

Sans inscription, tu risques d'écraser le travail d'une autre session.

## NexusCoder — stack d'économie de tokens (DEUXIÈME ACTION)

Après l'inscription session, invoquer la skill `nexuscoder` (chargée depuis
`~/.claude/skills/nexuscoder/SKILL.md`). Elle référence :

- `~/.nexuscoder/domain-facts.yml` — 15+ invariants Restaurant OS auto-injectables selon les fichiers touchés
- `~/.nexuscoder/routing-rules.yml` — table de routage question → outil optimal
- Slash commands projet : `/audit-pilier`, `/impact`, `/resume-projet`, `/comprendre`

**Règle de routage stricte pour toute question code intelligence** (ordre coût croissant) :

1. **Serena** MCP (`find_symbol`, `find_references`) — refs/definitions, ~200-500 tok
2. **Graphify** CLI (`graphify query`, `graphify path`, `graphify affected`) — structure/paths sans source, ~500-2k tok
3. **ast-grep** CLI (`ast-grep -p '<pattern>' -l ts`) — recherche AST structurelle, ~500-2k tok
4. **octofs** MCP (`view`, `batch_edit`) — Read/Grep optimisés avec IDs ligne-hash, économie 60-75% sur relectures
5. **CodeGraph** MCP (`codegraph_explore`) — source verbatim, **UNIQUEMENT** si édition prévue, ~15-24k tok
6. **Read** natif — dernier recours, TOUJOURS avec offset/limit si fichier >500 lignes

**Interdictions dures** :
- Pas de `grep` textuel sur `src/` sans scope (hook `nexuscoder-pretool.sh` bloque déjà)
- Pas de `Read` fichier >500 L sans offset (hook bloque)
- Pas de `Read` sur `.codegraph/`, `node_modules/`, `.next/`, `.git/`, `.firebase/` (hook bloque)
- Pas de redécouverte d'un invariant listé dans `domain-facts.yml` — le citer

## Architecture — piliers & domaines

Système multi-tenant en **8 piliers métier** (+ `mcc`, outillage plateforme), avec une couche de **domaines universels** (2-4 par pilier).
Structure canonique : `src/modules/<pilier>/<domaine>/<module>/`. L'infrastructure (providers, connectors, hooks, services, store, domain, migration) reste à la racine du pilier.

| Pilier | Domaines |
|--------|----------|
| **ops** | `service/` · `production/` · `workflow/` |
| **commerce** | `catalog/` · `acquisition/` · `relation/` · `fidelite/` |
| **finance** | `comptabilite/` · `tresorerie/` · `fiscalite/` |
| **compliance** | `qualite/` · `securite/` · `reglementaire/` |
| **human** | `effectifs/` · `remuneration/` |
| **logistics** | `stock/` · `approvisionnement/` · `fleet/` · `dispatch/` |
| **intelligence** | `analytique/` · `ia/` · `knowledge/` |
| **facility** | `spaces/` · `maintenance/` · `assets/` |

> Les modules d'un domaine se listent par `ls src/modules/<pilier>/<domaine>/`.

### Règle du Barrel (non négociable)
Un module n'exporte que via son `index.ts`. On importe **uniquement** depuis le barrel racine du pilier : `import { X } from '@/modules/<pilier>'`. Tout import vers `@/modules/<pilier>/<domaine>/...` est une violation (sauf tests qui mockent un chemin précis).

### Les 3 canaux légitimes cross-module
1. `import { X } from '@/modules/<pilier>'` — types, hooks, composants publics
2. `Nexus.adapter.get/set(...)` — données persistées
3. `NexusEventBus.emit/on(...)` — effets de bord async

### Décisions d'architecture canoniques
1. **Emplacement du métier** : le code métier vit **exclusivement** dans les piliers (`src/modules/<pilier>/`), jamais dans `src/verticals/`. *« Un bug = un endroit à toucher »*. Les verticales ne déclarent que types/config/adapters spécifiques (ex. `repair-intake` → `modules/ops/service/`, pas `verticals/garage/`).
2. **Motif interne** : `components/hooks/services/store`. L'hexagonal (ports & adapters) est réservé aux modules multi-implémentations (`e-invoicing`, `open-banking`).
3. **RBAC** : par **NIVEAUX** numériques universels (100 owner … 10 support) comparés via `minLevel` dans `ACTION_MAP`. Les **LIBELLÉS** (`roleLabels: Record<number, string>`) sont configurables par verticale sans toucher la matrice.

**Rapatriement progressif** : du code métier subsiste sur d'anciennes racines (`components/`, `domain/`, `engines/`…). Règle de non-régression : **tout nouveau code d'un pilier va dans `src/modules/<pilier>/`** ; à chaque passage sur un orphelin, le rapatrier. Ne jamais créer un fichier dans `components/<pilier>/` ou `domain/<pilier>/` si `modules/<pilier>/` peut l'accueillir.

**Anti-cycles** : `src/store/base.ts` = module neutre (`NexusNode`, `updateNexusNode`) ; les types/helpers partagés y vont pour éviter les cycles Registry ↔ Atomes.

**i18n INACTIF** : `src/i18n/` existe mais **0 composant ne l'utilise** (app monolingue FR en dur). Ne pas câbler i18n dans un nouveau composant sans décision explicite.

## Conventions critiques

### Monnaie — MICROUNITS OBLIGATOIRE
- **1 microunit = 0,000 001 €** (1 000 000 µ = 1 €)
- Prix en champs `*InMicrounits` (jamais `*InCents` dans le nouveau code)
- Helper `toMicrounits(val)` depuis `@/shared/schemas/primitives` — type branded `Microunits`, jamais `as Microunits` direct

### NF525 — Immuabilité fiscale
- `journalEntries`, `fiscalSeals`, `fiscalLedger` : **jamais delete, jamais update**
- Vente POS → `FinancialNexusBridge.processOrder()` → JournalEntry + FiscalSeal chaîné
- Hash chaîne : SHA-256(dataSnapshot + previousHash) via `CryptoService`

### Multi-tenancy Suzerain/Vassal
- Toute écriture Nexus : path `tenants/{tenantId}/{collection}/{id}`
- `tenantId` = `activeTenantId` depuis `useTenant()` (jamais hardcodé)
- `SovereignGuard` (`src/kernel/nexus/guards/`) = barrière cross-tenant — **ne jamais contourner** ; ne pas ajouter de collection protégée sans autorisation

### Types & schémas
- Schémas **Zod** par pilier : `src/modules/<pilier>/domain/schemas/` → typage auto via `z.infer<>`. Primitives partagées : `src/shared/schemas/primitives.ts`.
- Contrats runtime (interfaces) : `src/kernel/nexus/contracts/`
- `CartItem` ops = `src/modules/ops/workflow/engine/types.ts` (microunits) · `CartItem` legacy = `src/modules/ops/service/pos/hooks/usePos.ts` (cents → bridge via `toMicrounits`)

### PlatformVariant — multi-industrie
- Variants : `restaurant | hotel | bakery | garage | salon | clinic | retail | custom`
- DNA templates dans `src/lib/seeds/` — `resolveDNA(variant)` (`src/lib/seeds/index.ts`) route vers le bon template
- Nav gating : `filterByCapabilities(sections, tenant.capabilities)` dans `src/config/navConfig.ts`
- `variant` dans `TenantConfigSchema` (défaut `'restaurant'` à runtime dans `TenantSeeder`)

## Couches machine — `kernel/` vs `lib/`

> Issu du rapatriement `shared/` + `lib/nexus` → `kernel/` (terminé). `src/lib/nexus/` et `src/shared/nexus/` **n'existent plus**.

- **`src/kernel/`** = machine core Nexus, **aucune logique métier**. Singleton `Nexus` : `src/kernel/adapter/NexusAdapter.ts` (+ `NexusInstance.ts`, `NexusInterceptor.ts`). Guards : `src/kernel/nexus/guards/`. Contrats : `src/kernel/nexus/contracts/`. Le singleton enveloppe **automatiquement** tout adapter avec `NexusInterceptor` + `SovereignGuard`.
- **`src/lib/`** = services transversaux non-métier : `icm/`, `cron/`, `seeds/`, `sync/`, `services/`, `utils/`, `adapters/`, `mcc/`. Import direct `@/lib/<Service>` (barrels `@/lib/{services,utils,adapters}` dispo mais optionnels).

## Routes publiques — deux groupes à ne pas confondre

- `app/(public)/` = pages **PLATEFORME** (`legal/`, `status/`) — pas de tenant, pas de `NexusOpsProvider`.
- `app/(client)/(public)/` = pages **TENANT** (`landing/`, `showcase/`, `login/`) — tenant résolu depuis l'URL (`?tenant=` ou sous-domaine).
- **Piège** : `app/(public)/demo/` = ancien système démo (à supprimer). La démo officielle = tenants `_demo_*` bootstrappés via `TenantSeeder`.

## ICM-lite — chargement sélectif par route

Chaque route déclare une importance map dans `src/lib/icm/TaskContext.ts`. `NexusOpsProvider` la résout via `useTaskContext()` (pathname) ; `NexusSyncService.init()` n'initialise que les modules HIGH/MEDIUM.
**Nouvelle route** : ajouter une entrée dans `TASK_MAPS` + un cas dans `resolveTaskContext()`.

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/kernel/adapter/NexusAdapter.ts` | Singleton Nexus + wrap auto Interceptor/SovereignGuard |
| `src/kernel/nexus/guards/SovereignGuard.ts` | Barrière cross-tenant + immuabilité fiscale |
| `src/modules/finance/comptabilite/FinancialNexusBridge.ts` | Bridge POS → JournalEntry NF525 |
| `src/modules/finance/fiscalite/FiscalAdapter.ts` | `FiscalEngine.sealEntry()` — chaîne de scellement |
| `src/modules/ops/domain/schemas/pos.ts` · `src/modules/finance/domain/schemas/finance.ts` | `PosTicket`/`CartLine` · `JournalEntry` (Zod) |
| `src/orchestration/NexusEventBus.ts` | Bus d'événements (CRITICAL/HIGH/BACKGROUND) |
| `src/modules/intelligence/knowledge/rag/HermesKnowledgeManager.ts` | Orchestrateur LightRAG |

## Commandes

```bash
npx tsc --noEmit          # Vérification types
npx vitest run            # Tests
sentrux check .           # Gate architectural (cycles, god files, couches) — voir .sentrux/
./scripts/preflight.sh    # Vérification complète avant PR (inclut sentrux)
docker-compose up         # App + LightRAG sidecar
```

## Stack

Next.js 16 App Router · TypeScript strict · Firebase Firestore (cache IndexedDB local-first) · Jotai 2 (state par pilier) · Zod 4 · Vitest + Playwright · Google Gemini API · LightRAG Python sidecar (port 9621, Knowledge Graph RAG).
