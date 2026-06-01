# RESTAURANT-OS-CORE — Conventions Claude Code

## Architecture

Système multi-tenant en **piliers** (Core, Ops, Finance, Human, Commerce, Logistics, Compliance, Sovereign).
Chaque pilier a : `modules/`, `engines/`, `store/pillars/`, `domain/schemas/`.

**Nexus** = couche d'accès données (adapters : Firestore / Simulacra / Mock).
**SovereignGuard** = barrière cross-tenant — ne jamais contourner.

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
./scripts/preflight.sh     # Vérification complète avant PR
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
