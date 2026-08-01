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
export * from './providers';
// Factories server-only : importées directement par les routes API, pas ici

// Resolve TS2308 conflicts: providers and workflow/engine both export these
export { useGroups } from './providers/hooks/commerceHooks';
export { useNexusOps, NexusOpsProvider } from './providers/NexusOpsProvider';
export type { Table } from './workflow/engine/tables.types';

// Kitchen components (production/recipes)
export { RecipeCostBadge } from './production/recipes';
export { BarRecipeCard } from './production/recipes';

// Bar types (BarTab, Wine, Cocktail, WineRegion)
export type { BarTab, Wine, Cocktail, WineRegion } from './types/bar';

