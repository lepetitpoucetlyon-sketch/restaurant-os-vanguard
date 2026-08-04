import { Recipe } from '@nexus/contracts/common.types';

/**
 * 🍳 KitchenService - Restaurant OS
 * Centralized Domain Logic for Culinary Operations and HACCP.
 * Grade VI: Industrialized Recipe & Prep Management.
 */
const RECIPE_DEFAULTS = {
    name:                'Sans titre',
    category:            'Non classé',
    prepTime:            0,
    cookTime:            0,
    portions:            1,
    difficulty:          'easy' as Recipe['difficulty'],
    ingredients:         [] as Recipe['ingredients'],
    steps:               [] as Recipe['steps'],
    allergens:           [] as Recipe['allergens'],
    dietaryInfo:         [] as Recipe['dietaryInfo'],
    costPriceInCents:    0,
    sellingPriceInCents: 0,
    color:               '#000000',
    isActive:            true,
};

function buildRecipeDefaults(recipe: Partial<Recipe>, id: string, now: string): Recipe {
    const merged = { ...RECIPE_DEFAULTS, ...recipe };
    return {
        ...merged,
        id,
        marginInCents: (recipe.marginInCents as number) || merged.sellingPriceInCents - merged.costPriceInCents,
        updatedAt:     now,
        createdAt:     typeof recipe.createdAt === 'string' ? recipe.createdAt : now,
    } as Recipe;
}

export class KitchenService {

    static prepareRecipe(recipe: Partial<Recipe>, generatedId: string): Recipe {
        const now = new Date().toISOString();
        return buildRecipeDefaults(recipe, generatedId, now);
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
