import { describe, it, expect, vi } from 'vitest';
import { runGradeXProof } from '@/engines/Simulacra/SinfoniaGradeXProof';
import { FiscalHACCPMapper } from '@modules/finance';

// Mock FiscalHACCPMapper
vi.mock('@modules/finance', () => ({
    FiscalHACCPMapper: {
        processCriticalWaste: vi.fn().mockResolvedValue({
            digitalSignature: 'mock-signature-x',
            fiscalEntry: { amountInCents: 4500 }
        })
    }
}));

describe('SinfoniaGradeXProof - Cross-Domain Simulation Audit', () => {
    it('should successfully run the multi-domain task without any TypeScript casting errors', async () => {
        const result = await runGradeXProof();
        
        // Ensure the mapper was called with the correct mocked signature
        expect(FiscalHACCPMapper.processCriticalWaste).toHaveBeenCalledTimes(1);
        expect(FiscalHACCPMapper.processCriticalWaste).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'temperature',
                status: 'alert',
                isAnomaly: true
            }),
            expect.arrayContaining([
                expect.objectContaining({ id: 'stock_1', unit: 'kg' }),
                expect.objectContaining({ id: 'stock_2', unit: 'unit' })
            ]),
            'tenant_demo_grade_x'
        );

        // Ensure result parsing via the strict types (`as const` / `unknown`) worked
        expect(result).toBeDefined();
        expect(result?.digitalSignature).toBe('mock-signature-x');
    });
});
