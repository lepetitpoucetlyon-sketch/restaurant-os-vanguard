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

export const STATION_CONFIG = {
    all: { label: 'TOUS', icon: Utensils, activeBg: 'bg-text-primary', activeText: 'text-bg-primary', iconColor: 'text-text-primary' },
    cold: { label: 'FROID', icon: Snowflake, activeBg: 'bg-info', activeText: 'text-white', iconColor: 'text-info' },
    hot: { label: 'CHAUD', icon: Flame, activeBg: 'bg-error', activeText: 'text-white', iconColor: 'text-error' },
    bar: { label: 'BAR', icon: Beer, activeBg: 'bg-warning', activeText: 'text-white', iconColor: 'text-warning' },
    pastry: { label: 'PÂTISSERIE', icon: Utensils, activeBg: 'bg-purple-500', activeText: 'text-white', iconColor: 'text-purple-500' },
};
