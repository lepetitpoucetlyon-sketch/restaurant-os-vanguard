import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusYieldEngine } from '@/domain/services/NexusYieldEngine';
import { MarketingService } from '@/domain/services/MarketingService';
import { ProcurementService } from '@/domain/services/ProcurementService';
import { logger } from '@/lib/logger';

// --- GRADE X : MOCKING PROTOCOL ---
vi.mock('@/domain/services/MarketingService', () => ({
    MarketingService: {
        updateDynamicPricing: vi.fn(),
    }
}));

vi.mock('@/domain/services/ProcurementService', () => ({
    ProcurementService: {
        getRecentCostForIngredient: vi.fn(() => 1200),
        generateAutomatedPO: vi.fn(() => Promise.resolve('po_grade_x_valid')),
    }
}));

vi.mock('@/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
    }
}));

describe('🌀 VANGUARD : NexusYieldEngine Certification', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockProducts = [
        { id: 'ing_wagyu', name: 'Wagyu Beef', basePriceCents: 8500 }
    ];

    it('✅ SCENARIO 1: Stable Empire (Healthy Stock, Normal Velocity)', async () => {
        const mockStock = [{ ingredientId: 'ing_wagyu', quantity: 10000 }]; // 10kg
        const velocity = 20; // 20 orders/h

        const results = await (NexusYieldEngine as any).processYieldCycle({
            products: mockProducts,
            allStock: mockStock,
            currentVelocity: velocity
        });

        expect(results[0].yieldFactor).toBe(1.0);
        expect(results[0].adjustedPriceCents).toBe(8500);
        expect(results[0].isCritical).toBe(false);
        
        // Side Effects
        expect(MarketingService.updateDynamicPricing).toHaveBeenCalledWith('ing_wagyu', 1.0);
        expect(ProcurementService.generateAutomatedPO).not.toHaveBeenCalled();
    });

    it('⚡ SCENARIO 2: Operational Rush (Healthy Stock, High Velocity)', async () => {
        const mockStock = [{ ingredientId: 'ing_wagyu', quantity: 10000 }]; // 10kg
        const velocity = 75; // 75 orders/h (Rush)

        const results = await (NexusYieldEngine as any).processYieldCycle({
            products: mockProducts,
            allStock: mockStock,
            currentVelocity: velocity
        });

        // Profit is stable because stock is healthy
        expect(results[0].yieldFactor).toBe(1.0);
        expect(ProcurementService.generateAutomatedPO).not.toHaveBeenCalled();
    });

    it('📦 SCENARIO 3: Automated Resilience (Critical Stock, Low Velocity)', async () => {
        const mockStock = [{ ingredientId: 'ing_wagyu', quantity: 2000 }]; // 2kg (Critical < 5kg)
        const velocity = 10;

        const results = await (NexusYieldEngine as any).processYieldCycle({
            products: mockProducts,
            allStock: mockStock,
            currentVelocity: velocity
        });

        expect(results[0].isCritical).toBe(true);
        expect(results[0].yieldFactor).toBe(1.0); // Price remains base if not rushing
        
        // Side Effects: Sourcing triggered
        expect(ProcurementService.generateAutomatedPO).toHaveBeenCalledWith(expect.objectContaining({
            ingredientId: 'ing_wagyu',
            quantity: 10000
        }));
    });

    it('🔱 SCENARIO 4: Imperial Protocol (Critical Stock + Operational Rush)', async () => {
        const mockStock = [{ ingredientId: 'ing_wagyu', quantity: 3000 }]; // 3kg (Critical)
        const velocity = 88; // 88 orders/h (Rush)

        const results = await (NexusYieldEngine as any).processYieldCycle({
            products: mockProducts,
            allStock: mockStock,
            currentVelocity: velocity
        });

        // Yield Factor should be 1.15 (+15%)
        expect(results[0].yieldFactor).toBe(1.15);
        expect(results[0].adjustedPriceCents).toBe(Math.round(8500 * 1.15));
        
        // Dual Side Effects
        expect(MarketingService.updateDynamicPricing).toHaveBeenCalledWith('ing_wagyu', 1.15);
        expect(ProcurementService.generateAutomatedPO).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Automated Sourcing Triggered'));
    });

});
