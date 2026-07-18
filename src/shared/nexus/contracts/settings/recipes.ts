export interface RecipeSettings {
    id: string;
    name: string;
    photo?: string;
    category: 'starter' | 'main' | 'dessert' | 'base' | 'sauce' | 'marinade' | 'boissons' | 'cocktails' | 'snack' | 'other';
    prepTime: number;
    cookTime: number;
    restTime?: number;
    portions: number;
    yield?: number;
    yieldUnit?: string;
    calculatedCost: number;
    multiplier: number;
    suggestedPrice: number;
    targetMargin: number;
    difficulty: 1 | 2 | 3 | 4 | 5;
    createdBy?: string;
    version: number;
    notes?: string;
    presentationTip?: string;
}

export interface RecipesConfig {
    defaultYield: number;
    defaultUnit: 'portions' | 'kg' | 'l';
    showCostsToChefs: boolean;
    showMarginsToManagers: boolean;
    autoCalculateCosts: boolean;
    includeWastePercentage: boolean;
    defaultWastePercent: number;
    showNutrition: boolean;
    showAllergens: boolean;
    printFormat: 'a4' | 'letter' | 'recipe-card';
    showPhotosInRecipe: boolean;
    showTimersInRecipe: boolean;
    targetFoodCostPercent: number;
    targetGrossMargin: number;
}

export interface RecipeStep {
    id: string;
    recipeId: string;
    order: number;
    description: string;
    duration?: number;
    photo?: string;
    video?: string;
    temperature?: number;
    equipment?: string[];
    techniques?: string[];
}

export interface RecipeIngredient {
    id: string;
    recipeId: string;
    ingredientId: string;
    grossQuantity: number;
    netQuantity: number;
    unit: string;
    lossRate: number;
    substitute?: string;
    notes?: string;
}
