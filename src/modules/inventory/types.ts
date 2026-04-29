/**
 * INVENTORY TYPES - Complete Stock Management System
 */
import { TemperatureLog } from '@/modules/haccp/types';

// Storage Location Types
export type StorageType = 'fridge' | 'freezer' | 'dry_storage' | 'cellar' | 'counter' | 'other';

export interface StorageLocation {
    id: string;
    name: string;
    type: StorageType;
    temperature?: number; // Target temperature in °C
    temperatureMin?: number;
    temperatureMax?: number;
    capacity?: number; // Optional capacity tracking
    zone?: string; // e.g., "Zone A", "Préparation", "Service"
    isActive: boolean;
}

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

// Ingredient Categories
export type IngredientCategory =
    | 'produce' // Fruits & Légumes
    | 'dairy' // Produits Laitiers
    | 'meat' // Viandes
    | 'poultry' // Volailles
    | 'seafood' // Poissons & Fruits de mer
    | 'charcuterie' // Charcuterie
    | 'bakery' // Boulangerie
    | 'dry' // Épicerie sèche
    | 'condiment' // Condiments & Sauces
    | 'spice' // Épices & Aromates
    | 'oil' // Huiles & Vinaigres
    | 'beverage' // Boissons
    | 'wine' // Vins
    | 'spirits' // Spiritueux
    | 'frozen' // Surgelés
    | 'other';

export type IngredientUnit = 'kg' | 'g' | 'l' | 'ml' | 'cl' | 'unit' | 'piece' | 'bunch' | 'crate' | 'box' | 'bottle' | 'can';

// Base Ingredient Definition (Master data)
export interface Ingredient {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined; // Phase 9: Sovereign Mapping
    id: string;
    name: string;
    category: IngredientCategory;
    unit: IngredientUnit;
    minQuantity: number; // Alert threshold
    parLevel?: number; // Optimal stock level
    costInCents: number; // Current unit cost in cents
    supplier: string;
    supplierRef?: string;
    defaultStorageLocation: string; // Default storage location ID
    defaultLocationId?: string; // Alias for defaultStorageLocation used in StockEngine
    shelfLifeDays?: number; // Default shelf life in days
    storageAdvice?: string; // Storage advice used in StockEngine
    allergens?: string[];
    isOrganic?: boolean;
    origin?: string; // Country/Region of origin
    certifications?: string[]; // AOC, AOP, Label Rouge, etc.
    tags?: string[]; // Added for Phase 8 Vision Search
}

// Stock Item - Actual physical stock with batch/lot tracking
export interface StockItem {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined; // Phase 9: Sovereign Mapping
    id: string;
    ingredientId: string;
    ingredientName: string;
    category: IngredientCategory;
    quantity: number;
    unit: IngredientUnit;
    storageLocationId: string;
    batchNumber?: string;
    lotNumber?: string;
    
    // UI Helpers / Aliases
    name?: string; // alias for ingredientName
    minQuantity?: number; // alert threshold

    // Dates for raw products
    receptionDate: string; // Date received
    dlc: string; // Date Limite de Consommation
    expirationDate?: string; // Grade X Alias for dlc
    dlu?: string; // Date Limite d'Utilisation (after opening)
    openedDate?: string; // Date when opened

    // Traceability
    supplierId?: string;
    supplierName?: string;
    invoiceReference?: string;
    unitCostInCents: number;
    priceInCents?: number; // Grade X Alias for unitCostInCents
    taxRate?: number;
    shelfLifeDays?: number; // Added for Phase 8 UI stability
    unitCost?: number; // Added for Phase 8 UI stability

    // Status
    status: 'available' | 'reserved' | 'expired' | 'low' | 'quarantine' | 'depleted' | 'discarded';
    notes?: string;
    initialQuantity?: number;
    costInCents?: number; // legacy alias for unitCostInCents
    createdAt?: string;
    updatedAt?: string;
}

// Preparation - Mise en place and prepared items
export type PreparationType =
    | 'mise_en_place' // General prep
    | 'sauce' // Sauces
    | 'fond' // Stocks/Fonds
    | 'marinade'
    | 'bouillon'
    | 'pate' // Pastry dough
    | 'garniture' // Garnishes
    | 'decoupe' // Cut/portioned items
    | 'assemblage' // Assembled items ready to cook
    | 'dessert_base' // Dessert bases (crèmes, ganaches)
    | 'other';

