import { SovereignField, SovereignNode, SovereignMap } from '@/shared/nexus-contract';

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

export type IngredientUnit = 'kg' | 'g' | 'l' | 'ml' | 'cl' | 'unit' | 'portion' | 'piece' | 'bunch' | 'crate' | 'box' | 'bottle' | 'can';

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
    /** @deprecated use costInMicrounits */
    costInCents: number;
    costInMicrounits?: number;
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
    createdAt: string;
    updatedAt: string;
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
    /** @deprecated use unitCostInMicrounits */
    unitCostInCents: number;
    unitCostInMicrounits?: number;
    /** @deprecated use priceInMicrounits */
    priceInCents?: number;
    priceInMicrounits?: number;
    taxRate?: number;
    shelfLifeDays?: number;
    unitCost?: number;
    status: 'available' | 'reserved' | 'expired' | 'low' | 'quarantine' | 'depleted' | 'discarded';
    notes?: string;
    initialQuantity?: number;
    /** @deprecated use costInMicrounits */
    costInCents?: number;
    costInMicrounits?: number;
    reorderQuantity?: number; // log-3: configurable per ingredient (g/unit), fallback 10 000
    createdAt?: string;
    updatedAt?: string;
}

export type SupplierOrderStatus = 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface SupplierOrderItem {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: IngredientUnit;
    /** @deprecated use unitPriceInMicrounits */
    unitPriceInCents: number;
    unitPriceInMicrounits?: number;
    receivedQuantity?: number;
}

export interface SupplierOrder {
    id: string;
    supplierId: string;
    supplierName: string;
    status: SupplierOrderStatus;
    items: SupplierOrderItem[];
    /** @deprecated use totalCostInMicrounits */
    totalCostInCents: number;
    totalCostInMicrounits?: number;
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
    timestamp: string; // Grade X Alias for performedAt
    /** @deprecated use unitCostInMicrounits */
    unitCostInCents?: number;
    unitCostInMicrounits?: number;
}

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

export interface Preparation extends SovereignNode {
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
    /** @deprecated use costInMicrounits */
    costInCents?: number;
    costInMicrounits?: number;
    isCompleted?: boolean; // Grade X Task Tracking
}

export interface RecipeIngredient extends SovereignMap {
    id: string; // Add id for UI/Store compatibility
    ingredientId: string;
    name: string;
    quantity: number;
    unit: string;
    /** @deprecated use costInMicrounits */
    costInCents: number;
    costInMicrounits?: number;
    cost?: number; // Alias for UI compatibility
}

/** Method used to prepare a cocktail or mixed drink. */
export type ServingMethod = 'shaken' | 'stirred' | 'built' | 'blended' | 'layered';

/** All supported recipe categories, including bar specialties. */
export type RecipeCategory =
    | 'starter' | 'main' | 'dessert' | 'base' | 'sauce' | 'marinade'
    | 'boissons' | 'cocktails' | 'snack' | 'other';

export interface Recipe extends SovereignNode {
    name: string;
    description?: string;
    image?: string;
    imageUrl?: string;
    ingredients: RecipeIngredient[];
    preparationTimeMinutes: number;
    prepTime?: number; // Alias for UI compatibility
    difficulty: 'easy' | 'medium' | 'hard' | string;
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    allergens?: string[];
    dietaryInfo?: string[]; // Added for UI compatibility
    recipeSteps?: Array<{
        order: number;
        instruction: string;
        duration?: number;
        tip?: string;
    }>;
    steps?: unknown[]; // Alias for UI compatibility
    category?: RecipeCategory | string;
    portions?: number;
    /** @deprecated use costPriceInMicrounits */
    costPriceInCents?: number;
    costPriceInMicrounits?: number;
    /** @deprecated use sellingPriceInMicrounits */
    sellingPriceInCents?: number;
    sellingPriceInMicrounits?: number;
    isActive?: boolean;
    // ── Bar / cocktail fields (cui-3) ─────────────────────────────────────────
    /** Primary spirit(s) used in the recipe (e.g. "Rhum blanc"). */
    baseSpirit?: string;
    /** List of mixers / juices / sodas used (e.g. ["jus de citron", "sirop de canne"]). */
    mixers?: string[];
    /** Garnish description (e.g. "Zeste de citron vert"). */
    garnish?: string;
    /** How the drink is assembled — drives KDS bar station display. */
    servingMethod?: ServingMethod;
    /** Glass type used (e.g. "Coupe", "Highball", "Old Fashioned"). */
    glassType?: string;
}
