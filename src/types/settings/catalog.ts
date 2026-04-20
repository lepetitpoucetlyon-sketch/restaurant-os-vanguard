// @ts-nocheck
export interface MenuCategory {
    id: string;
    name: string;
    description?: string;
    order: number;
    icon?: string;
    color?: string;
    image?: string;
    isVisible: boolean;
    availableFor: 'lunch' | 'dinner' | 'both';
    availableFrom?: string;
    availableTo?: string;
}

export interface NutritionInfo {
    calories?: number;
    proteins?: number;
    carbs?: number;
    fats?: number;
    fiber?: number;
    salt?: number;
}

export interface ProductSettings {
    id: string;
    name: string;
    shortDescription?: string;
    longDescription?: string;
    priceHT: number;
    priceTTC: number;
    taxRate: number;
    mainPhoto?: string;
    gallery?: string[];
    categoryId: string;
    secondaryCategories?: string[];
    tags: string[];
    allergens: string[];
    nutritionInfo?: NutritionInfo;
    origin?: string;
    labels?: string[];
    prepTime?: number;
    portion?: string;
    availability: 'in_stock' | 'out_of_stock' | 'seasonal';
    seasonalMonths?: number[];
    visibleOnMenu: boolean;
    visibleOnline: boolean;
    isChefRecommended: boolean;
    isNew: boolean;
    isPopular: boolean;
    foodCost?: number;
    targetMargin?: number;
    suggestedSides?: string[];
    suggestedDrinks?: string[];
    displayOrder: number;
}

export interface Supplement {
    id: string;
    name: string;
    price: number;
    category: string;
    productIds: string[];
    maxSelectable: number;
    isRequired: boolean;
}

export interface MenuFormule {
    id: string;
    name: string;
    description?: string;
    price: number;
    starterIds: string[];
    mainIds: string[];
    dessertIds: string[];
    drinkIds?: string[];
    availableFor: 'lunch' | 'dinner' | 'both';
    maxChoicesPerCategory: number;
    supplements?: string[];
    restrictions?: string;
}
