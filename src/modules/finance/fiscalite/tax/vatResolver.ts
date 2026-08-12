/**
 * vatResolver — résolution du taux TVA applicable.
 *
 * §8.6 : La liste de plats restaurant (entrée|plat|dessert|pizza|burger…)
 * a été retirée d'ici et déplacée dans RestaurantInvoicingAdapter.inferProductCategory().
 * vatResolver délègue l'inférence à l'adapter de la verticale active.
 */
import type { TaxRate } from '../../domain/schemas/finance';
import type { ConsumptionMode } from '@/modules/ops';
import type { PlatformVariant } from '@nexus/contracts';
import { resolveInvoicingAdapter } from '@/modules/finance/comptabilite/billing/domain/IVerticalInvoicingAdapter';

type ProductCategory = 'food' | 'alcohol' | 'beverage_soft' | 'service' | 'other';

interface VatInput {
    category: ProductCategory;
    consumptionMode: ConsumptionMode;
}

/** Taux restaurant (per_cover) en fallback — conservé pour rétrocompat tests. */
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

/** Résout le taux TVA à partir d'une catégorie et d'un mode de consommation (restaurant). */
export function resolveVatRate({ category, consumptionMode }: VatInput): TaxRate {
    return RATE_MAP[category]?.[consumptionMode] ?? '0.20';
}

/**
 * Délègue l'inférence de catégorie à l'adapter de la verticale active.
 * Remplace l'ancienne liste de plats restaurant en dur.
 */
export function inferCategory(categoryId: string, productName?: string, variant: PlatformVariant = 'restaurant'): ProductCategory {
    const adapter = resolveInvoicingAdapter(variant);
    const result = adapter.inferProductCategory(categoryId, productName);
    // Normalise vers ProductCategory (union restaurant historique) pour rétrocompat
    if (['alcohol'].includes(result.category)) return 'alcohol';
    if (['beverage_soft', 'beverage'].includes(result.category)) return 'beverage_soft';
    if (['service', 'hair_service'].includes(result.category)) return 'service';
    if (['food', 'accommodation', 'parts', 'labor', 'medical_act', 'general', 'book', 'health', 'city_tax', 'warranty', 'aesthetic'].includes(result.category)) return 'food';
    return 'other';
}

/**
 * Résout le taux TVA directement depuis l'adapter vertical (sans passer par ProductCategory).
 * À préférer dans le nouveau code — plus précis, pas de normalisation lossy.
 */
export function resolveVatRateFromAdapter(categoryId: string, productName?: string, variant: PlatformVariant = 'restaurant'): TaxRate {
    const adapter = resolveInvoicingAdapter(variant);
    const { taxRate } = adapter.inferProductCategory(categoryId, productName);
    return String(taxRate / 100) as TaxRate;
}

export type { ProductCategory };
