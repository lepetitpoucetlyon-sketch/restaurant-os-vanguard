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
    payload?: Record<string, unknown>;
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
     * Deactivate telemetry. Buffer is flushed.
     */
    deactivate(): void {
        this._optedIn = false;
        this._buffer = [];
        logger.info('[Telemetry] Hollow Hook DEACTIVATED — No data will leave the vassal.');
    }

    /**
     * Check if telemetry is currently active.
     */
    get isActive(): boolean {
        return this._optedIn;
    }

    /**
     * Emit a metric event. If opt-in is false, this is a complete no-op.
     * The MCC will never see this event.
     */
    emit(moduleId: string, eventType: TelemetryEventType, payload?: Record<string, unknown>): void {
        // 🛡️ SOVEREIGNTY GATE: If not opted in, do absolutely nothing.
        if (!this._optedIn) return;

        const event: TelemetryEvent = {
            moduleId,
            eventType,
            payload,
            timestamp: new Date().toISOString(),
            tenantId: typeof window !== 'undefined' 
                ? localStorage.getItem('nexus_tenant_id') || 'unknown'
                : 'server',
        };

        this._buffer.push(event);

        // Prevent memory leaks: cap the buffer
        if (this._buffer.length > this.MAX_BUFFER_SIZE) {
            this._buffer = this._buffer.slice(-this.MAX_BUFFER_SIZE);
        }

        logger.debug(`[Telemetry] Event buffered: ${moduleId}/${eventType}`);
    }

    /**
     * Drain the buffer — used by the MCC connector when flushing metrics upstream.
     * Returns a copy and clears the internal buffer.
     */
    drain(): TelemetryEvent[] {
        if (!this._optedIn) return [];
        const events = [...this._buffer];
        this._buffer = [];
        return events;
    }

    /**
     * Get current buffer size (diagnostic).
     */
    get bufferSize(): number {
        return this._buffer.length;
    }
}

/**
 * Singleton instance — the Hollow Hook.
 * Import this anywhere to emit telemetry. It does nothing by default.
 */
export const TelemetryHook = new TelemetryHookService();
