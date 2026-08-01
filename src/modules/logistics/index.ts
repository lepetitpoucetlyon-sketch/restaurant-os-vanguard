// Domaine : stock (inventory, storage)
export * from './stock/inventory';
export { useInventory } from './stock/inventory/hooks/useInventory';
export { useStockMapper } from './stock/inventory/hooks/useStockMapper';
export { useProducts } from './stock/inventory/hooks/useProducts';
export { useCategories } from './stock/inventory/hooks/useCategories';

// Domaine : approvisionnement (reception, procurement)
export { InventoryReceptionDashboard } from './approvisionnement/reception/components/InventoryReceptionDashboard';
export * from './approvisionnement/procurement';
