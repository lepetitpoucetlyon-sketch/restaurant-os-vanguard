import { SovereignNode } from '@/shared/nexus-contract';
import type { Table, Order, Product, Recipe, Reservation, Quote, Campaign, Floor, Zone, LegalInvoice, Group } from './nexus-business.types';
import type { Customer, CRM_Record } from './customer.types';
import type { Ingredient } from './logistics';

export function isTable(node: SovereignNode): node is Table {
    return typeof node === 'object' && node !== null && typeof node.id === 'string' && typeof node.status === 'string' && typeof node.number === 'string' && typeof node.seats === 'number';
}

export function isOrder(node: SovereignNode): node is Order {
    return typeof node === 'object' && node !== null && typeof node.id === 'string' && typeof node.status === 'string' && typeof node.tableNumber === 'string' && typeof node.totalInCents === 'number' && Array.isArray(node.items);
}

export function isProduct(node: SovereignNode): node is Product {
    return typeof node === 'object' && node !== null && typeof node.id === 'string' && typeof node.name === 'string' && typeof node.priceInCents === 'number' && typeof node.categoryId === 'string';
}

export function isRecipe(node: SovereignNode): node is Recipe {
    return typeof node === 'object' && node !== null && typeof node.id === 'string' && typeof node.name === 'string' && Array.isArray(node.ingredients) && typeof node.preparationTimeMinutes === 'number';
}

export function isIngredient(node: SovereignNode): node is Ingredient {
    return typeof node === 'object' && node !== null && typeof node.id === 'string' && typeof node.name === 'string' && typeof (node as Ingredient).unit === 'string';
}

export function isReservation(node: SovereignNode): node is Reservation {
    return typeof node === 'object' && node !== null && typeof node.id === 'string' && typeof node.date === 'string' && typeof node.time === 'string' && typeof node.partySize === 'number' && typeof node.status === 'string';
}

export function isQuote(node: SovereignNode): node is Quote {
    return typeof node === 'object' && node !== null && typeof node.id === 'string' && typeof node.title === 'string' && typeof node.amount === 'number' && typeof node.status === 'string' && Array.isArray(node.items);
}

export function isCampaign(node: SovereignNode): node is Campaign {
    return typeof node === 'object' && node !== null && typeof node.id === 'string' && typeof node.title === 'string' && typeof node.status === 'string' && typeof node.budget === 'number' && typeof node.startDate === 'string' && typeof node.endDate === 'string';
}

export function isFloor(node: SovereignNode): node is Floor {
    return typeof node === 'object' && node !== null && typeof node.id === 'string' && typeof node.name === 'string' && typeof node.level === 'number';
}

export function isZone(node: SovereignNode): node is Zone {
    return typeof node === 'object' && node !== null && typeof node.id === 'string' && typeof node.name === 'string' && typeof node.color === 'string';
}

export function isLegalInvoice(node: SovereignNode): node is LegalInvoice {
    return typeof node === 'object' && node !== null && typeof node.id === 'string' && typeof node.orderId === 'string' && typeof node.invoiceNumber === 'string' && typeof node.totalInCents === 'number' && Array.isArray(node.taxDetails);
}

export function isCustomer(node: SovereignNode): node is Customer {
    return typeof node === 'object' && node !== null && typeof node.id === 'string' && typeof node.firstName === 'string' && typeof node.lastName === 'string' && typeof node.phone === 'string';
}

export function isCRMRecord(node: SovereignNode): node is CRM_Record {
    return isCustomer(node);
}

export function isGroup(node: SovereignNode): node is Group {
    return typeof node === 'object' && node !== null && typeof node.id === 'string' && typeof node.name === 'string';
}
