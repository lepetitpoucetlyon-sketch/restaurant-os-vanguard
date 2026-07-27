import { Utensils, Snowflake, Flame, Beer } from "lucide-react";

/**
 * 👨‍🍳 KDS CONTRATS - Grade X
 */

export type KitchenStation = 'all' | 'hot' | 'cold' | 'bar' | 'pastry';

export const ITEM_STATION_MAP: Record<string, KitchenStation> = {
    // 🥃 BAR / BOISSONS
    'Cocktail': 'bar',
    'Wine': 'bar',
    'Beer': 'bar',
    'Soft Drink': 'bar',
    'Coffee': 'bar',
    'Tea': 'bar',
    'Espresso': 'bar',
    'Cappuccino': 'bar',
    'Soda': 'bar',
    'Juice': 'bar',
    'Vittel': 'bar',
    'San Pellegrino': 'bar',

    // 🥗 COLD / FROID
    'Salad': 'cold',
    'Ceasar Salad': 'cold',
    'Tartare': 'cold',
    'Carpaccio': 'cold',
    'Cold Starter': 'cold',
    'Dessert': 'pastry',
    'Ice Cream': 'pastry',

    // 🔥 HOT / CHAUD
    'Burger': 'hot',
    'Steak': 'hot',
    'Pasta': 'hot',
    'Pizza': 'hot',
    'Soup': 'hot',
    'Hot Starter': 'hot',
    'Fish': 'hot',
    'Meat': 'hot',
    'Fries': 'hot',
    'Vegetables': 'hot'
};

const STATION_KEYWORDS: Array<{ keywords: string[]; station: KitchenStation }> = [
    { keywords: ['cocktail', 'wine', 'vin', 'beer', 'bière', 'biere', 'coffee', 'café', 'cafe', 'espresso', 'cappuccino', 'soda', 'juice', 'jus', 'eau', 'water', 'soft', 'boisson', 'drink', 'vittel', 'pellegrino', 'thé', 'the', 'tea', 'mojito', 'margarita', 'sangria', 'limonade', 'perrier', 'infusion', 'spritz', 'kir'], station: 'bar' },
    { keywords: ['salade', 'salad', 'tartare', 'carpaccio', 'froide', 'cold', 'ceviche', 'gazpacho', 'verrines', 'verrine'], station: 'cold' },
    { keywords: ['gâteau', 'gateau', 'dessert', 'glace', 'ice cream', 'tarte', 'fondant', 'crème', 'creme', 'brûlée', 'brulee', 'mille-feuille', 'macaron', 'tiramisu', 'mousse', 'profiterole', 'éclair', 'eclair', 'panna cotta'], station: 'pastry' },
    { keywords: ['burger', 'steak', 'pasta', 'pâtes', 'pates', 'pizza', 'soupe', 'soup', 'fish', 'poisson', 'meat', 'viande', 'fries', 'frites', 'grillé', 'grille', 'rôti', 'roti', 'poulet', 'chicken', 'bœuf', 'boeuf', 'beef', 'agneau', 'lamb', 'saumon', 'salmon', 'risotto', 'ravioli', 'gnocchi', 'côte', 'cote', 'entrecôte', 'entrecote', 'magret', 'confit'], station: 'hot' },
];

export function resolveStation(itemName: string): KitchenStation {
    const lower = itemName.toLowerCase();
    for (const { keywords, station } of STATION_KEYWORDS) {
        if (keywords.some(kw => lower.includes(kw))) return station;
    }
    // Fallback to exact map, then default hot
    return ITEM_STATION_MAP[itemName] ?? 'hot';
}

export const STATION_CONFIG = {
    all: { label: 'TOUS', icon: Utensils, activeBg: 'bg-text-primary', activeText: 'text-bg-primary', iconColor: 'text-text-primary' },
    cold: { label: 'FROID', icon: Snowflake, activeBg: 'bg-info', activeText: 'text-white', iconColor: 'text-info' },
    hot: { label: 'CHAUD', icon: Flame, activeBg: 'bg-error', activeText: 'text-white', iconColor: 'text-error' },
    bar: { label: 'BAR', icon: Beer, activeBg: 'bg-warning', activeText: 'text-white', iconColor: 'text-warning' },
    pastry: { label: 'PÂTISSERIE', icon: Utensils, activeBg: 'bg-action-primary', activeText: 'text-white', iconColor: 'text-brand' },
};
