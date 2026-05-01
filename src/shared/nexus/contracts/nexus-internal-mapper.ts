/*
 * 🏛️ NEXUS INTERNAL MAPPER - Type Narrowing Contracts
 * Grade X++ Suture Protocol
 * This file provides type-safe conversion functions from SovereignNode to domain-specific types.
 */

import { SovereignNode, OperationalIdentity, SovereignMap } from '@shared/nexus-contract';
import type { Ingredient } from './logistics';
import { SOVEREIGN_MODULE_IDS } from '../../ModuleRegistry';
import { SovereignError, PillarId, CoreErrorCode } from './errors.types';
import type { Customer, CRM_Record } from './customer.types';
export type { Customer, CRM_Record };

// --- Security & Permissions ---
// ... (omitted for brevity in replace call, but I will include the full section if needed)

/**
 * 🏛️ Error Translation Protocol
 * Converts raw technical exceptions into structed SovereignErrors.
 */
export function translateError(error: unknown, pillar: PillarId = 'CORE'): SovereignError {
    const baseError: SovereignError = {
        code: CoreErrorCode.INTERNAL_CRASH,
        pillar,
        message: error instanceof Error ? error.message : 'An unknown Imperial error occurred',
        severity: 'MEDIUM',
        timestamp: new Date().toISOString(),
    };

    // Logic to refine error code based on message or error type could be added here
    if (error instanceof Error && error.message.includes('NOT_FOUND')) {
        baseError.code = 'NOT_FOUND_ERR'; // Generic for now, but following the pillar prefix
    }

    return baseError;
}

// --- Security & Permissions ---

import { User, UserPermissions } from './auth.types';

/**
 * DNA Protocol for Module Access
 */
export function canAccessModule(permissions: UserPermissions, moduleId: string): boolean {
    if (permissions.isSovereignAdmin) return true;
    if (!SOVEREIGN_MODULE_IDS.has(moduleId as any)) return false;
    return permissions.allowedModules.includes(moduleId);
}

// --- Core Business Types ---

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
        order: number;
        instruction: string;
        duration?: number;
    }>;
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

// Suture: Ingredient moved to logistics.ts to allow for full Grade X complexity.

// Suture: Removed duplicate Reservation interface to resolve TS2717 and TS2687

// Suture: Preparation moved to logistics.ts to allow for full Grade X complexity.

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

// --- Type Guard Functions ---

/**
 * Type guard for Table
 */
export function isTable(node: SovereignNode): node is Table {
    return (
        typeof node === 'object' &&
        node !== null &&
        typeof node.id === 'string' &&
        typeof node.status === 'string' &&
        typeof node.number === 'string' &&
        typeof node.seats === 'number'
    );
}

/**
 * Type guard for Order
 */
export function isOrder(node: SovereignNode): node is Order {
    return (
        typeof node === 'object' &&
        node !== null &&
        typeof node.id === 'string' &&
        typeof node.status === 'string' &&
        typeof node.tableNumber === 'string' &&
        typeof node.totalInCents === 'number' &&
        Array.isArray(node.items)
    );
}

/**
 * Type guard for Product
 */
export function isProduct(node: SovereignNode): node is Product {
    return (
        typeof node === 'object' &&
        node !== null &&
        typeof node.id === 'string' &&
        typeof node.name === 'string' &&
        typeof node.priceInCents === 'number' &&
        typeof node.categoryId === 'string'
    );
}

/**
 * Type guard for Recipe
 */
export function isRecipe(node: SovereignNode): node is Recipe {
    return (
        typeof node === 'object' &&
        node !== null &&
        typeof node.id === 'string' &&
        typeof node.name === 'string' &&
        Array.isArray(node.ingredients) &&
        typeof node.preparationTimeMinutes === 'number'
    );
}

/**
 * Type guard for Ingredient
 */
export function isIngredient(node: SovereignNode): node is import('./logistics').Ingredient {
    return (
        typeof node === 'object' &&
        node !== null &&
        typeof node.id === 'string' &&
        typeof node.name === 'string' &&
        typeof (node as any).unit === 'string'
    );
}

/**
 * Type guard for Reservation
 */
export function isReservation(node: SovereignNode): node is Reservation {
    return (
        typeof node === 'object' &&
        node !== null &&
        typeof node.id === 'string' &&
        typeof node.date === 'string' &&
        typeof node.time === 'string' &&
        typeof node.partySize === 'number' &&
        typeof node.status === 'string'
    );
}

/**
 * Type guard for Quote
 */
export function isQuote(node: SovereignNode): node is Quote {
    return (
        typeof node === 'object' &&
        node !== null &&
        typeof node.id === 'string' &&
        typeof node.title === 'string' &&
        typeof node.amount === 'number' &&
        typeof node.status === 'string' &&
        Array.isArray(node.items)
    );
}

/**
 * Type guard for Campaign
 */
export function isCampaign(node: SovereignNode): node is Campaign {
    return (
        typeof node === 'object' &&
        node !== null &&
        typeof node.id === 'string' &&
        typeof node.title === 'string' &&
        typeof node.status === 'string' &&
        typeof node.budget === 'number' &&
        typeof node.startDate === 'string' &&
        typeof node.endDate === 'string'
    );
}

/**
 * Type guard for Floor
 */
export function isFloor(node: SovereignNode): node is Floor {
    return (
        typeof node === 'object' &&
        node !== null &&
        typeof node.id === 'string' &&
        typeof node.name === 'string' &&
        typeof node.level === 'number'
    );
}

/**
 * Type guard for Zone
 */
