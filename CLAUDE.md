# RESTAURANT-OS-CORE — Conventions Claude Code

> 📐 Pour une analyse complète (flux NF525, RAG, modèle de données, audit de dette), voir **`ARCHITECTURE.md`**.

## Coordination multi-sessions (OBLIGATOIRE — PREMIÈRE ACTION)

Plusieurs sessions Claude Code tournent en parallèle sur ce repo. **AVANT toute autre action** (même lire du code) :

1. **Lire** `.claude/sessions.md`
2. **S'inscrire** : ajouter une ligne au tableau avec un nom court, ton périmètre (dossiers/fichiers que tu vas toucher), la date, et `active`
3. **Vérifier** : si une autre session `active` couvre le même périmètre → **STOP, demander à l'utilisateur**
4. **À la fin** : passer ton status à `terminée`

Si tu ne t'inscris pas, tu risques d'écraser le travail d'une autre session sans le savoir.

## Architecture

Système multi-tenant en **8 piliers** avec une couche intermédiaire de **domaines universels** (2-3 par pilier).
Structure canonique : `src/modules/<pilier>/<domaine>/<module>/` — l'infrastructure (providers, connectors, hooks, services, store, domain, migration) reste à la racine du pilier.

### Arborescence des piliers et domaines

| Pilier | Domaines | Modules principaux |
|--------|----------|-------------------|
| **ops** | `service/` · `production/` · `workflow/` | service: pos, bar, printers, frontdesk · production: kds, kitchen, recipes · workflow: engine |
| **commerce** | `acquisition/` · `relation/` · `fidelite/` | acquisition: marketing, seo, landing · relation: reservations, crm, customers, delivery · fidelite: loyalty, quotes, widgets |
| **finance** | `comptabilite/` · `tresorerie/` · `fiscalite/` | comptabilite: accounting, billing, fec, documents, analytics · tresorerie: banking, payout, collection, ap · fiscalite: tax |
| **compliance** | `qualite/` · `securite/` · `reglementaire/` | qualite: haccp, iot, recall, donation, calendar · securite: audit · reglementaire: rgpd |
| **human** | `effectifs/` · `remuneration/` | effectifs: hr · remuneration: payroll |
| **logistics** | `stock/` · `approvisionnement/` | stock: inventory · approvisionnement: reception, procurement |
| **intelligence** | `analytique/` · `ia/` · `knowledge/` | analytique: analytics, reports, attendance, anomaly · ia: ai, agency, fleet, simulator, resilience, tools · knowledge: rag |
| **facility** | `spaces/` · `maintenance/` · `assets/` | spaces: floor-plan, settings · maintenance: registre |

**Règle du Barrel renforcée** : importer uniquement depuis `@/modules/<pilier>` (barrel racine). Tout import vers `@/modules/<pilier>/<domaine>/...` est une violation — sauf pour les tests qui mockent des chemins spécifiques.

**Nexus** = couche d'accès données (adapters : Firestore / Simulacra / Mock).
Le singleton `Nexus` (`src/lib/nexus/NexusAdapter.ts`) enveloppe **automatiquement** tout adapter avec `NexusInterceptor` + `SovereignGuard`.
**SovereignGuard** = barrière cross-tenant — ne jamais contourner.

**Anti-cycles** : `src/store/base.ts` est le module neutre (`NexusNode`, `updateNexusNode`) ; les types/helpers partagés y vont pour éviter les dépendances circulaires Registry ↔ Atomes.

**i18n** : `src/i18n/` existe (domains/ 464 lignes) mais **0 composant UI ne l'utilise** — l'app est monolingue français en dur. Infrastructure conservée en squelette pour une future internationalisation, mais inactive. Ne pas câbler i18n dans de nouveaux composants sans décision explicite.

**Migration Monolithe Modulaire (Règle du Barrel)** : Un module n'exporte que ce que son `index.ts` expose. Tout import qui court-circuite ce barrel est une violation d'architecture. Le barrel de chaque pilier (ex: `src/modules/ops/index.ts`) est la seule surface d'export publique — les domaines et modules internes ne sont pas importables directement.

