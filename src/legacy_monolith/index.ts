/**
 * 🏛️ NEXUS SMART SEAL - Grade X Barrel
 * This file is automatically maintained. Do not edit manually.
 * Manual changes will be overwritten unless you remove this header.
 */

export * from './commerce';
export * from './compliance';
export * from './finance';
export * from './human';

export * from './logistics';
export * from './ops';

// Resolve cross-pilier TS2308 ambiguities (ops sovereign versions take precedence)
export { useMarketing, useQuotes, useRegistre } from './ops';
export { useProducts, useCategories } from './ops';
