export interface DemoProduct {
  id: string;
  name: string;
  category: 'entrée' | 'plat' | 'dessert' | 'boisson';
  priceInMicrounits: number;
  vatRate: number; // e.g. 10 or 20
  ingredientId?: string;
  storageLocationId?: string;
}

export const DEMO_MENU: DemoProduct[] = [
  // Entrées (VAT 10%)
  { id: 'prod_ent_1', name: 'Salade Verte du Jardin', category: 'entrée', priceInMicrounits: 7_000_000, vatRate: 10, ingredientId: 'ing_salade', storageLocationId: 'frigo_legumes' },
  { id: 'prod_ent_2', name: 'Soupe de Saison', category: 'entrée', priceInMicrounits: 8_500_000, vatRate: 10, ingredientId: 'ing_legumes_soupe', storageLocationId: 'frigo_legumes' },
  { id: 'prod_ent_3', name: 'Terrine Maison', category: 'entrée', priceInMicrounits: 9_000_000, vatRate: 10, ingredientId: 'ing_viande_porc', storageLocationId: 'frigo_viande' },
  { id: 'prod_ent_4', name: 'Carpaccio de Bœuf', category: 'entrée', priceInMicrounits: 11_000_000, vatRate: 10, ingredientId: 'ing_viande_boeuf', storageLocationId: 'frigo_viande' },
  { id: 'prod_ent_5', name: 'Oeuf Parfait & Crème d\'Asperges', category: 'entrée', priceInMicrounits: 10_500_000, vatRate: 10, storageLocationId: 'frigo_legumes' },

  // Plats (VAT 10%)
  { id: 'prod_plat_1', name: 'Burger Gourmet & Frites', category: 'plat', priceInMicrounits: 17_500_000, vatRate: 10, ingredientId: 'ing_viande_boeuf', storageLocationId: 'frigo_viande' },
  { id: 'prod_plat_2', name: 'Entrecôte Grillée 250g', category: 'plat', priceInMicrounits: 24_000_000, vatRate: 10, ingredientId: 'ing_viande_boeuf', storageLocationId: 'frigo_viande' },
  { id: 'prod_plat_3', name: 'Pavé de Saumon Rôti', category: 'plat', priceInMicrounits: 21_000_000, vatRate: 10, ingredientId: 'ing_poisson_saumon', storageLocationId: 'frigo_poisson' },
  { id: 'prod_plat_4', name: 'Risotto aux Champignons', category: 'plat', priceInMicrounits: 16_000_000, vatRate: 10, storageLocationId: 'frigo_legumes' },
  { id: 'prod_plat_5', name: 'Poulet Fermier Rôti Jus Thym', category: 'plat', priceInMicrounits: 18_500_000, vatRate: 10, storageLocationId: 'frigo_viande' },
  { id: 'prod_plat_6', name: 'Tartare de Bœuf Préparé', category: 'plat', priceInMicrounits: 19_000_000, vatRate: 10, ingredientId: 'ing_viande_boeuf', storageLocationId: 'frigo_viande' },
  { id: 'prod_plat_7', name: 'Pâtes Fraises Pesto & Burrata', category: 'plat', priceInMicrounits: 15_500_000, vatRate: 10, storageLocationId: 'frigo_legumes' },

  // Desserts (VAT 10%)
  { id: 'prod_des_1', name: 'Fondant au Chocolat', category: 'dessert', priceInMicrounits: 7_500_000, vatRate: 10, storageLocationId: 'frigo_dessert' },
  { id: 'prod_des_2', name: 'Tiramisu Classique', category: 'dessert', priceInMicrounits: 7_000_000, vatRate: 10, storageLocationId: 'frigo_dessert' },
  { id: 'prod_des_3', name: 'Crumble aux Pommes', category: 'dessert', priceInMicrounits: 6_500_000, vatRate: 10, storageLocationId: 'frigo_dessert' },
  { id: 'prod_des_4', name: 'Café Gourmand', category: 'dessert', priceInMicrounits: 8_500_000, vatRate: 10, storageLocationId: 'frigo_dessert' },

  // Boissons (VAT 20% for alcohol, 10% soft)
  { id: 'prod_boi_1', name: 'Eau Minérale 1L', category: 'boisson', priceInMicrounits: 4_500_000, vatRate: 10, storageLocationId: 'cave_boissons' },
  { id: 'prod_boi_2', name: 'Soda 33cl', category: 'boisson', priceInMicrounits: 4_000_000, vatRate: 10, storageLocationId: 'cave_boissons' },
  { id: 'prod_boi_3', name: 'Verre de Vin Rouge Bordeaux', category: 'boisson', priceInMicrounits: 6_000_000, vatRate: 20, storageLocationId: 'cave_boissons' },
  { id: 'prod_boi_4', name: 'Bière Pression 50cl', category: 'boisson', priceInMicrounits: 7_000_000, vatRate: 20, storageLocationId: 'cave_boissons' },
];
