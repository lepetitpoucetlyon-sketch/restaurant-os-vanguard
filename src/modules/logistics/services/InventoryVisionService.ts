import { Ingredient, StockItem } from '@nexus/contracts';
import { ExtractedInvoiceItem } from '@nexus/contracts';
import type { InvoiceLineItem } from '@nexus/contracts';

export interface VisionMatchResult {
    extracted: ExtractedInvoiceItem;
    matchedIngredientId?: string;
    matchedIngredientName?: string;
    isNewProduct: boolean;
    confidence: number;
}

/**
 * InventoryVisionService - Bridges Vision Data with Inventory Business Logic
 */
export const InventoryVisionService = {
    /**
     * Normalizes a string for comparison
     */
    normalize(str: string): string {
        return str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, " ")
            .trim();
    },

    /**
     * Attempts to find the best matching ingredient for an extracted item.
     * Accepts both legacy ExtractedInvoiceItem and new InvoiceLineItem.
     */
    findBestMatch(extracted: ExtractedInvoiceItem | InvoiceLineItem, ingredients: Ingredient[]): VisionMatchResult {
        // Normalize to legacy shape for internal matching
        const item = this.toExtractedItem(extracted);
        const normalizedExtracted = this.normalize(item.name);
        let bestMatch: Ingredient | null = null;
        let maxScore = 0;

        for (const ing of ingredients) {
            const normalizedIng = this.normalize(ing.name);
            
            // 1. Exact match (after normalization)
            if (normalizedIng === normalizedExtracted) {
                return { extracted: item, matchedIngredientId: ing.id, matchedIngredientName: ing.name, isNewProduct: false, confidence: 1 };
            }

            // 2. Substring match
            if (normalizedExtracted.includes(normalizedIng) || normalizedIng.includes(normalizedExtracted)) {
                const score = Math.min(normalizedIng.length, normalizedExtracted.length) / Math.max(normalizedIng.length, normalizedExtracted.length);
                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = ing;
                }
            }
        }

        if (bestMatch && maxScore > 0.6) {
            return { 
                extracted: item, 
                matchedIngredientId: bestMatch.id, 
                matchedIngredientName: bestMatch.name, 
                isNewProduct: false, 
                confidence: maxScore 
            };
        }

        // 3. No confident match found
        return { extracted: item, isNewProduct: true, confidence: 0 };
    },

    /**
     * Converts a new InvoiceLineItem to legacy ExtractedInvoiceItem format.
     * Passes through legacy items unchanged.
     */
    toExtractedItem(item: ExtractedInvoiceItem | InvoiceLineItem): ExtractedInvoiceItem {
        // If it already has the 'name' property, it's the legacy format
        if ('name' in item) {
            return item as ExtractedInvoiceItem;
        }

        // New schema → legacy conversion
        const lineItem = item as InvoiceLineItem;
        return {
            name: lineItem.canonical_name ?? lineItem.raw_label,
            quantity: lineItem.quantity,
            unit: lineItem.unit,
            unitPriceHT: lineItem.unit_price_cents / 100,
            totalHT: lineItem.line_total_excl_tax_cents / 100,
            taxRate: lineItem.tax_rate_percent,
        };
    },

    /**
     * Prepares stock items from vision matches
     */
    prepareStockEntry(match: VisionMatchResult, lastStocks: StockItem[]): Partial<StockItem> {
        const lastStockItem = lastStocks.find(s => s.ingredientId === match.matchedIngredientId);
        const lastPriceMu = lastStockItem?.unitCostInMicrounits ?? ((lastStockItem?.unitCostInCents || 0) * 10_000);
        const newPriceMu = Math.round(match.extracted.unitPriceHT * 10_000);
        const evolution = lastPriceMu > 0 ? ((newPriceMu - lastPriceMu) / lastPriceMu) * 100 : 0;

        const validUnits: import('@nexus/contracts').IngredientUnit[] = ['kg', 'g', 'l', 'ml', 'cl', 'unit', 'piece', 'bunch', 'crate', 'box', 'bottle', 'can'];
        const normalizedUnit = match.extracted.unit.toLowerCase() as import('@nexus/contracts').IngredientUnit;
        const unit = validUnits.includes(normalizedUnit) ? normalizedUnit : 'unit';

        return {
            ingredientId: match.matchedIngredientId,
            ingredientName: match.matchedIngredientName || match.extracted.name,
            quantity: match.extracted.quantity,
            unit,
            unitCostInCents: match.extracted.unitPriceHT,
            unitCostInMicrounits: newPriceMu,
            expirationDate: match.extracted.expirationDate,
            batchNumber: match.extracted.batchNumber,
            priceEvolution: evolution
        };
    }
};
