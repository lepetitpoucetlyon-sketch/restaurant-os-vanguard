import { describe, it, expect, vi } from 'vitest';
import { SovereignMath } from '@/shared/services/SovereignMath';
import { usePosSplit } from '@/modules/ops/service/pos/hooks/usePosSplit';
import { renderHook, act } from '@testing-library/react';

describe('Règle du Reliquat de Split (Invariant #5 & Invariant Fiscal)', () => {

    it('devrait diviser 100€ (100_000_000 µ) en 3 parts avec reliquat alloué au dernier élément', () => {
        const total = 100_000_000;
        const parts = SovereignMath.splitRemainder(total, 3);

        expect(parts).toHaveLength(3);
        expect(parts[0]).toBe(33_333_333);
        expect(parts[1]).toBe(33_333_333);
        expect(parts[2]).toBe(33_333_334); // +1 µ de résidu

        const sum = parts.reduce((acc, p) => acc + p, 0);
        expect(sum).toBe(total);
    });

    it('devrait diviser 50€ en 7 parts sans aucune perte de microunité', () => {
        const total = 50_000_000;
        const parts = SovereignMath.splitRemainder(total, 7);

        expect(parts).toHaveLength(7);
        const sum = parts.reduce((acc, p) => acc + p, 0);
        expect(sum).toBe(total);
    });

    it('devrait gérer 1 seule part comme égale au total', () => {
        const total = 42_500_000;
        const parts = SovereignMath.splitRemainder(total, 1);

        expect(parts).toEqual([42_500_000]);
    });

    it('devrait suivre le cycle de paiement multi-convives dans usePosSplit et déclencher onSplitComplete', () => {
        const onComplete = vi.fn();
        const total = 100_000_000; // 100€

        const { result } = renderHook(() => usePosSplit({
            items: [],
            totalInMicrounits: total,
            initialCovers: 2,
            onSplitComplete: onComplete,
        }));

        // Initialement : 2 parts de 50€
        expect(result.current.equalParts).toEqual([50_000_000, 50_000_000]);
        expect(result.current.isFullyPaid).toBe(false);

        // Convive 1 paie sa part (50€ en CB)
        act(() => {
            result.current.recordConvivePayment(0, 'card');
        });

        expect(result.current.totalPaidInMicrounits).toBe(50_000_000);
        expect(result.current.remainingInMicrounits).toBe(50_000_000);
        expect(result.current.isFullyPaid).toBe(false);
        expect(onComplete).not.toHaveBeenCalled();

        // Convive 2 paie sa part (50€ en Espèces)
        act(() => {
            result.current.recordConvivePayment(1, 'cash');
        });

        expect(result.current.totalPaidInMicrounits).toBe(100_000_000);
        expect(result.current.remainingInMicrounits).toBe(0);
        expect(result.current.isFullyPaid).toBe(true);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });
});
