// Domaine : stock (inventory, storage)
export * from '@/verticals/restaurant/logistics/inventory/inventory';
export { useInventory } from '@/verticals/restaurant/logistics/inventory/inventory/hooks/useInventory';
export { useStockMapper } from '@/verticals/restaurant/logistics/inventory/inventory/hooks/useStockMapper';
export * from './services';

// Domaine : approvisionnement (reception, procurement)
export { InventoryReceptionDashboard } from '@/verticals/restaurant/logistics/procurement/reception/components/InventoryReceptionDashboard';
export * from '@/verticals/restaurant/logistics/procurement/procurement';

export { useInventoryPage } from '@/verticals/restaurant/logistics/inventory/inventory/hooks/useInventoryPage';
export { RotatingCount } from '@/verticals/restaurant/logistics/inventory/inventory/components/RotatingCount';
export { useProducts } from '@/verticals/restaurant/logistics/inventory/inventory/hooks/useProducts';
export { useCategories } from '@/verticals/restaurant/logistics/inventory/inventory/hooks/useCategories';
export { InvoiceExtractionService } from './services/InvoiceExtractionService';
export { InventorySyncService } from '@/verticals/restaurant/logistics/inventory/inventory/inventory.sync';
export type { SupplierInvoice } from '@/verticals/restaurant/logistics/procurement/procurement/ThreeWayMatchEngine';
export { StockEngine } from './services/StockEngine';
export { useStockPrediction } from './hooks/useStockPrediction';
export { stockItemsAtom } from '@/verticals/restaurant/logistics/inventory/inventory/store/inventoryAtoms';
