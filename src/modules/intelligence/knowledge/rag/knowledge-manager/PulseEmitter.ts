/**
 * 📡 PulseEmitter — Handles sanitized pulse building, validation, rate limiting and telemetry
 */

import { logger } from '@/lib/logger';
import { NexusTelemetryService } from '@/shared/nexus/telemetry/NexusTelemetryService';
import { AuditPulseType } from '@/shared/nexus/telemetry/types';
import { PulseSanitizer } from '../PulseSanitizer';
import { hashTenantId } from '../subservices/documentHelpers';
import type {
    SanitizedPulse,
    PulseCategory,
    PulseContext,
} from '../types';

export class PulseEmitter {
    private sanitizer: PulseSanitizer;
    private pulseConsentEnabled: boolean = false;
    private lastPulseTimestamps: Map<PulseCategory, number> = new Map();

    constructor(
        private readonly tenantId: string,
        private readonly pulseContext: PulseContext
    ) {
        this.sanitizer = new PulseSanitizer();
    }

    setPulseConsent(enabled: boolean): void {
        this.pulseConsentEnabled = enabled;
        logger.info(`[HermesKnowledge] Pulse consent ${enabled ? 'GRANTED' : 'REVOKED'} for ${this.tenantId}`);
    }

    async emitPulse(
        rawData: Record<string, unknown>,
        category: PulseCategory
    ): Promise<SanitizedPulse | null> {
        if (!this.pulseConsentEnabled) {
            logger.info(`[HermesKnowledge] Pulse emission blocked: consent not granted for ${this.tenantId}`);
            return null;
        }

        const lastEmitted = this.lastPulseTimestamps.get(category);
        if (!this.sanitizer.canEmit(category, lastEmitted)) {
            logger.info(`[HermesKnowledge] Pulse throttled: ${category} — too soon since last emission`);
            return null;
        }

        const tenantHash = await hashTenantId(this.tenantId);
        const pulse = this.sanitizer.buildPulse(rawData, category, tenantHash, this.pulseContext);

        const validation = this.sanitizer.validatePulse(pulse);
        if (!validation.valid) {
            logger.error(
                `[HermesKnowledge] PULSE BLOCKED — PII detected in final validation:\n` +
                validation.violations.join('\n')
            );

            await NexusTelemetryService.emit({
                pulse: AuditPulseType.PULSE_BLOCKED,
                vassalId: this.tenantId,
                actorId: 'hermes',
                payload: { category, violations: validation.violations },
                severity: 'CRITICAL',
                timestamp: new Date().toISOString(),
            });

            return null;
        }

        const detections = this.sanitizer.getDetections();
        if (detections.length > 0) {
            await NexusTelemetryService.emit({
                pulse: AuditPulseType.PII_DETECTED,
                vassalId: this.tenantId,
                actorId: 'hermes',
                payload: {
                    category,
                    detectionCount: detections.length,
                    categories: [...new Set(detections.map(d => d.category))],
                },
                severity: 'WARNING',
                timestamp: new Date().toISOString(),
            });
        }

        this.lastPulseTimestamps.set(category, Date.now());

        await NexusTelemetryService.emit({
            pulse: AuditPulseType.PULSE_EMITTED,
            vassalId: this.tenantId,
            actorId: 'hermes',
            payload: {
                pulseId: pulse.pulseId,
                category,
                metricsCount: Object.keys(pulse.payload.metrics).length,
                tagsCount: Object.keys(pulse.payload.tags).length,
                trendsCount: Object.keys(pulse.payload.trends).length,
            },
            severity: 'INFO',
            timestamp: new Date().toISOString(),
        });

        logger.info(`[HermesKnowledge] Pulse emitted: ${pulse.pulseId} [${category}]`);
        return pulse;
    }
}
