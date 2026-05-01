import { Ingredient, StockItem } from '@nexus/contracts';
import { ExtractedInvoiceItem } from './VisionService';
import { calculatePriceEvolution } from './StockEngine';

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
     * Attempts to find the best matching ingredient for an extracted item
     */
    findBestMatch(extracted: ExtractedInvoiceItem, ingredients: Ingredient[]): VisionMatchResult {
        const normalizedExtracted = this.normalize(extracted.name);
        let bestMatch: Ingredient | null = null;
        let maxScore = 0;

        for (const ing of ingredients) {
            const normalizedIng = this.normalize(ing.name);
            
            // 1. Exact match (after normalization)
            if (normalizedIng === normalizedExtracted) {
                return { extracted, matchedIngredientId: ing.id, matchedIngredientName: ing.name, isNewProduct: false, confidence: 1 };
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
                extracted, 
                matchedIngredientId: bestMatch.id, 
                matchedIngredientName: bestMatch.name, 
                isNewProduct: false, 
                confidence: maxScore 
            };
        }

        // 3. No confident match found
        return { extracted, isNewProduct: true, confidence: 0 };
    },

    /**
     * Prepares stock items from vision matches
     */
    prepareStockEntry(match: VisionMatchResult, lastStocks: StockItem[]): Partial<StockItem> {
        const lastPrice = lastStocks.find(s => s.ingredientId === match.matchedIngredientId)?.unitCostInCents || 0;
        const evolution = lastPrice > 0 ? ((match.extracted.unitPriceHT - lastPrice) / lastPrice) * 100 : 0;

        return {
            ingredientId: match.matchedIngredientId,
            ingredientName: match.matchedIngredientName || match.extracted.name,
            quantity: match.extracted.quantity,
            unit: match.extracted.unit as import('@nexus/contracts').IngredientUnit,
            unitCostInCents: match.extracted.unitPriceHT,
            expirationDate: match.extracted.expirationDate,
            batchNumber: match.extracted.batchNumber,
            priceEvolution: evolution
        };
    }
};
