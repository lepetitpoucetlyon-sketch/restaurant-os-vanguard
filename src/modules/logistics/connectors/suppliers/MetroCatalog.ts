/**
 * Catalogue Metro — données statiques phase 1.
 * Phase 2 = appel API partenariat ou scraping Metro.fr avec parsing HTML.
 */

/**
 * Entrée de catalogue statique fournisseur (Metro, Pomona, …).
 * Distinct de `SupplierProduct` (provider integration : ISupplierProvider.fetchCatalog).
 */
export interface SupplierCatalogEntry {
  name: string;
  category: string;
  unit: string;
  unitSize?: string;
  brand?: string;
  supplierId: string;
  supplierName: string;
  eanBarcode?: string;
}

export const METRO_PRODUCTS: SupplierCatalogEntry[] = [
  // ── Viandes ──────────────────────────────────────
  { name: 'Entrecôte Bœuf France', category: 'Viandes', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Rumsteck Bœuf France', category: 'Viandes', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Filet de Bœuf charolais', category: 'Viandes', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Magret de Canard du Périgord', category: 'Viandes', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Poulet entier Label Rouge', category: 'Viandes', unit: 'pièce', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Blanc de Poulet', category: 'Viandes', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Côte de Porc', category: 'Viandes', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Agneau Gigot désossé', category: 'Viandes', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },

  // ── Poissons ──────────────────────────────────────
  { name: 'Saumon Atlantique Filet', category: 'Poissons', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Cabillaud Filet MSC', category: 'Poissons', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Thon rouge Akami', category: 'Poissons', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Dorade royale entière', category: 'Poissons', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Crevettes entières crues', category: 'Crustacés', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Saint-Jacques noix fraîche', category: 'Crustacés', unit: 'pièce', supplierId: 'metro', supplierName: 'Metro' },

  // ── Épicerie sèche ─────────────────────────────────
  { name: 'Farine T55 Grands Moulins', category: 'Épicerie sèche', unit: 'sac 25kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Sucre cristal', category: 'Épicerie sèche', unit: 'sac 25kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Riz Long Grain', category: 'Épicerie sèche', unit: 'sac 25kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Pâtes Spaghetti n°5', category: 'Épicerie sèche', unit: 'carton 5kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Huile d\'Olive Vierge Extra', category: 'Épicerie sèche', unit: 'bidon 5L', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Huile de Tournesol', category: 'Épicerie sèche', unit: 'bidon 10L', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Sel fin', category: 'Épicerie sèche', unit: 'sac 10kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Poivre noir moulu', category: 'Épicerie sèche', unit: 'boîte 1kg', supplierId: 'metro', supplierName: 'Metro' },

  // ── Produits laitiers ─────────────────────────────
  { name: 'Beurre AOP Charentes-Poitou', category: 'Produits laitiers', unit: 'plaquette 500g', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Crème Fraîche Épaisse 30%', category: 'Produits laitiers', unit: 'pot 5L', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Lait Entier pasteurisé', category: 'Produits laitiers', unit: 'pack 6x1L', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Parmesan AOP râpé', category: 'Fromages', unit: 'sachet 1kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Mozzarella fior di latte', category: 'Fromages', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Comté AOP 18 mois', category: 'Fromages', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },

  // ── Fruits & Légumes ───────────────────────────────
  { name: 'Tomates Grappe', category: 'Fruits & Légumes', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Salade Batavia', category: 'Fruits & Légumes', unit: 'pièce', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Oignons jaunes', category: 'Fruits & Légumes', unit: 'filet 10kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Pommes de terre Agria', category: 'Fruits & Légumes', unit: 'sac 10kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Carottes', category: 'Fruits & Légumes', unit: 'kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Champignons de Paris', category: 'Fruits & Légumes', unit: 'barquette 1kg', supplierId: 'metro', supplierName: 'Metro' },

  // ── Boissons ──────────────────────────────────────
  { name: 'Eau minérale Evian', category: 'Boissons', unit: 'palette 24x1.5L', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Eau gazeuse Perrier', category: 'Boissons', unit: 'caisse 24x33cl', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Café grain espresso', category: 'Boissons', unit: 'sac 3kg', supplierId: 'metro', supplierName: 'Metro' },
  { name: 'Chocolat en poudre', category: 'Boissons', unit: 'boîte 1kg', supplierId: 'metro', supplierName: 'Metro' },
];

export function searchMetroProducts(query: string, limit = 10): SupplierCatalogEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return METRO_PRODUCTS.slice(0, limit);
  return METRO_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  ).slice(0, limit);
}
