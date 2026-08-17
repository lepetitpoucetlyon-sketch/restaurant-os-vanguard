/**
 * 🔒 sanitizerRules — PII detection patterns, blocked fields, and generalization banding
 */

import { PIICategory } from '../types';

export const PII_PATTERNS: Record<PIICategory, RegExp> = {
    EMAIL:       /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    PHONE:       /(?:\+33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g,
    IBAN:        /[A-Z]{2}\d{2}\s?(?:\d{4}\s?){4,7}\d{1,4}/g,
    CARD_NUMBER: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
    SSN:        /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/g,
    IP_ADDRESS:  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    NAME:        /\b[A-ZÀ-Ü][a-zà-ÿ]+\s[A-ZÀ-Ü][a-zà-ÿ]+\b/g,
    ADDRESS:     /\d+\s+(?:rue|avenue|boulevard|place|impasse|allée|chemin)\s+[A-Za-zÀ-ÿ\s]+/gi,
    HEALTH_DATA: /\b(?:allerg(?:ie|y|ique)|gluten|lactose|arachide|peanut|celiac|diabèt|intolér)/gi,
};

/** Fields that are ALWAYS blocked, regardless of context */
export const HARD_BLOCKED_FIELDS = new Set([
    'customerName', 'customerEmail', 'customerPhone', 'customerAddress',
    'userName', 'userEmail', 'userPhone',
    'employeeName', 'employeeEmail', 'employeeSsn',
    'supplierContact', 'supplierEmail', 'supplierPhone',
    'iban', 'bankAccount', 'cardNumber',
    'allergens', 'allergies', 'medicalNotes', 'dietaryRestrictions',
    'password', 'token', 'secret', 'apiKey',
]);

// ============================================
// BANDING FUNCTIONS (Generalization)
// ============================================

export function bandRevenue(cents: number): string {
    const euros = cents / 100;
    if (euros < 1000) return 'revenue_band_0_1000';
    if (euros < 2500) return 'revenue_band_1000_2500';
    if (euros < 5000) return 'revenue_band_2500_5000';
    if (euros < 10000) return 'revenue_band_5000_10000';
    if (euros < 25000) return 'revenue_band_10000_25000';
    return 'revenue_band_25000_plus';
}

export function bandAmount(cents: number): string {
    const euros = cents / 100;
    if (euros < 50) return 'amount_band_0_50';
    if (euros < 200) return 'amount_band_50_200';
    if (euros < 500) return 'amount_band_200_500';
    if (euros < 1000) return 'amount_band_500_1000';
    return 'amount_band_1000_plus';
}

export function bandPrice(cents: number): string {
    const euros = cents / 100;
    if (euros < 5) return 'price_band_0_5';
    if (euros < 10) return 'price_band_5_10';
    if (euros < 15) return 'price_band_10_15';
    if (euros < 20) return 'price_band_15_20';
    if (euros < 30) return 'price_band_20_30';
    return 'price_band_30_plus';
}

export function bandSalary(cents: number): string {
    const euros = cents / 100;
    if (euros < 1500) return 'salary_band_smic';
    if (euros < 2000) return 'salary_band_1500_2000';
    if (euros < 2500) return 'salary_band_2000_2500';
    if (euros < 3500) return 'salary_band_2500_3500';
    return 'salary_band_3500_plus';
}

/** Fields that should be generalized (banded) instead of stripped */
export const GENERALIZABLE_FIELDS: Record<string, (value: number) => string> = {
    dailyRevenue: (v) => bandRevenue(v),
    amountInCents: (v) => bandAmount(v),
    totalInCents: (v) => bandAmount(v),
    priceInCents: (v) => bandPrice(v),
    salary: (v) => bandSalary(v),
};
