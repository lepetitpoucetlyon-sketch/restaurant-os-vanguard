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
export { StockReceptionModal, StockTransferModal, CreatePreparationModal, OracleModal } from './stock/inventory/components/inventory';
export { ThresholdModal, PhysicalCountModal, AdjustStockModal, computeDLCStatus } from './stock/inventory/components/InventoryInlineModals';
export { useProducts } from './stock/inventory/hooks/useProducts';
export { useCategories } from './stock/inventory/hooks/useCategories';
export { InvoiceExtractionService } from './services/InvoiceExtractionService';
export { InventorySyncService } from './stock/inventory/inventory.sync';
export type { SupplierInvoice } from './approvisionnement/procurement/ThreeWayMatchEngine';
// Note: DeliveryNote/PurchaseOrder sont déjà exportés via `export * from './approvisionnement/procurement'` (ci-dessus)
export { StockEngine } from './services/StockEngine';
export { useStockPrediction } from './hooks/useStockPrediction';
export { stockItemsAtom } from './stock/inventory/store/inventoryAtoms';
export { ProductAvailabilityService } from './stock/services/ProductAvailabilityService';

// ── Domaine Types ─────────────────────────────────────────────────────────────
// Delivery/DeliveryItem = types Livraison fournisseur (réception)
