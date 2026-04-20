/**
 * COMMON / SHARED TYPES
 */

// ============================================
// NOTIFICATIONS
// ============================================

import { Ingredient } from './inventory.types';

export type NotificationType = 'info' | 'warning' | 'critical' | 'success';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    module?: string;
    action?: {
        label: string;
        href?: string;
    };
}

// ============================================
// PRODUCTS & MENU
// ============================================

export interface Option {
    id: string;
    name: string;
    priceModifierInCents: number;
    isDefault?: boolean;
}

export interface OptionGroup {
    id: string;
    name: string;
    type: 'single' | 'multiple';
    required: boolean;
    minSelections?: number;
    maxSelections?: number;
    options: Option[];
}

export interface ProductIngredient {
    ingredientId: string;
    quantity: number; // Amount used per unit sold
}

export interface RecipeStep {
    order: number;
    instruction: string;
    duration?: number; // In minutes
    temperature?: string;
    tip?: string;
    imageUrl?: string;
    videoUrl?: string;
}

export interface Product {
    id: string;
    category: string;
    name: string;
    priceInCents: number;
    color: string;
    image?: string;
    description?: string;
    optionGroups?: OptionGroup[];
    ingredients?: ProductIngredient[];
    recipeSteps?: RecipeStep[];
    prepTime?: number; // Minutes
    tags?: string[]; // Star, Dog, Plowhorse, Puzzle
}

export interface RecipeIngredient {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    costInCents: number;
}

export interface Recipe {
    id: string;
    productId?: string;
    name: string;
    category: string;
    description?: string;
    prepTime: number;
    cookTime: number;
    portions: number;
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients: RecipeIngredient[];
    steps: RecipeStep[];
    allergens: string[];
    dietaryInfo: string[];
    costPriceInCents: number;
    sellingPriceInCents: number;
    marginInCents: number;
    imageUrl?: string;
    standardImage?: string; // Technical reference for AI Plate Audit
    color: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface RecipeContextType {
    recipes: Recipe[];
    customRecipes: Recipe[];
    prepTasks: MiseEnPlaceTask[];
    addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
    deleteRecipe: (id: string) => Promise<void>;
    getRecipeById: (id: string) => Promise<Recipe | undefined>;
    addPrepTask: (task: Omit<MiseEnPlaceTask, 'id'>) => Promise<void>;
    updatePrepTask: (id: string, updates: Partial<MiseEnPlaceTask>) => Promise<void>;
    deletePrepTask: (id: string) => Promise<void>;
    togglePrepTask: (id: string) => Promise<void>;
    assignPrepTask: (taskId: string, staffId: string) => Promise<void>;
    getRecipeSteps: (productId: string) => RecipeStep[];
    miseEnPlaceTarget: Record<string, number>;
    calculateRecipeCost: (ingredients: RecipeIngredient[]) => number;
    ingredients: Ingredient[]; 
    
    expert: {
        queryExpert: (prompt: string, contextData?: Record<string, any>) => Promise<{
            response: string;
            suggestions?: string[];
            metadata?: Record<string, any>;
        }>;
        isConfigured: boolean;
        isAuthorized: boolean;
        role: string;
        modelId: string;
    };
    agent: {
        query: (prompt: string, context?: Record<string, any>) => Promise<{
            answer: string;
            confidence: number;
            source?: string;
        }>;
        isProcessing: boolean;
    };
}

export interface Category {
    id: string;
    name: string;
    color: string;
}

// ============================================
// OPERATIONS & MANAGEMENT
// ============================================

export interface WasteLog {
    id: string;
    productId?: string;
    ingredientId?: string;
    name: string;
    quantity: number;
    unit: string;
    reason: 'damaged' | 'expired' | 'mistake' | 'waste';
    costInCents: number;
    timestamp: Date;
    loggedBy: string;
}

export interface PrepTask {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    isCompleted: boolean;
    assignedTo?: string;
    dueDate: Date;
}

export interface MiseEnPlaceTask extends PrepTask {
    station?: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    estimatedTime: number; // in minutes
    actualTime?: number;
    notes?: string;
    recipeId?: string; // linked recipe id
}

export interface MenuAnalysis {
    productId: string;
    name: string;
    profitability: number; // Margin
    popularity: number; // Sales volume
    category: 'star' | 'plowhorse' | 'puzzle' | 'dog';
}

// ============================================
// SYSTEM & SYNC
// ============================================

export interface AuditLog {
    id: string;
    timestamp: Date;
    userId: string;
    userName: string;
    action: string;
    module: string;
    details?: string;
}

// ============================================
// ADVANCED MODULES (PREMIUM)
// ============================================

// 1. REPUTATION & SENTIMENT
export type SentimentType = 'positive' | 'neutral' | 'negative' | 'ironic';

export interface SocialReview {
    id: string;
    source: 'google' | 'tripadvisor' | 'yelp' | 'facebook' | 'instagram';
    rating: number;
    content: string;
    author: string;
    timestamp: Date;
    sentiment: SentimentType;
    themes: string[]; // ['service', 'food', 'price', 'atmosphere']
    replied: boolean;
    suggestedReply?: string;
}

// 3. IOT PREDICTIVE MAINTENANCE
export interface EquipmentMetric {
    id: string;
    equipmentId: string;
    name: string;
    type: 'temperature' | 'vibration' | 'power_draw';
    value: number;
    timestamp: Date;
    anomalous: boolean;
}

export interface PredictiveAlert {
    id: string;
    equipmentId: string;
    equipmentName: string;
    predictedFailureDate: Date;
    confidence: number;
    reason: string;
    severity: 'low' | 'medium' | 'critical';
}

// 4. INGREDIENT PROFITABILITY
export interface IngredientPricePoint {
    ingredientId: string;
    priceInCents: number;
    timestamp: Date;
    source: 'invoice' | 'market';
}

export interface ProfitabilityAlert {
    productId: string;
    productName: string;
    currentMarginInCents: number;
    currentMargin: number; // Alias for UI
    targetMarginInCents: number;
    targetMargin: number; // Alias for UI
    status: 'ok' | 'critical';
    suggestedPriceInCents: number;
    suggestedPrice: number; // Alias for UI
}

// 5. DIGITAL TWIN SIMULATOR
export interface SimulationScenario {
    id: string;
    name: string;
    description: string;
    inputs: {
        priceChange?: number; // +/- percentage
        newOpeningHours?: string[];
        menuChanges?: string[]; // IDs of added/removed products
    };
    projections: {
        revenueImpact: number;
        laborCostImpact: number;
        netProfitChange: number;
    };
    confidenceScore: number;
}
