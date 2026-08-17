/**
 * 🔒 PulseSanitizer — La Douane Souveraine
 * Grade X Intelligence Layer
 *
 * This module strips ALL Personally Identifiable Information (PII)
 * from tenant data before it can cross the Vassal → MCC boundary.
 *
 * Pipeline: Raw Data → PII Scan → Strip → Generalize → Tag → Sealed Pulse
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
import { JsonObject } from "@/shared/types/json";
import {
    PII_PATTERNS,
    HARD_BLOCKED_FIELDS,
    GENERALIZABLE_FIELDS,
} from './pulse-sanitizer/sanitizerRules';

// ============================================
// CORE SANITIZER
// ============================================

export class PulseSanitizer {
    private detections: PIIDetection[] = [];

    /**
     * 🔍 Scans a raw data object for PII.
     */
    scanForPII(data: Record<string, unknown>): PIIDetection[] {
        this.detections = [];
        this.scanObject(data, '');
        return [...this.detections];
    }

    /**
     * ✂️ Strips all PII from the data and returns a sanitized payload.
     */
    sanitizePayload(
        rawData: Record<string, unknown>,
        _category: PulseCategory
    ): SanitizedPayload {
        const metrics: Record<string, number> = {};
        const tags: Record<string, string> = {};
        const trends: Record<string, PulseTrend> = {};

        for (const [key, value] of Object.entries(rawData)) {
            if (HARD_BLOCKED_FIELDS.has(key)) {
                this.detections.push({
                    field: key,
                    category: this.inferPIICategory(key),
                    value: String(value),
                    action: 'BLOCKED',
                });
                continue;
            }

            if (typeof value === 'number' && key in GENERALIZABLE_FIELDS) {
                tags[key] = GENERALIZABLE_FIELDS[key](value);
                this.detections.push({
                    field: key,
                    category: 'NAME',
                    value: String(value),
                    action: 'GENERALIZED',
                });
                continue;
            }

            if (typeof value === 'number') {
                metrics[key] = Math.round(value * 100) / 100;
                continue;
            }

            if (typeof value === 'string') {
                const cleanValue = this.stripPIIFromString(value, key);
                if (cleanValue !== null) {
                    tags[key] = cleanValue;
                }
                continue;
            }

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
        this.scanForPII(rawData);
        const payload = this.sanitizePayload(rawData, category);

        const now = new Date();
        now.setMinutes(0, 0, 0);

        const pulse: SanitizedPulse = {
            pulseId: this.generatePulseId(),
            sourceHash: tenantHash,
            emittedAt: now.toISOString(),
            category,
            payload,
            context,
            integrityHash: '',
        };

        pulse.integrityHash = this.computeIntegrityHash(pulse);
        return pulse;
    }

    /**
     * ✅ Validates that a pulse contains zero PII before transmission.
     */
    validatePulse(pulse: SanitizedPulse): { valid: boolean; violations: string[] } {
        const violations: string[] = [];
        const serialized = JSON.stringify(pulse.payload);

        for (const [category, pattern] of Object.entries(PII_PATTERNS)) {
            const matches = serialized.match(pattern);
            if (matches && matches.length > 0) {
                violations.push(`PII_LEAK_DETECTED: ${category} pattern found in pulse payload`);
            }
        }

        const expectedHash = this.computeIntegrityHash({
            ...pulse,
            integrityHash: '',
        });
        if (expectedHash !== pulse.integrityHash) {
            violations.push('INTEGRITY_VIOLATION: Pulse hash mismatch — possible tampering');
        }

        return { valid: violations.length === 0, violations };
    }

    getDetections(): PIIDetection[] {
        return [...this.detections];
    }

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
                this.scanObject(value as JsonObject, fieldPath);
            }
        }
    }

    private stripPIIFromString(value: string, field: string): string | null {
        let cleaned = value;

        for (const [cat, pattern] of Object.entries(PII_PATTERNS)) {
            if (cat === 'HEALTH_DATA') {
                pattern.lastIndex = 0;
                if (pattern.test(cleaned)) {
                    this.detections.push({
                        field,
                        category: 'HEALTH_DATA',
                        value: cleaned.substring(0, 50),
                        action: 'BLOCKED',
                    });
                    return null;
                }
            }

            pattern.lastIndex = 0;
            cleaned = cleaned.replace(pattern, `[${cat}_REDACTED]`);
        }

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
        const obj = value as JsonObject;
        return (
            typeof obj.direction === 'string' &&
            typeof obj.magnitudePercent === 'number' &&
            typeof obj.periodDays === 'number'
        );
    }

    private generatePulseId(): string {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
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

        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `pulse_hash_${Math.abs(hash).toString(16)}`;
    }

    private getMinIntervalMs(frequency: string): number {
        switch (frequency) {
            case 'realtime_throttled': return 60 * 60 * 1000;
            case 'daily':             return 24 * 60 * 60 * 1000;
            case 'weekly':            return 7 * 24 * 60 * 60 * 1000;
            case 'monthly':           return 30 * 24 * 60 * 60 * 1000;
            default:                  return 24 * 60 * 60 * 1000;
        }
    }
}
