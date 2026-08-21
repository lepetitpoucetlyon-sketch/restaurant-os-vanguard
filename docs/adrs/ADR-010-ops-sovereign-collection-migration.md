# ADR-010 — Migration du pilier ops vers useSovereignCollection

- **Statut** : Adopté (Phase 2 — 2026-08-21)
- **Décideur** : session Claude Code + patron
- **Contexte** : Plan Master P4.3, suite d'ADR-009 (Phase 1 finance)
- **Successeur** : à définir (Phase 3 logistics, puis commerce, facility)

## Contexte

L'ADR-009 (Phase 1) a livré le pattern de migration sur le pilier finance
avec `expenseClaims`. Le pattern est reproductible :
1 adapter métier `useSovereign<X>` + 1 composant preuve + tests ≥ 6 + entrée
au barrel + garde-fou NF525 respecté.

Le pilier ops est le **cœur opérationnel** du produit (POS, KDS, plan de salle,
réservations). Il concentre :
- Le trafic UI le plus élevé (chaque service = centaines d'orders)
- Les cas d'usage offline les plus critiques (réseau instable en salle)
- Les collections MUTABLES les plus visibles pour l'utilisateur

## Décision

Migrer **trois collections mutables du pilier ops** dans une seule phase :

| Collection | Adapter | Cas d'usage cible |
|---|---|---|
| `orders` | `useSovereignOrders` | POS / KDS / expédition — cycle pending→cooking→ready→served→paid |
| `tables` | `useSovereignTables` | Plan de salle — statut, position, capacité |
| `reservations` | `useSovereignReservations` | Booking — cycle pending→confirmed→seated→completed |

### Implémentation

**Adapters** — `src/modules/ops/hooks/`
- `useSovereignOrders.ts` : `create / setStatus / cancel / markPaid / setItemStatus / remove`
  - Filtres : `statusFilter` (single ou tableau), `tableId`
  - Renomme les types en `SovereignOrderStatus` / `SovereignOrderLineStatus`
    pour éviter la collision avec les types legacy du workflow engine.
- `useSovereignTables.ts` : `create / setStatus / free / occupy / setCleaning / updatePosition / updateSeats / remove`
  - Filtres : `statusFilter`, `zoneId`, `floorId`
- `useSovereignReservations.ts` : `create / confirm / seat / complete / cancel / noShow / assignTable / remove`
  - Filtres : `statusFilter`, `dateFilter` (ISO YYYY-MM-DD)

**Composant preuve** — `src/modules/ops/production/kds/components/OrdersLiveBoard.tsx`
- Kanban KDS 4 colonnes : pending → cooking → ready → served
- Optimistic UI, indicateur `isSyncing`, badge d'ancienneté
- Actions inline : progression au statut suivant, annulation

**Barrel racine** — `src/modules/ops/index.ts` ré-exporte via `./hooks`.

**Tests** — 22 tests bloquants dans `src/__tests__/ops/` :
- `useSovereignOrders.test.ts` (7 tests) : cycle complet, ligne KDS, filtre table
- `useSovereignTables.test.ts` (6 tests) : statuts, position, validation seats, zone
- `useSovereignReservations.test.ts` (6 tests) : cycle, cancel/noShow, dateFilter
- + 3 tests non-régression NF525 (bloque `journalEntries` mais autorise
  `orders`/`tables`/`reservations`)

### Ne PAS migrer côté ops

| Collection | Raison |
|---|---|
| `orderItemModifications` | Sous-document embedded d'`Order` — pas de collection propre |
| `fiscalSeals` / `journalEntries` | IMMUABLES NF525 (dérivés du `markPaid` via `FinancialNexusBridge`) |
| `printerJobs` | Éphémères / hardware — pipe dédié via printer adapter |
| `station` (KDS) | Config statique, gérée via tenantConfig |

## Conséquences

### Positives
- 3 collections critiques passent sur le pattern offline-first.
- Le KDS résiste à une coupure réseau : les changements de statut (ready,
  served) restent visibles immédiatement en salle, la synchro reprend au
  retour du réseau.
- La chaîne complète service → cuisine → paiement est instrumentable
  via un seul hook par collection.
- `OrdersLiveBoard` peut être réutilisé tel quel comme brique KDS dans les
  verticales bakery, salon, garage — le hook filtre par tenant.

### Négatives / Points d'attention
- Le `markPaid` du hook change simplement le statut de l'ordre — il NE
  déclenche PAS `FinancialNexusBridge.processOrder()` (qui reste appelé
  par le flow POS legacy). La chaîne fiscale NF525 n'est PAS altérée.
- La collision de types `OrderStatus` a été résolue par un renommage
  (`SovereignOrderStatus`) — les callers doivent utiliser le bon type
  selon leur origine.
- Le `setItemStatus` lit le `data` du hook (closure) : nécessite d'attendre
  le re-render après un `create` avant d'appeler `setItemStatus` (documenté
  dans le test correspondant).

### Plan de suite

| Phase | Pilier | Collections cibles | Effort estimé |
|---|---|---|---|
| ✅ 1 | finance | expenseClaims | — livré (ADR-009) |
| ✅ 2 | ops | orders, tables, reservations | — livré (cette ADR) |
| 3 | logistics | stocks, receipts, supplierInvoices | 1-2 j |
| 4 | commerce | customers, quotes, loyaltyRewards | 1 j |
| 5 | facility | floorPlanElements, maintenanceLogs | 0,5 j |

## Enforcement

Aucun garde CI supplémentaire — la barrière `NF525_IMMUTABLE_COLLECTIONS`
du kernel refuse déjà tout usage frauduleux. Les tests unitaires prouvent
que les collections `orders`/`tables`/`reservations` passent le garde.

## Références

- Kernel : [useSovereignCollection.ts](../../src/kernel/hooks/useSovereignCollection.ts)
- Phase 1 : [ADR-009](ADR-009-finance-sovereign-collection-migration.md)
- Adapters : [useSovereignOrders](../../src/modules/ops/hooks/useSovereignOrders.ts) · [useSovereignTables](../../src/modules/ops/hooks/useSovereignTables.ts) · [useSovereignReservations](../../src/modules/ops/hooks/useSovereignReservations.ts)
- Composant : [OrdersLiveBoard.tsx](../../src/modules/ops/production/kds/components/OrdersLiveBoard.tsx)
- Tests : [useSovereignOrders.test.ts](../../src/__tests__/ops/useSovereignOrders.test.ts) · [useSovereignTables.test.ts](../../src/__tests__/ops/useSovereignTables.test.ts) · [useSovereignReservations.test.ts](../../src/__tests__/ops/useSovereignReservations.test.ts)
- Plan Master : [PLAN_MEGA_100_CLIENTS.md § P4](../plans/PLAN_MEGA_100_CLIENTS.md)
