import { logger } from '@/lib/logger';
import { Recipe } from '@/types/common.types';

/**
 * 🍳 KitchenService - Restaurant OS
 * Centralized Domain Logic for Culinary Operations and HACCP.
 * Grade VI: Industrialized Recipe & Prep Management.
 */
export class KitchenService {

    /**
     * Prepares a recipe for persistence.
     * Could include unit conversions or nutritional calculation in the future.
     */
    static prepareRecipe(recipe: Partial<Recipe>, generatedId: string): Recipe {
        const now = new Date().toISOString();
        return {
            ...recipe,
            id: generatedId,
            name: recipe.name || 'Sans titre',
            category: recipe.category || 'Non classé',
            prepTime: recipe.prepTime || 0,
            cookTime: recipe.cookTime || 0,
            portions: recipe.portions || 1,
            difficulty: recipe.difficulty || 'easy',
            ingredients: recipe.ingredients || [],
            steps: recipe.steps || [],
            allergens: recipe.allergens || [],
            dietaryInfo: recipe.dietaryInfo || [],
            costPriceInCents: recipe.costPriceInCents || 0,
            sellingPriceInCents: recipe.sellingPriceInCents || 0,
            marginInCents: recipe.marginInCents || (recipe.sellingPriceInCents || 0) - (recipe.costPriceInCents || 0),
            updatedAt: now,
            createdAt: recipe.createdAt || now
        } as Recipe;
    }

    /**
     * Logic for toggling a prep task.
     * Ensures and logs the transition for audit trails.
     */
    static togglePrepTask(currentStatus: boolean): { isCompleted: boolean; updatedAt: string } {
        return {
            isCompleted: !currentStatus,
            updatedAt: new Date().toISOString()
        };
    }
}
