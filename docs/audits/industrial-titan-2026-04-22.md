# Industrial Titan Audit

Date: 2026-04-22

## Remediations Applied
- Atlas runtime detection is now flexible in [scripts/setup-atlas.js](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/scripts/setup-atlas.js:1). It resolves the Python runtime from the `graphify` shebang first, then falls back to `python3`/macOS paths instead of hardcoding `python3.11`.
- Ops and inventory sync services now hydrate and project snapshot data back into their Jotai nodes in [src/modules/ops/ops.sync.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/modules/ops/ops.sync.ts:1) and [src/modules/inventory/inventory.sync.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/modules/inventory/inventory.sync.ts:1).
- Logger signatures now accept `unknown` payloads in [src/lib/logger.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/lib/logger.ts:1), which removes a class of false-positive TypeScript friction around `Error` objects and structured audit payloads.
- Reservation/settings imports were aligned in [src/modules/ops/store/reservationAtoms.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/modules/ops/store/reservationAtoms.ts:1) and [src/types/settings.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/types/settings.ts:1).
- Stock movement persistence is now deterministic across retries: movement IDs are derived from the transaction correlation path in [src/domain/services/StockEngine.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/domain/services/StockEngine.ts:30), and `NF525Service` persists those IDs directly in [src/modules/finance/services/NF525Service.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/modules/finance/services/NF525Service.ts:84).
- `MasterBridge` now signs and verifies the same payload using a single `NF525_BRIDGE_V1` protocol in [src/lib/MasterBridge.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/lib/MasterBridge.ts:1).
- `SovereignGuard` now signs and verifies critical writes, and the adapter layer applies that guard before persistence in [src/lib/SovereignGuard.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/lib/SovereignGuard.ts:1) and [src/lib/nexus/adapters/FirestoreAdapter.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/lib/nexus/adapters/FirestoreAdapter.ts:1).
- The first shared-types debt wave was reduced in [src/shared/nexus-contract.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/shared/nexus-contract.ts:1), [src/lib/shared-kernel.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/lib/shared-kernel.ts:1), [src/store/masterAtoms.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/store/masterAtoms.ts:1), [src/shared/validation/SchemaRegistry.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/shared/validation/SchemaRegistry.ts:1), and [src/shared/services/SelfHealingEngine.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/shared/services/SelfHealingEngine.ts:1).

## Sector 1: Vitals, Dead Code, Structure

### `OMEGA`
- No remaining `OMEGA` finding in this sector after the bridge signature mismatch was removed. Residual risk has been downgraded to `ALPHA` because the protocol is now coherent but still symmetric and app-managed, not HMAC/asymmetric with external key custody.

### `ALPHA`
- Sync initialization is duplicated in two roots. [src/components/system/NexusServiceInitializer.tsx](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/components/system/NexusServiceInitializer.tsx:19) and [src/engines/ops/NexusOpsProvider.tsx](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/engines/ops/NexusOpsProvider.tsx:170) both call `NexusSyncService.init()` and maintain purge intervals. This creates avoidable start/stop churn during tenant changes and raises the risk of racey re-entry.
- `TimeSync` claims server-grade drift correction, but writes `new Date()` through the adapter in [src/lib/TimeSync.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/lib/TimeSync.ts:32) and only refreshes every 5 minutes in [src/lib/TimeSync.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/lib/TimeSync.ts:52). That is materially weaker than the 500ms signature window expected by `MasterBridge`.

### `BETA`
- The TypeScript baseline is still structurally unstable. `npx tsc --noEmit --pretty false` still reports a large error surface dominated by missing modules, `SovereignData` contract mismatches, duplicate exports, and casing drift. The most concentrated families are in `app/`, `shared/`, `types/`, and cross-module hooks.
- `orderAtoms.ts` no longer contains the `any` hotspot implied by the original prompt, but the surrounding sync/store graph was partially disconnected before this pass. The bigger structural problem is not loose typing inside the file itself; it is the mismatch between node contracts and cross-module consumers.

### `GAMMA`
- Several comments oversell guarantees that the code does not currently provide, especially around “hardware-level isolation”, “ultra-deterministic” sync, and “zero leak policy”. These should be treated as architectural aspirations, not verified properties.

## Sector 2: Logic, NF525, Security

### `OMEGA`
- No remaining `OMEGA` finding in this sector after signed-write enforcement was added for critical collections. Residual risk has been downgraded because the write policy is now real in the adapter path, even if it still relies on app-level symmetric secrets.

### `ALPHA`
- `MasterBridge` now uses a coherent signature protocol, but it still relies on an app-managed shared secret rather than externalized HMAC/asymmetric key material. That is much better than the prior mismatch, but it is not yet industrial-grade cryptographic custody.
- Multi-tenant isolation remains logical, not physical. `NexusAdapter` resolves tenant context from a mutable singleton override plus URL and `localStorage` fallbacks in [src/lib/nexus/NexusAdapter.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/lib/nexus/NexusAdapter.ts:117). That is useful for routing, but it is not a physical isolation boundary.
- `NF525Service` now uses deterministic inventory movement IDs, but the write model still mixes append-only seals with direct updates to orders and stock quantities in [src/modules/finance/services/NF525Service.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/modules/finance/services/NF525Service.ts:121). That needs an explicit reversal/compensation strategy before claiming strong fiscal non-alterability end to end.

### `BETA`
- `NF525Service` records tenant drift and seal generation, but the journal entry payload is still minimal in [src/modules/finance/services/NF525Service.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/modules/finance/services/NF525Service.ts:124). There is no obvious `session_id`/operator-chain evidence at the commit payload boundary.

## Sector 3: Sync, Debt, DX, Completion

### `ALPHA`
- The Bloom filter core is cheap in memory, but its transport path still serializes the whole buffer on the main thread in [src/lib/bloom-filter.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/lib/bloom-filter.ts:68). The worker can evaluate bloom checks in [src/workers/CoreWorker.ts](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/workers/CoreWorker.ts:26), but serialization/offloading is not wired into the fleet path shown here.
- The target of `< 180ms` tenant switching is not yet supported by evidence. The current switch path stops all sync, may reinitialize Firebase, updates local storage, then restarts all services in [src/engines/ops/NexusOpsProvider.tsx](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/engines/ops/NexusOpsProvider.tsx:185). There is no instrumentation in this path proving the budget.

### `BETA`
- DX debt remains high because the current compiler signal is too noisy to act on quickly. The next cleanup pass should group the TypeScript backlog into four tracks: missing imports/modules, casing collisions, `SovereignData` boundary typing, and duplicate/ambiguous re-exports.
- `NexusServiceInitializer` imports `logger` from `@/lib/axiom` in [src/components/system/NexusServiceInitializer.tsx](/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/src/components/system/NexusServiceInitializer.tsx:8), while adjacent code generally uses `@/lib/logger`. That inconsistency is a small but real DX tax around observability.

### `GAMMA`
- The repo still contains stale narrative/code artifacts and high-ceremony comments that make verification slower than it should be. The fastest hygiene win is to align claims, imports, and ownership comments with the real runtime behavior.

## Recommended Next Wave
- Replace `MasterBridge` signatures with a real HMAC or asymmetric verification flow, and make generation/verification use the same format.
- Collapse sync bootstrapping to a single root owner to remove double init/stop cycles.
- Introduce explicit write-policy enforcement at the Nexus adapter or transaction layer so “signed write only” is real, not narrative.
- Split the TypeScript backlog into tracked batches and burn down the casing/module-resolution errors first; they are the cheapest structural wins.
