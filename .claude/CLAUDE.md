<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.

### Restaurant OS — query patterns

Architecture: 8 piliers (`ops/commerce/finance/compliance/human/logistics/intelligence/facility`), barrel imports `@/modules/<pilier>`, NexusEventBus async messaging, SovereignGuard multi-tenant isolation.

**Effective queries by task type:**

| Task | Query pattern |
|------|---------------|
| Comprendre un module | `"<ModuleName> barrel exports"` ou `"index.ts in modules/<pilier>/<domaine>"` |
| Trouver les handlers d'un event | `"NexusEventBus <event.name>"` (ex: `"NexusEventBus support.ticket_submitted"`) |
| Impact d'un changement | `"<SymbolName> callers and dependents"` |
| Flux NF525 / fiscal | `"FinancialNexusBridge processOrder FiscalEngine sealEntry"` |
| Schéma Zod d'une entité | `"<SchemaName>Schema"` (ex: `"PosTicketSchema"`) |
| Guard / sécurité tenant | `"SovereignGuard"` ou `"requireMccLevel"` |
| Atoms Jotai d'un pilier | `"atom in modules/<pilier>"` |
| Route Next.js | `"route.ts in app/<path>"` ou `"page.tsx in app/<path>"` |
| Config verticale | `"PlatformVariant"` ou `"resolveDNA"` |
| Cross-module coupling | `"<ModuleA> <ModuleB>"` — CodeGraph montre les call paths entre les deux |

**Tips:**
- Toujours nommer les symboles précis plutôt que des termes vagues
- Pour un audit blast-radius, combiner : `"<Symbol> callers dependents imports"`
- Les handlers NexusEventBus sont dans `src/orchestration/handlers/` — query `"handlers/<domain>"` pour les lister
<!-- CODEGRAPH_END -->
