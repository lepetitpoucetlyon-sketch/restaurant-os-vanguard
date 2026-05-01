/**
 * @file TelemetryStream.ts
 * @description Event-driven stream for Grade X telemetry collection.
 * Provides buffering, priority-based flushing, and resilience.
 */

import { SiteTelemetry } from '@nexus/contracts';

export type TelemetryPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface TelemetryEvent {
    type: 'METRIC' | 'ALERT' | 'HEARTBEAT' | 'SECURITY';
    payload: Partial<SiteTelemetry>;
    timestamp: number;
    priority: TelemetryPriority;
    tenantId: string;
}

export type FlushHandler = (events: TelemetryEvent[]) => Promise<void>;

export class TelemetryStream {
    private queue: TelemetryEvent[] = [];
    private onFlush: FlushHandler;
    private flushInterval: number;
    private timer: NodeJS.Timeout | null = null;
    private isFlushing: boolean = false;

    constructor(onFlush: FlushHandler, flushInterval = 30000) {
        this.onFlush = onFlush;
        this.flushInterval = flushInterval;
    }

    /**
     * Emits a new event into the stream.
     */
    public emit(event: TelemetryEvent): void {
        this.queue.push(event);
        
        // Immediate flush for critical/high priority signals
        if (event.priority === 'CRITICAL' || event.priority === 'HIGH') {
            this.flush();
        } else if (!this.timer && !this.isFlushing) {
            this.startTimer();
        }
    }

    /**
     * Manually triggers a stream flush.
     */
    public async flush(): Promise<void> {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        if (this.queue.length === 0 || this.isFlushing) return;

        this.isFlushing = true;
        const batch = [...this.queue];
        this.queue = [];

        try {
            await this.onFlush(batch);
            this.isFlushing = false;
            
            // If new events arrived during flush, start timer again
            if (this.queue.length > 0) {
                this.startTimer();
            }
        } catch (error) {
            this.isFlushing = false;
            // Persistence: Put back at the beginning of the queue
            this.queue = [...batch, ...this.queue];
            console.warn('[TelemetryStream] Flush failed. Reality preserved in local buffer.', error);
            
            // Retry later
            this.startTimer(this.flushInterval * 2); 
        }
    }

    private startTimer(interval = this.flushInterval): void {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flush(), interval);
    }

    /**
     * Clears the current stream (emergency stop).
     */
    public stop(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.queue = [];
    }
}
