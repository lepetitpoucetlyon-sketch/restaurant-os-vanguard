import { atom } from 'jotai';
import { createProxyDomain } from './nexusNodeFactory';
import { 
    StockItem, 
    Product, 
    Recipe, 
    Category, 
    Ingredient, 
    Preparation, 
    SupplierOrder, 
    StorageLocation,
    MiseEnPlaceTask
} from '@/types';

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

// Kitchen Prep Progress
export const miseEnPlaceTargetSelector = atom((get) => {
    const recipesData = get(recipesAtom);
    return recipesData.reduce((acc: Record<string, { name: string; target: number }>, r) => {
        acc[r.id] = { name: r.name, target: 10 }; 
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
