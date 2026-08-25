import { ProductCategory } from '../../../types/quality';
import { getSetting } from '@/lib/settings/SettingsReader';

export interface TemperatureThresholds {
    min: number;
    max: number;
}

/**
 * Plafonds réglementaires sanitaires stricts (Règlement CE 852/2004, Arrêté du 21 décembre 2009).
 * Inviolables par le haut.
 */
export const LEGAL_MAX_TEMP_CEILING: Record<ProductCategory, number> = {
    meat: 4,
    poultry: 4,
    fish_seafood: 2,
    dairy: 8,
    eggs: 4,
    charcuterie: 4,
    frozen: -18,
    vegetables: 8,
    fruits: 10,
    dry_goods: 25,
    beverages: 15,
    other: 5,
};

/**
 * Table de référence des seuils HACCP par catégorie d'aliments (Niveau N1 — Phase 5)
 */
export const CATEGORY_TEMP_DEFAULTS: Record<ProductCategory, TemperatureThresholds> = {
    meat: { min: 0, max: 4 },
    poultry: { min: 0, max: 4 },
    fish_seafood: { min: -1, max: 2 },
    dairy: { min: 2, max: 6 },
    eggs: { min: 2, max: 4 },
    charcuterie: { min: 0, max: 4 },
    frozen: { min: -25, max: -18 },
    vegetables: { min: 4, max: 8 },
    fruits: { min: 6, max: 10 },
    dry_goods: { min: 10, max: 25 },
    beverages: { min: 2, max: 12 },
    other: { min: 0, max: 5 },
};

export interface ResolveThresholdInput {
    productTempRange?: { min: number; max: number }; // N3 : Produit
    sensorTempRange?: { min: number; max: number };  // N2 : Capteur / Zone
    category?: ProductCategory;                       // N1 : Catégorie
}

export class HACCPTemperatureCascadeService {
    /**
     * Résolution en cascade N3 -> N2 -> N1 -> N0 avec respect absolu du plafond légal
     */
    static resolveThresholds(input: ResolveThresholdInput): TemperatureThresholds {
        // N3 : Fiche produit
        if (input.productTempRange && (input.productTempRange.min !== undefined || input.productTempRange.max !== undefined)) {
            return this.applyLegalClamp(input.productTempRange, input.category);
        }

        // N2 : Capteur de zone
        if (input.sensorTempRange && (input.sensorTempRange.min !== undefined || input.sensorTempRange.max !== undefined)) {
            return this.applyLegalClamp(input.sensorTempRange, input.category);
        }

        // N1 : Catégorie d'aliments (avec surcharge possible via réglages RBAC)
        if (input.category) {
            const defaultThreshold = CATEGORY_TEMP_DEFAULTS[input.category] || CATEGORY_TEMP_DEFAULTS.other;
            const settingKey = `temp_max_${input.category}`;
            const configuredMax = getSetting<number>('haccp', settingKey, defaultThreshold.max);
            return this.applyLegalClamp({ min: defaultThreshold.min, max: configuredMax }, input.category);
        }

        // N0 : Filet de sécurité global
        return { min: 0, max: 5 };
    }

    /**
     * Garantit que le seuil maximal ne dépasse jamais le plafond légal sanitaire (CE 852/2004)
     */
    private static applyLegalClamp(range: { min?: number; max?: number }, category?: ProductCategory): TemperatureThresholds {
        const legalMax = category ? LEGAL_MAX_TEMP_CEILING[category] : 5;
        const min = range.min ?? (legalMax < 0 ? -25 : 0);
        const rawMax = range.max ?? legalMax;
        // On autorise à être PLUS strict que la loi, mais JAMAIS plus laxiste
        const max = Math.min(rawMax, legalMax);
        return { min, max };
    }

    /**
     * Évalue si une mesure est conforme selon la cascade
     */
    static evaluateTemperature(
        measuredTemp: number,
        input: ResolveThresholdInput
    ): { isCompliant: boolean; status: 'ok' | 'warning' | 'critical'; thresholds: TemperatureThresholds } {
        const thresholds = this.resolveThresholds(input);

        if (measuredTemp > thresholds.max + 2 || measuredTemp < thresholds.min - 3) {
            return { isCompliant: false, status: 'critical', thresholds };
        }
        if (measuredTemp > thresholds.max || measuredTemp < thresholds.min) {
            return { isCompliant: false, status: 'warning', thresholds };
        }
        return { isCompliant: true, status: 'ok', thresholds };
    }
}
