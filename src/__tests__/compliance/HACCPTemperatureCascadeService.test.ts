import { describe, it, expect, beforeEach } from 'vitest';
import { getDefaultStore } from 'jotai';
import { pageSettingsAtom } from '@/store/settingsAtoms';
import {
    HACCPTemperatureCascadeService,
    LEGAL_MAX_TEMP_CEILING,
    CATEGORY_TEMP_DEFAULTS,
} from '@/modules/compliance/qualite/haccp/services/HACCPTemperatureCascadeService';

describe('HACCPTemperatureCascadeService — Cascade N3 -> N0 & Plafonds Légaux (DF-E1)', () => {
    const store = getDefaultStore();

    beforeEach(() => {
        store.set(pageSettingsAtom, {});
    });

    it('enforces legal ceiling (meat max is 4°C, fish max is 2°C)', () => {
        expect(LEGAL_MAX_TEMP_CEILING.meat).toBe(4);
        expect(LEGAL_MAX_TEMP_CEILING.fish_seafood).toBe(2);
        expect(LEGAL_MAX_TEMP_CEILING.frozen).toBe(-18);
    });

    it('resolves N1 category defaults when no product or sensor override', () => {
        const meatThresholds = HACCPTemperatureCascadeService.resolveThresholds({ category: 'meat' });
        expect(meatThresholds.max).toBe(4);
        expect(meatThresholds.min).toBe(0);

        const fishThresholds = HACCPTemperatureCascadeService.resolveThresholds({ category: 'fish_seafood' });
        expect(fishThresholds.max).toBe(2);
    });

    it('allows stricter threshold via RBAC settings but clamps at legal ceiling', () => {
        // Restaurateur configure un seuil plus strict à 3°C pour la viande
        store.set(pageSettingsAtom, {
            haccp: {
                temp_max_meat: 3,
            },
        });
        const stricter = HACCPTemperatureCascadeService.resolveThresholds({ category: 'meat' });
        expect(stricter.max).toBe(3);

        // Tentative de régler au-delà du plafond légal (ex: 8°C pour viande) -> borné à 4°C
        store.set(pageSettingsAtom, {
            haccp: {
                temp_max_meat: 8,
            },
        });
        const clamped = HACCPTemperatureCascadeService.resolveThresholds({ category: 'meat' });
        expect(clamped.max).toBe(4);
    });

    it('prioritizes N3 (Product spec) over N2 (Sensor) and N1 (Category)', () => {
        const thresholds = HACCPTemperatureCascadeService.resolveThresholds({
            productTempRange: { min: 1, max: 3 },
            sensorTempRange: { min: 0, max: 4 },
            category: 'meat',
        });
        expect(thresholds).toEqual({ min: 1, max: 3 });
    });

    it('correctly evaluates measured temperatures with warning and critical statuses', () => {
        // Poisson frais (max légal 2°C)
        const okEval = HACCPTemperatureCascadeService.evaluateTemperature(1.5, { category: 'fish_seafood' });
        expect(okEval.isCompliant).toBe(true);
        expect(okEval.status).toBe('ok');

        const warnEval = HACCPTemperatureCascadeService.evaluateTemperature(3.0, { category: 'fish_seafood' });
        expect(warnEval.isCompliant).toBe(false);
        expect(warnEval.status).toBe('warning');

        const critEval = HACCPTemperatureCascadeService.evaluateTemperature(6.0, { category: 'fish_seafood' });
        expect(critEval.isCompliant).toBe(false);
        expect(critEval.status).toBe('critical');
    });
});