export interface Preparation {
    id: string;
    name: string;
    type: PreparationType;
    recipeId?: string; // Link to recipe if applicable

    // Quantities
    quantity: number;
    unit: IngredientUnit;
    portions?: number; // Number of portions

    // Storage
    storageLocationId: string;
    containerId?: string; // Container reference (e.g., "Bac GN 1/3")

    // Dates
    preparationDate: string; // When it was made
    preparedBy: string; // Who made it
    dlc: string; // Date Limite de Consommation
    expirationDate?: string; // Grade X Alias for dlc

    // Ingredients used (for traceability & costing)
    ingredients: {
        stockItemId: string;
        ingredientName: string;
        quantityUsed: number;
        unit: IngredientUnit;
    }[];

    // Status & Tracking
    status: 'fresh' | 'ok' | 'use_today' | 'expired' | 'discarded';
    temperature?: number; // Last recorded temperature
    lastCheckedAt?: string;
    lastCheckedBy?: string;

    notes: string;
    costInCents?: number; // Total cost in cents
    isCompleted?: boolean; // Grade X Task Tracking
}

// Supplier Order Types
export type SupplierOrderStatus = 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface SupplierOrderItem {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: IngredientUnit;
    unitPriceInCents: number;
    receivedQuantity?: number;
}

export type InventoryMovementType = 'reception' | 'transfer' | 'consumption' | 'waste' | 'adjustment' | 'sale';

export interface InventoryMovement {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined;
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
    unitCostInCents?: number; // Added for financial tracking
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

// TemperatureLog moved to haccp.types.ts

export interface InventoryContextType {
    stock: StockItem[];
    stockItems: StockItem[];
    ingredients: Ingredient[];
    preparations: Preparation[];
    temperatureLogs: TemperatureLog[];
    movements: InventoryMovement[];
    storageLocations: StorageLocation[];
    supplierOrders: SupplierOrder[];
    lowStockItems: StockItem[];
    isLoading: boolean;
    error: string | null;
    
    // Actions
    addIngredient: (ingredient: Omit<Ingredient, 'id'>) => Promise<void>;
    updateIngredient: (id: string, updates: Partial<Ingredient>) => Promise<void>;
    deleteIngredient: (id: string) => Promise<void>;
    
    addStockItem: (item: Omit<StockItem, 'id'>) => Promise<void>;
    updateStockItem: (id: string, updates: Partial<StockItem>) => Promise<void>;
    deleteStockItem: (id: string) => Promise<void>;
    
    addPreparation: (prep: Omit<Preparation, 'id'>) => Promise<void>;
    updatePreparation: (id: string, updates: Partial<Preparation>) => Promise<void>;
    deletePreparation: (id: string) => Promise<void>;
    
    addSupplierOrder: (order: Omit<SupplierOrder, 'id'>) => Promise<void>;
    updateSupplierOrder: (id: string, updates: Partial<SupplierOrder>) => Promise<void>;
    receiveOrder: (id: string, receptionData: { receivedBy?: string; items?: SupplierOrderItem[] }) => Promise<void>;
    cancelOrder: (id: string) => Promise<void>;
    
    moveStock: (movement: Omit<InventoryMovement, 'id' | 'performedAt' | 'performedBy'>) => Promise<void>;
    transferStock: (id: string, toLocationId: string) => Promise<void>;
    consumeStock: (id: string, quantity: number, reason?: string) => Promise<void>;
    deductStockForProduct: (productId: string, quantity: number) => Promise<void>;
    
    getStockByLocation: (locationId: string) => StockItem[];
    getExpiringStock: (days: number) => StockItem[];
    getPreparationsByLocation: (locationId: string) => Preparation[];
    getExpiringPreparations: (days: number) => Preparation[];
    
    triggerRebalancing: () => Promise<void>;
    
    expert: {
        queryExpert: (prompt: string, contextData?: import('@/shared/nexus-contract').SovereignData) => Promise<{
            response: string;
            suggestions?: string[];
        }>;

        isConfigured: boolean;
        isAuthorized: boolean;
        role: string;
        modelId: string;
    };
    
    agent?: {
        query: (prompt: string, context?: import('@/shared/nexus-contract').SovereignData) => Promise<{
            answer: string;

            confidence: number;
        }>;
        isProcessing: boolean;
    };
}
