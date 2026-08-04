// Domaine : workflow (engine, operations dashboard)
export * from '@/verticals/restaurant/ops/workflow/engine';
export type { Order, OrderItem } from '@/verticals/restaurant/ops/workflow/engine';
export { OperationsDashboard } from '@/verticals/restaurant/ops/workflow/engine/components/OperationsDashboard';

// Domaine : service (POS, bar, frontdesk, printers)
export * from '@/verticals/restaurant/ops/pos';
export { usePOSController } from '@/verticals/restaurant/ops/pos/hooks/usePos';

// Domaine : production (KDS, kitchen, recipes)
export * from '@/verticals/restaurant/ops/kitchen';
export * from '@/verticals/restaurant/ops/kds';
export { KDSDashboard } from '@/verticals/restaurant/ops/kds/components/KDSDashboard';
export { KitchenDashboard } from '@/verticals/restaurant/ops/kitchen/components/KitchenDashboard';

// Infrastructure pilier (providers, connectors)
export * from './providers';
// Factories server-only : importées directement par les routes API, pas ici

// Resolve TS2308 conflicts: providers and workflow/engine both export these
export { useGroups } from './providers/hooks/commerceHooks';
export { useNexusOps, NexusOpsProvider } from './providers/NexusOpsProvider';
export type { Table } from '@/verticals/restaurant/ops/workflow/engine/tables.types';

// Kitchen components (production/recipes)
export { RecipeCostBadge } from '@/verticals/restaurant/ops/recipes';
export { BarRecipeCard } from '@/verticals/restaurant/ops/recipes';

// Bar types (BarTab, Wine, Cocktail, WineRegion)
export type { BarTab, Wine, Cocktail, WineRegion } from './types/bar';


export { winesAtom } from '@/verticals/restaurant/ops/bar/store/barAtoms';
export { cocktailsAtom } from '@/verticals/restaurant/ops/bar/store/barAtoms';
export { wineRegionsAtom } from '@/verticals/restaurant/ops/bar/store/barAtoms';
export { useTables } from './providers';
export type { Floor } from '@/verticals/restaurant/ops/workflow/engine/tables.types';
export type { Zone } from '@/verticals/restaurant/ops/workflow/engine/tables.types';
export type { CartItem } from '@/verticals/restaurant/ops/workflow/engine/types';
export { OpsSyncService } from '@/verticals/restaurant/ops/workflow/engine/ops.sync';
export { useOrders } from './providers';
export { useInventory } from './providers';
export { useMarketing } from './providers';
export { useQuotes } from './providers';
export { useCRM } from './providers';
export { useFiscal } from './providers';
export { useRecipes } from './providers';
export { useKitchen } from './providers';
export { DailyPrepList } from '@/verticals/restaurant/ops/recipes/DailyPrepList';
export { useIntelligence } from './providers';
export { useProducts } from './providers';
export { useCategories } from './providers';
export { RecipeTechnicalSheet } from '@/verticals/restaurant/ops/kitchen/components/RecipeTechnicalSheet';
export { CONN_ICON, AddPrinterWizard } from '@/verticals/restaurant/ops/printers/components/settings/AddPrinterWizard';
export { registerCashDrawerAnomalyHandler } from '@/verticals/restaurant/ops/pos/handlers/CashDrawerAnomalyHandler';
export { ordersAtom } from '@/verticals/restaurant/ops/pos/store/orderAtoms';
