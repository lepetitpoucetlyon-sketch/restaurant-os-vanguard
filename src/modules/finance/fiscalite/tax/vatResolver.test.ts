import { describe, it, expect } from 'vitest';
import { resolveVatRate, inferCategory } from './vatResolver';

describe('resolveVatRate', () => {
    it('food dine_in → 10%', () => {
        expect(resolveVatRate({ category: 'food', consumptionMode: 'dine_in' })).toBe('0.10');
    });

    it('food takeaway → 5.5%', () => {
        expect(resolveVatRate({ category: 'food', consumptionMode: 'takeaway' })).toBe('0.055');
    });

    it('alcohol is always 20% regardless of mode', () => {
        expect(resolveVatRate({ category: 'alcohol', consumptionMode: 'dine_in' })).toBe('0.20');
        expect(resolveVatRate({ category: 'alcohol', consumptionMode: 'takeaway' })).toBe('0.20');
    });

    it('soft beverage follows food rates', () => {
        expect(resolveVatRate({ category: 'beverage_soft', consumptionMode: 'dine_in' })).toBe('0.10');
        expect(resolveVatRate({ category: 'beverage_soft', consumptionMode: 'takeaway' })).toBe('0.055');
    });

    it('service is always 20%', () => {
        expect(resolveVatRate({ category: 'service', consumptionMode: 'dine_in' })).toBe('0.20');
    });
});

describe('inferCategory', () => {
    it('detects alcohol', () => {
        expect(inferCategory('boissons', 'Vin rouge')).toBe('alcohol');
        expect(inferCategory('bar', 'Cocktail mojito')).toBe('alcohol');
    });

    it('detects soft beverages', () => {
        expect(inferCategory('boissons', 'Jus d\'orange')).toBe('beverage_soft');
        expect(inferCategory('bar', 'Eau pétillante')).toBe('beverage_soft');
    });

    it('detects food', () => {
        expect(inferCategory('plats', 'Burger classic')).toBe('food');
        expect(inferCategory('entrées', 'Salade César')).toBe('food');
    });

    it('defaults to food for unknown categories', () => {
        expect(inferCategory('divers', 'Surprise du chef')).toBe('food');
    });
});
