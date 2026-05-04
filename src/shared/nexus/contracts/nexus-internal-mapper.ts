/*
 * 🏛️ NEXUS INTERNAL MAPPER - Type Narrowing Contracts
 * Grade X++ Suture Protocol
 * This file provides type-safe conversion functions from SovereignNode to domain-specific types.
 */

import { SovereignNode } from '@/shared/nexus-contract';
import type { Table, Order, Product, Recipe, Reservation, Quote, Campaign, Floor, Zone, LegalInvoice, Group, OrderStatus, TableStatus, OrderItem, OrderItemModification, Option, OptionGroup, RecipeIngredient, ModuleId } from './nexus-business.types';
import type { Customer, CRM_Record } from './customer.types';
import type { Ingredient } from './logistics';
import { translateError } from './nexus-error-mapper';
import { canAccessModule } from './nexus-auth-mapper';
import { toTable, toOrder, toProduct, toRecipe, toIngredient, toReservation, toQuote, toCampaign, toFloor, toZone, toLegalInvoice, toCustomer, toGroup } from './nexus-type-converters';
import { isTable, isOrder, isProduct, isRecipe, isIngredient, isReservation, isQuote, isCampaign, isFloor, isZone, isLegalInvoice, isCustomer, isCRMRecord, isGroup } from './nexus-type-guards';

// --- Re-exports to maintain backward compatibility ---
export type { Table, Order, Product, Recipe, Reservation, Quote, Campaign, Floor, Zone, LegalInvoice, Group, OrderStatus, TableStatus, OrderItem, OrderItemModification, Option, OptionGroup, RecipeIngredient, ModuleId, Customer, CRM_Record };
export { translateError, canAccessModule, toTable, toOrder, toProduct, toRecipe, toIngredient, toReservation, toQuote, toCampaign, toFloor, toZone, toLegalInvoice, toCustomer, toGroup, isTable, isOrder, isProduct, isRecipe, isIngredient, isReservation, isQuote, isCampaign, isFloor, isZone, isLegalInvoice, isCustomer, isCRMRecord, isGroup };

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
    static mapToGroup(node: SovereignNode): Group {
        return toGroup(node);
    }
    static translateError = translateError;
}
