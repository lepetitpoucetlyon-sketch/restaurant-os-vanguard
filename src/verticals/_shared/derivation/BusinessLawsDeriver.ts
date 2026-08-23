/**
 * ⚖️ BusinessLawsDeriver — dérive les businessLaws effectives d'un tenant.
 *
 * Le problème résolu : `TenantConfig.status.businessLaws` était statiquement
 * défini par blueprint (`node_capacity: 50`, `tax_rate: 20`…). Rien n'était
 * dérivé des signaux réels du scrape ni des réponses opérateur.
 *
 * Ce dériveur PUR calcule chaque businessLaw depuis les answers + variant +
 * companyProfile (optionnel). Sortie consommée par `TenantSeeder` pour peupler
 * la loi métier réelle du tenant.
 */

import type { PlatformVariant } from '@/modules/system';
import type { QualificationAnswers } from '@/modules/commerce';
import type { CompanyProfile } from '@/modules/commerce';

// ── Types de sortie ─────────────────────────────────────────────────────────────

export interface DerivedBusinessLaws {
    /** Capacité de traitement (transactions/j attendues). */
    readonly node_capacity: number;
    /** Taux TVA par défaut (0.20 = 20%). */
    readonly tax_rate_default: number;
    /** Map catégorie → taux TVA (ventilation multi-taux). */
    readonly tax_rate_map: Record<string, number>;
    /** Devise principale ISO 4217. */
    readonly currency: string;
    /** Devises acceptées en plus (multi-devise si multi-pays). */
    readonly currency_secondary: readonly string[];
    /** Mois de début d'exercice fiscal (1-12). */
    readonly fiscal_year_start_month: number;
    /** IANA timezone. */
    readonly timezone: string;
    /** Heures par défaut par jour (map "monday" → "09:00-19:00" ou ""). */
    readonly working_hours_default: Record<string, string>;
    /** Seuil hebdo heures normales (35h France standard). */
    readonly overtime_threshold_hours: number;
    /** Heure début majoration nuit (0-23, ex. 22 pour resto HCR). */
    readonly night_rate_start_hour: number;
    /** Mode d'arrondi monétaire ('bankers' | 'half_up' | 'floor'). */
    readonly rounding_mode: 'bankers' | 'half_up' | 'floor';
    /** Horaires de service alcool autorisés ("HH:MM-HH:MM" ou "" si N/A). */
    readonly alcohol_service_hours: string;
    /** Restrictions d'âge par catégorie (map catégorie → âge min). */
    readonly age_restrictions: Record<string, number>;
    /** Nombre de jours de conservation des plats témoins (resto uniquement, 0 sinon). */
    readonly witness_dish_days: number;
    /** Fréquence de changement d'huile de friture (jours, 0 si N/A). */
    readonly frying_oil_change_days: number;
    /** Format numéro ticket (préfixe + pattern). */
    readonly receipt_number_format: string;
    /** Coefficient fiscal (multiplicateur base, 1.0 défaut). */
    readonly fiscal_coefficient: number;
    /** Trace des règles ayant produit chaque valeur (audit). */
    readonly derivedFrom: Record<string, string>;
}

// ── Entrée ──────────────────────────────────────────────────────────────────────

export interface BusinessLawsDeriverInput {
    readonly answers: QualificationAnswers;
    readonly variant: PlatformVariant;
    readonly companyProfile?: CompanyProfile;
}

// ── Dérivation ──────────────────────────────────────────────────────────────────