### Les 3 canaux légitimes de communication cross-module
1. `import { X } from '@/modules/<pilier>'` (Types, hooks, composants publics)
2. `Nexus.adapter.get/set(...)` (Données persistées)
3. `NexusEventBus.emit/on(...)` (Effets de bord async)

**Rapatriement progressif** : Le code métier est encore dispersé sur 8 racines (`components/`, `domain/`, `engines/`, etc.). Règle de non-régression : **tout nouveau code d'un pilier va dans `src/modules/<pilier>/`**. À chaque passage sur un fichier orphelin dans `components/` ou `domain/`, le rapatrier vers le bon pilier. Ne jamais créer de nouveau fichier dans `components/<pilier>/` ou `domain/<pilier>/` si `modules/<pilier>/` peut l'accueillir.

## Conventions critiques

### Monnaie — MICROUNITS OBLIGATOIRE
- **1 microunit = 0,000 001 €** (1 000 000 µ = 1 €)
- Tous les prix en champs `*InMicrounits` (jamais `*InCents` dans le nouveau code)
- Helper : `toMicrounits(val)` depuis `@/domain/schemas/primitives`
- Type branded : `Microunits` — cast via `toMicrounits()`, jamais `as Microunits` direct

### NF525 — Immuabilité fiscale
- `journalEntries`, `fiscalSeals`, `fiscalLedger` : **jamais delete, jamais update**
- Toute vente POS → `FinancialNexusBridge.processOrder()` → JournalEntry + FiscalSeal chaîné
- Hash chaîne : SHA-256(dataSnapshot + previousHash) via `CryptoService`

### Multi-tenancy Suzerain/Vassal
- Toute écriture Nexus : path `tenants/{tenantId}/{collection}/{id}`
- `tenantId` = `activeTenantId` depuis `useTenant()` (jamais hardcodé)
- Collections protégées dans `SovereignGuard` : ne pas ajouter sans autorisation

### Types
- Schémas Zod dans `src/domain/schemas/` → typage auto via `z.infer<>`
- Contrats dans `src/shared/nexus/contracts/` (interfaces runtime)
- `CartItem` ops = `src/modules/ops/workflow/engine/types.ts` (microunits)
- `CartItem` legacy = `src/modules/ops/service/pos/hooks/usePos.ts` (cents → bridge via `toMicrounits`)

### PlatformVariant — multi-industrie
- Variants supportés : `restaurant | hotel | bakery | garage | salon | clinic | retail | custom`
- DNA templates dans `src/shared/seeds/` — `resolveDNA(variant)` route vers le bon template
- Nav gating : `filterByCapabilities(sections, tenant.capabilities)` dans `src/config/navConfig.ts`
- `variant` dans `TenantConfigSchema` (optionnel, défaut `'restaurant'` à runtime dans `TenantSeeder`)

## Structure `lib/` — couches transversales

`src/lib/` regroupe tout ce qui est **transversal mais pas un pilier métier**.
Les sous-dossiers ci-dessous sont la cible de migration (barrels logiques déjà en place) :

```
lib/
├── nexus/      ← machine core : NexusAdapter, NexusInterceptor, types, adapters Firestore
│                 NE PAS y mettre de logique métier
├── mcc/        ← outils Multi-Cloud-Control (admin platform)
├── icm/        ← TaskContext, ICM-lite chargement sélectif par route
├── cron/       ← jobs planifiés (DLCExpiryJob, QuoteReminderJob, IotOfflineMonitor…)
├── services/   ← barrel → BrandingService, CryptoService, IdentityManager…
│                 (fichiers sources encore à la racine lib/ — migration post-versionbase)
├── utils/      ← barrel → dates, formatters, helpers, constants, bloom-filter…
└── adapters/   ← barrel → firebase, axiom, sentry, audit, email-service…
```

**Règle lib/nexus vs shared/nexus** :

| `lib/nexus/` | `shared/nexus/` |
|---|---|
| Machine core : `NexusAdapter.ts`, `NexusInterceptor.ts`, types primitifs, adapters Firestore/Simulacra/Mock | Logique métier : guards, contracts, engines, state, vault, tokens |
| Aucune dépendance vers `modules/` ou `shared/` | Peut importer `lib/nexus/` |
| Instanciation du singleton `Nexus` | Utilise le singleton |

