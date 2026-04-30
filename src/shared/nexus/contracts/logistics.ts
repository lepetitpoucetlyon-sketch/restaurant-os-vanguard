import { SovereignField } from '@shared/nexus-contract';

/**
 * 🏛️ LOGISTICS CORE TYPES - Sovereign Shared Contract
 * Moved to shared to prevent circular dependencies between Commerce and Logistics.
 */

export type StorageType = 'fridge' | 'freezer' | 'dry_storage' | 'cellar' | 'counter' | 'other';

export interface StorageLocation {
    id: string;
    name: string;
    type: StorageType;
    temperature?: number;
    temperatureMin?: number;
    temperatureMax?: number;
    capacity?: number;
    zone?: string;
    isActive: boolean;
}

export type IngredientCategory =
    | 'produce' | 'dairy' | 'meat' | 'poultry' | 'seafood' | 'charcuterie'
    | 'bakery' | 'dry' | 'condiment' | 'spice' | 'oil' | 'beverage'
    | 'wine' | 'spirits' | 'frozen' | 'other';

export type IngredientUnit = 'kg' | 'g' | 'l' | 'ml' | 'cl' | 'unit' | 'piece' | 'bunch' | 'crate' | 'box' | 'bottle' | 'can';

// Predefined storage locations
export const DEFAULT_STORAGE_LOCATIONS: StorageLocation[] = [
    { id: 'frigo_1', name: 'Frigo 1 - Produits Frais', type: 'fridge', temperature: 3, temperatureMin: 0, temperatureMax: 4, zone: 'Cuisine', isActive: true },
    { id: 'frigo_2', name: 'Frigo 2 - Légumes', type: 'fridge', temperature: 4, temperatureMin: 2, temperatureMax: 6, zone: 'Cuisine', isActive: true },
    { id: 'frigo_3', name: 'Frigo 3 - Viandes', type: 'fridge', temperature: 2, temperatureMin: 0, temperatureMax: 4, zone: 'Cuisine', isActive: true },
    { id: 'frigo_4', name: 'Frigo 4 - Poissons', type: 'fridge', temperature: 0, temperatureMin: -2, temperatureMax: 2, zone: 'Cuisine', isActive: true },
    { id: 'frigo_5', name: 'Frigo 5 - Préparations', type: 'fridge', temperature: 3, temperatureMin: 0, temperatureMax: 4, zone: 'Préparation', isActive: true },
    { id: 'frigo_bar', name: 'Frigo Bar', type: 'fridge', temperature: 4, temperatureMin: 2, temperatureMax: 6, zone: 'Bar', isActive: true },
    { id: 'congelateur_1', name: 'Congélateur 1 - Principal', type: 'freezer', temperature: -18, temperatureMin: -22, temperatureMax: -15, zone: 'Cuisine', isActive: true },
    { id: 'congelateur_2', name: 'Congélateur 2 - Glaces', type: 'freezer', temperature: -20, temperatureMin: -25, temperatureMax: -18, zone: 'Cuisine', isActive: true },
    { id: 'congelateur_3', name: 'Congélateur 3 - Réserve', type: 'freezer', temperature: -18, temperatureMin: -22, temperatureMax: -15, zone: 'Réserve', isActive: true },
    { id: 'epicerie_1', name: 'Épicerie Sèche', type: 'dry_storage', zone: 'Réserve', isActive: true },
    { id: 'epicerie_2', name: 'Épicerie - Conserves', type: 'dry_storage', zone: 'Réserve', isActive: true },
    { id: 'epicerie_3', name: 'Épicerie - Huiles & Vinaigres', type: 'dry_storage', zone: 'Réserve', isActive: true },
    { id: 'cave_vin', name: 'Cave à Vins', type: 'cellar', temperature: 12, temperatureMin: 10, temperatureMax: 14, zone: 'Cave', isActive: true },
    { id: 'cave_spiritueux', name: 'Cave Spiritueux', type: 'cellar', zone: 'Cave', isActive: true },
    { id: 'comptoir_cuisine', name: 'Comptoir Cuisine', type: 'counter', zone: 'Cuisine', isActive: true },
    { id: 'comptoir_patisserie', name: 'Comptoir Pâtisserie', type: 'counter', zone: 'Pâtisserie', isActive: true },
];

export interface Ingredient {
    [key: string]: SovereignField | undefined;
    id: string;
    name: string;
    category: IngredientCategory;
    unit: IngredientUnit;
    minQuantity: number;
    parLevel?: number;
    costInCents: number;
    supplier: string;
    supplierRef?: string;
    defaultStorageLocation: string;
    shelfLifeDays?: number;
    storageAdvice?: string;
    allergens?: string[];
    isOrganic?: boolean;
    origin?: string;
    certifications?: string[];
    tags?: string[];
}

export interface StockItem {
    [key: string]: SovereignField | undefined;
    id: string;
    ingredientId: string;
    ingredientName: string;
    category: IngredientCategory;
    quantity: number;
    unit: IngredientUnit;
    storageLocationId: string;
    batchNumber?: string;
    lotNumber?: string;
    name?: string;
    minQuantity?: number;
    receptionDate: string;
    dlc: string;
    expirationDate?: string;
    dlu?: string;
    openedDate?: string;
    supplierId?: string;
    supplierName?: string;
    invoiceReference?: string;
    unitCostInCents: number;
    priceInCents?: number;
    taxRate?: number;
    shelfLifeDays?: number;
    unitCost?: number;
    status: 'available' | 'reserved' | 'expired' | 'low' | 'quarantine' | 'depleted' | 'discarded';
    notes?: string;
    initialQuantity?: number;
    costInCents?: number;
    createdAt?: string;
    updatedAt?: string;
}

export type SupplierOrderStatus = 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface SupplierOrderItem {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: IngredientUnit;
    unitPriceInCents: number;
    receivedQuantity?: number;
}

export interface SupplierOrder {
    id: string;
    supplierId: string;
    supplierName: string;
    status: SupplierOrderStatus;
    items: SupplierOrderItem[];
    totalCostInCents: number;
    createdAt: string;
    updatedAt: string;
    deliveryDate?: string;
}

export type InventoryMovementType = 'reception' | 'transfer' | 'consumption' | 'waste' | 'adjustment' | 'sale';

export interface InventoryMovement {
    [key: string]: SovereignField | undefined;
    id: string;
    stockItemId: string;
    type: InventoryMovementType;
    quantity: number;
    unit: IngredientUnit;
    ingredientId: string;
    ingredientName: string;
    reason: string;
    performedAt: string;
    performedBy: string;
    unitCostInCents?: number;
}
