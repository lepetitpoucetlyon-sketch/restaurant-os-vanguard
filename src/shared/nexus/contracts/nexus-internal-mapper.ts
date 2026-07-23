/*
 * 🏛️ NEXUS INTERNAL MAPPER - Type Narrowing Contracts
 * Grade X++ Suture Protocol
 * This file provides type-safe conversion functions from SovereignNode to domain-specific types.
 */

import type { Table, Order, Reservation, OrderStatus, TableStatus, OrderItem, OrderItemModification, Floor, Zone } from './ops.types';
import type { Product, Quote, Group } from './commerce.types';
import type { Campaign } from './marketing.types';
import type { LegalInvoice, JournalEntry } from './finance.types';
import type { Option, OptionGroup, Category } from './common.types';
import { ModuleId } from '@shared/genome.types';
import type { Customer, CRM_Record } from './customer.types';
import type { Recipe, RecipeIngredient } from './logistics';
import { translateError } from './nexus-error-mapper';
import { canAccessModule } from './nexus-auth-mapper';
import { toTable, toOrder, toProduct, toRecipe, toIngredient, toReservation, toQuote, toCampaign, toFloor, toZone, toLegalInvoice, toCustomer, toGroup, toJournalEntry, toCategory } from './nexus-type-converters';
import { isTable, isOrder, isProduct, isRecipe, isIngredient, isReservation, isQuote, isCampaign, isFloor, isZone, isLegalInvoice, isCustomer, isCRMRecord, isGroup, isJournalEntry, isCategory } from './nexus-type-guards';

// --- Re-exports to maintain backward compatibility ---
export type { Table, Order, Product, Recipe, Reservation, Quote, Campaign, Floor, Zone, LegalInvoice, Group, OrderStatus, TableStatus, OrderItem, OrderItemModification, Option, OptionGroup, RecipeIngredient, ModuleId, Customer, CRM_Record, JournalEntry, Category };
export { translateError, canAccessModule, toTable, toOrder, toProduct, toRecipe, toIngredient, toReservation, toQuote, toCampaign, toFloor, toZone, toLegalInvoice, toCustomer, toGroup, toJournalEntry, toCategory, isTable, isOrder, isProduct, isRecipe, isIngredient, isReservation, isQuote, isCampaign, isFloor, isZone, isLegalInvoice, isCustomer, isCRMRecord, isGroup, isJournalEntry, isCategory };

/**
 * 🏛️ NEXUS INTERNAL MAPPER - Static Interface
 * Unified class for type-safe mapping.
 */
export class NexusInternalMapper {
    static mapToTable = toTable;
    static mapToOrder = toOrder;
    static mapToProduct = toProduct;
    static mapToRecipe = toRecipe;
    static mapToIngredient = toIngredient;
    static mapToReservation = toReservation;
    static mapToQuote = toQuote;
    static mapToCampaign = toCampaign;
    static mapToFloor = toFloor;
    static mapToZone = toZone;
    static mapToLegalInvoice = toLegalInvoice;
    static mapToCustomer = toCustomer;
    static mapToGroup = toGroup;
    static mapToJournalEntry = toJournalEntry;
    static translateError = translateError;
}
