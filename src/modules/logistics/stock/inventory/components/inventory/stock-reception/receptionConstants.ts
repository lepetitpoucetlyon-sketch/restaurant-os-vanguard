import type { IngredientCategory, IngredientUnit } from "@nexus/contracts";

export interface SupplierRecord {
    id: string;
    name: string;
    [key: string]: unknown;
}

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
    produce: 'Fruits & Légumes',
    dairy: 'Produits Laitiers',
    meat: 'Viandes',
    poultry: 'Volailles',
    seafood: 'Poissons & Fruits de mer',
    charcuterie: 'Charcuterie',
    bakery: 'Boulangerie',
    dry: 'Épicerie sèche',
    condiment: 'Condiments',
    spice: 'Épices',
    oil: 'Huiles & Vinaigres',
    beverage: 'Boissons',
    wine: 'Vins',
    spirits: 'Spiritueux',
    frozen: 'Surgelés',
    spare_part: 'Pièces détachées',
    consumable: 'Consommables',
    medical_supply: 'Dispositifs médicaux',
    cosmetic: 'Produits cosmétiques',
    luxury_goods: 'Articles de luxe',
    raw_material: 'Matières premières',
    tool: 'Outillage & Matériel',
    other: 'Autre'
};

export const UNIT_OPTIONS: IngredientUnit[] = ['kg', 'g', 'l', 'ml', 'cl', 'unit', 'piece', 'bunch', 'crate', 'box', 'bottle', 'can'];
