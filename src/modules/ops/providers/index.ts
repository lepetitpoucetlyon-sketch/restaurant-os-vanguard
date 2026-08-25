export { NexusOpsProvider, useNexusOps, useFloorOps } from './NexusOpsProvider';
export * from './ops-contract';
export * from './hooks';
// opsCore (guardedAction/sanitizeToSovereign/createSovereignHook) est un détail
// d'implémentation interne à providers/ — non exposé dans le barrel public
// pour éviter le cycle providers/index → hooks → kitchenHooks → opsCore → providers/index.
