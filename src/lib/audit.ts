/**
 * EMPIRE AUDIT & OBSERVABILITY ENGINE
 * Centralized logging for system integrity, fiscal compliance (NF525), and performance.
 */

import { logger } from './axiom';
import { logger as devLogger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AuditModule = 'kitchen' | 'accounting' | 'inventory' | 'staff' | 'haccp' | 'system' | 'orchestration' | 'fleet';

export interface AuditEvent {
    module: AuditModule;
    action: string;
    details?: import('@/shared/nexus-contract').SovereignData;
    severity?: AuditSeverity;
    userId?: string;
    timestamp: Date;
    fiscalSeal?: string; // Optional NF525 seal hash
    instanceId?: string;
}


class EmpireAuditLogger {
    private static instance: EmpireAuditLogger;
    private subscribers: ((event: AuditEvent) => void)[] = [];

    private constructor() {}

    public static getInstance(): EmpireAuditLogger {
        if (!EmpireAuditLogger.instance) {
            EmpireAuditLogger.instance = new EmpireAuditLogger();
        }
        return EmpireAuditLogger.instance;
    }

    /**
     * Subscribe to live audit events (Internal MCC Bridge)
     */
    public subscribe(callback: (event: AuditEvent) => void) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(s => s !== callback);
        };
    }

    /**
     * Log a system or business event.
     * Integrates with Axiom for long-term storage and observability.
     */
    public log(event: AuditEvent) {
        // ASYNCHRONOUS LOGGING: Prevents blocking the main UI thread during navigation
        setTimeout(() => {
            const payload = {
                ...event,
                timestamp: event.timestamp.toISOString() as unknown, // Cast temporaire pour le bridge Axiom
                env: process.env.NODE_ENV || 'development',
                context: 'RESTAURANT-OS-EMPIRE'
            };

            try {
                // 0. Notify Internal Subscribers (MCC Dashboard)
                this.subscribers.forEach(s => {
                    try {
                        s(event);
                    } catch (e) {
                        console.error("[AUDIT] Subscriber error:", e);
                    }
                });

                // 1. Axiom Integration (Long-term Observability)
                try {
                    logger.info(event.action, payload as import('@/shared/nexus-contract').SovereignMap);
                } catch (_e) {
                    // Silently fail if axiom is not configured
                }

                // 2. Development Log — routed through the central logger so this
                // no longer writes to stdout on the fiscal-sealing hot path in prod
                // (logger.debug is a no-op outside development).
                devLogger.debug(`[AUDIT][${event.module.toUpperCase()}] ${event.action}`, event.details || '');

                // 3. Sentry Integration (Critical Error Tracking)
                if (event.severity === 'critical') {
                    try {
                        Sentry.captureMessage(event.action, { 
                            level: 'error', 
                            extra: event.details,
                            tags: { module: event.module }
                        });
                    } catch (_e) {
                        // Silently fail
                    }
                }
            } catch (globalError) {
                console.error("[AUDIT] Critical check failed:", globalError);
            }
        }, 0);
    }

    /**
     * Specialized Fiscal Trace for NF525 Compliance.
     */
    public fiscalTrace(details: { transactionId: string; amountInCents: number; previousHash: string; instanceId: string }) {
        this.log({
            module: 'accounting',
            action: 'FISCAL_SEAL_CREATED',
            severity: 'medium',
            details,
            instanceId: details.instanceId,
            timestamp: new Date()
        });
    }

    /**
     * Report an error to the observability stack.
     */
    public error(error: Error | string, module: AuditModule, context?: import('@/shared/nexus-contract').SovereignData) {
        this.log({
            module,
            action: typeof error === 'string' ? error : error.message,
            severity: 'critical',
            details: {
                stack: typeof error === 'string' ? null : error.stack,
                ...(context as import('@/shared/nexus-contract').SovereignData)
            },
            timestamp: new Date()
        });
    }


    /**
     * Hook into global browser errors.
     */
    public initGlobalCapture() {
        if (typeof window === 'undefined') return;

        window.addEventListener('error', (event) => {
            this.error(event.error || event.message, 'system', {
                filename: event.filename,
                lineno: event.lineno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.error(event.reason, 'system', { type: 'unhandled_promise_rejection' });
        });
    }
}

export const empireAudit = EmpireAuditLogger.getInstance();