export function isZone(node: SovereignNode): node is Zone {
    return (
        typeof node === 'object' &&
        node !== null &&
        typeof node.id === 'string' &&
        typeof node.name === 'string' &&
        typeof node.color === 'string'
    );
}

/**
 * Type guard for LegalInvoice
 */
export function isLegalInvoice(node: SovereignNode): node is LegalInvoice {
    return (
        typeof node === 'object' &&
        node !== null &&
        typeof node.id === 'string' &&
        typeof node.orderId === 'string' &&
        typeof node.invoiceNumber === 'string' &&
        typeof node.totalInCents === 'number' &&
        Array.isArray(node.taxDetails)
    );
}

/**
 * Type guard for Customer
 */
export function isCustomer(node: SovereignNode): node is Customer {
    return (
        typeof node === 'object' &&
        node !== null &&
        typeof node.id === 'string' &&
        typeof node.firstName === 'string' &&
        typeof node.lastName === 'string' &&
        typeof node.phone === 'string'
    );
}

/**
 * Type guard for CRM_Record
 */
export function isCRMRecord(node: SovereignNode): node is CRM_Record {
    return isCustomer(node);
}

// --- Type Conversion Functions ---

/**
 * Convert SovereignNode to Table with validation
 */
export function toTable(node: SovereignNode): Table {
    if (!isTable(node)) {
        throw new Error(`Cannot convert SovereignNode to Table: missing required properties`);
    }
    return node;
}

/**
 * Convert SovereignNode to Order with validation
 */
export function toOrder(node: SovereignNode): Order {
    if (!isOrder(node)) {
        throw new Error(`Cannot convert SovereignNode to Order: missing required properties`);
    }
    return node;
}

/**
 * Convert SovereignNode to Product with validation
 */
export function toProduct(node: SovereignNode): Product {
    if (!isProduct(node)) {
        throw new Error(`Cannot convert SovereignNode to Product: missing required properties`);
    }
    return node;
}

/**
 * Convert SovereignNode to Recipe with validation
 */
export function toRecipe(node: SovereignNode): Recipe {
    if (!isRecipe(node)) {
        throw new Error(`Cannot convert SovereignNode to Recipe: missing required properties`);
    }
    return node;
}

/**
 * Convert SovereignNode to Ingredient with validation
 */
export function toIngredient(node: SovereignNode): Ingredient {
    if (!isIngredient(node)) {
        throw new Error(`Cannot convert SovereignNode to Ingredient: missing required properties`);
    }
    return node;
}

/**
 * Convert SovereignNode to Reservation with validation
 */
export function toReservation(node: SovereignNode): Reservation {
    if (!isReservation(node)) {
        throw new Error(`Cannot convert SovereignNode to Reservation: missing required properties`);
    }
    return node;
}

/**
 * Convert SovereignNode to Quote with validation
 */
export function toQuote(node: SovereignNode): Quote {
    if (!isQuote(node)) {
        throw new Error(`Cannot convert SovereignNode to Quote: missing required properties`);
    }
    return node;
}

/**
 * Convert SovereignNode to Campaign with validation
 */
export function toCampaign(node: SovereignNode): Campaign {
    if (!isCampaign(node)) {
        throw new Error(`Cannot convert SovereignNode to Campaign: missing required properties`);
    }
    return node;
}

/**
 * Convert SovereignNode to Floor with validation
 */
export function toFloor(node: SovereignNode): Floor {
    if (!isFloor(node)) {
        throw new Error(`Cannot convert SovereignNode to Floor: missing required properties`);
    }
    return node;
}

/**
 * Convert SovereignNode to Zone with validation
 */
export function toZone(node: SovereignNode): Zone {
    if (!isZone(node)) {
        throw new Error(`Cannot convert SovereignNode to Zone: missing required properties`);
    }
    return node;
}

/**
 * Convert SovereignNode to LegalInvoice with validation
 */
export function toLegalInvoice(node: SovereignNode): LegalInvoice {
    if (!isLegalInvoice(node)) {
        throw new Error(
            `Cannot convert SovereignNode to LegalInvoice: missing required properties`,
        );
    }
    return node;
}

/**
 * Convert SovereignNode to Customer with validation
 */
export function toCustomer(node: SovereignNode): Customer {
    if (!isCustomer(node)) {
        throw new Error(`Cannot convert SovereignNode to Customer: missing required properties`);
    }
    return node;
}

/**
 * 🏛️ NEXUS INTERNAL MAPPER - Static Interface
 * Unified class for type-safe mapping.
 */
export class NexusInternalMapper {
    static mapToTable(node: SovereignNode): Table {
        return toTable(node);
    }
    static mapToOrder(node: SovereignNode): Order {
        return toOrder(node);
    }
    static mapToProduct(node: SovereignNode): Product {
        return toProduct(node);
    }
    static mapToRecipe(node: SovereignNode): Recipe {
        return toRecipe(node);
    }
    static mapToIngredient(node: SovereignNode): Ingredient {
        return toIngredient(node);
    }
    static mapToReservation(node: SovereignNode): Reservation {
        return toReservation(node);
    }
    static mapToQuote(node: SovereignNode): Quote {
        return toQuote(node);
    }
    static mapToCampaign(node: SovereignNode): Campaign {
        return toCampaign(node);
    }
    static mapToFloor(node: SovereignNode): Floor {
        return toFloor(node);
    }
    static mapToZone(node: SovereignNode): Zone {
        return toZone(node);
    }
    static mapToLegalInvoice(node: SovereignNode): LegalInvoice {
        return toLegalInvoice(node);
    }
    static mapToCustomer(node: SovereignNode): Customer {
        return toCustomer(node);
    }
    static translateError = translateError;
}

// --- END OF NEXUS INTERNAL MAPPER ---
