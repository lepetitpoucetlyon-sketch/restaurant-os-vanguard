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

Système multi-tenant en **piliers** (Core, Ops, Finance, Human, Commerce, Logistics, Compliance, Sovereign).
Chaque pilier a : `modules/`, `engines/`, `store/pillars/`, `domain/schemas/`.
Piliers réels dans `src/modules/` : `ops, commerce, compliance, finance, human, logistics, intelligence, kds`.

**Nexus** = couche d'accès données (adapters : Firestore / Simulacra / Mock).
Le singleton `Nexus` (`src/lib/nexus/NexusAdapter.ts`) enveloppe **automatiquement** tout adapter avec `NexusInterceptor` + `SovereignGuard`.
**SovereignGuard** = barrière cross-tenant — ne jamais contourner.

**Anti-cycles** : `src/store/base.ts` est le module neutre (`NexusNode`, `updateNexusNode`) ; les types/helpers partagés y vont pour éviter les dépendances circulaires Registry ↔ Atomes.

**i18n** : `src/i18n/` existe (domains/ 464 lignes) mais **0 composant UI ne l'utilise** — l'app est monolingue français en dur. Infrastructure conservée en squelette pour une future internationalisation, mais inactive. Ne pas câbler i18n dans de nouveaux composants sans décision explicite.

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
- `CartItem` ops = `src/modules/ops/engine/types.ts` (microunits)
- `CartItem` legacy = `src/modules/pos/hooks/usePos.ts` (cents → bridge via `toMicrounits`)

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
| `src/infrastructure/adapters/FinancialNexusBridge.ts` | Bridge POS → JournalEntry NF525 |
| `src/infrastructure/adapters/FiscalAdapter.ts` | `FiscalEngine.sealEntry()` — chaîne de scellement |
| `src/domain/schemas/pos.ts` | `PosTicket`, `CartLine` (schéma canonique) |
| `src/domain/schemas/finance.ts` | `JournalEntry` (Zod) |
| `src/lib/nexus/NexusAdapter.ts` | Singleton Nexus |
| `src/engines/fiscal/NexusFiscalProvider.tsx` | Context fiscal React |
| `src/modules/intelligence/rag/HermesKnowledgeManager.ts` | Orchestrateur LightRAG |
| `src/modules/intelligence/rag/LightRAGClient.ts` | Client REST LightRAG (retry intégré) |

## Commandes

```bash
npx tsc --noEmit          # Vérification types
npx vitest run             # Tests
sentrux check .            # Gate architectural (cycles, god files, couches) — voir .sentrux/
./scripts/preflight.sh     # Vérification complète avant PR (inclut sentrux)
docker-compose up          # App + LightRAG sidecar
```

## Stack

- Next.js 16 App Router + TypeScript strict
- Firebase Firestore (local-first IndexedDB cache)
- Jotai 2 (state management par pilier)
- Zod 4 (validation + typage)
- Vitest + Playwright (tests)
- Google Gemini API (AI)
- LightRAG Python sidecar (port 9621, Knowledge Graph RAG)
