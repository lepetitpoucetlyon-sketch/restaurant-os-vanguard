/**
 * COMMON / SHARED TYPES
 */

// ============================================
// NOTIFICATIONS
// ============================================

import { SovereignNode, SovereignField, SovereignData } from '@/shared/nexus-contract';
// Imports redirigés vers les sources canoniques pour casser le cycle
// common.types <-> nexus-internal-mapper (détecté par sentrux). La surface
// publique (re-export ci-dessous) reste identique.
import type { Recipe, RecipeIngredient } from './logistics';
import type { Customer } from './customer.types';
import type { Product } from './commerce.types';
import type { ModuleId } from '@/shared/genome.types';
import type { Floor, Zone } from './ops.types';
export type { Recipe, RecipeIngredient, Customer, Product, ModuleId, Floor, Zone };
import { Ingredient } from './logistics';

// Ingredient is defined in nexus-internal-mapper.ts (Neutral Ground)

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
    createdAt: string;
    updatedAt: string;
}

// ============================================
// PRODUCTS & MENU
// ============================================

export interface Option {
    [key: string]: SovereignField | undefined;
    id: string;
    name: string;
    priceModifierInCents: number;
    priceModifierInMicrounits?: number; // microunits = cents × 10 000
    isDefault?: boolean;
    // Stock-Engine-Nexus linking
    ingredientId?: string;
    action?: 'add' | 'remove' | 'info';
    quantityImpact?: number; // In grams or units
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
    [key: string]: SovereignField;
    order: number;
    instruction: string;
    duration?: number; // In minutes
    temperature?: string;
    tip?: string;
    imageUrl?: string;
    videoUrl?: string;
}

// Product is now imported from nexus-internal-mapper.ts



// SEOProfile: Defined locally to avoid peripheral import
export interface SEOProfile {
    id: string;
    establishmentId: string;
    site: { title: string; description: string; keywords: string[]; language: string; locale: string; [key: string]: SovereignField };
    organization: { name: string; description: string; logo: string; [key: string]: SovereignField };
    restaurant: { cuisineTypes: string[]; priceRange: string; [key: string]: SovereignField };
    [key: string]: SovereignField;
}

// FleetInsight: Already defined in @nexus/contracts/fleet.types.ts
import { FleetInsight } from './fleet.types';

/**
 * 🧠 IntelligenceConfig - Grade VI Atomic Bridge
 * Centralizes the configuration for the system's strategic engine.
 */
export interface IntelligenceConfig {
    globalInflationRate: number;
    setGlobalInflationRate?: (rate: number) => void;
    insights?: FleetInsight[];
    seoProfile?: SEOProfile;
    scenarios?: SimulationScenario[];
    financialInsight?: {
        revenue: number;
        foodCostPercent: number;
        laborCostPercent: number;
        primeCost: number;
    } | null;
    runSimulation?: (config: Partial<SimulationScenario>) => Promise<void>; 
    predictSignatureChance?: (quote: { id: string; title: string; amount: number; status: string; [key: string]: SovereignField }, inflation?: number) => number;
    predictLaborCost?: (shift: { id: string; date: string; type: string; [key: string]: SovereignField }) => number;
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
    miseEnPlaceTarget: { [key: string]: number };
    calculateRecipeCost: (ingredients: RecipeIngredient[]) => number;

    ingredients: Ingredient[]; 
    
    expert: {
        queryExpert: (prompt: string, contextData?: SovereignData) => Promise<{
            response: string;
            suggestions?: string[];
            metadata?: SovereignData;
        }>;
        isConfigured: boolean;
        isAuthorized: boolean;
        role: string;
        modelId: string;
    };
    agent: {
        query: (prompt: string, context?: SovereignData) => Promise<{
            answer: string;
            confidence: number;
            source?: string;
        }>;
        isProcessing: boolean;
    };

}

export interface Category extends SovereignNode {
    id: string;
    name: string;
    color: string;
    createdAt: string;
    updatedAt: string;
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
    costInMicrounits?: number; // microunits = cents × 10 000
    timestamp: Date;
    loggedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface PrepTask {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    isCompleted: boolean;
    assignedTo?: string;
    dueDate: Date;
    createdAt?: Date | string;
    updatedAt?: Date | string;
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

export interface AuditLog extends SovereignNode {
    timestamp: string;
    userId: string;
    userName?: string;
    action: string;
    module?: string;
    details?: string;
    metadata?: SovereignData;
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
    priceInMicrounits?: number; // microunits = cents × 10 000
    timestamp: Date;
    source: 'invoice' | 'market';
}

export interface ProfitabilityAlert {
    productId: string;
    productName: string;
    currentMarginBps: number;
    currentMargin: number;
    targetMarginBps: number;
    targetMargin: number;
    status: 'ok' | 'critical';
    suggestedPriceInMicrounits: number;
    suggestedPrice: number;
    impactLevel?: 'high' | 'medium' | 'low';
    category?: string;
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

// ============================================
// DOCUMENTATION & TUTORIALS
// ============================================

export interface DocCategory {
    title: string;
    description: string;
    icon: import('lucide-react').LucideIcon | string;
    color: string;
    isRecipe?: boolean;
    recipe?: {
        name: string;
        description: string;
        image: string;
        prepTime: string;
        difficulty: string;
        ingredients: { name: string; quantity: string }[];
        steps: { order: string; instruction: string; time: string }[];
        allergens: string[];
    };
    details: {
        label: string;
        content: string;
    }[];
    fullTutorial?: {
        title: string;
        icon: string;
        content: string;
        points: string[];
    }[];
}
