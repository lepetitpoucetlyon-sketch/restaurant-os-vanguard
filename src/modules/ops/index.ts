// Domaine : workflow (engine, operations dashboard)
export * from './workflow/engine';
export type { Order, OrderItem } from './workflow/engine';
export { OperationsDashboard } from './workflow/engine/components/OperationsDashboard';

// Domaine : service (POS, bar, frontdesk, printers)
export * from './service/pos';
export { usePOSController } from './service/pos/hooks/usePos';

// Domaine : production (KDS, kitchen, recipes)
export * from './production/kitchen';
export * from './production/kds';
export { KDSDashboard } from './production/kds/components/KDSDashboard';
export { KitchenDashboard } from './production/kitchen/components/KitchenDashboard';

// Infrastructure pilier (providers, connectors)
export { NexusOpsProvider, useOrders, useTables, useKitchen } from './providers';
export { useGroups } from './providers/hooks/commerceHooks';
// Factories server-only : importées directement par les routes API, pas ici

// Cross-pilier (facility)
// eslint-disable-next-line no-restricted-imports
export type { FloorPlanEditorRef } from '@/modules/facility/spaces/floor-plan/FloorPlanEditor';
