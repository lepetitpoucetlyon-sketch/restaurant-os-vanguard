import type { TaxRate } from '../../domain/schemas/finance';
import type { ConsumptionMode } from '../../comptabilite/FinancialNexusTypes';

type ProductCategory = 
    | 'food' 
    | 'alcohol' 
    | 'beverage_soft' 
    | 'service' 
    | 'spare_parts'
    | 'medical_exempt'
    | 'used_goods_margin'
    | 'merchandise'
    | 'other';

interface VatInput {
    category: ProductCategory;
    consumptionMode: ConsumptionMode;
}

const RATE_MAP: Record<ProductCategory, Record<ConsumptionMode, TaxRate>> = {
    food: {
        dine_in:  '0.10',
        takeaway: '0.055',
        delivery: '0.055',
    },
    beverage_soft: {
        dine_in:  '0.10',
        takeaway: '0.055',
        delivery: '0.055',
    },
    alcohol: {
        dine_in:  '0.20',
        takeaway: '0.20',
        delivery: '0.20',
    },
    service: {
        dine_in:  '0.20',
        takeaway: '0.20',
        delivery: '0.20',
    },
    spare_parts: {
        dine_in:  '0.20',
        takeaway: '0.20',
        delivery: '0.20',
    },
    medical_exempt: {
        dine_in:  '0.00',
        takeaway: '0.00',
        delivery: '0.00',
    },
    used_goods_margin: {
        dine_in:  '0.20',
        takeaway: '0.20',
        delivery: '0.20',
    },
    merchandise: {
        dine_in:  '0.20',
        takeaway: '0.20',
        delivery: '0.20',
    },
    other: {
        dine_in:  '0.20',
        takeaway: '0.20',
        delivery: '0.20',
    },
};

export function resolveVatRate({ category, consumptionMode }: VatInput): TaxRate {
    return RATE_MAP[category]?.[consumptionMode] ?? '0.20';
}

export function inferCategory(categoryId: string, productName?: string): ProductCategory {
    const lower = (categoryId + ' ' + (productName ?? '')).toLowerCase();
    
    // 1. Médical & Soins conventionnés (Exonération art. 261-4-1° CGI)
    if (/consultation|ccam|ordonnance|praticien|acte_medical|soin_infirmier/.test(lower)) return 'medical_exempt';

    // 2. Alcool & Spiritueux (20%)
    if (/alcool|vin|bière|cocktail|spiritueux|whisky|rhum|vodka|gin|champagne|prosecco|apéritif/.test(lower)) return 'alcohol';

    // 3. Boissons softs (10% sur place / 5.5% emporté)
    if (/boisson|jus|soda|eau|café|thé|limonade|smoothie/.test(lower)) return 'beverage_soft';

    // 4. Prestations & Main d'œuvre (20%)
    if (/service|couverts|supplément|main_oeuvre|prestation|forfait|diagnostic|pose|coiffure|shampoing|brushing/.test(lower)) return 'service';

    // 5. Pièces mécaniques, consommables & fournitures (20%)
    if (/piece|filtre|huile|pneu|plaquette|batterie|accessoire|fourniture|consommable/.test(lower)) return 'spare_parts';

    // 6. Alimentation & Restauration (10% sur place / 5.5% emporté)
    if (/entrée|plat|dessert|salade|soupe|pizza|burger|pâtes|viande|poisson|fromage|pain|snack|sandwich|wrap|taco|tapas|menu|boulangerie|croissant|gateau|entrecôte|entrecote|steak|grill|boeuf|poulet|veau|agneau|nourriture|repas|chef/.test(lower)) return 'food';

    return 'merchandise';
}


export type { ProductCategory };

