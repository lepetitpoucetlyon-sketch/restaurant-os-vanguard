// Hooks souverains (ADR-010 Phase 2) — orders, tables, reservations
export * from './hooks';

// Domaine : workflow (engine, operations dashboard)
export * from './workflow/engine';
export type { Order, OrderItem } from './workflow/engine';
export { OperationsDashboard } from './workflow/engine/components/OperationsDashboard';
export { useRegistre } from './workflow/engine/hooks/useRegistre';

// Domaine : service (POS, bar, frontdesk, printers)
export * from './service/pos';
export { usePOSController } from './service/pos/hooks/usePos';
export {
  BarSidebar,
  KdsTab,
  WineCellarTab,
  SommelierTab,
  CocktailTab,
  StocksTab,
  WineDetailPanel,
} from './service/pos/components/bar';
export { ProductFormModal } from './service/pos/components/ProductFormModal';
export { PaymentDialog } from './service/pos/components/PaymentDialog';
export { SplitBillDialog } from './service/pos/components/SplitBillDialog';
export { ProductGrid } from './service/pos/components/ProductGrid';
export { Cart } from './service/pos/components/Cart';
export { TableSelector } from './service/pos/components/TableSelector';

// Domaine : production (KDS, kitchen, recipes)
export * from './production/kds';
export { KDSDashboard } from './production/kds/components/KDSDashboard';
export { KitchenDashboard } from './production/kitchen/components/KitchenDashboard';
export { RecipeDetailDialog } from './production/kitchen/components/RecipeDetailDialog';
export { RecipeTechnicalSheet } from './production/kitchen/components/RecipeTechnicalSheet';
export { AddPrinterWizard, CONN_ICON } from './service/printers/components/settings/AddPrinterWizard';

// Domaine : menu-builder (composition catalogue)
export * from './menu-builder';

// Domaine : printers (hardware d'impression, contrats et adapters)
export * from './service/printers';

// Infrastructure pilier (providers, connectors)
export * from './providers';
// Factories server-only : importées directement par les routes API, pas ici

// Resolve TS2308 conflicts: providers and workflow/engine both export these
export { useGroups } from './providers/hooks/commerceHooks';
export { useNexusOps, NexusOpsProvider } from './providers/NexusOpsProvider';

// Bar types (BarTab, Wine, Cocktail, WineRegion)
export type { BarTab, Wine, Cocktail, WineRegion } from './types/bar';

export { winesAtom } from './service/bar/store/barAtoms';
export { cocktailsAtom } from './service/bar/store/barAtoms';
export { wineRegionsAtom } from './service/bar/store/barAtoms';
export { useTables } from './providers';
// DeliveryProviderFactory et ReservationProviderFactory sont server-only :
// les importer directement dans les routes API, jamais via ce barrel.
export type { CartItem, SovereignProduct } from './workflow/engine/types';
export type { GroupEvent } from './workflow/engine/groups.types';
export { KDSCourseSequencingEngine } from './production/kds/services/KDSCourseSequencingEngine';
export { registerCashDrawerAnomalyHandler } from './service/pos/handlers/CashDrawerAnomalyHandler';
export { OpsSyncService } from './workflow/engine/ops.sync';
export { useOrders } from './providers';
export { useInventory } from './providers';
export { useMarketing } from './providers';
export { useQuotes } from './providers';
export { useCRM } from './providers';
export { useFiscal } from './providers';
export { useRecipes } from './providers';
export { useKitchen } from './providers';
export { useIntelligence } from './providers';
export { useProducts } from './providers';
export { useCategories } from './providers';
export { ordersAtom } from './service/pos/store/orderAtoms';

// 🏛️ Domaine Schemas
// orders: source canonique de ConsumptionMode, CartLine, PosTicket…
export * from './domain/schemas/orders';
// ops: TableSchema, ReservationSchema, FloorSchema, ZoneSchema, FloorTable…
// TableShape/TableStatus/Reservation sont aussi dans workflow/engine — disambiguation ci-dessous
export * from './domain/schemas/ops';
export * from './domain/schemas/inventory';
export * from './domain/schemas/cash';
export * from './domain/schemas/pos';
export { SmsGatewayService } from './service/notifications/SmsGatewayService';
export { KioskPage } from './service/kiosk/KioskPage';
export { PmsPage } from './service/pms/PmsPage';
// Résolution TS2308 : types dupliqués entre domain/schemas et sous-barrels
export type { Table, Floor, Zone, TableShape, TableStatus, Reservation, FloorTable } from './domain/schemas/ops';
export type { ConsumptionMode } from './domain/schemas/orders';
export type { CourseType, SplitMode, PaymentMethod, ConvivePayment } from './domain/schemas/pos';
