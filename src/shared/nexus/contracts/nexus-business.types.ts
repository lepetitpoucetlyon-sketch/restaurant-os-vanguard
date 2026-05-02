import { SovereignNode, SovereignMap } from '@/shared/nexus-contract';

export type TableStatus =
    | 'free'
    | 'available'
    | 'occupied'
    | 'reserved'
    | 'cleaning'
    | 'locked'
    | string;

export interface Table extends SovereignNode {
    number: string;
    seats: number;
    status: TableStatus;
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    zoneId: string;
    floorId?: string;
}

export interface OrderItemModification extends SovereignMap {
    id: string;
    type: string;
    description: string;
    requestedAt: string;
    approved: boolean;
    respondedAt?: string;
    respondedBy?: string;
    responseNote?: string;
}

export interface OrderItem extends SovereignNode {
    productId: string;
    categoryId?: string;
    name: string;
    quantity: number;
    priceInCents: number;
    modifiers?: string[];
    notes?: string;
    status?: 'pending' | 'cooking' | 'ready' | 'served';
    removedIngredients?: string[];
    addedIngredients?: string[];
    allergens?: string[];
    modification?: OrderItemModification;
}

export interface Order extends SovereignNode {
    status:
        | 'draft'
        | 'new'
        | 'ordered'
        | 'preparing'
        | 'ready'
        | 'delivered'
        | 'cancelled'
        | 'paid'
        | string;
    tableId?: string;
    tableNumber: string;
    serverName?: string;
    timestamp: string;
    items: OrderItem[];
    totalInCents: number;
    paymentMethod?: 'card' | 'cash' | 'mobile';
    isUrgent?: boolean;
    customerName?: string;
    customerId?: string; // Suture: ensure consistency
    blockchainProof?: {
        hash: string;
        timestamp: string;
        blockNumber: number;
        status: 'pending' | 'confirmed' | 'failed';
        maticTxId?: string;
    };
}

export interface Reservation extends SovereignNode {
    id: string;
    customerId: string;
    tableId?: string;
    date: string; // ISO
    time: string; // HH:mm
    partySize: number;
    status: 'pending' | 'confirmed' | 'arrived' | 'seated' | 'cancelled' | 'no_show';
    notes?: string;
}

export interface Option {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined;
    id: string;
    name: string;
    priceModifierInCents: number;
    isDefault?: boolean;
}

export interface OptionGroup extends SovereignNode {
    name: string;
    type: 'single' | 'multiple';
    required: boolean;
    minSelections?: number;
    maxSelections?: number;
    options: Option[];
}

export interface Product extends SovereignNode {
    name: string;
    priceInCents: number;
    categoryId: string;
    description?: string;
    imageUrl?: string;
    image?: string; // Suture for UI compatibility
    color?: string; // Suture for UI compatibility
    sku?: string;
    ingredients?: Array<{
        [key: string]: import('@/shared/nexus-contract').SovereignField | undefined;
        ingredientId: string;
        quantity: number;
    }>;
    allergens?: string[];
    isAvailable?: boolean;
    stockQuantity?: number;
    optionGroups?: OptionGroup[]; // Suture: Now using populated objects as expected by UI
}

export interface RecipeIngredient extends SovereignMap {
    ingredientId: string;
    name: string;
    quantity: number;
    unit: string;
    costInCents: number;
}

export interface Recipe extends SovereignNode {
    name: string;
    ingredients: RecipeIngredient[];
    preparationTimeMinutes: number;
    difficulty: 'easy' | 'medium' | 'hard';
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    allergens?: string[];
    recipeSteps?: Array<{
        [key: string]: import('@/shared/nexus-contract').SovereignField | undefined;
        order: number;
        instruction: string;
        duration?: number;
    }>;
    // --- Grade X Extensions ---
    category?: string;
    prepTime?: number;
    cookTime?: number;
    portions?: number;
    steps?: import('./common.types').RecipeStep[];
    dietaryInfo?: string[];
    costPriceInCents?: number;
    sellingPriceInCents?: number;
    marginInCents?: number;
    color?: string;
    isActive?: boolean;
}

export type OrderStatus =
    | 'draft'
    | 'new'
    | 'ordered'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'cancelled'
    | 'paid'
    | string;
export type ModuleId = string;

export interface Quote extends SovereignNode {
    title: string;
    number: string;
    amount: number;
    amountInCents: number;
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'converted' | 'rejected' | 'expired';
    customerId: string;
    customerName: string;
    validUntil?: string;
    totals: {
        totalHTInCents: number;
        totalTTCInCents: number;
        totalTaxInCents: number;
        totalDiscountInCents: number;
    };
    customer: {
        id: string;
        name: string;
        email?: string;
        type: 'individual' | 'company';
    };
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        priceInCents: number;
    }>;
}

export interface Campaign extends SovereignNode {
    title: string;
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
    budget: number;
    startDate: string;
    endDate: string;
    targetAudience: string;
    channels: string[];
}

export interface Floor extends SovereignNode {
    name: string;
    level: number;
    isActive: boolean;
    icon?: string;
    description?: string;
}

export interface Zone extends SovereignNode {
    name: string;
    color: string;
    description?: string;
    floorId?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}

export interface LegalInvoice extends SovereignNode {
    orderId: string;
    invoiceNumber: string;
    customerName?: string;
    subTotalInCents: number;
    taxTotalInCents: number;
    totalInCents: number;
    taxDetails: Array<{
        rate: number;
        amountInCents: number;
        baseInCents: number;
    }>;
    status: 'draft' | 'issued' | 'paid' | 'cancelled';
    issuedAt: string;
    seal?: string;
}
