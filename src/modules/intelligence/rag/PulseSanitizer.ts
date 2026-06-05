/**
 * 🔒 PulseSanitizer — La Douane Souveraine
 * Grade X Intelligence Layer
 *
 * This module strips ALL Personally Identifiable Information (PII)
 * from tenant data before it can cross the Vassal → MCC boundary.
 *
 * Pipeline: Raw Data → PII Scan → Strip → Generalize → Tag → Sealed Pulse
 *
 * GDPR Article 9 data (health, allergies) is HARD-BLOCKED, never configurable.
 *
 * Copyright © 2026 Mohammed-ali Boudjaadar. Tous droits réservés.
 */

import {
    SanitizedPulse,
    SanitizedPayload,
    PulseCategory,
    PulseContext,
    PulseTrend,
    PIICategory,
    PIIDetection,
    PULSE_SCHEDULE,
} from './types';

// ============================================
// PII DETECTION PATTERNS
// ============================================

const PII_PATTERNS: Record<PIICategory, RegExp> = {
    EMAIL:       /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    PHONE:       /(?:\+33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g,
    IBAN:        /[A-Z]{2}\d{2}\s?(?:\d{4}\s?){4,7}\d{1,4}/g,
    CARD_NUMBER: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
    SSN:        /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/g,
    IP_ADDRESS:  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    NAME:        /\b[A-ZÀ-Ü][a-zà-ÿ]+\s[A-ZÀ-Ü][a-zà-ÿ]+\b/g, // Simplified name pattern
    ADDRESS:     /\d+\s+(?:rue|avenue|boulevard|place|impasse|allée|chemin)\s+[A-Za-zÀ-ÿ\s]+/gi,
    HEALTH_DATA: /\b(?:allerg(?:ie|y|ique)|gluten|lactose|arachide|peanut|celiac|diabèt|intolér)/gi,
};

/** Fields that are ALWAYS blocked, regardless of context */
const HARD_BLOCKED_FIELDS = new Set([
    'customerName', 'customerEmail', 'customerPhone', 'customerAddress',
    'userName', 'userEmail', 'userPhone',
    'employeeName', 'employeeEmail', 'employeeSsn',
    'supplierContact', 'supplierEmail', 'supplierPhone',
    'iban', 'bankAccount', 'cardNumber',
    'allergens', 'allergies', 'medicalNotes', 'dietaryRestrictions',
    'password', 'token', 'secret', 'apiKey',
]);

/** Fields that should be generalized (banded) instead of stripped */
const GENERALIZABLE_FIELDS: Record<string, (value: number) => string> = {
    dailyRevenue: (v) => bandRevenue(v),
    amountInCents: (v) => bandAmount(v),
    totalInCents: (v) => bandAmount(v),
    priceInCents: (v) => bandPrice(v),
    salary: (v) => bandSalary(v),
};

// ============================================
// BANDING FUNCTIONS (Generalization)
// ============================================

function bandRevenue(cents: number): string {
    const euros = cents / 100;
    if (euros < 1000) return 'revenue_band_0_1000';
    if (euros < 2500) return 'revenue_band_1000_2500';
    if (euros < 5000) return 'revenue_band_2500_5000';
    if (euros < 10000) return 'revenue_band_5000_10000';
    if (euros < 25000) return 'revenue_band_10000_25000';
    return 'revenue_band_25000_plus';
}

function bandAmount(cents: number): string {
    const euros = cents / 100;
    if (euros < 50) return 'amount_band_0_50';
    if (euros < 200) return 'amount_band_50_200';
    if (euros < 500) return 'amount_band_200_500';
    if (euros < 1000) return 'amount_band_500_1000';
    return 'amount_band_1000_plus';
}

function bandPrice(cents: number): string {
    const euros = cents / 100;
    if (euros < 5) return 'price_band_0_5';
    if (euros < 10) return 'price_band_5_10';
    if (euros < 15) return 'price_band_10_15';
    if (euros < 20) return 'price_band_15_20';
    if (euros < 30) return 'price_band_20_30';
    return 'price_band_30_plus';
}

function bandSalary(cents: number): string {
    const euros = cents / 100;
    if (euros < 1500) return 'salary_band_smic';
    if (euros < 2000) return 'salary_band_1500_2000';
    if (euros < 2500) return 'salary_band_2000_2500';
    if (euros < 3500) return 'salary_band_2500_3500';
    return 'salary_band_3500_plus';
}

// ============================================
// CORE SANITIZER
// ============================================

export class PulseSanitizer {
    private detections: PIIDetection[] = [];

    /**
     * 🔍 Scans a raw data object for PII.
     * Returns all detections without modifying the data.
     */
    scanForPII(data: Record<string, unknown>): PIIDetection[] {
        this.detections = [];
        this.scanObject(data, '');
        return [...this.detections];
    }

    /**
     * ✂️ Strips all PII from the data and returns a sanitized payload.
     * Hard-blocked fields are removed entirely.
     * Generalizable fields are banded.
     * PII patterns in string values are redacted.
     */
    sanitizePayload(
        rawData: Record<string, unknown>,
        _category: PulseCategory
    ): SanitizedPayload {
        const metrics: Record<string, number> = {};
        const tags: Record<string, string> = {};
        const trends: Record<string, PulseTrend> = {};

        for (const [key, value] of Object.entries(rawData)) {
            // 1. Hard-block check
            if (HARD_BLOCKED_FIELDS.has(key)) {
                this.detections.push({
                    field: key,
                    category: this.inferPIICategory(key),
                    value: String(value),
                    action: 'BLOCKED',
                });
                continue;
            }

            // 2. Generalization for numeric fields
            if (typeof value === 'number' && key in GENERALIZABLE_FIELDS) {
                tags[key] = GENERALIZABLE_FIELDS[key](value);
                this.detections.push({
                    field: key,
                    category: 'NAME', // Placeholder — it's a value generalization
                    value: String(value),
                    action: 'GENERALIZED',
                });
                continue;
            }

            // 3. Numeric pass-through (non-sensitive metrics)
            if (typeof value === 'number') {
                metrics[key] = Math.round(value * 100) / 100; // Round to 2 decimals
                continue;
            }

            // 4. String PII scan
            if (typeof value === 'string') {
                const cleanValue = this.stripPIIFromString(value, key);
                if (cleanValue !== null) {
                    tags[key] = cleanValue;
                }
                continue;
            }

            // 5. Trend objects pass through if valid
            if (this.isTrend(value)) {
                trends[key] = value as PulseTrend;
                continue;
            }
        }

        return { metrics, tags, trends };
    }

    /**
     * 🏗️ Builds a complete SanitizedPulse from raw tenant data.
     */
    buildPulse(
        rawData: Record<string, unknown>,
        category: PulseCategory,
        tenantHash: string,
        context: PulseContext
    ): SanitizedPulse {
        // Scan first, then sanitize
        this.scanForPII(rawData);

        const payload = this.sanitizePayload(rawData, category);

        // Round timestamp to the hour
        const now = new Date();
        now.setMinutes(0, 0, 0);

        const pulse: SanitizedPulse = {
            pulseId: this.generatePulseId(),
            sourceHash: tenantHash,
            emittedAt: now.toISOString(),
            category,
            payload,
            context,
            integrityHash: '', // Will be computed below
        };

        pulse.integrityHash = this.computeIntegrityHash(pulse);

        return pulse;
    }

    /**
     * ✅ Validates that a pulse contains zero PII before transmission.
     * Final gate — if this fails, the pulse is BLOCKED.
     */
    validatePulse(pulse: SanitizedPulse): { valid: boolean; violations: string[] } {
        const violations: string[] = [];

        // Deep scan the serialized pulse for PII patterns
        const serialized = JSON.stringify(pulse.payload);

        for (const [category, pattern] of Object.entries(PII_PATTERNS)) {
            const matches = serialized.match(pattern);
            if (matches && matches.length > 0) {
                violations.push(`PII_LEAK_DETECTED: ${category} pattern found in pulse payload`);
            }
        }

        // Verify integrity hash
        const expectedHash = this.computeIntegrityHash({
            ...pulse,
            integrityHash: '',
        });
        if (expectedHash !== pulse.integrityHash) {
            violations.push('INTEGRITY_VIOLATION: Pulse hash mismatch — possible tampering');
        }

        return { valid: violations.length === 0, violations };
    }

    /**
     * Returns all PII detections from the last scan/sanitize operation.
     */
    getDetections(): PIIDetection[] {
        return [...this.detections];
    }

    /**
     * Checks if the given category is allowed to emit at this time,
     * based on the PULSE_SCHEDULE.
     */
    canEmit(category: PulseCategory, lastEmittedAt?: number): boolean {
        const schedule = PULSE_SCHEDULE.find(s => s.category === category);
        if (!schedule) return false;

        if (!lastEmittedAt) return true;

        const elapsed = Date.now() - lastEmittedAt;
        const minInterval = this.getMinIntervalMs(schedule.frequency);

        return elapsed >= minInterval;
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    private scanObject(obj: Record<string, unknown>, prefix: string): void {
        for (const [key, value] of Object.entries(obj)) {
            const fieldPath = prefix ? `${prefix}.${key}` : key;

            if (HARD_BLOCKED_FIELDS.has(key)) {
                this.detections.push({
                    field: fieldPath,
                    category: this.inferPIICategory(key),
                    value: String(value).substring(0, 50),
                    action: 'BLOCKED',
                });
                continue;
            }

            if (typeof value === 'string') {
                for (const [cat, pattern] of Object.entries(PII_PATTERNS)) {
                    // Reset regex lastIndex for global patterns
                    pattern.lastIndex = 0;
                    if (pattern.test(value)) {
                        this.detections.push({
                            field: fieldPath,
                            category: cat as PIICategory,
                            value: value.substring(0, 50),
                            action: cat === 'HEALTH_DATA' ? 'BLOCKED' : 'STRIPPED',
                        });
                    }
                }
            }

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                this.scanObject(value as Record<string, unknown>, fieldPath);
            }
        }
    }

    private stripPIIFromString(value: string, field: string): string | null {
        let cleaned = value;

        for (const [cat, pattern] of Object.entries(PII_PATTERNS)) {
            // GDPR Article 9: Health data = full block
            if (cat === 'HEALTH_DATA') {
                pattern.lastIndex = 0;
                if (pattern.test(cleaned)) {
                    this.detections.push({
                        field,
                        category: 'HEALTH_DATA',
                        value: cleaned.substring(0, 50),
                        action: 'BLOCKED',
                    });
                    return null; // Entire field blocked
                }
            }

            pattern.lastIndex = 0;
            cleaned = cleaned.replace(pattern, `[${cat}_REDACTED]`);
        }

        // If the string is mostly redacted, drop it entirely
        const redactedCount = (cleaned.match(/\[.*?_REDACTED\]/g) || []).length;
        if (redactedCount > 2) return null;

        return cleaned;
    }

    private inferPIICategory(field: string): PIICategory {
        const lower = field.toLowerCase();
        if (lower.includes('email')) return 'EMAIL';
        if (lower.includes('phone')) return 'PHONE';
        if (lower.includes('iban') || lower.includes('bank') || lower.includes('card')) return 'IBAN';
        if (lower.includes('ssn') || lower.includes('secu')) return 'SSN';
        if (lower.includes('allerg') || lower.includes('medical') || lower.includes('diet')) return 'HEALTH_DATA';
        if (lower.includes('address')) return 'ADDRESS';
        return 'NAME';
    }

    private isTrend(value: unknown): boolean {
        if (typeof value !== 'object' || value === null) return false;
        const obj = value as Record<string, unknown>;
        return (
            typeof obj.direction === 'string' &&
            typeof obj.magnitudePercent === 'number' &&
            typeof obj.periodDays === 'number'
        );
    }

    private generatePulseId(): string {
        // Crypto-safe UUID generation
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback
        return `pulse_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    private computeIntegrityHash(pulse: SanitizedPulse): string {
        const content = JSON.stringify({
            pulseId: pulse.pulseId,
            sourceHash: pulse.sourceHash,
            emittedAt: pulse.emittedAt,
            category: pulse.category,
            payload: pulse.payload,
            context: pulse.context,
        });

        // Simple hash for now — will be replaced with crypto.subtle.digest in production
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return `pulse_hash_${Math.abs(hash).toString(16)}`;
    }

    private getMinIntervalMs(frequency: string): number {
        switch (frequency) {
            case 'realtime_throttled': return 60 * 60 * 1000;     // 1 hour
            case 'daily':             return 24 * 60 * 60 * 1000; // 24 hours
            case 'weekly':            return 7 * 24 * 60 * 60 * 1000;
            case 'monthly':           return 30 * 24 * 60 * 60 * 1000;
            default:                  return 24 * 60 * 60 * 1000;
        }
    }
}
