/**
 * Re-export canonique pour rétro-compatibilité interne au module finance.
 * L'implémentation est hébergée dans src/lib/mcc/fiscal/FiscalSealer.ts (ADR-015) —
 * évite le cycle finance ↔ lib via le barrel.
 */
export { FiscalSealer } from '@/lib/mcc/fiscal/FiscalSealer';
