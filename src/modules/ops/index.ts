export * from './engine';
export * from './pos';
export * from './kitchen';
export * from './kds';
export { useNexusOps, useOrders, useKitchen, useFloorOps, useManagement, useAllocations, useReservations, useCRM, useTables } from '@/engines/ops/NexusOpsProvider';
export { usePOSController } from './pos/hooks/usePos';
// 🛒 usePOSController is now imported from @modules/ops/pos
export type { Order, OrderItem } from './engine';
// FloorPlanEditor (konva + react-reconciler ~1.2MB) must be lazy-loaded via next/dynamic.
// Import the RUNTIME component directly from '@modules/ops/engine/components/floor-plan/FloorPlanEditor'.
// Only the TYPES are re-exported here — types are erased at compile time so they don't drag konva into the bundle.
export type { FloorPlanEditorRef } from './engine/components/floor-plan/FloorPlanEditor';
