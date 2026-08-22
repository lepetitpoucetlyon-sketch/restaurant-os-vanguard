import { logger } from '@/lib/logger';

/**
 * 🛰️ TelemetryHook - Sovereign Forge (Grade IX)
 * 
 * HOLLOW HOOK PATTERN: This is a passive telemetry suture that allows the MCC
 * to receive operational metrics from vassals — IF AND ONLY IF the tenant has 
 * explicitly opted in via their configuration.
 * 
 * By default: COMPLETELY INERT. No data leaves the vassal.
 * 
 * Sovereignty Doctrine: The restaurateur controls their data. The MCC does not
 * spy; it listens only when invited.
 */

type TelemetryEventType = 
    | 'post_scheduled'
    | 'post_published'
    | 'campaign_created'
    | 'campaign_sent'
    | 'segment_created'
    | 'reservation_created'
    | 'reservation_confirmed'
    | 'reservation_noshow'
    | 'reservation_cancelled'
    | 'revenue_recorded'
    | 'module_accessed';

interface TelemetryEvent {
    moduleId: string;
    eventType: TelemetryEventType;
    payload?: import('@/shared/nexus-contract').SovereignData;
    timestamp: string;
    tenantId: string;
}

class TelemetryHookService {
    private _optedIn: boolean = false;
    private _buffer: TelemetryEvent[] = [];
    private readonly MAX_BUFFER_SIZE = 50;

    /**
     * Activate telemetry for this tenant session.
     * Must be called explicitly — never auto-activated.
     */
    activate(): void {
        this._optedIn = true;
        logger.info('[Telemetry] Hollow Hook ACTIVATED — Metrics will flow to MCC.');
    }

    /**
     * Deactivate telemetry (re-assert data sovereignty).
     */
    deactivate(): void {
        this._optedIn = false;
        this._buffer = [];
        logger.info('[Telemetry] Hollow Hook DEACTIVATED — Vassal sovereignty restored.');
    }

    get isOptedIn(): boolean {
        return this._optedIn;
    }

    /**
     * Emit a telemetry event. Silent NOOP if not opted-in.
     * Non-blocking, zero performance overhead.
     */
    emit(moduleId: string, eventType: TelemetryEventType, payload?: import('@/shared/nexus-contract').SovereignData): void {
        if (!this._optedIn) return; // Silent discard

        const event: TelemetryEvent = {
            moduleId,
            eventType,
            payload,
            timestamp: new Date().toISOString(),
            tenantId: (payload as { tenantId?: string })?.tenantId ?? 'unknown'
        };

        this._buffer.push(event);

        // Auto-flush if buffer is full
        if (this._buffer.length >= this.MAX_BUFFER_SIZE) {
            this.flush();
        }
    }

    /**
     * Flush buffered events to the MCC telemetry sink.
     */
    async flush(): Promise<void> {
        if (!this._optedIn || this._buffer.length === 0) return;

        const batch = [...this._buffer];
        this._buffer = [];

        try {
            // Future: POST to /api/telemetry or MCC ingestion endpoint
            // For now: structured log only (silent local persistence)
            logger.info(`[Telemetry] Flushed ${batch.length} events to sink.`);
        } catch (_err) {
            // Telemetry failure MUST NEVER break vassal operations
            // Events are silently dropped (best-effort delivery)
        }
    }

    /**
     * Read buffered events (for local inspection/debug).
     */
    getBufferedEvents(): readonly TelemetryEvent[] {
        return this._buffer;
    }
}

export const TelemetryHook = new TelemetryHookService();
