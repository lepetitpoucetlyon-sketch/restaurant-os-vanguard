import { Utensils, Snowflake, Flame, Beer } from "lucide-react";

export type KitchenStation = 'all' | 'cold' | 'hot' | 'bar';

export const ITEM_STATION_MAP: Record<string, KitchenStation> = {
    'Tartare de Bœuf': 'cold',
    'Saumon Gravlax': 'cold',
    'Salade César': 'cold',
    'Huîtres': 'cold',
    'Carpaccio': 'cold',
    'Filet de Bœuf Wellington': 'hot',
    'Homard Thermidor': 'hot',
    'Risotto': 'hot',
    'Magret de Canard': 'hot',
    'Sole Meunière': 'hot',
    'Entrecôte Grillée': 'hot',
    'Cocktail Signature': 'bar',
    'Champagne': 'bar',
    'Vin Rouge': 'bar',
    'Café Gourmand': 'bar',
    'Espresso': 'bar',
};

export const STATION_CONFIG = {
    all: { label: 'TOUS', icon: Utensils, activeBg: 'bg-text-primary', activeText: 'text-bg-primary', iconColor: 'text-text-primary' },
    cold: { label: 'FROID', icon: Snowflake, activeBg: 'bg-info', activeText: 'text-white', iconColor: 'text-info' },
    hot: { label: 'CHAUD', icon: Flame, activeBg: 'bg-error', activeText: 'text-white', iconColor: 'text-error' },
    bar: { label: 'BAR', icon: Beer, activeBg: 'bg-warning', activeText: 'text-white', iconColor: 'text-warning' },
};