export function deriveBusinessLaws(input: BusinessLawsDeriverInput): DerivedBusinessLaws {
    const { answers, variant, companyProfile } = input;
    const derivedFrom: Record<string, string> = {};

    // ── node_capacity : estimation depuis échelle × catalogue ─────────────────
    const catalogSize = companyProfile?.catalog.length ?? 0;
    const baseCapacity = { solo: 30, tpe: 80, pme: 250, eti: 800 }[answers.axis1_scale];
    const catalogMultiplier = catalogSize > 100 ? 1.5 : catalogSize > 30 ? 1.2 : 1.0;
    const node_capacity = Math.round(baseCapacity * catalogMultiplier);
    derivedFrom['node_capacity'] = `scale=${answers.axis1_scale} (base=${baseCapacity}) × catalogSize=${catalogSize} (mult=${catalogMultiplier})`;

    // ── TVA : régime + ventilation ───────────────────────────────────────────
    const { tax_rate_default, tax_rate_map, taxOrigin } = deriveTaxRates(answers, companyProfile);
    derivedFrom['tax_rate_default'] = taxOrigin;
    derivedFrom['tax_rate_map'] = taxOrigin;

    // ── Devise + fiscal year : depuis pays SIREN ou défaut FR ────────────────
    const { currency, currency_secondary, fiscal_year_start_month, currencyOrigin } = deriveCurrencyAndFiscalYear(companyProfile);
    derivedFrom['currency'] = currencyOrigin;
    derivedFrom['fiscal_year_start_month'] = currencyOrigin;

    // ── Timezone : depuis adresse ou fallback Europe/Paris ────────────────────
    const timezone = companyProfile?.identity.address?.country === 'BE' ? 'Europe/Brussels'
        : companyProfile?.identity.address?.country === 'CH' ? 'Europe/Zurich'
        : 'Europe/Paris';
    derivedFrom['timezone'] = `country=${companyProfile?.identity.address?.country ?? 'FR (défaut)'}`;

    // ── Heures de travail : depuis OpeningHours ou défauts métier ────────────
    const working_hours_default = companyProfile?.identity.openingHours ?? defaultWorkingHours(variant);
    derivedFrom['working_hours_default'] = companyProfile?.identity.openingHours
        ? 'CompanyProfile.identity.openingHours'
        : `défaut sectoriel variant=${variant}`;

    // ── Convention collective : seuils heures sup + nuit ─────────────────────
    const { overtime_threshold_hours, night_rate_start_hour, ccOrigin } = deriveCollectiveAgreement(variant, answers);
    derivedFrom['overtime_threshold_hours'] = ccOrigin;
    derivedFrom['night_rate_start_hour'] = ccOrigin;

    // ── Arrondi monétaire ────────────────────────────────────────────────────
    const rounding_mode: DerivedBusinessLaws['rounding_mode'] = variant === 'retail' ? 'half_up' : 'bankers';
    derivedFrom['rounding_mode'] = `variant=${variant} → ${rounding_mode}`;

    // ── Alcool : horaires si mod_bar sous-jacent (via catalogue) ─────────────
    const hasAlcohol = companyProfile?.catalog.some(i => /vin|bière|biere|alcool|cocktail|spiritueux/i.test(i.name + i.category)) ?? false;
    const alcohol_service_hours = hasAlcohol ? '06:00-02:00' : '';
    derivedFrom['alcohol_service_hours'] = hasAlcohol ? 'alcool détecté dans catalogue → horaires légaux FR' : 'aucun alcool';

    const age_restrictions: Record<string, number> = {};
    if (hasAlcohol) age_restrictions['alcohol'] = 18;
    if (companyProfile?.catalog.some(i => /tabac|vape|cigarette/i.test(i.name))) age_restrictions['tobacco'] = 18;
    derivedFrom['age_restrictions'] = 'catalogue scanné pour alcool/tabac';

    // ── Métier bouche : plats témoins + huile de friture ────────────────────
    const isFood = ['restaurant', 'bakery'].includes(variant);
    const witness_dish_days = isFood ? 5 : 0;
    const frying_oil_change_days = variant === 'restaurant' ? 7 : 0;
    derivedFrom['witness_dish_days'] = isFood ? `variant=${variant} → 5j obligatoires (arrêté FR)` : 'N/A';
    derivedFrom['frying_oil_change_days'] = variant === 'restaurant' ? 'HCR → 7j max friture' : 'N/A';

    // ── Numérotation ticket : depuis SIREN + année ───────────────────────────
    const sirenShort = companyProfile?.identity.siren?.slice(0, 4) ?? 'FR';
    const receipt_number_format = `${sirenShort}-{YYYY}-{SEQ:06}`;
    derivedFrom['receipt_number_format'] = `SIREN ${sirenShort} + année + séquence 6 chiffres`;

    // ── Fiscal coefficient (défaut 1.0 sauf variant spécial) ─────────────────
    const fiscal_coefficient = 1.0;
    derivedFrom['fiscal_coefficient'] = 'défaut 1.0 (à ajuster manuellement si régime particulier)';

    return {
        node_capacity,
        tax_rate_default,
        tax_rate_map,
        currency,
        currency_secondary,
        fiscal_year_start_month,
        timezone,
        working_hours_default,
        overtime_threshold_hours,
        night_rate_start_hour,
        rounding_mode,
        alcohol_service_hours,
        age_restrictions,
        witness_dish_days,
        frying_oil_change_days,
        receipt_number_format,
        fiscal_coefficient,
        derivedFrom,
    };
}

// ── Helpers de dérivation (isolés pour testabilité) ────────────────────────────

