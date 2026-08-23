/**
 * 🌍 LocalizationDeriver — dérive la localisation complète du tenant (§C.10 P2c).
 *
 * Complète `BusinessLawsDeriver` avec les paramètres UX/légaux dépendants du
 * pays : langue, format nombres/dates, plan comptable, numérotation factures.
 * Sortie consommée par les composants UI et par les moteurs export FEC/facture.
 */

import type { CompanyProfile } from '@/modules/commerce';

// ── Types de sortie ─────────────────────────────────────────────────────────────

export type Language = 'fr' | 'fr-CH' | 'fr-BE' | 'en' | 'de' | 'es' | 'it' | 'ar';
export type AccountingPlan = 'PCG_FR' | 'PCMN_BE' | 'PC_CH' | 'IFRS' | 'PC_GB' | 'PC_LU';

export interface DerivedLocalization {
    readonly language: Language;
    readonly currency: string;
    readonly currencySecondary: readonly string[];
    readonly timezone: string;
    /** Format LDML (ex. "dd/MM/yyyy" FR, "MM/dd/yyyy" US). */
    readonly dateFormat: string;
    readonly timeFormat: string;
    /** Séparateurs (ex. FR : "," décimal, " " milliers ; US : "." et ","). */
    readonly numberFormat: { decimal: string; thousands: string };
    readonly accountingPlan: AccountingPlan;
    /** Format numérotation factures (préfixe + tokens {YYYY}/{MM}/{SEQ:06}). */
    readonly invoiceNumbering: string;
    /** Format numérotation tickets (plus court). */
    readonly receiptNumbering: string;
    readonly derivedFrom: Record<string, string>;
}

// ── Entrée ──────────────────────────────────────────────────────────────────────

export interface LocalizationDeriverInput {
    readonly companyProfile?: CompanyProfile;
    /** Force la langue (bypass auto-détection depuis pays). */
    readonly forceLanguage?: Language;
}

// ── Dérivation ──────────────────────────────────────────────────────────────────

export function deriveLocalization(input: LocalizationDeriverInput): DerivedLocalization {
    const country = input.companyProfile?.identity.address?.country ?? 'FR';
    const derivedFrom: Record<string, string> = { country: `country=${country}` };

    const { language, dateFormat, timeFormat, numberFormat, timezone, currency, currencySecondary, accountingPlan, langOrigin } =
        derivePerCountry(country, input.forceLanguage);

    derivedFrom['language'] = langOrigin;
    derivedFrom['currency'] = `country=${country}`;
    derivedFrom['timezone'] = `country=${country}`;
    derivedFrom['accountingPlan'] = `country=${country} → ${accountingPlan}`;
    derivedFrom['dateFormat'] = `country=${country}`;
    derivedFrom['numberFormat'] = `country=${country}`;

    const sirenShort = input.companyProfile?.identity.siren?.slice(0, 4) ?? country;
    const invoiceNumbering = `FA-${sirenShort}-{YYYY}{MM}-{SEQ:06}`;
    const receiptNumbering = `T-{YYYY}{MM}{DD}-{SEQ:04}`;
    derivedFrom['invoiceNumbering'] = `SIREN ${sirenShort} + YYYY + MM + séquence 6`;
    derivedFrom['receiptNumbering'] = 'ticket compact YYYY+MM+DD + séquence 4';

    return {
        language,
        currency,
        currencySecondary,
        timezone,
        dateFormat,
        timeFormat,
        numberFormat,
        accountingPlan,
        invoiceNumbering,
        receiptNumbering,
        derivedFrom,
    };
}

// ── Table par pays ──────────────────────────────────────────────────────────────

function derivePerCountry(country: string, forceLanguage?: Language): {
    language: Language;
    dateFormat: string;
    timeFormat: string;
    numberFormat: { decimal: string; thousands: string };
    timezone: string;
    currency: string;
    currencySecondary: readonly string[];
    accountingPlan: AccountingPlan;
    langOrigin: string;
} {
    const c = country.toUpperCase();
    const base = {
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        numberFormat: { decimal: ',', thousands: ' ' },
    };
    if (c === 'BE') {
        return { ...base, language: forceLanguage ?? 'fr-BE', timezone: 'Europe/Brussels',
                 currency: 'EUR', currencySecondary: [], accountingPlan: 'PCMN_BE',
                 langOrigin: forceLanguage ? `forceLanguage=${forceLanguage}` : 'country=BE → fr-BE' };
    }
    if (c === 'CH') {
        return { ...base, language: forceLanguage ?? 'fr-CH', timezone: 'Europe/Zurich',
                 currency: 'CHF', currencySecondary: ['EUR'], accountingPlan: 'PC_CH',
                 langOrigin: forceLanguage ? `forceLanguage=${forceLanguage}` : 'country=CH → fr-CH' };
    }
    if (c === 'GB' || c === 'UK') {
        return {
            dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm',
            numberFormat: { decimal: '.', thousands: ',' },
            language: forceLanguage ?? 'en', timezone: 'Europe/London',
            currency: 'GBP', currencySecondary: [], accountingPlan: 'PC_GB',
            langOrigin: forceLanguage ? `forceLanguage=${forceLanguage}` : 'country=GB → en',
        };
    }
    if (c === 'LU') {
        return { ...base, language: forceLanguage ?? 'fr', timezone: 'Europe/Luxembourg',
                 currency: 'EUR', currencySecondary: [], accountingPlan: 'PC_LU',
                 langOrigin: forceLanguage ? `forceLanguage=${forceLanguage}` : 'country=LU → fr' };
    }
    if (c === 'US') {
        return {
            dateFormat: 'MM/dd/yyyy', timeFormat: 'hh:mm a',
            numberFormat: { decimal: '.', thousands: ',' },
            language: forceLanguage ?? 'en', timezone: 'America/New_York',
            currency: 'USD', currencySecondary: [], accountingPlan: 'IFRS',
            langOrigin: forceLanguage ? `forceLanguage=${forceLanguage}` : 'country=US → en',
        };
    }
    // Défaut : FR
    return { ...base, language: forceLanguage ?? 'fr', timezone: 'Europe/Paris',
             currency: 'EUR', currencySecondary: [], accountingPlan: 'PCG_FR',
             langOrigin: forceLanguage ? `forceLanguage=${forceLanguage}` : 'country=FR (défaut) → fr' };
}
