// Domaine : stock (inventory, storage)
export * from './stock/inventory';
export { useInventory } from './stock/inventory/hooks/useInventory';
export { useStockMapper } from './stock/inventory/hooks/useStockMapper';
export * from './services';

// Domaine : approvisionnement (reception, procurement)
export { InventoryReceptionDashboard } from './approvisionnement/reception/components/InventoryReceptionDashboard';
export * from './approvisionnement/procurement';

export { useInventoryPage } from './stock/inventory/hooks/useInventoryPage';
export { RotatingCount } from './stock/inventory/components/RotatingCount';
export { useProducts } from './stock/inventory/hooks/useProducts';
export { useCategories } from './stock/inventory/hooks/useCategories';
export { InvoiceExtractionService } from './services/InvoiceExtractionService';
export { InventorySyncService } from './stock/inventory/inventory.sync';
export type { SupplierInvoice } from './approvisionnement/procurement/ThreeWayMatchEngine';
export { StockEngine } from './services/StockEngine';
export { useStockPrediction } from './hooks/useStockPrediction';
export { stockItemsAtom } from './stock/inventory/store/inventoryAtoms';
