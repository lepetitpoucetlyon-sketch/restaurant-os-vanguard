// Domaine : workflow (engine, operations dashboard)
export * from './workflow/engine';
export type { Order, OrderItem } from './workflow/engine';
export { OperationsDashboard } from './workflow/engine/components/OperationsDashboard';

// Domaine : service (POS, bar, front-desk, printers)
export * from './service/pos';
export { usePOSController } from './service/pos/hooks/usePos';
export { ServiceTicketService } from './service/core';
export type { ServiceLine, PaymentSplit, ServiceState, ServiceTicket } from './service/core';

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


export { winesAtom } from './service/bar/store/barAtoms';
export { cocktailsAtom } from './service/bar/store/barAtoms';
export { wineRegionsAtom } from './service/bar/store/barAtoms';
export { useTables } from './providers';
export { ReservationProviderFactory } from './connectors/reservations';
export { DeliveryProviderFactory } from './connectors/delivery';
export type { Floor } from './workflow/engine/tables.types';
export type { Zone } from './workflow/engine/tables.types';
export type { CartItem } from './workflow/engine/types';
export { OpsSyncService } from './workflow/engine/ops.sync';
export { useOrders } from './providers';
export { useInventory } from './providers';
export { useMarketing } from './providers';
export { useQuotes } from './providers';
export { useCRM } from './providers';
export { useFiscal } from './providers';
export { useRecipes } from './providers';
export { useKitchen } from './providers';
export { DailyPrepList } from './production/recipes/DailyPrepList';
export { useIntelligence } from './providers';
export { useProducts } from './providers';
export { useCategories } from './providers';
export { RecipeTechnicalSheet } from './production/kitchen/components/RecipeTechnicalSheet';
export { CONN_ICON, AddPrinterWizard } from './service/printers/components/settings/AddPrinterWizard';
export { ordersAtom } from './service/pos/store/orderAtoms';

// 🏛️ Domaine Schemas
// orders: source canonique de ConsumptionMode, CartLine, PosTicket…
export * from './domain/schemas/orders';
// ops: TableSchema, ReservationSchema, FloorSchema, ZoneSchema, FloorTable…
// TableShape/TableStatus/Reservation sont aussi dans workflow/engine — disambiguation ci-dessous
export * from './domain/schemas/ops';
// Résolution TS2308 : types dupliqués entre domain/schemas et sous-barrels
export type { TableShape, TableStatus, Reservation } from './domain/schemas/ops';
export type { CourseType, SplitMode, PaymentMethod, ConvivePayment } from './domain/schemas/pos';
