import type { TaxRate } from '@/domain/schemas/finance';
import type { ConsumptionMode } from '@/domain/schemas/orders';

type ProductCategory = 'food' | 'alcohol' | 'beverage_soft' | 'service' | 'other';

interface VatInput {
    category: ProductCategory;
    consumptionMode: ConsumptionMode;
}

const RATE_MAP: Record<ProductCategory, Record<ConsumptionMode, TaxRate>> = {
    food: {
        dine_in:  '0.10',
        takeaway: '0.055',
    },
    beverage_soft: {
        dine_in:  '0.10',
        takeaway: '0.055',
    },
    alcohol: {
        dine_in:  '0.20',
        takeaway: '0.20',
    },
    service: {
        dine_in:  '0.20',
        takeaway: '0.20',
    },
    other: {
        dine_in:  '0.20',
        takeaway: '0.20',
    },
};

export function resolveVatRate({ category, consumptionMode }: VatInput): TaxRate {
    return RATE_MAP[category]?.[consumptionMode] ?? '0.20';
}

export function inferCategory(categoryId: string, productName?: string): ProductCategory {
    const lower = (categoryId + ' ' + (productName ?? '')).toLowerCase();
    if (/alcool|vin|bière|cocktail|spiritueux|whisky|rhum|vodka|gin|champagne|prosecco|apéritif/.test(lower)) return 'alcohol';
    if (/boisson|jus|soda|eau|café|thé|limonade|smoothie/.test(lower)) return 'beverage_soft';
    if (/service|couverts|supplément/.test(lower)) return 'service';
    if (/entrée|plat|dessert|salade|soupe|pizza|burger|pâtes|viande|poisson|fromage|pain|snack|sandwich|wrap|taco|tapas|menu/.test(lower)) return 'food';
    return 'food';
}

export type { ProductCategory };
