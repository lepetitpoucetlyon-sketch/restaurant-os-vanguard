export * from './service/restaurant/pos/infrastructure/cash-drawer/CashDrawerService';
export * from './providers/hooks';
// Hooks souverains (ADR-010 Phase 2) — orders, tables, reservations
export * from './hooks';

// Domaine : workflow (engine, operations dashboard)
export * from './workflow/engine';
export type { Order, OrderItem } from './workflow/engine';
export { OperationsDashboard } from './workflow/engine/components/OperationsDashboard';
export { useRegistre } from './workflow/engine/hooks/useRegistre';

// Domaine : service (POS, bar, frontdesk, printers)
export * from './service/restaurant/pos';
export type { TicketStyle, ReceiptConfig, PrinterConnection } from './service/core/printing/hardware/types';
export { usePOSController } from './service/restaurant/pos/hooks/usePos';
export {
  BarSidebar,
  KdsTab,
  WineCellarTab,
  SommelierTab,
  CocktailTab,
  StocksTab,
  WineDetailPanel,
} from './service/restaurant/pos/components/bar';
export { ProductFormModal } from './service/restaurant/pos/components/ProductFormModal';
export { PaymentDialog } from './service/restaurant/pos/components/PaymentDialog';
export { SplitBillDialog } from './service/restaurant/pos/components/SplitBillDialog';
export { ProductGrid } from './service/restaurant/pos/components/ProductGrid';
export { Cart } from './service/restaurant/pos/components/Cart';
export { TableSelector } from './service/restaurant/pos/components/TableSelector';
export { PosHeader } from './service/restaurant/pos/components/PosHeader';

// Domaine : production (KDS, kitchen, recipes)
export * from './production/kds';
export { KDSDashboard } from './production/kds/components/KDSDashboard';
export { KitchenDashboard } from './production/kitchen/components/KitchenDashboard';
export { RecipeDetailDialog } from './production/kitchen/components/RecipeDetailDialog';
export { RecipeTechnicalSheet } from './production/kitchen/components/RecipeTechnicalSheet';
export { AddPrinterWizard, PRINTER_CONN_ICON, PRINTER_CONN_ICON as CONN_ICON } from './service/core/printing/components/settings/AddPrinterWizard';

// Domaine : menu-builder (composition catalogue)
export * from './menu-builder';

// Domaine : printers (hardware d'impression, contrats et adapters)
export * from './service/core/printing';

// Infrastructure pilier (providers, connectors)
export * from './providers';
// Factories server-only : importées directement par les routes API, pas ici

// Resolve TS2308 conflicts: providers and workflow/engine both export these
export { useGroups } from './providers/hooks/commerceHooks';
export { useNexusOps, NexusOpsProvider } from './providers/NexusOpsProvider';

// Bar types (BarTab, Wine, Cocktail, WineRegion)
export type { BarTab, Wine, Cocktail, WineRegion } from './types/bar';

export { winesAtom } from './service/restaurant/bar/store/barAtoms';
export { cocktailsAtom } from './service/restaurant/bar/store/barAtoms';
export { wineRegionsAtom } from './service/restaurant/bar/store/barAtoms';
export { useTables } from './providers/hooks';
// DeliveryProviderFactory et ReservationProviderFactory sont server-only :
// les importer directement dans les routes API, jamais via ce barrel.
export type { CartItem, SovereignProduct } from './workflow/engine/types';
export type { GroupEvent } from './workflow/engine/groups.types';
export { KDSCourseSequencingEngine } from './production/kds/services/KDSCourseSequencingEngine';
export { registerCashDrawerAnomalyHandler } from './service/restaurant/pos/handlers/CashDrawerAnomalyHandler';
export { OpsSyncService } from './workflow/engine/ops.sync';
export { useOrders } from './providers/hooks';
export { useInventory } from './providers/hooks';
export { useMarketing } from './providers/hooks';
export { useQuotes } from './providers/hooks';
export { useCRM } from './providers/hooks';
export { useFiscal } from './providers/hooks';
export { useRecipes } from './providers/hooks';
export { useKitchen } from './providers/hooks';
export { useIntelligence } from './providers/hooks';
export { useProducts } from './providers/hooks';
export { useCategories } from './providers/hooks';
export { ordersAtom } from './service/restaurant/pos/store/orderAtoms';

// 🏛️ Domaine Schemas
// orders: source canonique de ConsumptionMode, CartLine, PosTicket…
export * from './domain/schemas/orders';
// ops: TableSchema, ReservationSchema, FloorSchema, ZoneSchema, FloorTable…
// TableShape/TableStatus/Reservation sont aussi dans workflow/engine — disambiguation ci-dessous
export * from './domain/schemas/ops';
export * from './domain/schemas/inventory';
export * from './domain/schemas/cash';
export * from './domain/schemas/pos';
export { SmsGatewayService } from './service/core/notifications/SmsGatewayService';
export { KioskPage } from './service/restaurant/kiosk/KioskPage';
export { PmsPage } from './service/hospitality/pms/PmsPage';
// Résolution TS2308 : types dupliqués entre domain/schemas et sous-barrels
export type { Table, Floor, Zone, TableShape, TableStatus, Reservation, FloorTable } from './domain/schemas/ops';
export type { ConsumptionMode } from './domain/schemas/orders';
export type { CourseType, SplitMode, PaymentMethod, ConvivePayment } from './domain/schemas/pos';

// Handlers KDS — relocalises depuis shared/eventBus/handlers/ (ADR-020)
export * from './production/kds/handlers/DishReboundHandler';
export * from './production/kds/handlers/KDSRushAlertNotifier';
export * from './production/kds/handlers/KDSTicketDoneNotifier';
export * from './production/kds/handlers/KdsCourseManagerHandler';
export * from './production/kds/handlers/KdsCoursePassedHandler';
export * from './production/kds/handlers/KdsPassNotifierHandler';
export * from './production/kds/handlers/KdsPrepDelayAlertHandler';
export * from './production/kds/handlers/KdsPrepTimeAnalyzerHandler';
export * from './production/kds/handlers/KdsPrintFallbackHandler';
export * from './production/kds/handlers/KdsRoutingHandler';
