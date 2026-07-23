import { AuditPulse } from './types';

/**
 * Wrapper d'émission d'audit pulses utilisé par NexusInterceptor.
 *
 * ⚠️ Anti-cycle : ce module n'importe JAMAIS le service domaine directement.
 * Un import statique recréerait le cycle
 *   NexusInterceptor → shared/telemetry → domain/telemetry → FleetTelemetryService
 *   → FleetTelemetryExecutor → NexusAdapter → NexusInterceptor.
 * À la place, le service domaine s'enregistre via registerAuditPulseSink() à son
 * initialisation (inversion de dépendance).
 */

type AuditPulseSink = (pillar: string, action: string, data: object) => void;

let auditSink: AuditPulseSink | null = null;

/** Le service domaine appelle ceci au chargement pour brancher l'émission réelle. */
export function registerAuditPulseSink(fn: AuditPulseSink): void {
    auditSink = fn;
}

export const NexusTelemetryService = {
    emit: async (pulse: AuditPulse) => {
        auditSink?.('NEXUS', pulse.pulse, pulse);
    },
};
