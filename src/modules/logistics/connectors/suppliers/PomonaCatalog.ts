/**
 * Catalogue Pomona — données statiques phase 1 (gamme Brake).
 * Phase 2 = intégration EDI Pomona ou catalogue XML partenaire.
 */

import type { SupplierCatalogEntry } from './MetroCatalog';

export const POMONA_PRODUCTS: SupplierCatalogEntry[] = [
  // ── Viandes élaborées ──────────────────────────────
  { name: 'Steak Haché 5/5 Bœuf pur', category: 'Viandes élaborées', unit: 'carton 8kg', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Escalope de Veau pré-parée', category: 'Viandes élaborées', unit: 'kg', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Lardons nature', category: 'Viandes élaborées', unit: 'sachet 5kg', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Jambon blanc cuit supérieur', category: 'Charcuterie', unit: 'kg', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Saucisse de Francfort cuite', category: 'Charcuterie', unit: 'carton 2.5kg', supplierId: 'pomona', supplierName: 'Pomona' },

  // ── Produits de la mer surgelés ────────────────────
  { name: 'Crevettes décortiquées surgelées', category: 'Surgelés mer', unit: 'carton 4kg', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Filets de Merlu surgelés', category: 'Surgelés mer', unit: 'carton 5kg', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Moules marinières cuites surgelées', category: 'Surgelés mer', unit: 'carton 2.5kg', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Calamars anneaux surgelés', category: 'Surgelés mer', unit: 'carton 3kg', supplierId: 'pomona', supplierName: 'Pomona' },

  // ── Légumes surgelés ───────────────────────────────
  { name: 'Frites fraîches longues 10/10', category: 'Surgelés légumes', unit: 'carton 5kg', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Petits pois carottes surgelés', category: 'Surgelés légumes', unit: 'carton 2.5kg', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Haricots verts extra fins surgelés', category: 'Surgelés légumes', unit: 'carton 2.5kg', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Brunoise de légumes surgelée', category: 'Surgelés légumes', unit: 'carton 2.5kg', supplierId: 'pomona', supplierName: 'Pomona' },

  // ── Pâtisserie & boulangerie ───────────────────────
  { name: 'Pain baguette tradition cru', category: 'Boulangerie', unit: 'carton 50 pièces', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Croissant pur beurre cru', category: 'Boulangerie', unit: 'carton 40 pièces', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Pain de campagne tranché', category: 'Boulangerie', unit: 'sachet 500g', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Génoise nature', category: 'Pâtisserie', unit: 'pièce 1kg', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Tarte aux pommes', category: 'Pâtisserie', unit: 'pièce 8 parts', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Millefeuille vanille', category: 'Pâtisserie', unit: 'plateau 8 pièces', supplierId: 'pomona', supplierName: 'Pomona' },

  // ── Épicerie ───────────────────────────────────────
  { name: 'Fond de veau déshydraté', category: 'Sauces & fonds', unit: 'boîte 800g', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Fumet de poisson', category: 'Sauces & fonds', unit: 'boîte 750g', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Mayonnaise classique', category: 'Condiments', unit: 'seau 5L', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Moutarde de Dijon', category: 'Condiments', unit: 'seau 5L', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Ketchup tomate', category: 'Condiments', unit: 'bidon 5L', supplierId: 'pomona', supplierName: 'Pomona' },
  { name: 'Chocolat couverture noir 64%', category: 'Confiserie', unit: 'tablette 5kg', supplierId: 'pomona', supplierName: 'Pomona' },
];

export function searchPomonaProducts(query: string, limit = 10): SupplierCatalogEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return POMONA_PRODUCTS.slice(0, limit);
  return POMONA_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  ).slice(0, limit);
}
