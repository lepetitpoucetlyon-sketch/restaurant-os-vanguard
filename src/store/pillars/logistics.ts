import { atom } from 'jotai';
import { createProxyDomain } from '@/store/nexusNodeFactory';
import { expectedCoversAtom } from '@nexus/state/SovereignGenome';
import {
    StockItem,
    Product,
    Recipe,
    Category,
    Ingredient,
    Preparation,
    SupplierOrder,
    StorageLocation,
    MiseEnPlaceTask,
    InventoryMovement,
} from '@nexus/contracts';

// --- 📦 INVENTORY & KITCHEN DOMAIN (Stocks, Catégories, Produits, Recettes, Préparations) ---

const _stockItems = createProxyDomain<StockItem>('stockItems');
export const stockItemsNodeAtom = _stockItems.node;
export const stockItemsAtom = _stockItems.data;
export const stockLoadingAtom = _stockItems.loading;

const _categories = createProxyDomain<Category>('categories');
export const categoriesNodeAtom = _categories.node;
export const categoriesAtom = _categories.data;
export const categoriesLoadingAtom = _categories.loading;

const _products = createProxyDomain<Product>('products');
export const productsNodeAtom = _products.node;
export const productsAtom = _products.data;
export const productsLoadingAtom = _products.loading;

const _recipes = createProxyDomain<Recipe>('recipes');
export const recipesNodeAtom = _recipes.node;
export const recipesAtom = _recipes.data;
export const recipesLoadingAtom = _recipes.loading;

const _ingredients = createProxyDomain<Ingredient>('ingredients');
export const ingredientsNodeAtom = _ingredients.node;
export const ingredientsAtom = _ingredients.data;

const _preparations = createProxyDomain<Preparation>('preparations');
export const preparationsNodeAtom = _preparations.node;
export const preparationsAtom = _preparations.data;

const _supplierOrders = createProxyDomain<SupplierOrder>('supplierOrders');
export const supplierOrdersNodeAtom = _supplierOrders.node;
export const supplierOrdersAtom = _supplierOrders.data;

const _storageLocations = createProxyDomain<StorageLocation>('storageLocations');
export const storageLocationsNodeAtom = _storageLocations.node;
export const storageLocationsAtom = _storageLocations.data;

const _prepTasks = createProxyDomain<MiseEnPlaceTask>('prepTasks', []);
export const prepTasksNodeAtom = _prepTasks.node;
export const prepTasksAtom = _prepTasks.data;
export const prepLoadingAtom = _prepTasks.loading;

// Kitchen Prep Progress (Grade X Oracle Connection)
export const miseEnPlaceTargetSelector = atom((get) => {
    const recipesData = get(recipesAtom);
    const expectedCovers = get(expectedCoversAtom) || 20; 
    
    // AI Forecast Logic: Target = (Expected Covers / 2) + Buffer
    const aiTarget = Math.ceil(expectedCovers * 0.4); 

    return recipesData.reduce((acc: Record<string, { name: string; target: number }>, r) => {
        // Only increase target for rotisserie items if enabled
        const target = r.category === 'rotisserie' ? aiTarget : 10;
        acc[r.id] = { name: r.name, target }; 
        return acc;
    }, {});
});

/**
 * 🛰️ Global Recipe Cost Selector (Atomic Scalpel)
 * Computes cost dynamically from stock items atom.
 */
export const calculateRecipeCostSelector = atom(null, (get, _set, recipeIngredients: { ingredientId: string; quantity: number }[]) => {
    if (!recipeIngredients) return 0;
    const stockItemsData = get(stockItemsAtom);
    return recipeIngredients.reduce((total, ri) => {
        const item = stockItemsData.find(i => i.id === ri.ingredientId);
        const cost = item?.unitCostInCents || 0;
        return total + (cost * ri.quantity);
    }, 0);
});

// --- ⚡ PHASE 3: REAL-TIME OPTIMISTIC RECONCILIATION ---
export const decrementStockAtom = atom(
    null,
    async (get, set, { itemId, amount }: { itemId: string, amount: number }) => {
        const { Nexus } = await import('@/kernel/adapter/NexusAdapter');
        const { logger } = await import('@/lib/logger');
        
        // 1. ⚡ OPTIMISTIC UPDATE: Local Deduction
        const currentNode = get(stockItemsNodeAtom);
        const itemIndex = currentNode.data.findIndex(i => i.id === itemId);
        
        if (itemIndex === -1) return;
        
        const originalData = [...currentNode.data];
        const optimisticData = [...originalData];
        optimisticData[itemIndex] = {
            ...optimisticData[itemIndex],
            quantity: Math.max(0, (Number(optimisticData[itemIndex].quantity) || 0) - amount),
            version: (Number(optimisticData[itemIndex].version) || 0) + 1 // Local version jump
        };
        
        set(stockItemsNodeAtom, (prev) => ({ ...prev, data: optimisticData }));
        logger.info(`[Stock-Optimistic] Deducted ${amount} from ${itemId}. UI updated (0ms).`);

        // 2. 🛰️ PERSISTENT ATOMIC BURST
        try {
            const persistencePath = Nexus.getTenantPath(`stockItems/${itemId}`);
            await Nexus.adapter.increment(persistencePath, 'quantity', -amount);
            logger.debug(`[Stock-Atomic] Persistence success for ${itemId}.`);
        } catch (error) {
            // 🛡️ ROLLBACK: Handled by ResilienceSlayer but triggered here if immediate failure
            logger.error(`[Stock-Atomic] Persistence failed for ${itemId}. Rolling back...`, error);
            set(stockItemsNodeAtom, (prev) => ({ ...prev, data: originalData }));
        }
    }
);
const _inventoryMovements = createProxyDomain<InventoryMovement>('inventoryMovements');
export const inventoryMovementsNodeAtom = _inventoryMovements.node;
export const inventoryMovementsAtom = _inventoryMovements.data;