**Règle d'import** : toujours `@/lib/<ServiceName>` (chemin direct) jusqu'à migration physique.
Les barrels `@/lib/services`, `@/lib/utils`, `@/lib/adapters` sont disponibles mais non obligatoires.

## Routes publiques — deux groupes distincts

```
app/(public)/              ← pages PLATEFORME (indépendantes du tenant)
│   ├── legal/             — mentions légales, CGV
│   └── status/            — page statut système
│
app/(client)/(public)/     ← pages TENANT (contextuelles au tenant courant)
    ├── landing/           — landing page personnalisée
    ├── showcase/          — menu/vitrine publique
    └── login/             — authentification
```

Ce n'est **pas un doublon** — les layouts et middlewares sont différents :
- `(public)` : pas de tenant requis, pas de `NexusOpsProvider`
- `(client)/(public)` : tenant résolu depuis l'URL (`?tenant=` ou sous-domaine), layout client actif

**Piège courant** : `app/(public)/demo/` est l'**ancien** système de démo (à supprimer post-versionbase Sprint 1).
La démo officielle passe par `_demo_*` tenants bootstrappés via `TenantSeeder`.

## ICM-lite — Chargement sélectif par route

Chaque route a une **importance map** déclarée dans `src/lib/icm/TaskContext.ts`.
`NexusOpsProvider` résout automatiquement la map via `useTaskContext()` (lit le pathname).
`NexusSyncService.init(tenantId, taskContext)` n'initialise que les modules HIGH/MEDIUM.

| Route | Modules chargés |
|-------|----------------|
| `/pos` | orders, tables, products, categories |
| `/kds` | orders, tables, recipes |
| `/finance` ou `/audit` | finance, compliance |
| `/operations` | orders, tables, stocks, compliance |
| `/admin` | tout |

**Pour ajouter une nouvelle route :** ajouter une entrée dans `TASK_MAPS` et un cas dans `resolveTaskContext()`.

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/modules/finance/comptabilite/FinancialNexusBridge.ts` | Bridge POS → JournalEntry NF525 |
| `src/modules/finance/fiscalite/FiscalAdapter.ts` | `FiscalEngine.sealEntry()` — chaîne de scellement |
| `src/domain/schemas/pos.ts` | `PosTicket`, `CartLine` (schéma canonique) |
| `src/domain/schemas/finance.ts` | `JournalEntry` (Zod) |
| `src/lib/nexus/NexusAdapter.ts` | Singleton Nexus |
| `src/modules/finance/providers/NexusFiscalProvider.tsx` | Context fiscal React |
| `src/modules/intelligence/knowledge/rag/HermesKnowledgeManager.ts` | Orchestrateur LightRAG |
| `src/modules/intelligence/knowledge/rag/LightRAGClient.ts` | Client REST LightRAG (retry intégré) |

## Architecture Decision Records (ADRs)

Les décisions fondamentales du socle sont documentées dans `docs/adrs/` :
- `ADR-001` : Normalisation obligatoire de l'eventId & Idempotence par défaut
- `ADR-002` : Isolation contextuelle multi-tenant & Membrane SovereignGuard
- `ADR-003` : Scellement fiscal inaltérable NF525 & Archives WORM
- `ADR-004` : Architecture multi-verticales universelle & Vertical Forge
- `ADR-005` : Résilience déconnectée, Outbox atomique & Dead Letter Queue (DLQ)

## Commandes

```bash
npx tsc --noEmit          # Vérification types
npx vitest run             # Tests (175 suites, 1120+ tests)
npm run preflight          # Gate complète d'intégrité (TypeScript, tests, ESLint, sentrux, Next.js build)
sentrux check .            # Gate architectural (cycles, god files, couches) — voir .sentrux/
docker-compose up          # App + LightRAG sidecar
```

## Stack

- Next.js 16 App Router + TypeScript strict (12 verticales unifiées)
- Firebase Firestore (local-first IndexedDB cache Dexie)
- Jotai 2 (state management par pilier)
- Zod 4 (validation + typage)
- Vitest + Playwright (tests)
- Google Gemini API (AI)
- LightRAG Python sidecar (port 9621, Knowledge Graph RAG)

