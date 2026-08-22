/**
 * 🏛️ NEXUS SMART SEAL - Grade X Barrel
 * This file is automatically maintained. Do not edit manually.
 * Manual changes will be overwritten unless you remove this header.
 */

export * from './commerce';
export * from './compliance';
export * from './facility';
export * from './finance';
export * from './human';
export * from './intelligence';
export * from './logistics';
export * from './ops';
export * from './system';

// Resolve cross-pilier TS2308 ambiguities (pilier canonique prend la précédence)
export { useMarketing, useQuotes, useRegistre } from './ops';
export { useProducts, useCategories } from './ops';
export { useCRM, useReservations } from './ops';
export { useInventory } from './logistics';
// Types cross-piliers — version canonique explicite
export type { StockItem } from './logistics';
export type { Reservation } from './commerce';
export type { DeliveryNote, PurchaseOrder } from './logistics';
export type { ComplianceAlert } from './compliance';
export type { DocumentType } from './human';
export type { ProductCategory } from './compliance';
export type { Floor, Table, TableShape, TableStatus, Zone } from './facility';
export type { OrchestratorSignal, TenantConfig, TenantTheme } from './system';
export type { ExtractedInvoice } from './logistics';
export type { PrivatisationData, PrivatisationFormule } from './commerce';

