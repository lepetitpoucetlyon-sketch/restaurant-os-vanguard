import { SovereignNode } from '@/shared/nexus-contract';
import { isTable, isOrder, isProduct, isRecipe, isIngredient, isReservation, isQuote, isCampaign, isFloor, isZone, isLegalInvoice, isCustomer, isGroup, isJournalEntry, isCategory } from './nexus-type-guards';
import type { Table, Order, Reservation, Floor, Zone } from './ops.types';
import type { Product, Quote, Group } from './commerce.types';
import type { Campaign } from './marketing.types';
import type { LegalInvoice, JournalEntry } from './finance.types';
import type { Customer } from './customer.types';
import type { Ingredient, Recipe } from './logistics';
import type { Category } from './common.types';

export function toCategory(node: SovereignNode): Category {
    if (!isCategory(node)) throw new Error(`Cannot convert SovereignNode to Category`);
    return node;
}

export function toTable(node: SovereignNode): Table {
    if (!isTable(node)) throw new Error(`Cannot convert SovereignNode to Table`);
    return node;
}

export function toOrder(node: SovereignNode): Order {
    if (!isOrder(node)) throw new Error(`Cannot convert SovereignNode to Order`);
    return node;
}

export function toProduct(node: SovereignNode): Product {
    if (!isProduct(node)) throw new Error(`Cannot convert SovereignNode to Product`);
    return node;
}

export function toRecipe(node: SovereignNode): Recipe {
    if (!isRecipe(node)) throw new Error(`Cannot convert SovereignNode to Recipe`);
    return node;
}

export function toIngredient(node: SovereignNode): Ingredient {
    if (!isIngredient(node)) throw new Error(`Cannot convert SovereignNode to Ingredient`);
    return node;
}

export function toReservation(node: SovereignNode): Reservation {
    if (!isReservation(node)) throw new Error(`Cannot convert SovereignNode to Reservation`);
    return node;
}

export function toQuote(node: SovereignNode): Quote {
    if (!isQuote(node)) throw new Error(`Cannot convert SovereignNode to Quote`);
    return node;
}

export function toCampaign(node: SovereignNode): Campaign {
    if (!isCampaign(node)) throw new Error(`Cannot convert SovereignNode to Campaign`);
    return node;
}

export function toFloor(node: SovereignNode): Floor {
    if (!isFloor(node)) throw new Error(`Cannot convert SovereignNode to Floor`);
    return node;
}

export function toZone(node: SovereignNode): Zone {
    if (!isZone(node)) throw new Error(`Cannot convert SovereignNode to Zone`);
    return node;
}

export function toLegalInvoice(node: SovereignNode): LegalInvoice {
    if (!isLegalInvoice(node)) throw new Error(`Cannot convert SovereignNode to LegalInvoice`);
    return node;
}

export function toCustomer(node: SovereignNode): Customer {
    if (!isCustomer(node)) throw new Error(`Cannot convert SovereignNode to Customer`);
    return node;
}

export function toGroup(node: SovereignNode): Group {
    if (!isGroup(node)) throw new Error(`Cannot convert SovereignNode to Group`);
    return node;
}

export function toJournalEntry(node: SovereignNode): JournalEntry {
    if (!isJournalEntry(node)) throw new Error(`Cannot convert SovereignNode to JournalEntry`);
    return node;
}
