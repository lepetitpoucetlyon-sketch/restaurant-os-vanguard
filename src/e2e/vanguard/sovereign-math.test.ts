import { describe, it, expect } from 'vitest';
import { SovereignMath } from '@/shared/services/SovereignMath';

describe('🏛️ SovereignMath : Microunits Protocol (Grade X)', () => {

    it('SC-1: Conversion vers Microunités (toMicrounits)', () => {
        // 1.00€ = 1,000,000 Microunités
        expect(SovereignMath.toMicrounits(1.00)).toBe(1_000_000);
        expect(SovereignMath.toMicrounits(0.1 + 0.2)).toBe(300_000); // Epsilon Guard
        expect(SovereignMath.toMicrounits(19.99)).toBe(19_990_000);
    });

    it('SC-2: Conversion vers Euros (fromMicrounits)', () => {
        expect(SovereignMath.fromMicrounits(1_000_000)).toBe(1.00);
        expect(SovereignMath.fromMicrounits(19_990_000)).toBe(19.99);
    });

    it('SC-3: Conversion vers Centimes (toCents)', () => {
        // 1.00€ (1,000,000 micro) -> 100 cents
        expect(SovereignMath.toCents(BigInt(1_000_000))).toBe(100);
        // 19.99€ (19,990,000 micro) -> 1999 cents
        expect(SovereignMath.toCents(BigInt(19_990_000))).toBe(1999);
        // Précision extrême
        expect(SovereignMath.toCents(BigInt(1_000_001))).toBe(100); // Reste 100 cents (tronqué/arrondi)
        expect(SovereignMath.toCents(BigInt(1_000_005))).toBe(100); 
    });

    it('SC-4: Arithmétique Souveraine (add/subtract/multiply)', () => {
        const a = SovereignMath.toMicrounits(10.50);
        const b = SovereignMath.toMicrounits(2.10);

        // Addition
        expect(SovereignMath.add(a, b)).toBe(12_600_000);

        // Soustraction
        expect(SovereignMath.subtract(a, b)).toBe(8_400_000);

        // Multiplication (ex: 10.50€ * 2.00)
        expect(SovereignMath.multiply(a, SovereignMath.toMicrounits(2))).toBe(21_000_000);
        
        // Division (ex: 10€ / 3.00)
        const ten = SovereignMath.toMicrounits(10);
        const divided = SovereignMath.divide(ten, SovereignMath.toMicrounits(3));
        expect(divided).toBe(3_333_333); // 3.333333€
    });

    it('SC-5: Sécurité de Division par Zéro', () => {
        expect(() => SovereignMath.divide(100, 0)).toThrow('FISCAL_DIVISION_BY_ZERO');
    });
});
