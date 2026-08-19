/**
 * Barrel du module menu-builder — exposé via @/modules/ops par re-export.
 * Consommé par les pages App Router pour éviter les imports profonds
 * (violation Barrel Contract).
 */
export * from './menuBuilderConstants';
export { CategorySidebar } from './components/CategorySidebar';
export { ProductCardGrid } from './components/ProductCardGrid';
export { ProductEditModal } from './components/ProductEditModal';
