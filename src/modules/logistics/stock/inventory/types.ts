/**
 * INVENTORY TYPES - Complete Stock Management System
 */
import { TemperatureLog } from '@nexus/contracts';

import { 
    StorageType, 
    StorageLocation, 
    IngredientCategory, 
    IngredientUnit, 
    Ingredient, 
    StockItem, 
    SupplierOrderStatus, 
    SupplierOrderItem, 
    SupplierOrder, 
    InventoryMovementType, 
    InventoryMovement,
    DEFAULT_STORAGE_LOCATIONS
} from '@nexus/contracts/logistics';

export type { 
    StorageType, 
    StorageLocation, 
    IngredientCategory, 
    IngredientUnit, 
    Ingredient, 
    StockItem, 
    SupplierOrderStatus, 
    SupplierOrderItem, 
    SupplierOrder, 
    InventoryMovementType, 
    InventoryMovement,
    DEFAULT_STORAGE_LOCATIONS
};


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
