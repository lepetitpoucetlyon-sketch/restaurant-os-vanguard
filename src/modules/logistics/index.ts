// Domaine : stock (inventory, storage)
export * from './stock/inventory';
export { useInventory } from './stock/inventory/hooks/useInventory';
export { useStockMapper } from './stock/inventory/hooks/useStockMapper';
export * from './services';

export { InventoryReceptionDashboard } from './approvisionnement/reception/components/InventoryReceptionDashboard';
export { SupplierHubDashboard } from './approvisionnement/ui/SupplierHubDashboard';
export * from './approvisionnement/procurement';

export { useInventoryPage } from './stock/inventory/hooks/useInventoryPage';
export { RotatingCount } from './stock/inventory/components/RotatingCount';
export { StorageMapBoard } from './stock/inventory/components/storage-map';
export { StockReceptionModal, StockTransferModal, CreatePreparationModal, OracleModal } from './stock/inventory/components/inventory';

export { ThresholdModal, PhysicalCountModal, AdjustStockModal, computeDLCStatus } from './stock/inventory/components/InventoryInlineModals';
export { useProducts } from './stock/inventory/hooks/useProducts';
export { useCategories } from './stock/inventory/hooks/useCategories';
export { InvoiceExtractionService } from './services/InvoiceExtractionService';
export { InventorySyncService } from './stock/inventory/inventory.sync';
export type { SupplierInvoice } from './approvisionnement/procurement/ThreeWayMatchEngine';
export { StockEngine } from './services/StockEngine';
export { useStockPrediction } from './hooks/useStockPrediction';
export { stockItemsAtom } from './stock/inventory/store/inventoryAtoms';
export { ProductAvailabilityService } from './stock/services/ProductAvailabilityService';

// ── Domaine Types & Schemas ───────────────────────────────────────────────────
export * from './domain/schemas/inventory';
export * from './domain/schemas/supplier-invoice.schemas';
export * from './domain/types/delivery';

// Disambiguation TS2308
export type { StockItem } from './domain/schemas/inventory';
export type { DeliveryNote, PurchaseOrder } from './approvisionnement/procurement';