function deriveTaxRates(answers: QualificationAnswers, cp?: CompanyProfile):
    { tax_rate_default: number; tax_rate_map: Record<string, number>; taxOrigin: string } {
    if (answers.axis2_vatRegime === 'franchise_base') {
        return { tax_rate_default: 0, tax_rate_map: {}, taxOrigin: 'axis2_vatRegime=franchise_base → 0% partout (art. 293B CGI)' };
    }
    if (answers.axis2_vatRegime === 'reverse_charge') {
        return { tax_rate_default: 0, tax_rate_map: { autoliquidation: 0 }, taxOrigin: 'axis2_vatRegime=reverse_charge (BTP/export)' };
    }
    // Multi-taux : agréger depuis les taxRate du catalogue si dispo
    if (answers.axis2_vatRegime === 'multi_rate' && cp?.catalog.length) {
        const map: Record<string, number> = {};
        for (const it of cp.catalog) map[it.category] = it.taxRate;
        return {
            tax_rate_default: 0.20,
            tax_rate_map: map,
            taxOrigin: 'axis2_vatRegime=multi_rate + agrégation catégories du catalogue scrapé',
        };
    }
    return { tax_rate_default: 0.20, tax_rate_map: {}, taxOrigin: 'axis2_vatRegime=standard_20' };
}

function deriveCurrencyAndFiscalYear(cp?: CompanyProfile):
    { currency: string; currency_secondary: readonly string[]; fiscal_year_start_month: number; currencyOrigin: string } {
    const country = cp?.identity.address?.country;
    if (country === 'CH') {
        return { currency: 'CHF', currency_secondary: ['EUR'], fiscal_year_start_month: 1, currencyOrigin: 'country=CH → CHF+EUR' };
    }
    if (country === 'GB') {
        return { currency: 'GBP', currency_secondary: [], fiscal_year_start_month: 4, currencyOrigin: 'country=GB → GBP, année fiscale avril' };
    }
    // Zone euro par défaut (FR/BE/DE/LU/NL/…)
    return { currency: 'EUR', currency_secondary: [], fiscal_year_start_month: 1, currencyOrigin: `country=${country ?? 'FR défaut'} → EUR` };
}

function deriveCollectiveAgreement(variant: PlatformVariant, answers: QualificationAnswers):
    { overtime_threshold_hours: number; night_rate_start_hour: number; ccOrigin: string } {
    switch (variant) {
        case 'restaurant':
        case 'hotel':
        case 'bakery':
            return { overtime_threshold_hours: 39, night_rate_start_hour: 22, ccOrigin: 'HCR (IDCC 1979) : 39h hebdo, nuit dès 22h' };
        case 'garage':
            return { overtime_threshold_hours: 39, night_rate_start_hour: 21, ccOrigin: 'Services automobile (IDCC 1090)' };
        case 'clinic':
        case 'veterinary':
            return { overtime_threshold_hours: 35, night_rate_start_hour: 20, ccOrigin: 'FEHAP / hospitalisation privée' };
        default: {
            // Défaut selon complexité déclarée
            const th = answers.axis3_payrollComplexity === 'modulation' ? 39 : 35;
            return { overtime_threshold_hours: th, night_rate_start_hour: 21, ccOrigin: `défaut Code du travail (axis3_payrollComplexity=${answers.axis3_payrollComplexity})` };
        }
    }
}

function defaultWorkingHours(variant: PlatformVariant): Record<string, string> {
    // Ces défauts sont indicatifs ; ils sont écrasés par CompanyProfile.identity.openingHours si dispo.
    switch (variant) {
        case 'restaurant':
            return { monday: '', tuesday: '12:00-14:30,19:00-22:30', wednesday: '12:00-14:30,19:00-22:30',
                thursday: '12:00-14:30,19:00-22:30', friday: '12:00-14:30,19:00-23:00',
                saturday: '12:00-14:30,19:00-23:00', sunday: '12:00-14:30' };
        case 'bakery':
            return { monday: '06:30-19:30', tuesday: '06:30-19:30', wednesday: '06:30-19:30',
                thursday: '06:30-19:30', friday: '06:30-19:30', saturday: '06:30-19:30', sunday: '07:00-13:00' };
        case 'hotel':
            return { monday: '00:00-23:59', tuesday: '00:00-23:59', wednesday: '00:00-23:59',
                thursday: '00:00-23:59', friday: '00:00-23:59', saturday: '00:00-23:59', sunday: '00:00-23:59' };
        default:
            return { monday: '09:00-19:00', tuesday: '09:00-19:00', wednesday: '09:00-19:00',
                thursday: '09:00-19:00', friday: '09:00-19:00', saturday: '09:00-19:00', sunday: '' };
    }
}
