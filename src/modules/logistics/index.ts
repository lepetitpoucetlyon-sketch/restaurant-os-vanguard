// Domaine : stock (inventory, storage)
export * from './stock/inventory';
export { useInventory } from './stock/inventory/hooks/useInventory';
export { useStockMapper } from './stock/inventory/hooks/useStockMapper';
export * from './services';

// Domaine : approvisionnement (reception, procurement)
export { InventoryReceptionDashboard } from './approvisionnement/reception/components/InventoryReceptionDashboard';
export * from './approvisionnement/procurement';
